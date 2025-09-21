from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_hazard_type_display()} - {self.get_severity_display()} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
