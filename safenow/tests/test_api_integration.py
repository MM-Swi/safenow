import pytest
from datetime import datetime, timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from shelters.models import Shelter
from alerts.models import Alert
from devices.models import Device, SafetyStatus


class APIIntegrationTest(APITestCase):
    """Comprehensive API integration tests with fixtures."""

    def setUp(self):
        """Set up test fixtures for Warsaw shelters and alerts."""
        # Create 4 Warsaw shelters
        self.shelters = [
            Shelter.objects.create(
                name="Warsaw Central Station Shelter",
                address="Aleje Jerozolimskie 54, Warsaw",
                lat=52.2297,
                lon=21.0122,
                is_verified=True,
                capacity=500,
                is_open_now=True,
                source="test"
            ),
            Shelter.objects.create(
                name="Palace of Culture Underground",
                address="Plac Defilad 1, Warsaw",
                lat=52.2319,
                lon=20.9957,
                is_verified=True,
                capacity=300,
                is_open_now=True,
                source="test"
            ),
            Shelter.objects.create(
                name="Old Town Metro Station",
                address="Krakowskie Przedmiescie, Warsaw",
                lat=52.2477,
                lon=21.0170,
                is_verified=True,
                capacity=200,
                is_open_now=False,  # Closed shelter
                source="test"
            ),
            Shelter.objects.create(
                name="University of Warsaw Basement",
                address="Krakowskie Przedmiescie 26/28, Warsaw",
                lat=52.2397,
                lon=21.0175,
                is_verified=False,
                capacity=100,
                is_open_now=True,
                source="test"
            ),
        ]

        # Create 2 alerts: one valid, one expired
        now = timezone.now()
        self.valid_alert = Alert.objects.create(
            hazard_type="MISSILE",
            severity="CRITICAL",
            center_lat=52.2297,
            center_lon=21.0122,
            radius_m=2000,
            valid_until=now + timedelta(hours=1),  # Valid for 1 hour
            source="test"
        )

        self.expired_alert = Alert.objects.create(
            hazard_type="AIR_RAID",
            severity="HIGH",
            center_lat=52.2319,
            center_lon=20.9957,
            radius_m=1500,
            valid_until=now - timedelta(hours=1),  # Expired 1 hour ago
            source="test"
        )

    def test_health_endpoint_returns_status_ok_and_counts(self):
        """Test /api/health returns status ok and counts keys."""
        response = self.client.get('/api/health/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check required keys
        self.assertIn('status', data)
        self.assertIn('counts', data)
        self.assertEqual(data['status'], 'ok')

        # Check counts
        self.assertIn('shelters', data['counts'])
        self.assertIn('active_alerts', data['counts'])
        self.assertEqual(data['counts']['shelters'], 4)
        self.assertEqual(data['counts']['active_alerts'], 1)  # Only valid alert

    def test_nearby_shelters_returns_limit_and_sorted_by_distance(self):
        """Test /api/nearby-shelters returns <= limit and sorted by distance_km ascending."""
        # Test from Palace of Culture location
        response = self.client.get('/api/nearby-shelters/', {
            'lat': 52.2319,
            'lon': 20.9957,
            'limit': 2
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check limit respected
        self.assertLessEqual(len(data), 2)

        # Check sorted by distance ascending
        if len(data) > 1:
            for i in range(len(data) - 1):
                self.assertLessEqual(data[i]['distance_km'], data[i + 1]['distance_km'])

        # Check required fields
        for shelter in data:
            self.assertIn('id', shelter)
            self.assertIn('name', shelter)
            self.assertIn('distance_km', shelter)
            self.assertIn('eta_seconds', shelter)
            self.assertIn('is_open_now', shelter)

    def test_nearby_shelters_default_limit_3(self):
        """Test nearby shelters uses default limit of 3."""
        response = self.client.get('/api/nearby-shelters/', {
            'lat': 52.2297,
            'lon': 21.0122
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should return maximum 3 shelters (default limit)
        self.assertLessEqual(len(data), 3)

    def test_active_alerts_returns_only_inside_radius_and_valid(self):
        """Test /api/active-alerts returns alert only when point is inside radius and valid_until >= now."""
        # Test point inside valid alert radius
        response = self.client.get('/api/active-alerts/', {
            'lat': 52.2297,  # Same as valid alert center
            'lon': 21.0122
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should return only the valid alert
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], self.valid_alert.id)
        self.assertEqual(data[0]['hazard_type'], 'MISSILE')

        # Test point outside all alert radii
        response = self.client.get('/api/active-alerts/', {
            'lat': 52.5,  # Far from both alerts
            'lon': 21.5
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should return no alerts
        self.assertEqual(len(data), 0)

    def test_device_register_upserts_by_device_id(self):
        """Test /api/devices/register upserts by device_id, persists push_token, updates last_seen_at."""
        device_id = "test_device_123"

        # First registration
        response = self.client.post('/api/devices/register/', {
            'device_id': device_id,
            'push_token': 'token_v1',
            'lat': 52.2297,
            'lon': 21.0122
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data['device_id'], device_id)

        # Check device was created
        device = Device.objects.get(device_id=device_id)
        self.assertEqual(device.push_token, 'token_v1')
        self.assertEqual(float(device.last_lat), 52.2297)
        first_seen = device.last_seen_at

        # Second registration (update)
        response = self.client.post('/api/devices/register/', {
            'device_id': device_id,
            'push_token': 'token_v2',  # Updated token
            'lat': 52.2400,  # Updated location
            'lon': 21.0200
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check device was updated, not duplicated
        self.assertEqual(Device.objects.filter(device_id=device_id).count(), 1)
        device.refresh_from_db()
        self.assertEqual(device.push_token, 'token_v2')
        self.assertEqual(float(device.last_lat), 52.2400)
        self.assertGreater(device.last_seen_at, first_seen)

    def test_status_validates_in_shelter_requires_shelter_id(self):
        """Test /api/status validates IN_SHELTER requires shelter_id and persists status."""
        # Create a device first
        device = Device.objects.create(
            device_id="status_test_device",
            push_token="test_token"
        )

        # Test IN_SHELTER without shelter_id should fail
        response = self.client.post('/api/status/', {
            'device_id': device.device_id,
            'status': 'IN_SHELTER'
            # Missing shelter_id
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test IN_SHELTER with shelter_id should succeed
        response = self.client.post('/api/status/', {
            'device_id': device.device_id,
            'status': 'IN_SHELTER',
            'shelter_id': self.shelters[0].id
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data['status'], 'IN_SHELTER')
        self.assertEqual(data['shelter_id'], self.shelters[0].id)

        # Check status was persisted
        safety_status = SafetyStatus.objects.get(device=device)
        self.assertEqual(safety_status.status, 'IN_SHELTER')
        self.assertEqual(safety_status.shelter.id, self.shelters[0].id)

        # Test other statuses work without shelter_id
        response = self.client.post('/api/status/', {
            'device_id': device.device_id,
            'status': 'OK'
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_api_error_handling_json_responses(self):
        """Test API endpoints return JSON error responses."""
        # Test 404 for non-existent endpoint
        response = self.client.get('/api/nonexistent/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response['Content-Type'], 'application/json')

        # Test 400 for invalid parameters
        response = self.client.get('/api/nearby-shelters/', {
            'lat': 'invalid',
            'lon': 'invalid'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response['Content-Type'], 'application/json')

    def test_alert_geo_filtering_precision(self):
        """Test precise geo-filtering for alerts."""
        # Test point exactly at alert edge (should be included)
        # Calculate point at radius distance from alert center
        alert_center_lat = float(self.valid_alert.center_lat)
        alert_center_lon = float(self.valid_alert.center_lon)

        # Test point very close to center (definitely inside)
        response = self.client.get('/api/active-alerts/', {
            'lat': alert_center_lat + 0.001,  # Very small offset
            'lon': alert_center_lon + 0.001
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 1)

        # Test point far from center (definitely outside)
        response = self.client.get('/api/active-alerts/', {
            'lat': alert_center_lat + 0.5,  # Large offset (~55km)
            'lon': alert_center_lon + 0.5
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 0)