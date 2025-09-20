from django.conf import settings
from django.utils import timezone
from django.db import models
from django.shortcuts import render
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from shelters.models import Shelter
from alerts.models import Alert
from devices.models import Device, SafetyStatus
from backend.safenow.common.geo import haversine_km, eta_walk_seconds, bounding_box
from backend.safenow.advice.provider import SafetyAdvisor
from .throttles import SimulateAlertThrottle
from .serializers import (
    HealthSerializer,
    NearbyShelterSerializer,
    ActiveAlertSerializer,
    DeviceRegisterSerializer,
    SafetyStatusSerializer,
    SimulateAlertSerializer,
)


class HealthView(APIView):
    """Health check endpoint."""

    throttle_classes = [AnonRateThrottle]

    @extend_schema(
        summary="System Health Check",
        description="Get system health status, version, and resource counts",
        responses={200: HealthSerializer},
    )
    def get(self, request):
        shelters_count = Shelter.objects.count()
        active_alerts_count = Alert.objects.filter(
            valid_until__gte=timezone.now()
        ).count()

        data = {
            'status': 'ok',
            'version': getattr(settings, 'APP_VERSION', 'dev'),
            'counts': {
                'shelters': shelters_count,
                'active_alerts': active_alerts_count,
            },
        }

        serializer = HealthSerializer(data)
        return Response(serializer.data)


