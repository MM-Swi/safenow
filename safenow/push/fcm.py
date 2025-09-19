import json
import logging
import requests
from django.conf import settings
from typing import Dict, Optional, Any

logger = logging.getLogger(__name__)


class FCMError(Exception):
    """Firebase Cloud Messaging error."""
    pass


def send_push(token: str, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> bool:
    """
    Send push notification via Firebase Cloud Messaging.

    Args:
        token: FCM registration token
        title: Notification title
        body: Notification body text
        data: Optional data payload

    Returns:
        bool: True if successful, False otherwise

    Raises:
        FCMError: If FCM server key is not configured
    """
    fcm_server_key = getattr(settings, 'FCM_SERVER_KEY', '')
    if not fcm_server_key:
        logger.error("FCM_SERVER_KEY not configured in settings")
        raise FCMError("FCM server key not configured")

    if not token:
        logger.warning("Empty push token provided")
        return False

    # FCM endpoint
    url = "https://fcm.googleapis.com/fcm/send"

    # Prepare headers
    headers = {
        'Authorization': f'key={fcm_server_key}',
        'Content-Type': 'application/json',
    }

    # Prepare payload
    payload = {
        'to': token,
        'notification': {
            'title': title,
            'body': body,
            'sound': 'default',
            'badge': 1,
        },
        'priority': 'high',
        'content_available': True,
    }

    # Add data payload if provided
    if data:
        payload['data'] = data

    try:
        logger.info(f"Sending FCM push notification: {title}")
        response = requests.post(
            url,
            headers=headers,
            data=json.dumps(payload),
            timeout=10
        )

        # Check response
        if response.status_code == 200:
            response_data = response.json()

            # Check if message was successful
            if response_data.get('success', 0) > 0:
                logger.info(f"FCM push sent successfully to token: {token[:20]}...")
                return True
            else:
                # Handle FCM errors
                errors = response_data.get('results', [{}])[0].get('error')
                if errors:
                    logger.warning(f"FCM error: {errors} for token: {token[:20]}...")
                else:
                    logger.warning(f"FCM failed for unknown reason: {response_data}")
                return False
        else:
            logger.error(f"FCM request failed with status {response.status_code}: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        logger.error(f"FCM request exception: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        logger.error(f"FCM response JSON decode error: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected FCM error: {str(e)}")
        return False


def send_emergency_alert_push(token: str, alert_title: str, shelter_distance: float, shelter_eta: int, alert_data: Dict[str, Any]) -> bool:
    """
    Send emergency alert push notification with shelter information.

    Args:
        token: FCM registration token
        alert_title: Alert title (e.g. "🚨 Incoming Missile")
        shelter_distance: Distance to nearest shelter in km
        shelter_eta: ETA to nearest shelter in seconds
        alert_data: Additional alert data for payload

    Returns:
        bool: True if successful, False otherwise
    """
    # Format ETA
    if shelter_eta < 60:
        eta_text = f"{shelter_eta}s"
    elif shelter_eta < 3600:
        minutes = shelter_eta // 60
        eta_text = f"{minutes}min"
    else:
        hours = shelter_eta // 3600
        minutes = (shelter_eta % 3600) // 60
        eta_text = f"{hours}h {minutes}min"

    # Format distance
    if shelter_distance < 1:
        distance_text = f"{int(shelter_distance * 1000)}m"
    else:
        distance_text = f"{shelter_distance:.1f}km"

    # Create body text
    body = f"Nearest shelter {distance_text} away, ETA {eta_text}"

    # Prepare data payload
    data = {
        'type': 'emergency_alert',
        'alert_id': str(alert_data.get('alert_id', '')),
        'hazard_type': alert_data.get('hazard_type', ''),
        'severity': alert_data.get('severity', ''),
        'shelter_distance_km': str(shelter_distance),
        'shelter_eta_seconds': str(shelter_eta),
        'action': 'navigate_to_shelter'
    }

    return send_push(token, alert_title, body, data)


def send_test_push(token: str) -> bool:
    """
    Send a test push notification.

    Args:
        token: FCM registration token

    Returns:
        bool: True if successful, False otherwise
    """
    title = "🧪 SafeNow Test"
    body = "This is a test notification from SafeNow emergency system."
    data = {
        'type': 'test',
        'timestamp': str(int(time.time())) if 'time' in globals() else '0'
    }

    return send_push(token, title, body, data)


# Import time for test function
import time