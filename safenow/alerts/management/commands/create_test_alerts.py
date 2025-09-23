from django.core.management.base import BaseCommand
from alerts.models import Alert
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'DEPRECATED: Create test alerts for all hazard types. Use "create_alerts" command instead.'

    def add_arguments(self, parser):
        parser.add_argument('--lat', type=float, default=50.0564, help='Latitude')
        parser.add_argument('--lon', type=float, default=22.0004, help='Longitude') 
        parser.add_argument('--radius', type=int, default=20000, help='Radius in meters')
        parser.add_argument('--clear', action='store_true', help='Clear existing alerts first')

    def handle(self, *args, **options):
        # Deprecation warning
        self.stdout.write(
            self.style.WARNING(
                '⚠️  DEPRECATION WARNING: This command is deprecated.\n'
                '   Please use "python manage.py create_alerts" instead.\n'
                '   The new command supports:\n'
                '   - All 18 hazard types (vs 6 in this old command)\n'
                '   - Geolocation support (IP-based, GPS, manual input)\n'
                '   - Better error handling and validation\n'
                '   - Dry-run mode\n'
                '   - Individual hazard type creation\n'
                '   - Configurable severity and validity\n'
                '\n'
                '   Example: python manage.py create_alerts --lat 50.0564 --lon 22.0004 --clear\n'
            )
        )
        
        lat = options['lat']
        lon = options['lon']
        radius = options['radius']
        
        if options['clear']:
            Alert.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Cleared existing alerts.'))
        
        # All hazard types from the model
        hazard_types = [
            'AIR_RAID',
            'DRONE', 
            'MISSILE',
            'FLOOD',
            'FIRE',
            'INDUSTRIAL'
        ]
        
        alerts_created = 0
        
        # Create one CRITICAL alert for each hazard type
        for hazard_type in hazard_types:
            alert = Alert.objects.create(
                hazard_type=hazard_type,
                severity='CRITICAL',
                center_lat=lat,
                center_lon=lon,
                radius_m=radius,
                valid_until=datetime.now() + timedelta(hours=2),
                source='Test Alert Creation'
            )
            alerts_created += 1
            self.stdout.write(
                self.style.SUCCESS(f'Created {hazard_type} alert with CRITICAL severity')
            )
        
        # Create additional alerts with different severity levels for MISSILE
        severity_levels = ['LOW', 'MEDIUM', 'HIGH']
        for severity in severity_levels:
            alert = Alert.objects.create(
                hazard_type='MISSILE',
                severity=severity,
                center_lat=lat,
                center_lon=lon,
                radius_m=radius,
                valid_until=datetime.now() + timedelta(hours=2),
                source=f'Test Alert Creation - {severity} Example'
            )
            alerts_created += 1
            self.stdout.write(
                self.style.SUCCESS(f'Created MISSILE alert with {severity} severity')
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nTotal alerts created: {alerts_created}\n'
                f'Coordinates: {lat}, {lon}\n'
                f'Radius: {radius} meters'
            )
        )
