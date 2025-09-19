from django.core.management.base import BaseCommand
from django.core.management import call_command

from alerts.models import Alert
from shelters.models import Shelter
from devices.models import Device, SafetyStatus


class Command(BaseCommand):
    help = 'Reset all demo data and reload fresh demo dataset'

    def add_arguments(self, parser):
        parser.add_argument('--yes', action='store_true',
                          help='Skip confirmation prompt')

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('RESET DEMO DATA'))
        self.stdout.write('This will delete ALL data and reload demo dataset:')
        self.stdout.write('  • All Alerts')
        self.stdout.write('  • All Shelters')
        self.stdout.write('  • All Devices')
        self.stdout.write('  • All Safety Status records')
        self.stdout.write()

        if not options['yes']:
            confirm = input('Are you sure? Type "yes" to continue: ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.ERROR('Reset cancelled.'))
                return

        self.stdout.write(self.style.SUCCESS('Resetting SafeNow demo data...'))
        self.stdout.write()

        # Count existing data
        alert_count = Alert.objects.count()
        shelter_count = Shelter.objects.count()
        device_count = Device.objects.count()
        status_count = SafetyStatus.objects.count()

        self.stdout.write('Existing data:')
        self.stdout.write(f'  Alerts: {alert_count}')
        self.stdout.write(f'  Shelters: {shelter_count}')
        self.stdout.write(f'  Devices: {device_count}')
        self.stdout.write(f'  Safety statuses: {status_count}')
        self.stdout.write()

        # Delete all data
        self.stdout.write('1. Deleting existing data...')

        deleted_status = SafetyStatus.objects.all().delete()
        self.stdout.write(f'   ✓ Deleted {deleted_status[0]} safety status records')

        deleted_alerts = Alert.objects.all().delete()
        self.stdout.write(f'   ✓ Deleted {deleted_alerts[0]} alerts')

        deleted_devices = Device.objects.all().delete()
        self.stdout.write(f'   ✓ Deleted {deleted_devices[0]} devices')

        deleted_shelters = Shelter.objects.all().delete()
        self.stdout.write(f'   ✓ Deleted {deleted_shelters[0]} shelters')

        self.stdout.write()

        # Reload demo data
        self.stdout.write('2. Loading fresh demo data...')
        call_command('load_demo')

        self.stdout.write()
        self.stdout.write(self.style.SUCCESS('Demo reset complete!'))
        self.stdout.write('Fresh demo data is ready for use.')