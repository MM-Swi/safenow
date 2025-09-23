#!/usr/bin/env python3
"""
DEPRECATED: This standalone script is deprecated.
Please use the Django management command instead:

    python manage.py create_alerts --help

The new command provides:
- Better Django integration
- All 18 hazard types support
- Enhanced geolocation features
- Dry-run mode
- Better error handling

Legacy script to create all possible alert types with geolocation support.
Supports multiple methods to determine coordinates:
1. IP-based geolocation (automatic)
2. Manual coordinate input
3. Environment variables
4. Hardcoded fallback (Rzeszów, Poland)
"""
import os
import sys
import django
import json
import requests
import argparse
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safenow_project.settings')
django.setup()

from alerts.models import Alert

def get_ip_geolocation():
    """
    Get current location based on IP address using a free geolocation service.
    Returns (lat, lon, city) or None if failed.
    """
    try:
        # Using ipapi.co - free service with no API key required
        response = requests.get('https://ipapi.co/json/', timeout=5)
        if response.status_code == 200:
            data = response.json()
            lat = float(data.get('latitude', 0))
            lon = float(data.get('longitude', 0))
            city = data.get('city', 'Unknown')
            country = data.get('country_name', 'Unknown')
            
            if lat != 0 and lon != 0:
                print(f"📍 Detected location: {city}, {country} ({lat:.4f}, {lon:.4f})")
                return lat, lon, f"{city}, {country}"
    except Exception as e:
        print(f"⚠️  IP geolocation failed: {e}")
    
    return None

def get_manual_coordinates():
    """
    Get coordinates through manual input with validation.
    Returns (lat, lon, description) or None if cancelled.
    """
    try:
        print("\n📍 Manual coordinate input:")
        lat_input = input("Enter latitude (-90 to 90): ").strip()
        if not lat_input:
            return None
            
        lon_input = input("Enter longitude (-180 to 180): ").strip()
        if not lon_input:
            return None
            
        lat = float(lat_input)
        lon = float(lon_input)
        
        # Validate coordinates
        if not (-90 <= lat <= 90):
            print("❌ Invalid latitude. Must be between -90 and 90.")
            return None
        if not (-180 <= lon <= 180):
            print("❌ Invalid longitude. Must be between -180 and 180.")
            return None
            
        description = input("Enter location description (optional): ").strip()
        if not description:
            description = f"Manual ({lat:.4f}, {lon:.4f})"
            
        return lat, lon, description
        
    except ValueError:
        print("❌ Invalid coordinate format. Please enter numeric values.")
        return None
    except KeyboardInterrupt:
        print("\n❌ Input cancelled.")
        return None

def get_coordinates():
    """
    Get coordinates using multiple methods in order of preference.
    Returns (lat, lon, description).
    """
    # Method 1: Check environment variables
    env_lat = os.getenv('ALERT_LAT')
    env_lon = os.getenv('ALERT_LON')
    if env_lat and env_lon:
        try:
            lat, lon = float(env_lat), float(env_lon)
            description = os.getenv('ALERT_LOCATION', f"Environment ({lat:.4f}, {lon:.4f})")
            print(f"📍 Using environment coordinates: {description}")
            return lat, lon, description
        except ValueError:
            print("⚠️  Invalid environment coordinates, trying other methods...")
    
    # Method 2: Try IP-based geolocation
    print("🌐 Attempting IP-based geolocation...")
    ip_result = get_ip_geolocation()
    if ip_result:
        lat, lon, city = ip_result
        
        # Ask user if they want to use detected location
        try:
            use_detected = input(f"Use detected location? (y/n, default: y): ").strip().lower()
            if use_detected in ['', 'y', 'yes']:
                return lat, lon, city
        except KeyboardInterrupt:
            print("\n❌ Input cancelled.")
    
    # Method 3: Manual input
    print("📝 Would you like to enter coordinates manually?")
    try:
        use_manual = input("Enter coordinates manually? (y/n, default: n): ").strip().lower()
        if use_manual in ['y', 'yes']:
            manual_result = get_manual_coordinates()
            if manual_result:
                return manual_result
    except KeyboardInterrupt:
        print("\n❌ Input cancelled.")
    
    # Method 4: Fallback to hardcoded coordinates (Rzeszów, Poland)
    print("📍 Using fallback coordinates: Rzeszów, Poland")
    return 50.0564, 22.0004, "Rzeszów, Poland (fallback)"

