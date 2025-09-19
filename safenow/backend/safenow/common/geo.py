import math


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees) using the Haversine formula.

    Returns distance in kilometers.
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))

    # Radius of earth in kilometers
    r = 6371

    return c * r


def eta_walk_seconds(distance_km: float, speed_m_s: float = 1.4) -> int:
    """
    Calculate estimated time of arrival (ETA) for walking a given distance.

    Args:
        distance_km: Distance in kilometers
        speed_m_s: Walking speed in meters per second (default: 1.4 m/s ≈ 5 km/h)

    Returns:
        ETA in seconds

    Raises:
        ValueError: If distance_km is negative or speed_m_s is <= 0
    """
    if distance_km < 0:
        raise ValueError("Distance cannot be negative")
    if speed_m_s <= 0:
        raise ValueError("Speed must be positive")

    distance_m = distance_km * 1000  # Convert km to meters
    eta_seconds = distance_m / speed_m_s
    return int(round(eta_seconds))


def bounding_box(lat: float, lon: float, radius_km: float = 1.5) -> tuple:
    """
    Calculate bounding box coordinates for a given point and radius.

    Args:
        lat: Center latitude in decimal degrees
        lon: Center longitude in decimal degrees
        radius_km: Radius in kilometers (default: 1.5km)

    Returns:
        Tuple of (min_lat, max_lat, min_lon, max_lon)
    """
    # Approximate conversion: 1 degree latitude ≈ 111 km
    lat_delta = radius_km / 111.0

    # Longitude delta varies by latitude due to Earth's curvature
    lon_delta = radius_km / (111.0 * math.cos(math.radians(lat)))

    min_lat = lat - lat_delta
    max_lat = lat + lat_delta
    min_lon = lon - lon_delta
    max_lon = lon + lon_delta

    return (min_lat, max_lat, min_lon, max_lon)