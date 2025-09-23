import pytest
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta

from .models import Alert, AlertVote

User = get_user_model()


class AlertModelTest(TestCase):
    """Test cases for the enhanced Alert model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role='ADMIN'
        )
        
        self.alert_data = {
            'hazard_type': 'MISSILE',
            'severity': 'CRITICAL',
            'center_lat': 52.2297,
            'center_lon': 21.0122,
            'radius_m': 5000,
            'valid_until': timezone.now() + timedelta(hours=1),
            'source': 'test_source'
        }
    
    def test_create_alert_with_user(self):
        """Test creating alert with user ownership"""
        alert = Alert.objects.create(
            **self.alert_data,
            created_by=self.user,
            status='PENDING'
        )
        
        self.assertEqual(alert.created_by, self.user)
        self.assertEqual(alert.status, 'PENDING')
        self.assertEqual(alert.verification_score, 0)
        self.assertFalse(alert.is_official)
    
    def test_create_official_alert(self):
        """Test creating official alert"""
        alert = Alert.objects.create(
            **self.alert_data,
            status='ACTIVE',
            is_official=True
        )
        
        self.assertIsNone(alert.created_by)
        self.assertEqual(alert.status, 'ACTIVE')
        self.assertTrue(alert.is_official)
    
    def test_alert_can_be_edited_by_owner(self):
        """Test that users can edit their own alerts"""
        alert = Alert.objects.create(
            **self.alert_data,
            created_by=self.user
        )
        
        self.assertTrue(alert.can_be_edited_by(self.user))
        # Admin can also edit any alert
        self.assertTrue(alert.can_be_edited_by(self.admin_user))
    
    def test_alert_can_be_edited_by_admin(self):
        """Test that admins can edit any alert"""
        alert = Alert.objects.create(
            **self.alert_data,
            created_by=self.user
        )
        
        self.assertTrue(alert.can_be_edited_by(self.admin_user))
    
    def test_alert_is_active_property(self):
        """Test the is_active property"""
        # Active alert
        active_alert = Alert.objects.create(
            **self.alert_data,
            status='VERIFIED'
        )
        self.assertTrue(active_alert.is_active)
        
        # Expired alert
        expired_alert = Alert.objects.create(
            hazard_type='MISSILE',
            severity='CRITICAL',
            center_lat=52.2297,
            center_lon=21.0122,
            radius_m=5000,
            valid_until=timezone.now() - timedelta(hours=1),
            source='test_source',
            status='VERIFIED'
        )
        self.assertFalse(expired_alert.is_active)
        
        # Pending alert
        pending_alert = Alert.objects.create(
            **self.alert_data,
            status='PENDING'
        )
        self.assertFalse(pending_alert.is_active)


class AlertVoteModelTest(TestCase):
    """Test cases for the AlertVote model"""
    
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='testpass123'
        )
        
        self.alert = Alert.objects.create(
            hazard_type='MISSILE',
            severity='CRITICAL',
            center_lat=52.2297,
            center_lon=21.0122,
            radius_m=5000,
            valid_until=timezone.now() + timedelta(hours=1),
            source='test_source',
            created_by=self.user1,
            status='PENDING'
        )
    
    def test_create_vote(self):
        """Test creating a vote"""
        vote = AlertVote.objects.create(
            user=self.user2,
            alert=self.alert,
            vote_type='UPVOTE'
        )
        
        self.assertEqual(vote.user, self.user2)
        self.assertEqual(vote.alert, self.alert)
        self.assertEqual(vote.vote_type, 'UPVOTE')
    
    def test_unique_vote_constraint(self):
        """Test that users can only vote once per alert"""
        AlertVote.objects.create(
            user=self.user2,
            alert=self.alert,
            vote_type='UPVOTE'
        )
        
        # This should raise an integrity error
        with self.assertRaises(Exception):
            AlertVote.objects.create(
                user=self.user2,
                alert=self.alert,
                vote_type='DOWNVOTE'
            )
    
    def test_update_verification_score_signal(self):
        """Test that verification score is updated when votes are created"""
        # Initial score should be 0
        self.assertEqual(self.alert.verification_score, 0)
        
        # Add upvote
        AlertVote.objects.create(
            user=self.user2,
            alert=self.alert,
            vote_type='UPVOTE'
        )
        
        self.alert.refresh_from_db()
        self.assertEqual(self.alert.verification_score, 1)
        
        # Add another user and downvote
        user3 = User.objects.create_user(
            username='user3',
            email='user3@example.com',
            password='testpass123'
        )
        AlertVote.objects.create(
            user=user3,
            alert=self.alert,
            vote_type='DOWNVOTE'
        )
        
        self.alert.refresh_from_db()
        self.assertEqual(self.alert.verification_score, 0)
    
    def test_auto_verification_threshold(self):
        """Test automatic verification when threshold is reached"""
        # Create 3 users to upvote
        users = []
        for i in range(3):
            user = User.objects.create_user(
                username=f'voter{i}',
                email=f'voter{i}@example.com',
                password='testpass123'
            )
            users.append(user)
            AlertVote.objects.create(
                user=user,
                alert=self.alert,
                vote_type='UPVOTE'
            )
        
        self.alert.refresh_from_db()
        self.assertEqual(self.alert.verification_score, 3)
        self.assertEqual(self.alert.status, 'VERIFIED')
    
    def test_auto_rejection_threshold(self):
        """Test automatic rejection when threshold is reached"""
        # Create 3 users to downvote
        users = []
        for i in range(3):
            user = User.objects.create_user(
                username=f'downvoter{i}',
                email=f'downvoter{i}@example.com',
                password='testpass123'
            )
            users.append(user)
            AlertVote.objects.create(
                user=user,
                alert=self.alert,
                vote_type='DOWNVOTE'
            )
        
        self.alert.refresh_from_db()
        self.assertEqual(self.alert.verification_score, -3)
        self.assertEqual(self.alert.status, 'REJECTED')


class AlertAPITest(APITestCase):
    """Test cases for Alert API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role='ADMIN'
        )
        
        # Get JWT tokens
        self.user_token = str(RefreshToken.for_user(self.user).access_token)
        self.admin_token = str(RefreshToken.for_user(self.admin_user).access_token)
        
        self.alert_data = {
            'hazard_type': 'MISSILE',
            'severity': 'CRITICAL',
            'center_lat': 52.2297,
            'center_lon': 21.0122,
            'radius_m': 5000,
            'valid_minutes': 60,
            'source': 'test_source'
        }
        
        self.alert = Alert.objects.create(
            hazard_type='FLOOD',
            severity='HIGH',
            center_lat=52.2297,
            center_lon=21.0122,
            radius_m=3000,
            valid_until=timezone.now() + timedelta(hours=2),
            source='existing_alert',
            created_by=self.user,
            status='PENDING'
        )
    
    def test_list_alerts_public(self):
        """Test listing alerts without authentication (should only show active/verified)"""
        # Clear existing alerts and create only test alerts
        Alert.objects.all().delete()
        
        # Create active alert
        Alert.objects.create(
            hazard_type='FIRE',
            severity='HIGH',
            center_lat=52.2297,
            center_lon=21.0122,
            radius_m=2000,
            valid_until=timezone.now() + timedelta(hours=1),
            source='active_alert',
            status='ACTIVE'
        )
        
        # Create pending alert (should not be shown)
        Alert.objects.create(
            hazard_type='FLOOD',
            severity='HIGH',
            center_lat=52.2297,
            center_lon=21.0122,
            radius_m=2000,
            valid_until=timezone.now() + timedelta(hours=1),
            source='pending_alert',
            status='PENDING'
        )
        
        response = self.client.get('/api/alerts/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only show active alerts, not pending ones
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['hazard_type'], 'FIRE')
    
    def test_create_alert_authenticated(self):
        """Test creating alert as authenticated user"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        
        response = self.client.post('/api/alerts/', self.alert_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['hazard_type'], 'MISSILE')
        self.assertEqual(response.data['status'], 'PENDING')
        self.assertEqual(response.data['created_by_username'], 'testuser')
        self.assertFalse(response.data['is_official'])
    
    def test_create_alert_unauthenticated(self):
        """Test creating alert without authentication"""
        response = self.client.post('/api/alerts/', self.alert_data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_update_own_alert(self):
        """Test updating own alert"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        
        update_data = {
            'severity': 'CRITICAL',
            'radius_m': 4000
        }
        
        response = self.client.patch(f'/api/alerts/{self.alert.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['severity'], 'CRITICAL')
        self.assertEqual(response.data['radius_m'], 4000)
    
    def test_update_other_user_alert(self):
        """Test updating another user's alert (should fail)"""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        other_token = str(RefreshToken.for_user(other_user).access_token)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {other_token}')
        
        update_data = {'severity': 'CRITICAL'}
        response = self.client.patch(f'/api/alerts/{self.alert.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_admin_update_any_alert(self):
        """Test admin updating any alert"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        
        update_data = {
            'status': 'VERIFIED',
            'is_official': True
        }
        
        response = self.client.patch(f'/api/alerts/{self.alert.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'VERIFIED')
        self.assertTrue(response.data['is_official'])
    
    def test_delete_own_alert(self):
        """Test deleting own alert"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        
        response = self.client.delete(f'/api/alerts/{self.alert.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Alert.objects.filter(id=self.alert.id).exists())


class AlertVotingAPITest(APITestCase):
    """Test cases for Alert voting API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='testpass123'
        )
        
        self.user1_token = str(RefreshToken.for_user(self.user1).access_token)
        self.user2_token = str(RefreshToken.for_user(self.user2).access_token)
        
        self.alert = Alert.objects.create(
            hazard_type='MISSILE',
            severity='CRITICAL',
            center_lat=52.2297,
            center_lon=21.0122,
            radius_m=5000,
            valid_until=timezone.now() + timedelta(hours=1),
            source='test_source',
            created_by=self.user1,
            status='PENDING'
        )
    
    def test_vote_on_alert(self):
        """Test voting on an alert"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user2_token}')
        
        vote_data = {'vote_type': 'UPVOTE'}
        response = self.client.post(f'/api/alerts/{self.alert.id}/vote/', vote_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['vote_type'], 'UPVOTE')
        self.assertEqual(response.data['verification_score'], 1)
        
        # Verify vote was created
        vote = AlertVote.objects.get(user=self.user2, alert=self.alert)
        self.assertEqual(vote.vote_type, 'UPVOTE')
    
    def test_update_existing_vote(self):
        """Test updating an existing vote"""
        # Create initial vote
        AlertVote.objects.create(
            user=self.user2,
            alert=self.alert,
            vote_type='UPVOTE'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user2_token}')
        
        # Change vote to downvote
        vote_data = {'vote_type': 'DOWNVOTE'}
        response = self.client.post(f'/api/alerts/{self.alert.id}/vote/', vote_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['vote_type'], 'DOWNVOTE')
        
        # Verify vote was updated
        vote = AlertVote.objects.get(user=self.user2, alert=self.alert)
        self.assertEqual(vote.vote_type, 'DOWNVOTE')
    
    def test_vote_on_own_alert(self):
        """Test voting on own alert (should fail)"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user1_token}')
        
        vote_data = {'vote_type': 'UPVOTE'}
        response = self.client.post(f'/api/alerts/{self.alert.id}/vote/', vote_data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_vote_without_authentication(self):
        """Test voting without authentication"""
        vote_data = {'vote_type': 'UPVOTE'}
        response = self.client.post(f'/api/alerts/{self.alert.id}/vote/', vote_data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_vote_summary(self):
        """Test getting vote summary for an alert"""
        # Create some votes
        AlertVote.objects.create(user=self.user2, alert=self.alert, vote_type='UPVOTE')
        
        user3 = User.objects.create_user(
            username='user3',
            email='user3@example.com',
            password='testpass123'
        )
        AlertVote.objects.create(user=user3, alert=self.alert, vote_type='DOWNVOTE')
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user2_token}')
        response = self.client.get(f'/api/alerts/{self.alert.id}/votes/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['upvotes'], 1)
        self.assertEqual(response.data['downvotes'], 1)
        self.assertEqual(response.data['total_votes'], 2)
        self.assertEqual(response.data['verification_score'], 0)
        self.assertEqual(response.data['user_vote'], 'UPVOTE')
    
    def test_vote_summary_without_user_vote(self):
        """Test vote summary when user hasn't voted"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user2_token}')
        response = self.client.get(f'/api/alerts/{self.alert.id}/votes/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['upvotes'], 0)
        self.assertEqual(response.data['downvotes'], 0)
        self.assertEqual(response.data['total_votes'], 0)
        self.assertIsNone(response.data['user_vote'])
