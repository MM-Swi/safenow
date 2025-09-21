from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema_field
from shelters.models import Shelter
from alerts.models import Alert, AlertVote
from devices.models import Device, SafetyStatus


class HealthSerializer(serializers.Serializer):
    """System health and statistics response."""
    status = serializers.CharField(help_text="System status indicator")
    version = serializers.CharField(help_text="Application version")
    counts = serializers.DictField(help_text="Resource counts (shelters, active_alerts)")


class NearbyShelterSerializer(serializers.ModelSerializer):
    """Shelter with calculated distance and estimated time of arrival."""
    distance_km = serializers.FloatField(read_only=True, help_text="Distance from user location in kilometers")
    eta_seconds = serializers.IntegerField(read_only=True, help_text="Estimated walking time in seconds")

    class Meta:
        model = Shelter
        fields = ['id', 'name', 'address', 'distance_km', 'eta_seconds', 'is_open_now']


class ActiveAlertSerializer(serializers.ModelSerializer):
    """Active emergency alert with distance from user location."""
    distance_km = serializers.FloatField(read_only=True, help_text="Distance from user to alert center in kilometers")
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, help_text="Username of alert creator")
    vote_summary = serializers.SerializerMethodField(help_text="Vote summary for this alert")

    class Meta:
        model = Alert
        fields = [
            'id', 'hazard_type', 'severity', 'center_lat', 'center_lon',
            'radius_m', 'distance_km', 'valid_until', 'source', 'created_at',
            'status', 'verification_score', 'is_official', 'created_by_username', 'vote_summary'
        ]
    
    def get_vote_summary(self, obj):
        """Get vote summary for the alert"""
        upvotes = obj.votes.filter(vote_type='UPVOTE').count()
        downvotes = obj.votes.filter(vote_type='DOWNVOTE').count()
        return {
            'upvotes': upvotes,
            'downvotes': downvotes,
            'total': upvotes + downvotes
        }


class DeviceRegisterSerializer(serializers.Serializer):
    """Device registration for push notifications and location tracking."""
    device_id = serializers.CharField(
        max_length=255,
        min_length=1,
        help_text="Unique device identifier"
    )
    push_token = serializers.CharField(
        max_length=4000,
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Firebase Cloud Messaging push token for notifications"
    )
    lat = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        required=False,
        allow_null=True,
        min_value=-90.0,
        max_value=90.0,
        help_text="Device latitude"
    )
    lon = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        required=False,
        allow_null=True,
        min_value=-180.0,
        max_value=180.0,
        help_text="Device longitude"
    )

    def validate_device_id(self, value):
        if not value or value.isspace():
            raise serializers.ValidationError("Device ID cannot be empty or whitespace")
        return value.strip()

    def create(self, validated_data):
        device_id = validated_data['device_id']
        push_token = validated_data.get('push_token')
        lat = validated_data.get('lat')
        lon = validated_data.get('lon')

        defaults = {
            'push_token': push_token,
            'last_seen_at': timezone.now()
        }
        
        # Only update location if both lat and lon are provided
        if lat is not None and lon is not None:
            defaults.update({
                'last_lat': lat,
                'last_lon': lon
            })

        device, created = Device.objects.update_or_create(
            device_id=device_id,
            defaults=defaults
        )
        return device

    def to_representation(self, instance):
        return {
            'device_id': instance.device_id,
            'message': 'Device registered successfully',
            'last_seen_at': instance.last_seen_at
        }


class SafetyStatusSerializer(serializers.Serializer):
    """Safety status update for device location and emergency state."""
    device_id = serializers.CharField(
        max_length=255,
        min_length=1,
        help_text="Device identifier to update status for"
    )
    status = serializers.ChoiceField(
        choices=SafetyStatus.STATUS_CHOICES,
        help_text="Current safety status (OK, NEEDS_HELP, IN_SHELTER, UNREACHABLE)"
    )
    shelter_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=1,
        help_text="Shelter ID when status is IN_SHELTER (required for IN_SHELTER status)"
    )

    def validate_device_id(self, value):
        if not value or value.isspace():
            raise serializers.ValidationError("Device ID cannot be empty or whitespace")
        return value.strip()

    def validate(self, data):
        if data['status'] == 'IN_SHELTER' and not data.get('shelter_id'):
            raise serializers.ValidationError(
                "shelter_id is required when status is IN_SHELTER"
            )
        return data

    def validate_shelter_id(self, value):
        if value is not None:
            if not Shelter.objects.filter(id=value).exists():
                raise serializers.ValidationError("Invalid shelter_id")
        return value

    def create(self, validated_data):
        device_id = validated_data['device_id']
        status = validated_data['status']
        shelter_id = validated_data.get('shelter_id')

        try:
            device = Device.objects.get(device_id=device_id)
        except Device.DoesNotExist:
            raise serializers.ValidationError({"device_id": "Device not found"})

        shelter = None
        if shelter_id:
            shelter = Shelter.objects.get(id=shelter_id)

        safety_status = SafetyStatus.objects.create(
            device=device,
            status=status,
            shelter=shelter
        )
        return safety_status

    def to_representation(self, instance):
        return {
            'device_id': instance.device.device_id,
            'status': instance.status,
            'shelter_id': instance.shelter.id if instance.shelter else None,
            'updated_at': instance.updated_at,
            'message': 'Safety status updated successfully'
        }


