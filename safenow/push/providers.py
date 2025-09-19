import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Optional, Any
from django.conf import settings
from push.fcm import send_push as fcm_send_push

logger = logging.getLogger(__name__)


class PushProvider(ABC):
    """Abstract base class for push notification providers."""

    @abstractmethod
    def send_push(self, token: str, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> bool:
        """Send push notification."""
        pass

    @abstractmethod
    def send_emergency_alert_push(self, token: str, alert_title: str, shelter_distance: float,
                                shelter_eta: int, alert_data: Dict[str, Any]) -> bool:
        """Send emergency alert push notification."""
        pass


class MockPushProvider(PushProvider):
    """Mock push provider that logs notifications to stdout/logger."""

    def send_push(self, token: str, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> bool:
        """Mock push notification - logs to stdout and always returns success."""
        data_str = json.dumps(data) if data else "{}"
        log_message = f"MOCK PUSH -> token={token[:20]}... title='{title}' body='{body}' data={data_str}"

        # Log to both logger and print to stdout for visibility
        logger.info(log_message)
        print(log_message)

        return True

    def send_emergency_alert_push(self, token: str, alert_title: str, shelter_distance: float,
                                shelter_eta: int, alert_data: Dict[str, Any]) -> bool:
        """Mock emergency alert push notification."""
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

        return self.send_push(token, alert_title, body, data)


class FcmPushProvider(PushProvider):
    """FCM push provider using the existing FCM implementation."""

    def send_push(self, token: str, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> bool:
        """Send push notification via FCM."""
        try:
            return fcm_send_push(token, title, body, data)
        except Exception as e:
            logger.error(f"FCM push failed: {str(e)}")
            return False

    def send_emergency_alert_push(self, token: str, alert_title: str, shelter_distance: float,
                                shelter_eta: int, alert_data: Dict[str, Any]) -> bool:
        """Send emergency alert push notification via FCM."""
        from push.fcm import send_emergency_alert_push as fcm_send_emergency_alert_push

        try:
            return fcm_send_emergency_alert_push(token, alert_title, shelter_distance, shelter_eta, alert_data)
        except Exception as e:
            logger.error(f"FCM emergency alert push failed: {str(e)}")
            return False


def get_push_provider() -> PushProvider:
    """
    Factory function to get the configured push provider.

    Returns:
        PushProvider: Configured push provider instance based on PUSH_PROVIDER setting
    """
    provider_type = getattr(settings, 'PUSH_PROVIDER', 'mock')

    if provider_type == 'fcm':
        logger.info("Using FCM push provider")
        return FcmPushProvider()
    elif provider_type == 'mock':
        logger.info("Using Mock push provider")
        return MockPushProvider()
    else:
        logger.warning(f"Unknown push provider '{provider_type}', defaulting to mock")
        return MockPushProvider()