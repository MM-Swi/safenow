import os
import random
import requests
from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from alerts.models import Alert
from devices.models import Device
from authentication.models import User


class Command(BaseCommand):
    help = 'Load comprehensive demo data for SafeNow'

    def add_arguments(self, parser):
        parser.add_argument('--lat', type=float, help='Latitude for alert center')
        parser.add_argument('--lon', type=float, help='Longitude for alert center')
        parser.add_argument('--location', type=str, help='Location description')
        parser.add_argument(
            '--radius',
            type=int,
            default=20000,
            help='Alert radius in meters (default: 20000)',
        )
        parser.add_argument(
            '--ip', action='store_true', help='Force IP geolocation only'
        )
        parser.add_argument(
            '--auto', action='store_true', help='Auto-detect location without prompts'
        )
        parser.add_argument(
            '--fallback',
            action='store_true',
            help='Use hardcoded fallback coordinates (Warsaw, Poland)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Loading SafeNow demo data...'))
        self.stdout.write()

        # 1. Load shelter data
        self.stdout.write('1. Loading shelter data...')
        shelter_csv_path = os.path.join('fixtures', 'shelters_sample.csv')
        if os.path.exists(shelter_csv_path):
            call_command('import_shelters', shelter_csv_path)
            self.stdout.write(self.style.SUCCESS('   ✓ Shelters loaded successfully'))
        else:
            self.stdout.write(
                self.style.WARNING(f'   ⚠ Shelter file not found: {shelter_csv_path}')
            )

        # 2. Load device data
        self.stdout.write('2. Loading device data...')
        devices_json_path = os.path.join('fixtures', 'devices_sample.json')
        if os.path.exists(devices_json_path):
            call_command('loaddata', devices_json_path)
            self.stdout.write(
                self.style.SUCCESS('   ✓ Demo devices loaded successfully')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'   ⚠ Devices file not found: {devices_json_path}')
            )

        # 3. Create demo users
        self.stdout.write('3. Creating demo users...')
        regular_user, admin_user = self.create_demo_users()

        # 4. Create comprehensive alerts
        self.stdout.write('4. Creating comprehensive alerts...')

        # Determine coordinates for alerts
        try:
            center_lat, center_lon, location_description = self.get_coordinates(options)
        except CommandError:
            raise
        except Exception as e:
            raise CommandError(f'Failed to determine coordinates: {str(e)}')

        self.create_comprehensive_alerts(
            regular_user, admin_user, center_lat, center_lon, options['radius']
        )

        # 5. Summary
        self.stdout.write()
        self.stdout.write(self.style.SUCCESS('Demo data loading complete!'))
        self.stdout.write()

        # Count data
        from shelters.models import Shelter
        from devices.models import Device, SafetyStatus

        shelter_count = Shelter.objects.count()
        alert_count = Alert.objects.filter(valid_until__gte=timezone.now()).count()
        device_count = Device.objects.count()
        status_count = SafetyStatus.objects.count()
        user_count = User.objects.count()
        admin_count = User.objects.filter(role='ADMIN').count()
        regular_user_count = User.objects.filter(role='USER').count()

        self.stdout.write('Summary:')
        self.stdout.write(
            f'  Users: {user_count} (Admin: {admin_count}, Regular: {regular_user_count})'
        )
        self.stdout.write(f'  Shelters: {shelter_count}')
        self.stdout.write(f'  Active alerts: {alert_count}')
        self.stdout.write(f'  Devices: {device_count}')
        self.stdout.write(f'  Safety statuses: {status_count}')
        self.stdout.write()
        self.stdout.write('Ready for demo! Visit:')
        self.stdout.write('  • API: http://localhost:8000/api/health/')
        self.stdout.write('  • Admin: http://localhost:8000/admin/')
        self.stdout.write('  • Docs: http://localhost:8000/api/docs/')
        self.stdout.write()
        self.stdout.write('Demo Login Credentials:')
        self.stdout.write('  • Regular User: user@safenow.com / user')
        self.stdout.write('  • Admin User: admin@safenow.com / admin')

    def create_demo_users(self):
        """Create demo users for testing."""
        # Create regular user
        regular_user, created = User.objects.get_or_create(
            username='user',
            email='user@safenow.com',
            defaults={
                'first_name': 'Demo',
                'last_name': 'User',
                'role': 'USER',
                'is_verified': True,
            },
        )
        if created:
            regular_user.set_password('user')
            regular_user.save()
            self.stdout.write(
                '   ✓ Created regular user: user@safenow.com (password: user)'
            )
        else:
            self.stdout.write('   ✓ Regular user already exists: user@safenow.com')

        # Create admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            email='admin@safenow.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'is_verified': True,
            },
        )
        if created:
            admin_user.set_password('admin')
            admin_user.save()
            self.stdout.write(
                '   ✓ Created admin user: admin@safenow.com (password: admin)'
            )
        else:
            self.stdout.write('   ✓ Admin user already exists: admin@safenow.com')

        return regular_user, admin_user

    def get_coordinates(self, options):
        """Get coordinates using multiple methods in order of preference."""

        # Method 1: Command-line arguments
        if options['lat'] is not None and options['lon'] is not None:
            lat, lon = options['lat'], options['lon']
            location = options['location'] or f"Command line ({lat:.4f}, {lon:.4f})"
            self.stdout.write(f"📍 Using command-line coordinates: {location}")
            return lat, lon, location

        # Method 2: Environment variables
        env_lat = os.getenv('ALERT_LAT')
        env_lon = os.getenv('ALERT_LON')
        if env_lat and env_lon:
            try:
                lat, lon = float(env_lat), float(env_lon)
                location = os.getenv(
                    'ALERT_LOCATION', f"Environment ({lat:.4f}, {lon:.4f})"
                )
                self.stdout.write(f"📍 Using environment coordinates: {location}")
                return lat, lon, location
            except ValueError:
                self.stdout.write(
                    self.style.WARNING(
                        "⚠️  Invalid environment coordinates, trying other methods..."
                    )
                )

        # Method 3: Hardcoded fallback (if explicitly requested)
        if options['fallback']:
            lat, lon = 52.2297, 21.0122
            location = "Warsaw, Poland (fallback)"
            self.stdout.write(f"📍 Using fallback coordinates: {location}")
            return lat, lon, location

        # Method 4: IP-based geolocation
        if options['ip'] or options['auto'] or not any([options.get('gps', False)]):
            self.stdout.write("🌐 Attempting IP-based geolocation...")
            ip_result = self.get_ip_geolocation()
            if ip_result:
                lat, lon, city = ip_result
                if options['auto']:
                    return lat, lon, city
                else:
                    # Interactive confirmation
                    try:
                        response = (
                            input(
                                f"Use detected location '{city}'? (y/n, default: y): "
                            )
                            .strip()
                            .lower()
                        )
                        if response in ['', 'y', 'yes']:
                            return lat, lon, city
                    except (EOFError, KeyboardInterrupt):
                        self.stdout.write("\n❌ Input cancelled")

        # Method 5: Manual input (interactive mode only)
        if not options['auto'] and not options['ip']:
            manual_result = self.get_manual_coordinates()
            if manual_result:
                return manual_result

        # Method 6: Final fallback
        lat, lon = 52.2297, 21.0122
        location = "Warsaw, Poland (final fallback)"
        self.stdout.write(f"📍 Using final fallback coordinates: {location}")
        return lat, lon, location

    def get_ip_geolocation(self):
        """Get current location based on IP address."""
        try:
            response = requests.get('https://ipapi.co/json/', timeout=5)
            if response.status_code == 200:
                data = response.json()
                lat = float(data.get('latitude', 0))
                lon = float(data.get('longitude', 0))
                city = data.get('city', 'Unknown')
                country = data.get('country_name', 'Unknown')

                if lat != 0 and lon != 0:
                    location = f"{city}, {country} ({lat:.4f}, {lon:.4f})"
                    self.stdout.write(f"📍 Detected location: {location}")
                    return lat, lon, location
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠️  IP geolocation failed: {e}"))

        return None

    def get_manual_coordinates(self):
        """Get coordinates through manual input with validation."""
        try:
            self.stdout.write("\n📍 Manual coordinate input:")
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
                self.stdout.write(
                    self.style.ERROR("❌ Invalid latitude. Must be between -90 and 90.")
                )
                return None
            if not (-180 <= lon <= 180):
                self.stdout.write(
                    self.style.ERROR(
                        "❌ Invalid longitude. Must be between -180 and 180."
                    )
                )
                return None

            description = input("Enter location description (optional): ").strip()
            if not description:
                description = f"Manual ({lat:.4f}, {lon:.4f})"

            return lat, lon, description

        except ValueError:
            self.stdout.write(
                self.style.ERROR(
                    "❌ Invalid coordinate format. Please enter numeric values."
                )
            )
            return None
        except (EOFError, KeyboardInterrupt):
            self.stdout.write("\n❌ Input cancelled.")
            return None

    def create_comprehensive_alerts(
        self, regular_user, admin_user, center_lat, center_lon, radius_m
    ):
        """Create comprehensive demo alerts for all hazard types."""
        # Convert coordinates to Decimal for database storage
        center_lat = Decimal(str(center_lat))
        center_lon = Decimal(str(center_lon))

        # Random descriptions for different hazard types
        alert_descriptions = {
            'AIR_RAID': [
                'Wykryto zbliżające się samoloty wojskowe. Natychmiast udaj się do schronienia.',
                'Alert lotniczy w rejonie centrum miasta. Pozostań w bezpiecznym miejscu.',
                'Sygnał alarmu przeciwlotniczego. Unikaj otwartych przestrzeni.',
            ],
            'DRONE': [
                'Nieidentyfikowane drony w okolicy. Zachowaj ostrożność.',
                'Wykryto podejrzaną aktywność dronów nad miastem.',
                'Ostrzeżenie przed dronami - unikaj skupisk ludzi na zewnątrz.',
            ],
            'MISSILE': [
                'Wykryto nadlatujące pociski. Natychmiast szukaj schronienia.',
                'Alert rakietowy - pozostań w budynku z dala od okien.',
                'Zagrożenie pociskami balistycznymi. Udaj się do najbliższego schronienia.',
            ],
            'FLOOD': [
                'Gwałtowny wzrost poziomu wody w rzece. Ewakuuj się na wyższy teren.',
                'Ostrzeżenie powodziowe - unikaj terenów zalewowych.',
                'Przekroczone stany alarmowe rzek. Nie zbliżaj się do wody.',
            ],
            'FIRE': [
                'Duży pożar w rejonie przemysłowym. Unikaj dymu i oparów.',
                'Pożar lasu rozprzestrzenia się w kierunku miasta.',
                'Pożar budynku mieszkalnego - drogi ewakuacyjne zablokowane.',
            ],
            'INDUSTRIAL': [
                'Awaria w zakładzie chemicznym. Możliwy wyciek substancji toksycznych.',
                'Eksplozja w fabryce - unikaj rejonu przemysłowego.',
                'Wyciek gazu w zakładzie przemysłowym. Zamknij okna i wentylację.',
            ],
            'SHOOTING': [
                'Strzelanina w centrum handlowym. Unikaj tego rejonu.',
                'Zgłoszenia o strzałach w okolicy dworca. Pozostań w bezpiecznym miejscu.',
                'Aktywny strzelec w budynku biurowym. Nie opuszczaj schronienia.',
            ],
            'STORM': [
                'Nadciąga gwałtowna burza z gradem. Schroń się w budynku.',
                'Ostrzeżenie przed silnym wiatrem - unikaj drzew i słupów.',
                'Burza z wyładowaniami atmosferycznymi. Nie korzystaj z urządzeń elektrycznych.',
            ],
            'TSUNAMI': [
                'Ostrzeżenie przed falą tsunami. Natychmiast ewakuuj się w głąb lądu.',
                'Zagrożenie tsunami po trzęsieniu ziemi. Udaj się na wyżyny.',
                'Fala tsunami zbliża się do wybrzeża. Opuść strefę nadmorską.',
            ],
            'CHEMICAL_WEAPON': [
                'Podejrzenie użycia broni chemicznej. Załóż maskę ochronną.',
                'Wykryto substancje chemiczne w powietrzu. Unikaj wdychania.',
                'Atak chemiczny w rejonie centrum. Schronienie w szczelnym pomieszczeniu.',
            ],
            'BIOHAZARD': [
                'Zagrożenie biologiczne - możliwy wyciek patogenów.',
                'Skażenie biologiczne w laboratorium. Unikaj kontaktu z powierzchniami.',
                'Alert biologiczny - zachowaj dystans od innych osób.',
            ],
            'NUCLEAR': [
                'Awaria elektrowni jądrowej. Możliwe skażenie radioaktywne.',
                'Zagrożenie nuklearne - pozostań w pomieszczeniu z zamkniętymi oknami.',
                'Wykryto podwyższone promieniowanie. Unikaj spożywania wody z kranu.',
            ],
            'UNMARKED_SOLDIERS': [
                'Nieoznaczeni żołnierze w rejonie granicy. Unikaj tego obszaru.',
                'Podejrzane jednostki wojskowe bez identyfikacji.',
                'Nieznane siły zbrojne w okolicy. Pozostań w domu.',
            ],
            'PANDEMIC': [
                'Nowe ognisko epidemii. Zachowaj dystans społeczny.',
                'Wzrost zakażeń chorobą zakaźną. Noś maskę ochronną.',
                'Alert pandemiczny - ograniczaj kontakty z innymi osobami.',
            ],
            'TERRORIST_ATTACK': [
                'Podejrzenie ataku terrorystycznego. Unikaj miejsc publicznych.',
                'Zagrożenie terrorystyczne w centrum miasta.',
                'Alert antyterrorystyczny - zgłaszaj podejrzane zachowania.',
            ],
            'MASS_POISONING': [
                'Masowe zatrucie w restauracji. Nie spożywaj jedzenia z tego rejonu.',
                'Podejrzenie zatrucia wody pitnej. Używaj tylko wody butelkowanej.',
                'Zatrucie gazem w budynku mieszkalnym. Ewakuacja w toku.',
            ],
            'CYBER_ATTACK': [
                'Cyberatak na infrastrukturę krytyczną. Możliwe zakłócenia w dostawach.',
                'Atak hakerski na systemy miejskie. Unikaj płatności elektronicznych.',
                'Zagrożenie cybernetyczne - nie korzystaj z publicznych sieci Wi-Fi.',
            ],
            'EARTHQUAKE': [
                'Trzęsienie ziemi magnitude 6.2. Unikaj budynków i mostów.',
                'Silne wstrząsy sejsmiczne. Możliwe repliki w najbliższych godzinach.',
                'Trzęsienie ziemi spowodowało uszkodzenia infrastruktury.',
            ],
        }

        # All 18 hazard types from the model
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
            'CHEMICAL_WEAPON',
            'BIOHAZARD',
            'NUCLEAR',
            'UNMARKED_SOLDIERS',
            'PANDEMIC',
            'TERRORIST_ATTACK',
            'MASS_POISONING',
            'CYBER_ATTACK',
            'EARTHQUAKE',
        ]

        # All severity levels for comprehensive testing
        severity_levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

        alerts_created = []

        # Create one alert for each hazard type with random severity, alternating between users
        for i, hazard_type in enumerate(hazard_types):
            # Alternate between users: even indices = regular_user, odd indices = admin_user
            # All alerts will have VERIFIED status for demo purposes
            creator = regular_user if i % 2 == 0 else admin_user
            is_official = creator == admin_user
            status = 'VERIFIED'  # All demo alerts are verified

            # Get random severity for this alert
            severity = random.choice(severity_levels)

            # Get random description for this hazard type
            description = random.choice(
                alert_descriptions.get(
                    hazard_type, ['Alert bezpieczeństwa - szczegóły niedostępne.']
                )
            )

            alert = Alert.objects.create(
                hazard_type=hazard_type,
                severity=severity,
                center_lat=center_lat,
                center_lon=center_lon,
                radius_m=radius_m,
                valid_until=timezone.now() + timedelta(hours=200),
                source='demo_load',
                description=description,
                created_by=creator,
                is_official=is_official,
                status=status,
            )
            alerts_created.append(alert)
            creator_name = 'admin' if creator == admin_user else 'user'
            self.stdout.write(
                f'   ✓ Created {hazard_type} alert with {severity} severity by {creator_name} (ID: {alert.id}, Status: VERIFIED)'
            )

        # Create additional alerts with random hazard types and severities for more variety
        additional_hazards = [
            'MISSILE',
            'FIRE',
            'FLOOD',
        ]  # Popular hazard types for additional examples
        for hazard_type in additional_hazards:
            # Get random severity for this additional alert
            severity = random.choice(severity_levels)

            # Get random description for this hazard type
            description = random.choice(
                alert_descriptions.get(
                    hazard_type, ['Alert bezpieczeństwa - szczegóły niedostępne.']
                )
            )

            alert = Alert.objects.create(
                hazard_type=hazard_type,
                severity=severity,
                center_lat=center_lat,
                center_lon=center_lon,
                radius_m=radius_m,
                valid_until=timezone.now() + timedelta(hours=2),
                source=f'demo_load_additional_{hazard_type.lower()}',
                description=description,
                created_by=regular_user,
                is_official=False,
                status='VERIFIED',  # All demo alerts are verified
            )
            alerts_created.append(alert)
            self.stdout.write(
                f'   ✓ Created additional {hazard_type} alert with {severity} severity by user (ID: {alert.id}, Status: VERIFIED)'
            )

        self.stdout.write(f'   📊 Total alerts created: {len(alerts_created)}')
