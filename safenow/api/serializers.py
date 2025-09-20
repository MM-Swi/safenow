from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema_field
from shelters.models import Shelter
from alerts.models import Alert
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

    class Meta:
        model = Alert
        fields = [
            'id', 'hazard_type', 'severity', 'center_lat', 'center_lon',
            'radius_m', 'distance_km', 'valid_until', 'source', 'created_at'
        ]


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