from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class User(AbstractUser):
    """
    Custom User model extending AbstractUser with additional fields for SafeNow
    """
    
    class Role(models.TextChoices):
        USER = 'USER', 'User'
        ADMIN = 'ADMIN', 'Admin'
    
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.USER,
        help_text="User role in the system"
    )
    
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="User's phone number for emergency notifications"
    )
    
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether the user's account has been verified"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    class Meta:
        db_table = 'auth_user_custom'
        verbose_name = 'User'
        verbose_name_plural = 'Users'


class UserProfile(models.Model):
    """
    User profile model with additional preferences and settings
    """
    
    class Language(models.TextChoices):
        POLISH = 'pl', 'Polish'
        ENGLISH = 'en', 'English'
        UKRAINIAN = 'uk', 'Ukrainian'
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    
    preferred_language = models.CharField(
        max_length=5,
        choices=Language.choices,
        default=Language.POLISH,
        help_text="User's preferred language for notifications and interface"
    )
    
    # Notification preferences
    email_notifications = models.BooleanField(
        default=True,
        help_text="Receive emergency notifications via email"
    )
    
    push_notifications = models.BooleanField(
        default=True,
        help_text="Receive emergency notifications via push notifications"
    )
    
    sms_notifications = models.BooleanField(
        default=False,
        help_text="Receive emergency notifications via SMS"
    )
    
    # Location preferences
    auto_location = models.BooleanField(
        default=True,
        help_text="Automatically detect user location for relevant alerts"
    )
    
    alert_radius = models.IntegerField(
        default=10,
        help_text="Radius in kilometers for receiving location-based alerts"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profile for {self.user.username}"
    
    class Meta:
        db_table = 'user_profile'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Automatically create a UserProfile when a User is created
    """
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Save the UserProfile when the User is saved
    """
    if hasattr(instance, 'profile'):
        instance.profile.save()
