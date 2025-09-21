from django.conf import settings
from django.utils import timezone
from django.db import models
from django.shortcuts import render
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.decorators import api_view, permission_classes
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from shelters.models import Shelter
from alerts.models import Alert, AlertVote
from alerts.permissions import IsOwnerOrReadOnly, IsAuthenticatedOrReadOnlyPublic, CanVoteOnAlert
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
    EmergencyEducationSerializer,
    AlertCreateSerializer,
    AlertUpdateSerializer,
    AlertVoteSerializer,
    AlertVoteSummarySerializer,
    UserAlertSerializer,
    DashboardStatsSerializer,
    VoteHistorySerializer,
    UserActivitySerializer,
    NotificationSerializer,
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

        # Get all active alerts (only verified and active status)
        active_alerts = Alert.objects.filter(
            valid_until__gte=timezone.now(),
            status__in=['VERIFIED', 'ACTIVE']
        )

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


class EmergencyEducationView(APIView):
    """Emergency education data for learning and preparation."""

    throttle_classes = [AnonRateThrottle]

    @extend_schema(
        summary="Get Emergency Education Data",
        description="Get comprehensive emergency education data including practical tips, warning signs, and preparation steps for all hazard types",
        responses={
            200: EmergencyEducationSerializer(many=True),
        },
    )
    def get(self, request):
        # Get all hazard types from Alert model
        hazard_types = [choice[0] for choice in Alert.HAZARD_TYPE_CHOICES]
        
        # Get education data for each hazard type
        advisor = SafetyAdvisor()
        education_data = []
        
        for hazard_type in hazard_types:
            data = advisor.get_education_data(hazard_type)
            data['hazard_type'] = hazard_type
            education_data.append(data)
        
        # Serialize the data
        serializer = EmergencyEducationSerializer(education_data, many=True)
        return Response(serializer.data)