class NearbySheltersView(APIView):
    """Find nearby shelters with distance and ETA."""

    throttle_classes = [AnonRateThrottle]

    @extend_schema(
        summary="Find Nearby Shelters",
        description="Get nearby shelters sorted by distance with walking time estimates",
        parameters=[
            OpenApiParameter(
                name='lat',
                type=OpenApiTypes.FLOAT,
                location=OpenApiParameter.QUERY,
                required=True,
                description='User latitude (-90 to 90)',
            ),
            OpenApiParameter(
                name='lon',
                type=OpenApiTypes.FLOAT,
                location=OpenApiParameter.QUERY,
                required=True,
                description='User longitude (-180 to 180)',
            ),
            OpenApiParameter(
                name='limit',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                required=False,
                description='Maximum number of shelters to return (default: 3)',
            ),
        ],
        responses={
            200: NearbyShelterSerializer(many=True),
            400: {'description': 'Invalid lat, lon, or limit parameters'},
        },
    )
    def get(self, request):
        try:
            user_lat = float(request.query_params.get('lat'))
            user_lon = float(request.query_params.get('lon'))
            limit = int(request.query_params.get('limit', 3))
        except (TypeError, ValueError):
            return Response(
                {
                    'error': {
                        'code': 400,
                        'message': 'Invalid lat, lon, or limit parameters',
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Clamp limit to maximum of 20
        MAX_LIMIT = 20
        limit = min(limit, MAX_LIMIT)

        # Calculate bounding box for prefiltering (~10km radius)
        min_lat, max_lat, min_lon, max_lon = bounding_box(user_lat, user_lon, 10.0)

        # Query shelters within bounding box first (uses indexes)
        shelters = Shelter.objects.filter(
            lat__gte=min_lat, lat__lte=max_lat, lon__gte=min_lon, lon__lte=max_lon
        )

        shelter_distances = []

        for shelter in shelters:
            distance_km = haversine_km(
                user_lat, user_lon, float(shelter.lat), float(shelter.lon)
            )
            eta_seconds = eta_walk_seconds(distance_km)

            # Add calculated fields to shelter object
            shelter.distance_km = round(distance_km, 3)
            shelter.eta_seconds = eta_seconds
            shelter_distances.append((distance_km, shelter))

        # Sort by distance and limit results
        shelter_distances.sort(key=lambda x: x[0])
        nearest_shelters = [shelter for _, shelter in shelter_distances[:limit]]

        serializer = NearbyShelterSerializer(nearest_shelters, many=True)
        return Response(serializer.data)


class ActiveAlertsView(APIView):
    """Get active alerts within user's location radius."""

    throttle_classes = [AnonRateThrottle]

    @extend_schema(
        summary="Get Active Alerts",
        description="Get emergency alerts that affect the user's location (within alert radius and still valid)",
        parameters=[
            OpenApiParameter(
                name='lat',
                type=OpenApiTypes.FLOAT,
                location=OpenApiParameter.QUERY,
                required=True,
                description='User latitude (-90 to 90)',
            ),
            OpenApiParameter(
                name='lon',
                type=OpenApiTypes.FLOAT,
                location=OpenApiParameter.QUERY,
                required=True,
                description='User longitude (-180 to 180)',
            ),
        ],
        responses={
            200: ActiveAlertSerializer(many=True),
            400: {'description': 'Invalid lat or lon parameters'},
        },
    )
    def get(self, request):
        try:
            user_lat = float(request.query_params.get('lat'))
            user_lon = float(request.query_params.get('lon'))
        except (TypeError, ValueError):
            return Response(
                {'error': {'code': 400, 'message': 'Invalid lat or lon parameters'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get all active alerts
        active_alerts = Alert.objects.filter(valid_until__gte=timezone.now())

        # Filter alerts where user is within radius
        relevant_alerts = []
        for alert in active_alerts:
            distance_km = haversine_km(
                user_lat, user_lon, float(alert.center_lat), float(alert.center_lon)
            )
            distance_m = distance_km * 1000

            if distance_m <= alert.radius_m:
                # Add distance to alert object for serialization
                alert.distance_km = round(distance_km, 3)
                relevant_alerts.append(alert)

        # Sort by severity (CRITICAL first) and then by distance
        severity_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
        relevant_alerts.sort(
            key=lambda x: (severity_order.get(x.severity, 4), x.distance_km)
        )

        serializer = ActiveAlertSerializer(relevant_alerts, many=True)
        return Response(serializer.data)


class DeviceRegisterView(APIView):
    """Register or update a device."""

    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        serializer = DeviceRegisterSerializer(data=request.data)
        if serializer.is_valid():
            device = serializer.save()
            return Response(
                serializer.to_representation(device), status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SafetyStatusView(APIView):
    """Update device safety status."""

    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        serializer = SafetyStatusSerializer(data=request.data)
        if serializer.is_valid():
            try:
                safety_status = serializer.save()
                return Response(
                    serializer.to_representation(safety_status),
                    status=status.HTTP_201_CREATED,
                )
            except Exception as e:
                return Response(
                    {'error': {'code': 400, 'message': str(e)}},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SimulateAlertView(APIView):
    """Simulate an emergency alert."""

    throttle_classes = [SimulateAlertThrottle]

    def post(self, request):
        # Check authentication based on DEBUG setting
        if not settings.DEBUG:
            api_key = request.headers.get('X-API-KEY')
            expected_key = getattr(settings, 'SIMULATION_API_KEY', None)
            if not api_key or api_key != expected_key:
                return Response(
                    {
                        'error': {
                            'code': 401,
                            'message': 'Invalid or missing X-API-KEY header',
                        }
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        serializer = SimulateAlertSerializer(data=request.data)
        if serializer.is_valid():
            alert = serializer.save()
            return Response(
                serializer.to_representation(alert), status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def simulate_form_view(request):
    """HTML form for creating simulation alerts."""
    if request.method == 'POST':
        # Handle form submission
        form_data = {
            'hazard_type': request.POST.get('hazard_type'),
            'severity': request.POST.get('severity'),
            'center_lat': request.POST.get('center_lat'),
            'center_lon': request.POST.get('center_lon'),
            'radius_m': request.POST.get('radius_m'),
            'valid_minutes': request.POST.get('valid_minutes'),
            'source': 'simulation_form',
        }

        serializer = SimulateAlertSerializer(data=form_data)
        if serializer.is_valid():
            alert = serializer.save()
            context = {
                'success': True,
                'alert': alert,
                'message': f'Alert created successfully! ID: {alert.id}',
            }
        else:
            context = {
                'success': False,
                'errors': serializer.errors,
                'form_data': form_data,
            }
    else:
        context = {}

    # Add choices for form
    context.update(
        {
            'hazard_types': Alert.HAZARD_TYPE_CHOICES,
            'severities': Alert.SEVERITY_CHOICES,
            'debug_mode': settings.DEBUG,
        }
    )

    return render(request, 'simulate.html', context)


class SafetyInstructionsView(APIView):
    """Get safety instructions for specific hazard type and ETA."""

    throttle_classes = [AnonRateThrottle]

    @extend_schema(
        summary="Get Safety Instructions",
        description="Get hazard-specific safety instructions with evacuation time context",
        parameters=[
            OpenApiParameter(
                name='hazard_type',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Type of hazard (AIR_RAID, DRONE, MISSILE, FLOOD, FIRE, INDUSTRIAL)',
            ),
            OpenApiParameter(
                name='eta_seconds',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                required=False,
                description='Time to reach shelter in seconds (default: 0)',
            ),
        ],
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'title': {'type': 'string'},
                    'steps': {'type': 'array', 'items': {'type': 'string'}},
                    'do_not': {'type': 'array', 'items': {'type': 'string'}},
                    'eta_hint': {'type': 'string'},
                },
            },
            400: {'description': 'Invalid hazard_type or eta_seconds parameters'},
        },
    )
    def get(self, request):
        hazard_type = request.query_params.get('hazard_type')
        eta_seconds = request.query_params.get('eta_seconds')

        if not hazard_type:
            return Response(
                {
                    'error': {
                        'code': 400,
                        'message': 'hazard_type parameter is required',
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            eta_seconds = int(eta_seconds or 0)
        except (TypeError, ValueError):
            return Response(
                {
                    'error': {
                        'code': 400,
                        'message': 'eta_seconds must be a valid integer',
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate hazard type
        valid_hazard_types = [choice[0] for choice in Alert.HAZARD_TYPE_CHOICES]
        if hazard_type not in valid_hazard_types:
            return Response(
                {
                    'error': {
                        'code': 400,
                        'message': f'Invalid hazard_type. Valid options: {", ".join(valid_hazard_types)}',
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get safety instructions
        advisor = SafetyAdvisor()
        instructions = advisor.get_instructions(hazard_type, eta_seconds)

        return Response(instructions)
