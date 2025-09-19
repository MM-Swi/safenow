import csv
import os
from decimal import Decimal, InvalidOperation
from django.core.management.base import BaseCommand, CommandError
from django.core.exceptions import ValidationError
from django.db import transaction
from shelters.models import Shelter


class Command(BaseCommand):
    help = 'Import shelters from CSV file'

    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,
            help='Path to CSV file containing shelter data'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be imported without actually saving to database'
        )

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        dry_run = options['dry_run']

        if not os.path.exists(csv_file):
            raise CommandError(f'CSV file does not exist: {csv_file}')

        self.stdout.write(f'Importing shelters from: {csv_file}')
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No data will be saved'))

        success_count = 0
        error_count = 0
        skipped_count = 0

        try:
            with open(csv_file, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)

                # Validate CSV headers
                expected_headers = ['name', 'address', 'lat', 'lon', 'is_verified',
                                  'capacity', 'is_open_now', 'source']
                if not all(header in reader.fieldnames for header in expected_headers):
                    missing_headers = set(expected_headers) - set(reader.fieldnames or [])
                    raise CommandError(
                        f'CSV file missing required headers: {", ".join(missing_headers)}\n'
                        f'Required headers: {", ".join(expected_headers)}'
                    )

                with transaction.atomic():
                    for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                        try:
                            shelter_data = self.parse_shelter_row(row, row_num)
                            if shelter_data is None:
                                skipped_count += 1
                                continue

                            if not dry_run:
                                shelter, created = Shelter.objects.update_or_create(
                                    name=shelter_data['name'],
                                    address=shelter_data['address'],
                                    lat=shelter_data['lat'],
                                    lon=shelter_data['lon'],
                                    defaults=shelter_data
                                )
                                action = 'Created' if created else 'Updated'
                                self.stdout.write(f'  {action}: {shelter.name}')
                            else:
                                self.stdout.write(f'  Would import: {shelter_data["name"]}')

                            success_count += 1

                        except Exception as e:
                            error_count += 1
                            self.stdout.write(
                                self.style.ERROR(f'Row {row_num}: Error - {str(e)}')
                            )

                    if dry_run:
                        # Rollback transaction in dry run mode
                        transaction.set_rollback(True)

        except Exception as e:
            raise CommandError(f'Error reading CSV file: {str(e)}')

        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(f'Import Summary:')
        self.stdout.write(f'  Successfully processed: {success_count}')
        self.stdout.write(f'  Errors: {error_count}')
        self.stdout.write(f'  Skipped: {skipped_count}')
        self.stdout.write(f'  Total rows processed: {success_count + error_count + skipped_count}')

        if dry_run:
            self.stdout.write(self.style.WARNING('\nDRY RUN: No changes were saved to database'))
        else:
            self.stdout.write(self.style.SUCCESS('\nImport completed successfully!'))

    def parse_shelter_row(self, row, row_num):
        """Parse and validate a single CSV row."""
        try:
            # Required fields
            name = row['name'].strip()
            address = row['address'].strip()

            if not name or not address:
                self.stdout.write(
                    self.style.WARNING(f'Row {row_num}: Skipping - name and address are required')
                )
                return None

            # Coordinate validation
            try:
                lat = Decimal(row['lat'].strip())
                lon = Decimal(row['lon'].strip())

                if not (-90 <= lat <= 90):
                    raise ValueError(f'Latitude must be between -90 and 90, got {lat}')
                if not (-180 <= lon <= 180):
                    raise ValueError(f'Longitude must be between -180 and 180, got {lon}')

            except (InvalidOperation, ValueError) as e:
                raise ValueError(f'Invalid coordinates: {str(e)}')

            # Boolean fields with defaults
            is_verified = self.parse_boolean(row.get('is_verified', 'false'))
            is_open_now = self.parse_boolean(row.get('is_open_now', 'true'))

            # Optional capacity field
            capacity = None
            capacity_str = row.get('capacity', '').strip()
            if capacity_str and capacity_str.lower() != 'null':
                try:
                    capacity = int(capacity_str)
                    if capacity < 0:
                        raise ValueError('Capacity cannot be negative')
                except ValueError:
                    raise ValueError(f'Invalid capacity: {capacity_str}')

            # Source with default
            source = row.get('source', 'import').strip() or 'import'

            return {
                'name': name,
                'address': address,
                'lat': lat,
                'lon': lon,
                'is_verified': is_verified,
                'capacity': capacity,
                'is_open_now': is_open_now,
                'source': source
            }

        except Exception as e:
            raise ValueError(f'Row validation failed: {str(e)}')

    def parse_boolean(self, value):
        """Parse boolean value from string."""
        if isinstance(value, bool):
            return value

        value_str = str(value).lower().strip()
        if value_str in ['true', '1', 'yes', 'y']:
            return True
        elif value_str in ['false', '0', 'no', 'n', '']:
            return False
        else:
            raise ValueError(f'Invalid boolean value: {value}')