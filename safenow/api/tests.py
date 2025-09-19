from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from django.conf import settings
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import timedelta
from decimal import Decimal

from shelters.models import Shelter
from alerts.models import Alert
from devices.models import Device, SafetyStatus


class HealthAPITestCase(APITestCase):
    """Test cases for the health endpoint."""

    def setUp(self):
        # Create test data
        Shelter.objects.create(
            name="Test Shelter 1",
            address="Test Address 1",
            lat=Decimal('52.2297'),
            lon=Decimal('21.0122')
        )
        Alert.objects.create(
            hazard_type='MISSILE',
            severity='HIGH',
            center_lat=Decimal('52.2319'),
            center_lon=Decimal('20.9957'),
            radius_m=5000,
            valid_until=timezone.now() + timedelta(hours=1),
            source='test'
        )

    def test_health_endpoint_success(self):
        """Test health endpoint returns correct data."""
        url = reverse('health')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data['status'], 'ok')
        self.assertEqual(data['version'], getattr(settings, 'APP_VERSION', 'dev'))
        self.assertIn('counts', data)
        self.assertEqual(data['counts']['shelters'], 1)
        self.assertEqual(data['counts']['active_alerts'], 1)

    def test_health_endpoint_counts_expired_alerts(self):
        """Test health endpoint doesn't count expired alerts."""
        # Create expired alert
        Alert.objects.create(
            hazard_type='FIRE',
            severity='LOW',
            center_lat=Decimal('52.0000'),
            center_lon=Decimal('21.0000'),
            radius_m=1000,
            valid_until=timezone.now() - timedelta(hours=1),  # Expired
            source='test_expired'
        )

        url = reverse('health')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should still be 1 active alert (not counting expired)
        self.assertEqual(data['counts']['active_alerts'], 1)


