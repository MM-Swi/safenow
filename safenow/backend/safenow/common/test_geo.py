import pytest
import math
from .geo import haversine_km, eta_walk_seconds


class TestHaversineDistance:
    """Test cases for haversine distance calculation."""

    def test_haversine_warsaw_points(self):
        """Test haversine distance between two points in Warsaw with tolerance 0.1 km."""
        # Warsaw Central Station: 52.2297, 21.0122
        # Palace of Culture and Science: 52.2319, 20.9957
        # Expected distance: ~1.2 km
        lat1, lon1 = 52.2297, 21.0122
        lat2, lon2 = 52.2319, 20.9957

        distance = haversine_km(lat1, lon1, lat2, lon2)
        expected_distance = 1.2  # approximate distance in km

        assert abs(distance - expected_distance) <= 0.1, f"Distance {distance} km not within 0.1 km of expected {expected_distance} km"

    def test_haversine_same_point(self):
        """Test distance between the same point should be 0."""
        lat, lon = 52.2297, 21.0122
        distance = haversine_km(lat, lon, lat, lon)
        assert distance == 0.0

    def test_haversine_long_distance(self):
        """Test distance between distant cities."""
        # Warsaw: 52.2297, 21.0122
        # London: 51.5074, -0.1278
        # Expected distance: ~1449 km
        lat1, lon1 = 52.2297, 21.0122
        lat2, lon2 = 51.5074, -0.1278

        distance = haversine_km(lat1, lon1, lat2, lon2)
        expected_distance = 1449  # approximate distance in km

        # Allow 5% tolerance for long distances
        tolerance = expected_distance * 0.05
        assert abs(distance - expected_distance) <= tolerance

    def test_haversine_equator_points(self):
        """Test distance between points on the equator."""
        # Two points on equator, 1 degree apart
        lat1, lon1 = 0.0, 0.0
        lat2, lon2 = 0.0, 1.0

        distance = haversine_km(lat1, lon1, lat2, lon2)
        expected_distance = 111.32  # ~111.32 km per degree at equator

        assert abs(distance - expected_distance) <= 1.0

    def test_haversine_negative_coordinates(self):
        """Test with negative coordinates (southern/western hemispheres)."""
        # Sydney: -33.8688, 151.2093
        # Melbourne: -37.8136, 144.9631
        # Expected distance: ~713 km
        lat1, lon1 = -33.8688, 151.2093
        lat2, lon2 = -37.8136, 144.9631

        distance = haversine_km(lat1, lon1, lat2, lon2)
        expected_distance = 713

        # Allow 5% tolerance
        tolerance = expected_distance * 0.05
        assert abs(distance - expected_distance) <= tolerance


class TestEtaWalkSeconds:
    """Test cases for walking ETA calculation."""

    def test_eta_walk_seconds_basic_case(self):
        """Test basic ETA calculation with default walking speed."""
        distance_km = 1.0  # 1 km
        expected_seconds = 714  # 1000m / 1.4 m/s ≈ 714 seconds

        eta = eta_walk_seconds(distance_km)

        assert eta == expected_seconds

    def test_eta_walk_seconds_custom_speed(self):
        """Test ETA calculation with custom walking speed."""
        distance_km = 2.0  # 2 km
        speed_m_s = 2.0   # 2 m/s (faster walking)
        expected_seconds = 1000  # 2000m / 2.0 m/s = 1000 seconds

        eta = eta_walk_seconds(distance_km, speed_m_s)

        assert eta == expected_seconds

    def test_eta_walk_seconds_zero_distance(self):
        """Test ETA for zero distance."""
        distance_km = 0.0
        eta = eta_walk_seconds(distance_km)
        assert eta == 0

    def test_eta_walk_seconds_small_distance(self):
        """Test ETA for small distance (100 meters)."""
        distance_km = 0.1  # 100 meters
        expected_seconds = 71  # 100m / 1.4 m/s ≈ 71 seconds

        eta = eta_walk_seconds(distance_km)

        assert eta == expected_seconds

    def test_eta_walk_seconds_large_distance(self):
        """Test ETA for large distance (10 km)."""
        distance_km = 10.0
        expected_seconds = 7143  # 10000m / 1.4 m/s ≈ 7143 seconds

        eta = eta_walk_seconds(distance_km)

        assert eta == expected_seconds

    def test_eta_walk_seconds_returns_integer(self):
        """Test that ETA always returns an integer."""
        distance_km = 1.5
        eta = eta_walk_seconds(distance_km)

        assert isinstance(eta, int)

    def test_eta_walk_seconds_rounding(self):
        """Test proper rounding of ETA calculation."""
        # Distance that results in 100.4 seconds should round to 100
        distance_km = 0.1406  # 140.6m / 1.4 m/s = 100.4 seconds
        eta = eta_walk_seconds(distance_km)

        # Should round to nearest integer
        expected = 100
        assert eta == expected


