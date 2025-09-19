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

        # Alert 1: Critical missile alert (active)
        alert1 = Alert.objects.create(
            hazard_type='MISSILE',
            severity='CRITICAL',
            center_lat=Decimal('52.2297'),
            center_lon=Decimal('21.0122'),
            radius_m=5000,
            valid_until=timezone.now() + timedelta(hours=1),
            source='demo_load'
        )
        self.stdout.write(f'   ✓ Created CRITICAL MISSILE alert (ID: {alert1.id})')

        # Alert 2: Medium fire alert (active)
        alert2 = Alert.objects.create(
            hazard_type='FIRE',
            severity='MEDIUM',
            center_lat=Decimal('52.2319'),
            center_lon=Decimal('20.9957'),
            radius_m=2000,
            valid_until=timezone.now() + timedelta(minutes=30),
            source='demo_load'
        )
        self.stdout.write(f'   ✓ Created MEDIUM FIRE alert (ID: {alert2.id})')

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