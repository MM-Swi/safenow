from django.core.management.base import BaseCommand, CommandError
from alerts.models import Alert
from alerts.signals import send_alert_push_notifications
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Send push notifications for an existing alert'

    def add_arguments(self, parser):
        parser.add_argument('alert_id', type=int, help='Alert ID to send push notifications for')

    def handle(self, *args, **options):
        alert_id = options['alert_id']

        self.stdout.write(f"Sending push notifications for alert {alert_id}...")

        try:
            success = send_alert_push_notifications(alert_id)

            if success:
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully sent push notifications for alert {alert_id}')
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f'Failed to send push notifications for alert {alert_id}')
                )

        except Exception as e:
            raise CommandError(f'Error sending push notifications: {str(e)}')