class NearbySheltersAPITestCase(APITestCase):
    """Test cases for the nearby shelters endpoint."""

    def setUp(self):
        # Create test shelters in Warsaw area
        self.shelter1 = Shelter.objects.create(
            name="Central Station Shelter",
            address="Warsaw Central Station",
            lat=Decimal('52.2297'),
            lon=Decimal('21.0122'),
            is_open_now=True
        )
        self.shelter2 = Shelter.objects.create(
            name="Palace Shelter",
            address="Palace of Culture",
            lat=Decimal('52.2319'),
            lon=Decimal('20.9957'),
            is_open_now=True
        )
        self.shelter3 = Shelter.objects.create(
            name="Far Shelter",
            address="Far from center",
            lat=Decimal('52.3000'),
            lon=Decimal('21.1000'),
            is_open_now=False
        )

    def test_nearby_shelters_success(self):
        """Test nearby shelters endpoint with valid parameters."""
        url = reverse('nearby-shelters')
        # User location: near Warsaw Central Station
        response = self.client.get(url, {
            'lat': 52.2300,
            'lon': 21.0100,
            'limit': 2
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(len(data), 2)
        # Results should be sorted by distance
        self.assertTrue(data[0]['distance_km'] <= data[1]['distance_km'])

        # Check required fields are present
        for shelter in data:
            self.assertIn('id', shelter)
            self.assertIn('name', shelter)
            self.assertIn('address', shelter)
            self.assertIn('distance_km', shelter)
            self.assertIn('eta_seconds', shelter)
            self.assertIn('is_open_now', shelter)

    def test_nearby_shelters_invalid_parameters(self):
        """Test nearby shelters endpoint with invalid parameters."""
        url = reverse('nearby-shelters')

        # Missing lat parameter
        response = self.client.get(url, {'lon': 21.0100})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())

        # Invalid lat parameter
        response = self.client.get(url, {'lat': 'invalid', 'lon': 21.0100})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nearby_shelters_default_limit(self):
        """Test nearby shelters endpoint uses default limit of 3."""
        url = reverse('nearby-shelters')
        response = self.client.get(url, {
            'lat': 52.2300,
            'lon': 21.0100
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        # Should return all 3 shelters (default limit)
        self.assertEqual(len(data), 3)

    def test_nearby_shelters_distance_calculation(self):
        """Test that distance calculations are reasonable."""
        url = reverse('nearby-shelters')
        response = self.client.get(url, {
            'lat': 52.2297,  # Same as shelter1 location
            'lon': 21.0122,
            'limit': 1
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # First result should be very close (same location)
        self.assertLess(data[0]['distance_km'], 0.1)
        self.assertEqual(data[0]['id'], self.shelter1.id)


class SafetyStatusAPITestCase(APITestCase):
    """Test cases for safety status endpoint."""

    def setUp(self):
        self.device = Device.objects.create(device_id='test_device')
        self.shelter = Shelter.objects.create(
            name="Test Shelter",
            address="Test Address",
            lat=Decimal('52.2297'),
            lon=Decimal('21.0122')
        )

    def test_safety_status_success(self):
        """Test safety status update with valid data."""
        url = reverse('safety-status')
        data = {
            'device_id': 'test_device',
            'status': 'OK'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response_data = response.json()

        self.assertEqual(response_data['device_id'], 'test_device')
        self.assertEqual(response_data['status'], 'OK')
        self.assertIsNone(response_data['shelter_id'])
        self.assertIn('updated_at', response_data)

    def test_safety_status_in_shelter_without_shelter_id(self):
        """Test safety status IN_SHELTER without shelter_id returns 400."""
        url = reverse('safety-status')
        data = {
            'device_id': 'test_device',
            'status': 'IN_SHELTER'
            # Missing shelter_id
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        errors = response.json()
        self.assertIn('shelter_id is required when status is IN_SHELTER', str(errors))


class SimulateAlertSecurityTestCase(APITestCase):
    """Test cases for simulate alert endpoint security."""

    def setUp(self):
        self.url = reverse('simulate-alert')
        self.valid_alert_data = {
            'hazard_type': 'MISSILE',
            'severity': 'CRITICAL',
            'center_lat': 52.2297,
            'center_lon': 21.0122,
            'radius_m': 5000,
            'valid_minutes': 60
        }

    def _disable_throttling(self):
        """Helper method to disable throttling by clearing cache."""
        from django.core.cache import cache
        cache.clear()

    @override_settings(DEBUG=True)
    def test_simulate_alert_in_debug_mode_no_auth_required(self):
        """Test simulate alert works without API key in DEBUG mode."""
        self._disable_throttling()
        response = self.client.post(self.url, self.valid_alert_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data['hazard_type'], 'MISSILE')
        self.assertEqual(data['severity'], 'CRITICAL')

    @override_settings(DEBUG=False, SIMULATION_API_KEY='test-secret-key')
    def test_simulate_alert_production_mode_requires_api_key(self):
        """Test simulate alert requires X-API-KEY header in production mode."""
        self._disable_throttling()
        # Test without API key header
        response = self.client.post(self.url, self.valid_alert_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        data = response.json()
        self.assertEqual(data['error']['code'], 401)
        self.assertEqual(data['error']['message'], 'Invalid or missing X-API-KEY header')

    @override_settings(DEBUG=False, SIMULATION_API_KEY='test-secret-key')
    def test_simulate_alert_production_mode_with_invalid_api_key(self):
        """Test simulate alert rejects invalid API key in production mode."""
        self._disable_throttling()
        response = self.client.post(
            self.url,
            self.valid_alert_data,
            format='json',
            HTTP_X_API_KEY='wrong-key'
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        data = response.json()
        self.assertEqual(data['error']['code'], 401)
        self.assertEqual(data['error']['message'], 'Invalid or missing X-API-KEY header')

    @override_settings(DEBUG=False, SIMULATION_API_KEY='test-secret-key')
    def test_simulate_alert_production_mode_with_valid_api_key(self):
        """Test simulate alert works with valid API key in production mode."""
        self._disable_throttling()
        response = self.client.post(
            self.url,
            self.valid_alert_data,
            format='json',
            HTTP_X_API_KEY='test-secret-key'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data['hazard_type'], 'MISSILE')
        self.assertEqual(data['severity'], 'CRITICAL')

    @override_settings(DEBUG=False, SIMULATION_API_KEY='test-secret-key')
    def test_simulate_alert_production_mode_with_empty_api_key(self):
        """Test simulate alert rejects empty API key in production mode."""
        self._disable_throttling()
        response = self.client.post(
            self.url,
            self.valid_alert_data,
            format='json',
            HTTP_X_API_KEY=''
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        data = response.json()
        self.assertEqual(data['error']['code'], 401)
        self.assertEqual(data['error']['message'], 'Invalid or missing X-API-KEY header')

    @override_settings(DEBUG=False)
    def test_simulate_alert_production_mode_without_configured_key(self):
        """Test simulate alert behavior when SIMULATION_API_KEY is not configured."""
        self._disable_throttling()
        response = self.client.post(
            self.url,
            self.valid_alert_data,
            format='json',
            HTTP_X_API_KEY='any-key'
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        data = response.json()
        self.assertEqual(data['error']['code'], 401)
        self.assertEqual(data['error']['message'], 'Invalid or missing X-API-KEY header')