class AlertListCreateView(ListCreateAPIView):
    """
    List all alerts or create a new alert.
    GET: Public access to active alerts
    POST: Authenticated users can create alerts
    """
    permission_classes = [IsAuthenticatedOrReadOnlyPublic]
    throttle_classes = [AnonRateThrottle]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AlertCreateSerializer
        return ActiveAlertSerializer
    
    def create(self, request, *args, **kwargs):
        """Override create to return full alert data"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        alert = serializer.save()
        
        # Return the full alert data using ActiveAlertSerializer
        response_serializer = ActiveAlertSerializer(alert)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_queryset(self):
        queryset = Alert.objects.all()
        
        # For GET requests, filter by status and validity
        if self.request.method == 'GET':
            queryset = queryset.filter(
                valid_until__gte=timezone.now(),
                status__in=['VERIFIED', 'ACTIVE']
            )
        
        # Optional filtering by location
        lat = self.request.query_params.get('lat')
        lon = self.request.query_params.get('lon')
        
        if lat and lon:
            try:
                user_lat = float(lat)
                user_lon = float(lon)
                
                # Filter alerts where user is within radius
                relevant_alerts = []
                for alert in queryset:
                    distance_km = haversine_km(
                        user_lat, user_lon, float(alert.center_lat), float(alert.center_lon)
                    )
                    distance_m = distance_km * 1000
                    
                    if distance_m <= alert.radius_m:
                        alert.distance_km = round(distance_km, 3)
                        relevant_alerts.append(alert.id)
                
                queryset = queryset.filter(id__in=relevant_alerts)
            except (TypeError, ValueError):
                pass  # Ignore invalid coordinates
        
        return queryset.order_by('-created_at')

    @extend_schema(
        summary="List Active Alerts",
        description="Get list of active emergency alerts. Optionally filter by location.",
        parameters=[
            OpenApiParameter(
                name='lat',
                type=OpenApiTypes.FLOAT,
                location=OpenApiParameter.QUERY,
                required=False,
                description='User latitude for location filtering',
            ),
            OpenApiParameter(
                name='lon',
                type=OpenApiTypes.FLOAT,
                location=OpenApiParameter.QUERY,
                required=False,
                description='User longitude for location filtering',
            ),
        ],
        responses={200: ActiveAlertSerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Create Alert",
        description="Create a new emergency alert. Requires authentication.",
        request=AlertCreateSerializer,
        responses={
            201: ActiveAlertSerializer,
            400: {'description': 'Validation errors'},
            401: {'description': 'Authentication required'},
        },
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class AlertDetailView(RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete an alert.
    GET: Public access
    PUT/PATCH/DELETE: Only owners or admins
    """
    queryset = Alert.objects.all()
    permission_classes = [IsOwnerOrReadOnly]
    throttle_classes = [AnonRateThrottle]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AlertUpdateSerializer
        return ActiveAlertSerializer
    
    def update(self, request, *args, **kwargs):
        """Override update to return full alert data"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        alert = serializer.save()

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        # Return the full alert data using ActiveAlertSerializer
        response_serializer = ActiveAlertSerializer(alert)
        return Response(response_serializer.data)

    @extend_schema(
        summary="Get Alert Details",
        description="Get detailed information about a specific alert",
        responses={
            200: ActiveAlertSerializer,
            404: {'description': 'Alert not found'},
        },
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update Alert",
        description="Update an alert. Only owners or admins can update alerts.",
        request=AlertUpdateSerializer,
        responses={
            200: ActiveAlertSerializer,
            400: {'description': 'Validation errors'},
            401: {'description': 'Authentication required'},
            403: {'description': 'Permission denied'},
            404: {'description': 'Alert not found'},
        },
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(
        summary="Partially Update Alert",
        description="Partially update an alert. Only owners or admins can update alerts.",
        request=AlertUpdateSerializer,
        responses={
            200: ActiveAlertSerializer,
            400: {'description': 'Validation errors'},
            401: {'description': 'Authentication required'},
            403: {'description': 'Permission denied'},
            404: {'description': 'Alert not found'},
        },
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @extend_schema(
        summary="Delete Alert",
        description="Delete an alert. Only owners or admins can delete alerts.",
        responses={
            204: {'description': 'Alert deleted successfully'},
            401: {'description': 'Authentication required'},
            403: {'description': 'Permission denied'},
            404: {'description': 'Alert not found'},
        },
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


class AlertVoteView(APIView):
    """
    Vote on an alert (upvote/downvote).
    """
    permission_classes = [permissions.IsAuthenticated, CanVoteOnAlert]
    throttle_classes = [AnonRateThrottle]

    @extend_schema(
        summary="Vote on Alert",
        description="Cast a vote (upvote/downvote) on an alert. Users cannot vote on their own alerts.",
        request=AlertVoteSerializer,
        responses={
            201: {'description': 'Vote cast successfully'},
            200: {'description': 'Vote updated successfully'},
            400: {'description': 'Validation errors'},
            401: {'description': 'Authentication required'},
            403: {'description': 'Cannot vote on this alert'},
            404: {'description': 'Alert not found'},
        },
    )
    def post(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk)
        except Alert.DoesNotExist:
            return Response(
                {'error': 'Alert not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check permissions
        self.check_object_permissions(request, alert)

        serializer = AlertVoteSerializer(
            data=request.data,
            context={'request': request, 'alert': alert}
        )
        
        if serializer.is_valid():
            # Check if vote already exists
            existing_vote = AlertVote.objects.filter(
                user=request.user,
                alert=alert
            ).first()
            
            vote = serializer.save()
            created = existing_vote is None
            
            return Response(
                {
                    'message': 'Vote cast successfully' if created else 'Vote updated successfully',
                    'vote_type': vote.vote_type,
                    'verification_score': alert.verification_score
                },
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AlertVoteSummaryView(APIView):
    """
    Get vote summary for an alert.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AnonRateThrottle]

    @extend_schema(
        summary="Get Alert Vote Summary",
        description="Get voting statistics and current user's vote for an alert",
        responses={
            200: AlertVoteSummarySerializer,
            404: {'description': 'Alert not found'},
        },
    )
    def get(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk)
        except Alert.DoesNotExist:
            return Response(
                {'error': 'Alert not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        upvotes = alert.votes.filter(vote_type='UPVOTE').count()
        downvotes = alert.votes.filter(vote_type='DOWNVOTE').count()
        total_votes = upvotes + downvotes

        # Get current user's vote
        user_vote = None
        try:
            user_vote_obj = alert.votes.get(user=request.user)
            user_vote = user_vote_obj.vote_type
        except AlertVote.DoesNotExist:
            pass

        data = {
            'upvotes': upvotes,
            'downvotes': downvotes,
            'total_votes': total_votes,
            'verification_score': alert.verification_score,
            'user_vote': user_vote
        }

        serializer = AlertVoteSummarySerializer(data)
        return Response(serializer.data)


# Dashboard Views
class UserAlertsView(APIView):
    """Get user's own alerts."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get User's Alerts",
        description="Get all alerts created by the current user",
        responses={200: UserAlertSerializer(many=True)},
    )
    def get(self, request):
        alerts = Alert.objects.filter(created_by=request.user).order_by('-created_at')
        serializer = UserAlertSerializer(alerts, many=True, context={'request': request})
        return Response(serializer.data)


class DashboardStatsView(APIView):
    """Get user dashboard statistics."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get Dashboard Statistics",
        description="Get user's dashboard statistics including alerts created, votes cast, etc.",
        responses={200: DashboardStatsSerializer},
    )
    def get(self, request):
        user = request.user
        
        # Calculate statistics
        alerts_created = Alert.objects.filter(created_by=user).count()
        votes_cast = AlertVote.objects.filter(user=user).count()
        verified_alerts = Alert.objects.filter(
            created_by=user, 
            status='VERIFIED'
        ).count()
        
        # Calculate total score from user's alerts
        user_alerts = Alert.objects.filter(created_by=user)
        total_score = sum(alert.verification_score for alert in user_alerts)
        
        # Calculate profile completion percentage
        profile_completion = 100  # Base completion
        if not user.first_name:
            profile_completion -= 20
        if not user.last_name:
            profile_completion -= 20
        if not user.phone_number:
            profile_completion -= 10
        if not hasattr(user, 'profile') or not user.profile.preferred_language:
            profile_completion -= 10
        
        data = {
            'alerts_created': alerts_created,
            'votes_cast': votes_cast,
            'verified_alerts': verified_alerts,
            'total_score': total_score,
            'profile_completion': max(0, profile_completion)
        }
        
        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)