class SimulateAlertSerializer(serializers.Serializer):
    hazard_type = serializers.ChoiceField(choices=Alert.HAZARD_TYPE_CHOICES)
    severity = serializers.ChoiceField(choices=Alert.SEVERITY_CHOICES, default='MEDIUM')
    center_lat = serializers.DecimalField(max_digits=9, decimal_places=6)
    center_lon = serializers.DecimalField(max_digits=9, decimal_places=6)
    radius_m = serializers.IntegerField(min_value=1, max_value=50000)  # Max 50km radius
    valid_minutes = serializers.IntegerField(min_value=1, max_value=1440, default=60)  # Max 24 hours
    source = serializers.CharField(
        max_length=255,
        min_length=1,
        default='simulation'
    )

    def validate_source(self, value):
        if not value or value.isspace():
            raise serializers.ValidationError("Source cannot be empty or whitespace")
        return value.strip()

    def validate_center_lat(self, value):
        if not (-90 <= value <= 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value

    def validate_center_lon(self, value):
        if not (-180 <= value <= 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value

    def create(self, validated_data):
        valid_minutes = validated_data.pop('valid_minutes')
        valid_until = timezone.now() + timedelta(minutes=valid_minutes)

        alert = Alert.objects.create(
            hazard_type=validated_data['hazard_type'],
            severity=validated_data['severity'],
            center_lat=validated_data['center_lat'],
            center_lon=validated_data['center_lon'],
            radius_m=validated_data['radius_m'],
            valid_until=valid_until,
            source=validated_data.get('source', 'simulation')
        )
        return alert

    def to_representation(self, instance):
        return {
            'id': instance.id,
            'hazard_type': instance.hazard_type,
            'severity': instance.severity,
            'center_lat': float(instance.center_lat),
            'center_lon': float(instance.center_lon),
            'radius_m': instance.radius_m,
            'valid_until': instance.valid_until,
            'source': instance.source,
            'created_at': instance.created_at,
            'message': f'{instance.get_severity_display()} {instance.get_hazard_type_display()} alert created successfully'
        }


class EmergencyEducationSerializer(serializers.Serializer):
    """Emergency education data for learning and preparation."""
    hazard_type = serializers.CharField(help_text="Hazard type identifier")
    title = serializers.CharField(help_text="Emergency type title in Polish")
    description = serializers.CharField(help_text="Brief description of the emergency")
    priority = serializers.CharField(help_text="Priority level (low, medium, high, critical)")
    icon = serializers.CharField(help_text="Emoji icon for the emergency type")
    practical_tips = serializers.ListField(
        child=serializers.CharField(),
        help_text="Practical preparation tips"
    )
    warning_signs = serializers.ListField(
        child=serializers.CharField(),
        help_text="Warning signs to watch for"
    )
    preparation_steps = serializers.ListField(
        child=serializers.CharField(),
        help_text="Steps to prepare for this emergency"
    )


class AlertCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new alerts by authenticated users."""
    valid_minutes = serializers.IntegerField(
        min_value=1, 
        max_value=1440, 
        default=60,
        help_text="Alert validity duration in minutes (max 24 hours)"
    )

    class Meta:
        model = Alert
        fields = [
            'hazard_type', 'severity', 'center_lat', 'center_lon',
            'radius_m', 'source', 'valid_minutes'
        ]
        extra_kwargs = {
            'source': {'required': True, 'allow_blank': False}
        }

    def validate_center_lat(self, value):
        if not (-90 <= value <= 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value

    def validate_center_lon(self, value):
        if not (-180 <= value <= 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value

    def validate_radius_m(self, value):
        if value < 1 or value > 50000:  # Max 50km radius
            raise serializers.ValidationError("Radius must be between 1 and 50000 meters")
        return value

    def create(self, validated_data):
        valid_minutes = validated_data.pop('valid_minutes')
        valid_until = timezone.now() + timedelta(minutes=valid_minutes)
        
        # Set user as creator and default status
        alert = Alert.objects.create(
            **validated_data,
            valid_until=valid_until,
            created_by=self.context['request'].user,
            status='PENDING',  # User-created alerts start as pending
            is_official=False
        )
        return alert


class AlertUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating existing alerts by owners or admins."""
    valid_minutes = serializers.IntegerField(
        min_value=1, 
        max_value=1440,
        required=False,
        help_text="Update alert validity duration in minutes"
    )

    class Meta:
        model = Alert
        fields = [
            'hazard_type', 'severity', 'center_lat', 'center_lon',
            'radius_m', 'source', 'valid_minutes', 'status', 'is_official'
        ]

    def validate_status(self, value):
        user = self.context['request'].user
        # Only admins can change status directly
        if not (hasattr(user, 'role') and user.role == 'ADMIN') and not user.is_staff:
            if 'status' in self.initial_data:
                raise serializers.ValidationError("Only admins can change alert status")
        return value
    
    def validate_is_official(self, value):
        user = self.context['request'].user
        # Only admins can mark alerts as official
        if not (hasattr(user, 'role') and user.role == 'ADMIN') and not user.is_staff:
            if 'is_official' in self.initial_data:
                raise serializers.ValidationError("Only admins can mark alerts as official")
        return value

    def update(self, instance, validated_data):
        valid_minutes = validated_data.pop('valid_minutes', None)
        
        if valid_minutes:
            validated_data['valid_until'] = timezone.now() + timedelta(minutes=valid_minutes)
        
        return super().update(instance, validated_data)


class AlertVoteSerializer(serializers.ModelSerializer):
    """Serializer for voting on alerts."""
    
    class Meta:
        model = AlertVote
        fields = ['vote_type']

    def validate(self, data):
        user = self.context['request'].user
        alert = self.context['alert']
        
        # Users cannot vote on their own alerts
        if alert.created_by == user:
            raise serializers.ValidationError("You cannot vote on your own alert")
        
        # Users can only vote on pending or verified alerts
        if alert.status not in ['PENDING', 'VERIFIED']:
            raise serializers.ValidationError("You can only vote on pending or verified alerts")
        
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        alert = self.context['alert']
        
        # Update or create vote
        vote, created = AlertVote.objects.update_or_create(
            user=user,
            alert=alert,
            defaults={'vote_type': validated_data['vote_type']}
        )
        return vote


class AlertVoteSummarySerializer(serializers.Serializer):
    """Serializer for alert vote summary."""
    upvotes = serializers.IntegerField(help_text="Number of upvotes")
    downvotes = serializers.IntegerField(help_text="Number of downvotes")
    total_votes = serializers.IntegerField(help_text="Total number of votes")
    verification_score = serializers.IntegerField(help_text="Current verification score")
    user_vote = serializers.CharField(
        allow_null=True, 
        help_text="Current user's vote (UPVOTE/DOWNVOTE/null)"
    )


# Dashboard Serializers
class UserAlertSerializer(serializers.ModelSerializer):
    """Serializer for user's own alerts with full details."""
    vote_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = Alert
        fields = [
            'id', 'hazard_type', 'center_lat', 'center_lon', 'radius_m', 
            'severity', 'status', 'source', 'valid_until', 'created_at',
            'created_by', 'verification_score', 'is_official', 'vote_summary'
        ]
    
    def get_vote_summary(self, obj):
        """Get vote summary for the alert"""
        upvotes = obj.votes.filter(vote_type='UPVOTE').count()
        downvotes = obj.votes.filter(vote_type='DOWNVOTE').count()
        user_vote = None
        
        # Get current user's vote if authenticated
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                user_vote_obj = obj.votes.get(user=request.user)
                user_vote = user_vote_obj.vote_type
            except AlertVote.DoesNotExist:
                pass
        
        return {
            'upvotes': upvotes,
            'downvotes': downvotes,
            'total': upvotes + downvotes,
            'user_vote': user_vote
        }


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for user dashboard statistics."""
    alerts_created = serializers.IntegerField(help_text="Number of alerts created by user")
    votes_cast = serializers.IntegerField(help_text="Number of votes cast by user")
    verified_alerts = serializers.IntegerField(help_text="Number of user's alerts that were verified")
    total_score = serializers.IntegerField(help_text="Total verification score of user's alerts")
    profile_completion = serializers.IntegerField(help_text="Profile completion percentage")


class VoteHistorySerializer(serializers.ModelSerializer):
    """Serializer for user's voting history."""
    alert = serializers.SerializerMethodField()
    
    class Meta:
        model = AlertVote
        fields = ['id', 'alert', 'vote_type', 'created_at']
    
    def get_alert(self, obj):
        """Get basic alert information"""
        return {
            'id': obj.alert.id,
            'title': f"{obj.alert.hazard_type} Alert",
            'hazard_type': obj.alert.hazard_type,
            'status': obj.alert.status
        }


class UserActivitySerializer(serializers.Serializer):
    """Serializer for user activity log."""
    id = serializers.IntegerField()
    type = serializers.CharField()
    message = serializers.CharField()
    timestamp = serializers.DateTimeField()
    related_alert_id = serializers.IntegerField(allow_null=True)


class NotificationSerializer(serializers.Serializer):
    """Serializer for user notifications."""
    id = serializers.IntegerField()
    type = serializers.CharField()
    title = serializers.CharField()
    message = serializers.CharField()
    read = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    related_alert_id = serializers.IntegerField(allow_null=True)