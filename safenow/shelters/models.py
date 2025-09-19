from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Shelter(models.Model):
    SHELTER_TYPE_CHOICES = [
        ('PUBLIC', 'Public'),
        ('PRIVATE', 'Private'),
        ('ADHOC', 'Ad-hoc'),
    ]

    name = models.CharField(max_length=255)
    shelter_type = models.CharField(
        max_length=10,
        choices=SHELTER_TYPE_CHOICES,
        default='PUBLIC'
    )
    address = models.TextField()
    lat = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[
            MinValueValidator(-90.0),
            MaxValueValidator(90.0)
        ]
    )
    lon = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[
            MinValueValidator(-180.0),
            MaxValueValidator(180.0)
        ]
    )
    is_verified = models.BooleanField(default=False)
    capacity = models.IntegerField(null=True, blank=True)
    is_open_now = models.BooleanField(default=True)
    last_verified_at = models.DateTimeField(null=True, blank=True)
    source = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['lat']),
            models.Index(fields=['lon']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_shelter_type_display()})"
