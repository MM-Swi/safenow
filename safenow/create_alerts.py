#!/usr/bin/env python3
"""
Script to create all possible alert types with specified coordinates and radius.
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safenow_project.settings')
django.setup()

from alerts.models import Alert

def create_all_alerts():
    """Create alerts for all hazard types with CRITICAL severity."""
    
    # Clear existing alerts first
    Alert.objects.all().delete()
    print("Cleared existing alerts.")
    
    # Coordinates and radius as specified
    center_lat = 50.0564
    center_lon = 22.0004
    radius_m = 20000
    
    # All hazard types from the model
    hazard_types = [
        'AIR_RAID',
        'DRONE', 
        'MISSILE',
        'FLOOD',
        'FIRE',
        'INDUSTRIAL'
    ]
    
    # All severity levels
    severity_levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    
    # Create alerts for each hazard type with CRITICAL severity
    alerts_created = []
    
    for hazard_type in hazard_types:
        alert = Alert.objects.create(
            hazard_type=hazard_type,
            severity='CRITICAL',
            center_lat=center_lat,
            center_lon=center_lon,
            radius_m=radius_m,
            valid_until=datetime.now() + timedelta(hours=200),  # Valid for 2 hours
            source='Manual Creation Script'
        )
        alerts_created.append(alert)
        print(f"Created {hazard_type} alert with CRITICAL severity")
    
    # Also create one alert for each severity level using MISSILE as example
    for severity in severity_levels:
        if severity != 'CRITICAL':  # We already created CRITICAL MISSILE above
            alert = Alert.objects.create(
                hazard_type='MISSILE',
                severity=severity,
                center_lat=center_lat,
                center_lon=center_lon,
                radius_m=radius_m,
                valid_until=datetime.now() + timedelta(hours=2),
                source=f'Manual Creation Script - {severity} Example'
            )
            alerts_created.append(alert)
            print(f"Created MISSILE alert with {severity} severity")
    
    print(f"\nTotal alerts created: {len(alerts_created)}")
    print(f"Coordinates: {center_lat}, {center_lon}")
    print(f"Radius: {radius_m} meters")
    
    # Display all created alerts
    print("\nCreated alerts:")
    for alert in alerts_created:
        print(f"- {alert.hazard_type} ({alert.severity}) - Valid until: {alert.valid_until}")

if __name__ == '__main__':
    create_all_alerts()