class VotingHistoryView(APIView):
    """Get user's voting history."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get Voting History",
        description="Get user's voting history with alert details",
        responses={200: VoteHistorySerializer(many=True)},
    )
    def get(self, request):
        votes = AlertVote.objects.filter(user=request.user).order_by('-created_at')
        serializer = VoteHistorySerializer(votes, many=True)
        return Response(serializer.data)


class UserActivityView(APIView):
    """Get user's recent activity."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get User Activity",
        description="Get user's recent activity log",
        responses={200: UserActivitySerializer(many=True)},
    )
    def get(self, request):
        user = request.user
        activities = []
        activity_id = 1
        
        # Get recent alerts created
        recent_alerts = Alert.objects.filter(created_by=user).order_by('-created_at')[:5]
        for alert in recent_alerts:
            activities.append({
                'id': activity_id,
                'type': 'alert_created',
                'message': f'Created {alert.hazard_type} alert',
                'timestamp': alert.created_at,
                'related_alert_id': alert.id
            })
            activity_id += 1
        
        # Get recent votes
        recent_votes = AlertVote.objects.filter(user=user).order_by('-created_at')[:5]
        for vote in recent_votes:
            activities.append({
                'id': activity_id,
                'type': 'vote_cast',
                'message': f'Voted {vote.vote_type.lower()} on {vote.alert.hazard_type} alert',
                'timestamp': vote.created_at,
                'related_alert_id': vote.alert.id
            })
            activity_id += 1
        
        # Get verified alerts
        verified_alerts = Alert.objects.filter(
            created_by=user, 
            status='VERIFIED'
        ).order_by('-created_at')[:3]
        for alert in verified_alerts:
            activities.append({
                'id': activity_id,
                'type': 'alert_verified',
                'message': f'Your {alert.hazard_type} alert was verified',
                'timestamp': alert.created_at,
                'related_alert_id': alert.id
            })
            activity_id += 1
        
        # Sort by timestamp (most recent first)
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        activities = activities[:10]  # Limit to 10 most recent
        
        serializer = UserActivitySerializer(activities, many=True)
        return Response(serializer.data)


class NotificationsView(APIView):
    """Get user notifications."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get Notifications",
        description="Get user's notifications",
        responses={200: NotificationSerializer(many=True)},
    )
    def get(self, request):
        # For now, return mock notifications since we don't have a notification system yet
        # In a real implementation, you would query a Notification model
        notifications = [
            {
                'id': 1,
                'type': 'system_announcement',
                'title': 'Welcome to SafeNow',
                'message': 'Thank you for joining SafeNow. Stay safe!',
                'read': False,
                'created_at': timezone.now() - timezone.timedelta(hours=1),
                'related_alert_id': None
            }
        ]
        
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)


class MarkNotificationReadView(APIView):
    """Mark notification as read."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Mark Notification as Read",
        description="Mark a specific notification as read",
        responses={200: {'type': 'object', 'properties': {'message': {'type': 'string'}}}},
    )
    def patch(self, request, notification_id):
        # Mock implementation - in real app, you would update the notification
        return Response({'message': 'Notification marked as read'})
