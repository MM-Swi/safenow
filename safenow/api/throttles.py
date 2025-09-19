from rest_framework.throttling import AnonRateThrottle


class SimulateAlertThrottle(AnonRateThrottle):
    """
    Throttle for simulation alert endpoint.
    Allows only 3 requests per minute for anonymous users.
    """
    scope = 'simulate'