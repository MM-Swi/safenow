"""
Django management command to create emergency alerts with geolocation support.
Supports multiple methods to determine coordinates:
1. Command-line arguments
2. Environment variables
3. IP-based geolocation (automatic)
4. Manual coordinate input
5. Hardcoded fallback (Rzeszów, Poland)
"""
import os
import requests
from decimal import Decimal
from datetime import timedelta
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from alerts.models import Alert


class Command(BaseCommand):
    help = 'Create emergency alerts with geolocation support'

    def add_arguments(self, parser):
        parser.add_argument(
            '--lat',
            type=float,
            help='Latitude for alert center'
        )
        parser.add_argument(
            '--lon', 
            type=float,
            help='Longitude for alert center'
        )
        parser.add_argument(
            '--location',
            type=str,
            help='Location description'
        )
        parser.add_argument(
            '--radius',
            type=int,
            default=20000,
            help='Alert radius in meters (default: 20000)'
        )
        parser.add_argument(
            '--gps',
            action='store_true',
            help='Force GPS-only mode (requires GPS hardware)'
        )
        parser.add_argument(
            '--ip',
            action='store_true', 
            help='Force IP geolocation only'
        )
        parser.add_argument(
            '--auto',
            action='store_true',
            help='Auto-detect location without prompts'
        )
        parser.add_argument(
            '--fallback',
            action='store_true',
            help='Use hardcoded fallback coordinates (Rzeszów, Poland)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing alerts before creating new ones'
        )
        parser.add_argument(
            '--hazard-type',
            choices=[
                'AIR_RAID', 'DRONE', 'MISSILE', 'FLOOD', 'FIRE', 'INDUSTRIAL',
                'SHOOTING', 'STORM', 'TSUNAMI', 'CHEMICAL_WEAPON', 'BIOHAZARD',
                'NUCLEAR', 'UNMARKED_SOLDIERS', 'PANDEMIC', 'TERRORIST_ATTACK',
                'MASS_POISONING', 'CYBER_ATTACK', 'EARTHQUAKE'
            ],
            help='Create alert for specific hazard type only'
        )
        parser.add_argument(
            '--severity',
            choices=['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            default='CRITICAL',
            help='Alert severity level (default: CRITICAL)'
        )
        parser.add_argument(
            '--hours',
            type=int,
            default=2,
            help='Alert validity in hours (default: 2)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without saving to database'
        )

    def handle(self, *args, **options):
        """Main command handler."""
        if options['dry_run']:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No data will be saved'))

        # Clear existing alerts if requested
        if options['clear']:
            if not options['dry_run']:
                Alert.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('🧹 Cleared existing alerts'))

        # Determine coordinates
        try:
            center_lat, center_lon, location_description = self.get_coordinates(options)
        except CommandError:
            raise
        except Exception as e:
            raise CommandError(f'Failed to determine coordinates: {str(e)}')

        # Create alerts
        self.create_alerts(
            center_lat=center_lat,
            center_lon=center_lon,
            location_description=location_description,
            options=options
        )

    def get_coordinates(self, options):
        """Get coordinates using multiple methods in order of preference."""
        
        # Method 1: Command-line arguments
        if options['lat'] is not None and options['lon'] is not None:
            lat, lon = options['lat'], options['lon']
            location = options['location'] or f"Command line ({lat:.4f}, {lon:.4f})"
            self.stdout.write(f"📍 Using command-line coordinates: {location}")
            return lat, lon, location

        # Method 2: Environment variables
        env_lat = os.getenv('ALERT_LAT')
        env_lon = os.getenv('ALERT_LON')
        if env_lat and env_lon:
            try:
                lat, lon = float(env_lat), float(env_lon)
                location = os.getenv('ALERT_LOCATION', f"Environment ({lat:.4f}, {lon:.4f})")
                self.stdout.write(f"📍 Using environment coordinates: {location}")
                return lat, lon, location
            except ValueError:
                self.stdout.write(self.style.WARNING("⚠️  Invalid environment coordinates, trying other methods..."))

        # Method 3: Hardcoded fallback (if explicitly requested)
        if options['fallback']:
            lat, lon = 50.0564, 22.0004
            location = "Rzeszów, Poland (fallback)"
            self.stdout.write(f"📍 Using fallback coordinates: {location}")
            return lat, lon, location

        # Method 4: IP-based geolocation
        if options['ip'] or options['auto'] or not any([options['gps']]):
            self.stdout.write("🌐 Attempting IP-based geolocation...")
            ip_result = self.get_ip_geolocation()
            if ip_result:
                lat, lon, city = ip_result
                if options['auto']:
                    return lat, lon, city
                else:
                    # Interactive confirmation
                    try:
                        response = input(f"Use detected location '{city}'? (y/n, default: y): ").strip().lower()
                        if response in ['', 'y', 'yes']:
                            return lat, lon, city
                    except (EOFError, KeyboardInterrupt):
                        self.stdout.write("\n❌ Input cancelled")

        # Method 5: Manual input (interactive mode only)
        if not options['auto'] and not options['ip'] and not options['gps']:
            manual_result = self.get_manual_coordinates()
            if manual_result:
                return manual_result

        # Method 6: Final fallback
        lat, lon = 50.0564, 22.0004
        location = "Rzeszów, Poland (final fallback)"
        self.stdout.write(f"📍 Using final fallback coordinates: {location}")
        return lat, lon, location

    def get_ip_geolocation(self):
        """Get current location based on IP address."""
        try:
            response = requests.get('https://ipapi.co/json/', timeout=5)
            if response.status_code == 200:
                data = response.json()
                lat = float(data.get('latitude', 0))
                lon = float(data.get('longitude', 0))
                city = data.get('city', 'Unknown')
                country = data.get('country_name', 'Unknown')
                
                if lat != 0 and lon != 0:
                    location = f"{city}, {country} ({lat:.4f}, {lon:.4f})"
                    self.stdout.write(f"📍 Detected location: {location}")
                    return lat, lon, location
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠️  IP geolocation failed: {e}"))
        
        return None

    def get_manual_coordinates(self):
        """Get coordinates through manual input with validation."""
        try:
            self.stdout.write("\n📍 Manual coordinate input:")
            lat_input = input("Enter latitude (-90 to 90): ").strip()
            if not lat_input:
                return None
                
            lon_input = input("Enter longitude (-180 to 180): ").strip()
            if not lon_input:
                return None
                
            lat = float(lat_input)
            lon = float(lon_input)
            
            # Validate coordinates
            if not (-90 <= lat <= 90):
                self.stdout.write(self.style.ERROR("❌ Invalid latitude. Must be between -90 and 90."))
                return None
            if not (-180 <= lon <= 180):
                self.stdout.write(self.style.ERROR("❌ Invalid longitude. Must be between -180 and 180."))
                return None
                
            description = input("Enter location description (optional): ").strip()
            if not description:
                description = f"Manual ({lat:.4f}, {lon:.4f})"
                
            return lat, lon, description
            
        except ValueError:
            self.stdout.write(self.style.ERROR("❌ Invalid coordinate format. Please enter numeric values."))
            return None
        except (EOFError, KeyboardInterrupt):
            self.stdout.write("\n❌ Input cancelled.")
            return None

    def create_alerts(self, center_lat, center_lon, location_description, options):
        """Create alerts with specified parameters."""
        
        # All hazard types from the model
        all_hazard_types = [
            'AIR_RAID', 'DRONE', 'MISSILE', 'FLOOD', 'FIRE', 'INDUSTRIAL',
            'SHOOTING', 'STORM', 'TSUNAMI', 'CHEMICAL_WEAPON', 'BIOHAZARD',
            'NUCLEAR', 'UNMARKED_SOLDIERS', 'PANDEMIC', 'TERRORIST_ATTACK',
            'MASS_POISONING', 'CYBER_ATTACK', 'EARTHQUAKE'
        ]

        # Determine which hazard types to create
        if options['hazard_type']:
            hazard_types = [options['hazard_type']]
        else:
            hazard_types = all_hazard_types

        # All severity levels for comprehensive testing
        severity_levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        
        alerts_created = []
        
        # Create alerts for specified hazard types
        for hazard_type in hazard_types:
            if not options['dry_run']:
                alert = Alert.objects.create(
                    hazard_type=hazard_type,
                    severity=options['severity'],
                    center_lat=Decimal(str(center_lat)),
                    center_lon=Decimal(str(center_lon)),
                    radius_m=options['radius'],
                    valid_until=timezone.now() + timedelta(hours=options['hours']),
                    source='Django Management Command'
                )
                alerts_created.append(alert)
            
            self.stdout.write(
                self.style.SUCCESS(f"✅ {'Would create' if options['dry_run'] else 'Created'} {hazard_type} alert with {options['severity']} severity")
            )

        # If creating all hazard types, also create severity examples using MISSILE
        if not options['hazard_type'] and options['severity'] == 'CRITICAL':
            for severity in severity_levels:
                if severity != 'CRITICAL':  # We already created CRITICAL alerts above
                    if not options['dry_run']:
                        alert = Alert.objects.create(
                            hazard_type='MISSILE',
                            severity=severity,
                            center_lat=Decimal(str(center_lat)),
                            center_lon=Decimal(str(center_lon)),
                            radius_m=options['radius'],
                            valid_until=timezone.now() + timedelta(hours=options['hours']),
                            source=f'Django Management Command - {severity} Example'
                        )
                        alerts_created.append(alert)
                    
                    self.stdout.write(
                        self.style.SUCCESS(f"✅ {'Would create' if options['dry_run'] else 'Created'} MISSILE alert with {severity} severity")
                    )

        # Summary
        total_alerts = len(alerts_created) if not options['dry_run'] else len(hazard_types) + (3 if not options['hazard_type'] and options['severity'] == 'CRITICAL' else 0)
        
        self.stdout.write(f"\n📊 Summary:")
        self.stdout.write(f"   Total alerts {'would be created' if options['dry_run'] else 'created'}: {total_alerts}")
        self.stdout.write(f"   Location: {location_description}")
        self.stdout.write(f"   Coordinates: {center_lat:.4f}, {center_lon:.4f}")
        self.stdout.write(f"   Radius: {options['radius']} meters ({options['radius']/1000} km)")
        self.stdout.write(f"   Validity: {options['hours']} hours")

        if not options['dry_run'] and alerts_created:
            self.stdout.write("\n📋 Created alerts:")
            for alert in alerts_created:
                self.stdout.write(f"   - {alert.hazard_type} ({alert.severity}) - Valid until: {alert.valid_until}")

        if options['dry_run']:
            self.stdout.write(self.style.WARNING('\nDRY RUN: No changes were saved to database'))
        else:
            self.stdout.write(self.style.SUCCESS('\nAlert creation completed successfully!'))