def main():
    """Main function with command-line argument parsing."""
    print("⚠️  DEPRECATION WARNING: This standalone script is deprecated.")
    print("   Please use the Django management command instead:")
    print("   python manage.py create_alerts --help")
    print("   ")
    print("   The new command provides better integration and more features.")
    print("   Continuing with legacy script...")
    print()
    
    parser = argparse.ArgumentParser(
        description='Create emergency alerts with geolocation support',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python create_alerts.py                           # Interactive mode with geolocation
  python create_alerts.py --lat 50.0564 --lon 22.0004  # Specific coordinates
  python create_alerts.py --auto                    # Auto-detect location (no prompts)
  python create_alerts.py --fallback               # Use hardcoded Rzeszów coordinates

Environment variables:
  ALERT_LAT=50.0564 ALERT_LON=22.0004 ALERT_LOCATION="Custom Location" python create_alerts.py
        """
    )
    
    parser.add_argument('--lat', type=float, help='Latitude for alert center')
    parser.add_argument('--lon', type=float, help='Longitude for alert center')
    parser.add_argument('--location', type=str, help='Location description')
    parser.add_argument('--radius', type=int, default=200000, help='Alert radius in meters (default: 20000)')
    parser.add_argument('--auto', action='store_true', help='Auto-detect location without prompts')
    parser.add_argument('--fallback', action='store_true', help='Use hardcoded fallback coordinates')
    parser.add_argument('--quiet', '-q', action='store_true', help='Minimal output')
    
    args = parser.parse_args()
    
    # Override geolocation behavior based on arguments
    if args.lat is not None and args.lon is not None:
        # Use provided coordinates
        center_lat, center_lon = args.lat, args.lon
        location_description = args.location or f"Command line ({center_lat:.4f}, {center_lon:.4f})"
        if not args.quiet:
            print(f"📍 Using command-line coordinates: {location_description}")
    elif args.fallback:
        # Use hardcoded fallback
        center_lat, center_lon = 50.0564, 22.0004
        location_description = "Rzeszów, Poland (fallback)"
        if not args.quiet:
            print(f"📍 Using fallback coordinates: {location_description}")
    else:
        # Use geolocation system (with auto mode if specified)
        if not args.quiet:
            print("\n🌍 Determining location for alerts...")
        
        if args.auto:
            # Try IP geolocation first, fallback to hardcoded if failed
            ip_result = get_ip_geolocation()
            if ip_result:
                center_lat, center_lon, location_description = ip_result
            else:
                center_lat, center_lon = 50.0564, 22.0004
                location_description = "Rzeszów, Poland (fallback)"
                if not args.quiet:
                    print("📍 IP geolocation failed, using fallback coordinates")
        else:
            # Interactive mode
            center_lat, center_lon, location_description = get_coordinates()
    
    # Create alerts with determined coordinates
    create_all_alerts_with_coords(center_lat, center_lon, location_description, args.radius, args.quiet)

def create_all_alerts_with_coords(center_lat, center_lon, location_description, radius_m=20000, quiet=False):
    """Create alerts with specified coordinates."""
    # Clear existing alerts first
    Alert.objects.all().delete()
    if not quiet:
        print("🧹 Cleared existing alerts.")
    
    # All hazard types from the model
    hazard_types = [
        'AIR_RAID',
        'DRONE', 
        'MISSILE',
        'FLOOD',
        'FIRE',
        'INDUSTRIAL',
        'SHOOTING',
        'STORM',
        'TSUNAMI',
        'CHEMICAL WEAPON',
        'BIOHAZARD',
        'NUCLEAR',
        'UNMARKED SOLDIERS',
        'PANDEMIC',
        'TERRORIST ATTACK',
        'MASS POISONING',
        'CYBER ATTACK',
        'EARTHQUAKE'
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
            valid_until=timezone.now() + timedelta(hours=200),  # Valid for 200 hours
            source='Manual Creation Script'
        )
        alerts_created.append(alert)
        if not quiet:
            print(f"✅ Created {hazard_type} alert with CRITICAL severity")
    
    # Also create one alert for each severity level using MISSILE as example
    for severity in severity_levels:
        if severity != 'CRITICAL':  # We already created CRITICAL MISSILE above
            alert = Alert.objects.create(
                hazard_type='MISSILE',
                severity=severity,
                center_lat=center_lat,
                center_lon=center_lon,
                radius_m=radius_m,
                valid_until=timezone.now() + timedelta(hours=2),
                source=f'Manual Creation Script - {severity} Example'
            )
            alerts_created.append(alert)
            if not quiet:
                print(f"✅ Created MISSILE alert with {severity} severity")
    
    if not quiet:
        print(f"\n📊 Summary:")
        print(f"   Total alerts created: {len(alerts_created)}")
        print(f"   Location: {location_description}")
        print(f"   Coordinates: {center_lat:.4f}, {center_lon:.4f}")
        print(f"   Radius: {radius_m} meters ({radius_m/1000} km)")
        
        # Display all created alerts
        print("\n📋 Created alerts:")
        for alert in alerts_created:
            print(f"   - {alert.hazard_type} ({alert.severity}) - Valid until: {alert.valid_until}")
    else:
        print(f"Created {len(alerts_created)} alerts at {center_lat:.4f}, {center_lon:.4f}")

def create_all_alerts():
    """Legacy function for backward compatibility."""
    print("🌍 Determining location for alerts...")
    center_lat, center_lon, location_description = get_coordinates()
    create_all_alerts_with_coords(center_lat, center_lon, location_description)

if __name__ == '__main__':
    main()
