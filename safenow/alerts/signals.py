import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from alerts.models import Alert
from devices.models import Device
from shelters.models import Shelter
from backend.safenow.common.geo import haversine_km, eta_walk_seconds
from push.providers import get_push_provider

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Alert)
def send_alert_notifications(sender, instance, created, **kwargs):
    """
    Send push notifications to devices when a new alert is created.
    """
    if not created:
        # Only send notifications for new alerts
        return

    logger.info(f"Processing new alert: {instance.id} - {instance.get_hazard_type_display()}")

    # Get all devices with valid push tokens and last known location
    devices = Device.objects.filter(
        push_token__isnull=False,
        last_lat__isnull=False,
        last_lon__isnull=False
    ).exclude(push_token='')

    if not devices.exists():
        logger.info("No devices with push tokens and location found")
        return

    affected_devices = []

    # Find devices within alert radius
    for device in devices:
        try:
            # Calculate distance from device to alert center
            distance_km = haversine_km(
                float(device.last_lat), float(device.last_lon),
                float(instance.center_lat), float(instance.center_lon)
            )
            distance_m = distance_km * 1000

            # Check if device is within alert radius
            if distance_m <= instance.radius_m:
                affected_devices.append((device, distance_km))
                logger.info(f"Device {device.device_id} is {distance_km:.2f}km from alert center")

        except Exception as e:
            logger.error(f"Error calculating distance for device {device.device_id}: {str(e)}")
            continue

    if not affected_devices:
        logger.info(f"No devices found within {instance.radius_m}m radius of alert")
        return

    logger.info(f"Found {len(affected_devices)} devices within alert radius")

    # Get all shelters for finding nearest ones
    all_shelters = Shelter.objects.filter(is_open_now=True)

    # Get push provider
    push_provider = get_push_provider()

    # Send notifications to affected devices
    success_count = 0
    error_count = 0

    for device, device_distance_to_alert in affected_devices:
        try:
            # Find nearest shelter to the device
            nearest_shelter = None
            min_shelter_distance = float('inf')

            for shelter in all_shelters:
                shelter_distance = haversine_km(
                    float(device.last_lat), float(device.last_lon),
                    float(shelter.lat), float(shelter.lon)
                )
                if shelter_distance < min_shelter_distance:
                    min_shelter_distance = shelter_distance
                    nearest_shelter = shelter

            if not nearest_shelter:
                logger.warning(f"No open shelters found for device {device.device_id}")
                continue

            # Calculate ETA to nearest shelter
            shelter_eta = eta_walk_seconds(min_shelter_distance)

            # Create alert title with emoji based on hazard type
            hazard_emojis = {
                'AIR_RAID': '🚨',
                'MISSILE': '🚀',
                'DRONE': '🛸',
                'FLOOD': '🌊',
                'FIRE': '🔥',
                'INDUSTRIAL': '⚠️'
            }
            emoji = hazard_emojis.get(instance.hazard_type, '🚨')
            alert_title = f"{emoji} {instance.get_severity_display()} {instance.get_hazard_type_display()}"

            # Prepare alert data
            alert_data = {
                'alert_id': instance.id,
                'hazard_type': instance.hazard_type,
                'severity': instance.severity,
                'center_lat': str(instance.center_lat),
                'center_lon': str(instance.center_lon),
                'radius_m': instance.radius_m,
                'valid_until': instance.valid_until.isoformat(),
                'nearest_shelter_id': nearest_shelter.id,
                'nearest_shelter_name': nearest_shelter.name,
            }

            # Send push notification
            success = push_provider.send_emergency_alert_push(
                token=device.push_token,
                alert_title=alert_title,
                shelter_distance=min_shelter_distance,
                shelter_eta=shelter_eta,
                alert_data=alert_data
            )

            if success:
                success_count += 1
                logger.info(f"Push sent successfully to device {device.device_id}")
            else:
                error_count += 1
                logger.warning(f"Failed to send push to device {device.device_id}")

        except Exception as e:
            error_count += 1
            logger.error(f"Error sending notification to device {device.device_id}: {str(e)}")

    logger.info(f"Alert notifications completed: {success_count} successful, {error_count} failed")


def send_alert_push_notifications(alert_id):
    """
    Manually trigger push notifications for an existing alert.
    Used by management command.
    """
    try:
        alert = Alert.objects.get(id=alert_id)

        # Check if alert is still valid
        if alert.valid_until < timezone.now():
            logger.warning(f"Alert {alert_id} has expired, not sending notifications")
            return False

        # Trigger the same logic as post_save signal
        send_alert_notifications(Alert, alert, created=True)
        return True

    except Alert.DoesNotExist:
        logger.error(f"Alert {alert_id} not found")
        return False
    except Exception as e:
        logger.error(f"Error sending alert notifications for alert {alert_id}: {str(e)}")
        return False