from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Device(models.Model):
    device_id = models.CharField(max_length=255, unique=True)
    push_token = models.TextField(null=True, blank=True)
    last_lat = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(-90.0),
            MaxValueValidator(90.0)
        ]
    )
    last_lon = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(-180.0),
            MaxValueValidator(180.0)
        ]
    )
    last_seen_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-last_seen_at']

    def __str__(self):
        return f"Device {self.device_id}"


class SafetyStatus(models.Model):
    STATUS_CHOICES = [
        ('UNKNOWN', 'Unknown'),
        ('OK', 'OK'),
        ('IN_SHELTER', 'In Shelter'),
        ('NEED_HELP', 'Need Help'),
    ]

    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='safety_statuses')
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default='UNKNOWN'
    )
    shelter = models.ForeignKey(
        'shelters.Shelter',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='safety_statuses'
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        get_latest_by = 'updated_at'

    def __str__(self):
        shelter_info = f" at {self.shelter.name}" if self.shelter else ""
        return f"{self.device.device_id} - {self.get_status_display()}{shelter_info}"
