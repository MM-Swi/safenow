import os
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from alerts.models import Alert
from devices.models import Device


class Command(BaseCommand):
    help = 'Load comprehensive demo data for SafeNow'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Loading SafeNow demo data...'))
        self.stdout.write()

        # 1. Load shelter data
        self.stdout.write('1. Loading shelter data...')
        shelter_csv_path = os.path.join('fixtures', 'shelters_sample.csv')
        if os.path.exists(shelter_csv_path):
            call_command('import_shelters', shelter_csv_path)
            self.stdout.write(self.style.SUCCESS('   ✓ Shelters loaded successfully'))
        else:
            self.stdout.write(self.style.WARNING(f'   ⚠ Shelter file not found: {shelter_csv_path}'))

        # 2. Load device data
        self.stdout.write('2. Loading device data...')
        devices_json_path = os.path.join('fixtures', 'devices_sample.json')
        if os.path.exists(devices_json_path):
            call_command('loaddata', devices_json_path)
            self.stdout.write(self.style.SUCCESS('   ✓ Demo devices loaded successfully'))
        else:
            self.stdout.write(self.style.WARNING(f'   ⚠ Devices file not found: {devices_json_path}'))

        # 3. Create demo alerts
        self.stdout.write('3. Creating demo alerts...')
        
        # Clear existing alerts first
        Alert.objects.all().delete()
        self.stdout.write('   🧹 Cleared existing alerts')

        # Create comprehensive demo alerts for all hazard types
        self.create_comprehensive_alerts()

        # 4. Summary
        self.stdout.write()
        self.stdout.write(self.style.SUCCESS('Demo data loading complete!'))
        self.stdout.write()

        # Count data
        from shelters.models import Shelter
        from devices.models import Device, SafetyStatus

        shelter_count = Shelter.objects.count()
        alert_count = Alert.objects.filter(valid_until__gte=timezone.now()).count()
        device_count = Device.objects.count()
        status_count = SafetyStatus.objects.count()

        self.stdout.write('Summary:')
        self.stdout.write(f'  Shelters: {shelter_count}')
        self.stdout.write(f'  Active alerts: {alert_count}')
        self.stdout.write(f'  Devices: {device_count}')
        self.stdout.write(f'  Safety statuses: {status_count}')
        self.stdout.write()
        self.stdout.write('Ready for demo! Visit:')
        self.stdout.write('  • API: http://localhost:8000/api/health/')
        self.stdout.write('  • Admin: http://localhost:8000/admin/')
        self.stdout.write('  • Docs: http://localhost:8000/api/docs/')

    def create_comprehensive_alerts(self):
        """Create comprehensive demo alerts for all hazard types."""
        # Warsaw coordinates for demo
        center_lat = Decimal('52.2297')
        center_lon = Decimal('21.0122')
        
        # All 18 hazard types from the model
        hazard_types = [
            'AIR_RAID', 'DRONE', 'MISSILE', 'FLOOD', 'FIRE', 'INDUSTRIAL',
            'SHOOTING', 'STORM', 'TSUNAMI', 'CHEMICAL_WEAPON', 'BIOHAZARD',
            'NUCLEAR', 'UNMARKED_SOLDIERS', 'PANDEMIC', 'TERRORIST_ATTACK',
            'MASS_POISONING', 'CYBER_ATTACK', 'EARTHQUAKE'
        ]
        
        # All severity levels for comprehensive testing
        severity_levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        
        alerts_created = []
        
        # Create one CRITICAL alert for each hazard type
        for hazard_type in hazard_types:
            alert = Alert.objects.create(
                hazard_type=hazard_type,
                severity='CRITICAL',
                center_lat=center_lat,
                center_lon=center_lon,
                radius_m=20000,  # 20km radius
                valid_until=timezone.now() + timedelta(hours=2),
                source='demo_load'
            )
            alerts_created.append(alert)
            self.stdout.write(f'   ✓ Created {hazard_type} alert with CRITICAL severity (ID: {alert.id})')

        # Create additional severity examples using MISSILE as example
        for severity in severity_levels:
            if severity != 'CRITICAL':  # We already created CRITICAL alerts above
                alert = Alert.objects.create(
                    hazard_type='MISSILE',
                    severity=severity,
                    center_lat=center_lat,
                    center_lon=center_lon,
                    radius_m=15000,  # 15km radius for examples
                    valid_until=timezone.now() + timedelta(hours=2),
                    source=f'demo_load_{severity.lower()}_example'
                )
                alerts_created.append(alert)
                self.stdout.write(f'   ✓ Created MISSILE alert with {severity} severity (ID: {alert.id})')
        
        self.stdout.write(f'   📊 Total alerts created: {len(alerts_created)}')