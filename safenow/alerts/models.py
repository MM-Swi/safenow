from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver


class Alert(models.Model):
    HAZARD_TYPE_CHOICES = [
        ('AIR_RAID', 'Air Raid'),
        ('DRONE', 'Drone'),
        ('MISSILE', 'Missile'),
        ('FLOOD', 'Flood'),
        ('FIRE', 'Fire'),
        ('INDUSTRIAL', 'Industrial Accident'),
        ('SHOOTING', 'Shooting'),
        ('STORM', 'Storm'),
        ('TSUNAMI', 'Tsunami'),
        ('CHEMICAL WEAPON', 'Chemical Weapon'),
        ('BIOHAZARD', 'Biohazard'),
        ('NUCLEAR', 'Nuclear'),
        ('UNMARKED SOLDIERS', 'Unmarked Soldiers'),
        ('PANDEMIC', 'Pandemic'),
        ('TERRORIST ATTACK', 'Terrorist Attack'),
        ('MASS POISONING', 'Mass Poisoning'),
        ('CYBER ATTACK', 'Cyber Attack'),
        ('EARTHQUAKE', 'Earthquake'),
    ]

    SEVERITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending Verification'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
        ('ACTIVE', 'Active'),
    ]

    hazard_type = models.CharField(
        max_length=20,
        choices=HAZARD_TYPE_CHOICES
    )
    severity = models.CharField(
        max_length=10,
        choices=SEVERITY_CHOICES,
        default='MEDIUM'
    )
    center_lat = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[
            MinValueValidator(-90.0),
            MaxValueValidator(90.0)
        ]
    )
    center_lon = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[
            MinValueValidator(-180.0),
            MaxValueValidator(180.0)
        ]
    )
    radius_m = models.IntegerField(
        validators=[MinValueValidator(1)]
    )
    valid_until = models.DateTimeField()
    source = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True, help_text="Detailed description of the alert")
    created_at = models.DateTimeField(auto_now_add=True)
    
    # New fields for user ownership and verification
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_alerts',
        help_text="User who created this alert. Null for system-generated alerts."
    )
    
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='ACTIVE',
        help_text="Current verification status of the alert"
    )
    
    verification_score = models.IntegerField(
        default=0,
        help_text="Calculated score based on user votes (upvotes - downvotes)"
    )
    
    is_official = models.BooleanField(
        default=False,
        help_text="True for alerts created by admins or official sources"
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_hazard_type_display()} - {self.get_severity_display()} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
    
    def update_verification_score(self):
        """
        Update verification score based on votes and check for auto-verification
        """
        upvotes = self.votes.filter(vote_type='UPVOTE').count()
        downvotes = self.votes.filter(vote_type='DOWNVOTE').count()
        self.verification_score = upvotes - downvotes
        
        # Auto-verification logic
        if self.status == 'PENDING':
            if self.verification_score >= 3:  # Threshold for verification
                self.status = 'VERIFIED'
            elif self.verification_score <= -3:  # Threshold for rejection
                self.status = 'REJECTED'
        
        self.save(update_fields=['verification_score', 'status'])
    
    def can_be_edited_by(self, user):
        """
        Check if a user can edit this alert
        """
        if not user or not user.is_authenticated:
            return False
        
        # Users can edit their own alerts
        if self.created_by == user:
            return True
            
        # Admins can edit any alert
        if hasattr(user, 'role') and user.role == 'ADMIN':
            return True
        if user.is_staff or user.is_superuser:
            return True
            
        return False
    
    @property
    def is_active(self):
        """
        Check if alert is currently active (not expired and verified/active status)
        """
        from django.utils import timezone
        return (
            self.valid_until > timezone.now() and 
            self.status in ['VERIFIED', 'ACTIVE']
        )


class AlertVote(models.Model):
    """
    Model to track user votes on alerts for community verification
    """
    
    VOTE_TYPE_CHOICES = [
        ('UPVOTE', 'Upvote'),
        ('DOWNVOTE', 'Downvote'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='alert_votes'
    )
    
    alert = models.ForeignKey(
        Alert,
        on_delete=models.CASCADE,
        related_name='votes'
    )
    
    vote_type = models.CharField(
        max_length=10,
        choices=VOTE_TYPE_CHOICES
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'alert']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} {self.vote_type.lower()}d alert {self.alert.id}"


@receiver(post_save, sender=AlertVote)
def update_alert_verification_score(sender, instance, **kwargs):
    """
    Update alert verification score when a vote is created or updated
    """
    instance.alert.update_verification_score()
