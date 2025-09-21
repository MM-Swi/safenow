from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for UserProfile model
    """
    class Meta:
        model = UserProfile
        fields = [
            'preferred_language',
            'email_notifications',
            'push_notifications', 
            'sms_notifications',
            'auto_location',
            'alert_radius'
        ]


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model with nested profile
    """
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'role',
            'is_verified',
            'created_at',
            'updated_at',
            'profile'
        ]
        read_only_fields = ['id', 'role', 'is_verified', 'created_at', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = [
            'username',
            'password',
            'password2',
            'email',
            'first_name',
            'last_name',
            'phone_number'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True}
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs
    
    def validate_phone_number(self, value):
        """
        Validate phone number format
        """
        if value and not value.startswith('+'):
            raise serializers.ValidationError(
                "Phone number must start with country code (e.g., +48)"
            )
        return value
    
    def create(self, validated_data):
        validated_data.pop('password2', None)
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            # Allow login with email or username
            if '@' in username:
                try:
                    user_obj = User.objects.get(email=username)
                    username = user_obj.username
                except User.DoesNotExist:
                    raise serializers.ValidationError(
                        'Unable to log in with provided credentials.'
                    )
            
            user = authenticate(username=username, password=password)
            
            if not user:
                raise serializers.ValidationError(
                    'Unable to log in with provided credentials.'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    'User account is disabled.'
                )
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError(
                'Must include "username" and "password".'
            )


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing password
    """
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError(
                {"new_password": "New password fields didn't match."}
            )
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError(
                "Old password is not correct."
            )
        return value


class UserPreferencesSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user preferences
    """
    class Meta:
        model = UserProfile
        fields = [
            'preferred_language',
            'email_notifications',
            'push_notifications',
            'sms_notifications',
            'auto_location',
            'alert_radius'
        ]
    
    def validate_alert_radius(self, value):
        if value < 1 or value > 100:
            raise serializers.ValidationError(
                "Alert radius must be between 1 and 100 kilometers."
            )
        return value