class TestGeoIntegration:
    """Integration tests combining haversine and ETA calculations."""

    def test_warsaw_shelter_scenario(self):
        """Test realistic scenario: walking to shelter in Warsaw."""
        # Person at Palace of Culture: 52.2319, 20.9957
        # Shelter at Central Station: 52.2297, 21.0122
        person_lat, person_lon = 52.2319, 20.9957
        shelter_lat, shelter_lon = 52.2297, 21.0122

        # Calculate distance and ETA
        distance = haversine_km(person_lat, person_lon, shelter_lat, shelter_lon)
        eta = eta_walk_seconds(distance)

        # Verify reasonable values
        assert 1.0 <= distance <= 1.5  # Should be around 1.2 km
        assert 700 <= eta <= 1100      # Should be around 850 seconds (~14 minutes)

    def test_emergency_walking_speed(self):
        """Test ETA with emergency walking speed (faster pace)."""
        distance_km = 2.0
        emergency_speed = 2.0  # 2 m/s (7.2 km/h - brisk walk/light jog)

        normal_eta = eta_walk_seconds(distance_km)
        emergency_eta = eta_walk_seconds(distance_km, emergency_speed)

        # Emergency should be faster
        assert emergency_eta < normal_eta
        assert emergency_eta == 1000  # 2000m / 2.0 m/s


class TestGeoEdgeCases:
    """Test edge cases and error handling for geo utilities."""

    def test_haversine_zero_distance(self):
        """Test zero distance edge case."""
        distance = haversine_km(0, 0, 0, 0)
        assert distance == 0.0

    def test_haversine_approximately_1km(self):
        """Test ~1km distance for validation."""
        # Warsaw coordinates approximately 1km apart
        lat1, lon1 = 52.2297, 21.0122
        lat2, lon2 = 52.2297, 21.0244  # Move ~1km east
        distance = haversine_km(lat1, lon1, lat2, lon2)
        assert 0.8 <= distance <= 1.2, f"Expected ~1km, got {distance}km"

    def test_haversine_invalid_inputs(self):
        """Test invalid input handling."""
        with pytest.raises(TypeError):
            haversine_km("invalid", 21.0122, 52.2297, 21.0122)

        with pytest.raises(TypeError):
            haversine_km(52.2297, "invalid", 52.2297, 21.0122)

    def test_eta_walk_seconds_zero_distance_edge_case(self):
        """Test ETA calculation with zero distance."""
        eta = eta_walk_seconds(0.0)
        assert eta == 0

    def test_eta_walk_seconds_invalid_inputs(self):
        """Test ETA calculation with invalid inputs."""
        with pytest.raises(ValueError):
            eta_walk_seconds(-1.0)  # Negative distance

        with pytest.raises(ValueError):
            eta_walk_seconds(1.0, speed_m_s=0)  # Zero speed

        with pytest.raises(ValueError):
            eta_walk_seconds(1.0, speed_m_s=-1)  # Negative speed