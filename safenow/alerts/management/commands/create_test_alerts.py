from django.core.management.base import BaseCommand
from alerts.models import Alert
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Create test alerts for all hazard types'

    def add_arguments(self, parser):
        parser.add_argument('--lat', type=float, default=50.0564, help='Latitude')
        parser.add_argument('--lon', type=float, default=22.0004, help='Longitude') 
        parser.add_argument('--radius', type=int, default=20000, help='Radius in meters')
        parser.add_argument('--clear', action='store_true', help='Clear existing alerts first')

    def handle(self, *args, **options):
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
