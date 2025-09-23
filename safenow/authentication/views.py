from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from django.contrib.auth import update_session_auth_hash
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiResponse
from .models import User, UserProfile
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    UserPreferencesSerializer
)


class RegisterView(APIView):
    """
    Register a new user account
    """
    permission_classes = [AllowAny]
    
    @extend_schema(
        request=RegisterSerializer,
        responses={
            201: OpenApiResponse(
                response=UserSerializer,
                description="User registered successfully"
            ),
            400: OpenApiResponse(description="Validation errors")
        },
        summary="Register new user",
        description="Create a new user account with email verification"
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user_serializer = UserSerializer(user)
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'User registered successfully',
                'user': user_serializer.data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    Login user and return JWT tokens
    """
    permission_classes = [AllowAny]
    
    @extend_schema(
        request=LoginSerializer,
        responses={
            200: OpenApiResponse(
                description="Login successful with JWT tokens"
            ),
            400: OpenApiResponse(description="Invalid credentials")
        },
        summary="User login",
        description="Authenticate user and return JWT access and refresh tokens"
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            user_serializer = UserSerializer(user)
            
            return Response({
                'message': 'Login successful',
                'user': user_serializer.data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    Logout user by blacklisting refresh token
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        request={
            'type': 'object',
            'properties': {
                'refresh': {'type': 'string', 'description': 'Refresh token to blacklist'}
            },
            'required': ['refresh']
        },
        responses={
            200: OpenApiResponse(description="Logout successful"),
            400: OpenApiResponse(description="Invalid token")
        },
        summary="User logout",
        description="Blacklist refresh token to logout user"
    )
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserProfileView(APIView):
    """
    Get or update current user profile
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: UserSerializer
        },
        summary="Get user profile",
        description="Get current authenticated user's profile information"
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @extend_schema(
        request=UserSerializer,
        responses={
            200: UserSerializer,
            400: OpenApiResponse(description="Validation errors")
        },
        summary="Update user profile",
        description="Update current authenticated user's profile information"
    )
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserPreferencesView(APIView):
    """
    Get or update user preferences
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: UserPreferencesSerializer
        },
        summary="Get user preferences",
        description="Get current user's notification and location preferences"
    )
    def get(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserPreferencesSerializer(profile)
        return Response(serializer.data)
    
    @extend_schema(
        request=UserPreferencesSerializer,
        responses={
            200: UserPreferencesSerializer,
            400: OpenApiResponse(description="Validation errors")
        },
        summary="Update user preferences",
        description="Update current user's notification and location preferences"
    )
    def put(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserPreferencesSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    Change user password
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        request=ChangePasswordSerializer,
        responses={
            200: OpenApiResponse(description="Password changed successfully"),
            400: OpenApiResponse(description="Validation errors")
        },
        summary="Change password",
        description="Change current user's password"
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Keep the user logged in after password change
            update_session_auth_hash(request, user)
            
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
