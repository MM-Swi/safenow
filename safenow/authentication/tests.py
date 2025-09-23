import pytest
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, UserProfile

User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for the custom User model"""
    
    def setUp(self):
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '+48123456789'
        }
    
    def test_create_user(self):
        """Test creating a regular user"""
        user = User.objects.create_user(**self.user_data)
        
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.role, User.Role.USER)
        self.assertFalse(user.is_verified)
        self.assertTrue(user.check_password('testpass123'))
        self.assertIsNotNone(user.created_at)
        self.assertIsNotNone(user.updated_at)
    
    def test_create_superuser(self):
        """Test creating a superuser"""
        user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.role, User.Role.USER)  # Default role
    
    def test_user_str_representation(self):
        """Test the string representation of User"""
        user = User.objects.create_user(**self.user_data)
        expected_str = f"testuser (User)"
        self.assertEqual(str(user), expected_str)
    
    def test_user_profile_auto_creation(self):
        """Test that UserProfile is automatically created when User is created"""
        user = User.objects.create_user(**self.user_data)
        
        self.assertTrue(hasattr(user, 'profile'))
        self.assertIsInstance(user.profile, UserProfile)
        self.assertEqual(user.profile.user, user)
        self.assertEqual(user.profile.preferred_language, UserProfile.Language.POLISH)
        self.assertTrue(user.profile.email_notifications)
        self.assertTrue(user.profile.push_notifications)
        self.assertFalse(user.profile.sms_notifications)
        self.assertTrue(user.profile.auto_location)
        self.assertEqual(user.profile.alert_radius, 10)


class UserProfileModelTest(TestCase):
    """Test cases for the UserProfile model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_profile_str_representation(self):
        """Test the string representation of UserProfile"""
        expected_str = f"Profile for testuser"
        self.assertEqual(str(self.user.profile), expected_str)
    
    def test_profile_default_values(self):
        """Test default values for UserProfile"""
        profile = self.user.profile
        
        self.assertEqual(profile.preferred_language, UserProfile.Language.POLISH)
        self.assertTrue(profile.email_notifications)
        self.assertTrue(profile.push_notifications)
        self.assertFalse(profile.sms_notifications)
        self.assertTrue(profile.auto_location)
        self.assertEqual(profile.alert_radius, 10)
    
    def test_profile_update(self):
        """Test updating UserProfile"""
        profile = self.user.profile
        profile.preferred_language = UserProfile.Language.ENGLISH
        profile.email_notifications = False
        profile.alert_radius = 25
        profile.save()
        
        profile.refresh_from_db()
        self.assertEqual(profile.preferred_language, UserProfile.Language.ENGLISH)
        self.assertFalse(profile.email_notifications)
        self.assertEqual(profile.alert_radius, 25)


class AuthenticationAPITest(APITestCase):
    """Test cases for authentication API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('auth_register')
        self.login_url = reverse('auth_login')
        self.logout_url = reverse('auth_logout')
        self.profile_url = reverse('user_profile')
        self.preferences_url = reverse('user_preferences')
        self.change_password_url = reverse('change_password')
        
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'password2': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '+48123456789'
        }
        
        self.existing_user = User.objects.create_user(
            username='existing',
            email='existing@example.com',
            password='existingpass123'
        )
    
    def test_user_registration_success(self):
        """Test successful user registration"""
        response = self.client.post(self.register_url, self.user_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
        
        # Check user was created
        user = User.objects.get(username='testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(hasattr(user, 'profile'))
    
    def test_user_registration_password_mismatch(self):
        """Test registration with password mismatch"""
        data = self.user_data.copy()
        data['password2'] = 'differentpass'
        
        response = self.client.post(self.register_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
    
    def test_user_registration_duplicate_email(self):
        """Test registration with duplicate email"""
        data = self.user_data.copy()
        data['email'] = 'existing@example.com'
        
        response = self.client.post(self.register_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_user_login_success(self):
        """Test successful user login"""
        login_data = {
            'username': 'existing',
            'password': 'existingpass123'
        }
        
        response = self.client.post(self.login_url, login_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
    
    def test_user_login_with_email(self):
        """Test user login with email instead of username"""
        login_data = {
            'username': 'existing@example.com',  # Using email as username
            'password': 'existingpass123'
        }
        
        response = self.client.post(self.login_url, login_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
    
    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        login_data = {
            'username': 'existing',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(self.login_url, login_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_user_logout_success(self):
        """Test successful user logout"""
        # First login to get tokens
        login_data = {
            'username': 'existing',
            'password': 'existingpass123'
        }
        login_response = self.client.post(self.login_url, login_data)
        refresh_token = login_response.data['tokens']['refresh']
        access_token = login_response.data['tokens']['access']
        
        # Set authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Logout
        logout_data = {'refresh': refresh_token}
        response = self.client.post(self.logout_url, logout_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
    
    def test_get_user_profile(self):
        """Test getting user profile"""
        # Login and get access token
        refresh = RefreshToken.for_user(self.existing_user)
        access_token = str(refresh.access_token)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'existing')
        self.assertEqual(response.data['email'], 'existing@example.com')
        self.assertIn('profile', response.data)
    
    def test_update_user_profile(self):
        """Test updating user profile"""
        refresh = RefreshToken.for_user(self.existing_user)
        access_token = str(refresh.access_token)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'phone_number': '+48987654321'
        }
        
        response = self.client.put(self.profile_url, update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')
        self.assertEqual(response.data['last_name'], 'Name')
        self.assertEqual(response.data['phone_number'], '+48987654321')
    
    def test_get_user_preferences(self):
        """Test getting user preferences"""
        refresh = RefreshToken.for_user(self.existing_user)
        access_token = str(refresh.access_token)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(self.preferences_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['preferred_language'], 'pl')
        self.assertTrue(response.data['email_notifications'])
        self.assertEqual(response.data['alert_radius'], 10)
    
    def test_update_user_preferences(self):
        """Test updating user preferences"""
        refresh = RefreshToken.for_user(self.existing_user)
        access_token = str(refresh.access_token)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        update_data = {
            'preferred_language': 'en',
            'email_notifications': False,
            'alert_radius': 25
        }
        
        response = self.client.put(self.preferences_url, update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['preferred_language'], 'en')
        self.assertFalse(response.data['email_notifications'])
        self.assertEqual(response.data['alert_radius'], 25)
    
    def test_change_password_success(self):
        """Test successful password change"""
        refresh = RefreshToken.for_user(self.existing_user)
        access_token = str(refresh.access_token)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        password_data = {
            'old_password': 'existingpass123',
            'new_password': 'newpassword123',
            'new_password2': 'newpassword123'
        }
        
        response = self.client.post(self.change_password_url, password_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        
        # Verify password was changed
        self.existing_user.refresh_from_db()
        self.assertTrue(self.existing_user.check_password('newpassword123'))
    
    def test_change_password_wrong_old_password(self):
        """Test password change with wrong old password"""
        refresh = RefreshToken.for_user(self.existing_user)
        access_token = str(refresh.access_token)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        password_data = {
            'old_password': 'wrongoldpass',
            'new_password': 'newpassword123',
            'new_password2': 'newpassword123'
        }
        
        response = self.client.post(self.change_password_url, password_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('old_password', response.data)
    
    def test_protected_endpoint_without_token(self):
        """Test accessing protected endpoint without token"""
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_protected_endpoint_with_invalid_token(self):
        """Test accessing protected endpoint with invalid token"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalidtoken')
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
