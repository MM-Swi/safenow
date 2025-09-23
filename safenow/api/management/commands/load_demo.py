import os
import random
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from alerts.models import Alert
from devices.models import Device
from authentication.models import User


class Command(BaseCommand):
    help = 'Load comprehensive demo data for SafeNow'

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
            self.stdout.write(self.style.WARNING(f'   ⚠ Shelter file not found: {shelter_csv_path}'))

        # 2. Load device data
        self.stdout.write('2. Loading device data...')
        devices_json_path = os.path.join('fixtures', 'devices_sample.json')
        if os.path.exists(devices_json_path):
            call_command('loaddata', devices_json_path)
            self.stdout.write(self.style.SUCCESS('   ✓ Demo devices loaded successfully'))
        else:
            self.stdout.write(self.style.WARNING(f'   ⚠ Devices file not found: {devices_json_path}'))

        # 3. Create demo users
        self.stdout.write('3. Creating demo users...')
        regular_user, admin_user = self.create_demo_users()

        # 4. Create demo alerts
        self.stdout.write('4. Creating demo alerts...')
        
        # Clear existing alerts first
        Alert.objects.all().delete()
        self.stdout.write('   🧹 Cleared existing alerts')

        # Create comprehensive demo alerts for all hazard types
        self.create_comprehensive_alerts(regular_user, admin_user)

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
        self.stdout.write(f'  Users: {user_count} (Admin: {admin_count}, Regular: {regular_user_count})')
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
            }
        )
        if created:
            regular_user.set_password('user')
            regular_user.save()
            self.stdout.write('   ✓ Created regular user: user@safenow.com (password: user)')
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
            }
        )
        if created:
            admin_user.set_password('admin')
            admin_user.save()
            self.stdout.write('   ✓ Created admin user: admin@safenow.com (password: admin)')
        else:
            self.stdout.write('   ✓ Admin user already exists: admin@safenow.com')

        return regular_user, admin_user

    def create_comprehensive_alerts(self, regular_user, admin_user):
        """Create comprehensive demo alerts for all hazard types."""
        # Warsaw coordinates for demo
        center_lat = Decimal('52.2297')
        center_lon = Decimal('21.0122')
        
        # Random descriptions for different hazard types
        alert_descriptions = {
            'AIR_RAID': [
                'Wykryto zbliżające się samoloty wojskowe. Natychmiast udaj się do schronienia.',
                'Alert lotniczy w rejonie centrum miasta. Pozostań w bezpiecznym miejscu.',
                'Sygnał alarmu przeciwlotniczego. Unikaj otwartych przestrzeni.'
            ],
            'DRONE': [
                'Nieidentyfikowane drony w okolicy. Zachowaj ostrożność.',
                'Wykryto podejrzaną aktywność dronów nad miastem.',
                'Ostrzeżenie przed dronami - unikaj skupisk ludzi na zewnątrz.'
            ],
            'MISSILE': [
                'Wykryto nadlatujące pociski. Natychmiast szukaj schronienia.',
                'Alert rakietowy - pozostań w budynku z dala od okien.',
                'Zagrożenie pociskami balistycznymi. Udaj się do najbliższego schronienia.'
            ],
            'FLOOD': [
                'Gwałtowny wzrost poziomu wody w rzece. Ewakuuj się na wyższy teren.',
                'Ostrzeżenie powodziowe - unikaj terenów zalewowych.',
                'Przekroczone stany alarmowe rzek. Nie zbliżaj się do wody.'
            ],
            'FIRE': [
                'Duży pożar w rejonie przemysłowym. Unikaj dymu i oparów.',
                'Pożar lasu rozprzestrzenia się w kierunku miasta.',
                'Pożar budynku mieszkalnego - drogi ewakuacyjne zablokowane.'
            ],
            'INDUSTRIAL': [
                'Awaria w zakładzie chemicznym. Możliwy wyciek substancji toksycznych.',
                'Eksplozja w fabryce - unikaj rejonu przemysłowego.',
                'Wyciek gazu w zakładzie przemysłowym. Zamknij okna i wentylację.'
            ],
            'SHOOTING': [
                'Strzelanina w centrum handlowym. Unikaj tego rejonu.',
                'Zgłoszenia o strzałach w okolicy dworca. Pozostań w bezpiecznym miejscu.',
                'Aktywny strzelec w budynku biurowym. Nie opuszczaj schronienia.'
            ],
            'STORM': [
                'Nadciąga gwałtowna burza z gradem. Schroń się w budynku.',
                'Ostrzeżenie przed silnym wiatrem - unikaj drzew i słupów.',
                'Burza z wyładowaniami atmosferycznymi. Nie korzystaj z urządzeń elektrycznych.'
            ],
            'TSUNAMI': [
                'Ostrzeżenie przed falą tsunami. Natychmiast ewakuuj się w głąb lądu.',
                'Zagrożenie tsunami po trzęsieniu ziemi. Udaj się na wyżyny.',
                'Fala tsunami zbliża się do wybrzeża. Opuść strefę nadmorską.'
            ],
            'CHEMICAL_WEAPON': [
                'Podejrzenie użycia broni chemicznej. Załóż maskę ochronną.',
                'Wykryto substancje chemiczne w powietrzu. Unikaj wdychania.',
                'Atak chemiczny w rejonie centrum. Schronienie w szczelnym pomieszczeniu.'
            ],
            'BIOHAZARD': [
                'Zagrożenie biologiczne - możliwy wyciek patogenów.',
                'Skażenie biologiczne w laboratorium. Unikaj kontaktu z powierzchniami.',
                'Alert biologiczny - zachowaj dystans od innych osób.'
            ],
            'NUCLEAR': [
                'Awaria elektrowni jądrowej. Możliwe skażenie radioaktywne.',
                'Zagrożenie nuklearne - pozostań w pomieszczeniu z zamkniętymi oknami.',
                'Wykryto podwyższone promieniowanie. Unikaj spożywania wody z kranu.'
            ],
            'UNMARKED_SOLDIERS': [
                'Nieoznaczeni żołnierze w rejonie granicy. Unikaj tego obszaru.',
                'Podejrzane jednostki wojskowe bez identyfikacji.',
                'Nieznane siły zbrojne w okolicy. Pozostań w domu.'
            ],
            'PANDEMIC': [
                'Nowe ognisko epidemii. Zachowaj dystans społeczny.',
                'Wzrost zakażeń chorobą zakaźną. Noś maskę ochronną.',
                'Alert pandemiczny - ograniczaj kontakty z innymi osobami.'
            ],
            'TERRORIST_ATTACK': [
                'Podejrzenie ataku terrorystycznego. Unikaj miejsc publicznych.',
                'Zagrożenie terrorystyczne w centrum miasta.',
                'Alert antyterrorystyczny - zgłaszaj podejrzane zachowania.'
            ],
            'MASS_POISONING': [
                'Masowe zatrucie w restauracji. Nie spożywaj jedzenia z tego rejonu.',
                'Podejrzenie zatrucia wody pitnej. Używaj tylko wody butelkowanej.',
                'Zatrucie gazem w budynku mieszkalnym. Ewakuacja w toku.'
            ],
            'CYBER_ATTACK': [
                'Cyberatak na infrastrukturę krytyczną. Możliwe zakłócenia w dostawach.',
                'Atak hakerski na systemy miejskie. Unikaj płatności elektronicznych.',
                'Zagrożenie cybernetyczne - nie korzystaj z publicznych sieci Wi-Fi.'
            ],
            'EARTHQUAKE': [
                'Trzęsienie ziemi magnitude 6.2. Unikaj budynków i mostów.',
                'Silne wstrząsy sejsmiczne. Możliwe repliki w najbliższych godzinach.',
                'Trzęsienie ziemi spowodowało uszkodzenia infrastruktury.'
            ]
        }
        
        # All 18 hazard types from the model
        hazard_types = [
            'AIR_RAID', 'DRONE', 'MISSILE', 'FLOOD', 'FIRE', 'INDUSTRIAL',
            'SHOOTING', 'STORM', 'TSUNAMI', 'CHEMICAL_WEAPON', 'BIOHAZARD',
            'NUCLEAR', 'UNMARKED_SOLDIERS', 'PANDEMIC', 'TERRORIST_ATTACK',
            'MASS_POISONING', 'CYBER_ATTACK', 'EARTHQUAKE'
        ]
        
        # All severity levels for comprehensive testing
        severity_levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        
        alerts_created = []
        
        # Create one alert for each hazard type with random severity, alternating between users
        for i, hazard_type in enumerate(hazard_types):
            # Alternate between users: even indices = regular_user, odd indices = admin_user
            # Some alerts will be created by admin (official), others by regular user (pending)
            creator = regular_user if i % 2 == 0 else admin_user
            is_official = creator == admin_user
            status = 'ACTIVE' if is_official else 'PENDING'
            
            # Get random severity for this alert
            severity = random.choice(severity_levels)
            
            # Get random description for this hazard type
            description = random.choice(alert_descriptions.get(hazard_type, ['Alert bezpieczeństwa - szczegóły niedostępne.']))
            
            alert = Alert.objects.create(
                hazard_type=hazard_type,
                severity=severity,
                center_lat=center_lat,
                center_lon=center_lon,
                radius_m=20000,  # 20km radius
                valid_until=timezone.now() + timedelta(hours=2),
                source='demo_load',
                description=description,
                created_by=creator,
                is_official=is_official,
                status=status
            )
            alerts_created.append(alert)
            creator_name = 'admin' if creator == admin_user else 'user'
            self.stdout.write(f'   ✓ Created {hazard_type} alert with {severity} severity by {creator_name} (ID: {alert.id}, Status: {status})')

        # Create additional alerts with random hazard types and severities for more variety
        additional_hazards = ['MISSILE', 'FIRE', 'FLOOD']  # Popular hazard types for additional examples
        for hazard_type in additional_hazards:
            # Get random severity for this additional alert
            severity = random.choice(severity_levels)
            
            # Get random description for this hazard type
            description = random.choice(alert_descriptions.get(hazard_type, ['Alert bezpieczeństwa - szczegóły niedostępne.']))
            
            alert = Alert.objects.create(
                hazard_type=hazard_type,
                severity=severity,
                center_lat=center_lat,
                center_lon=center_lon,
                radius_m=15000,  # 15km radius for examples
                valid_until=timezone.now() + timedelta(hours=2),
                source=f'demo_load_additional_{hazard_type.lower()}',
                description=description,
                created_by=regular_user,
                is_official=False,
                status='PENDING'
            )
            alerts_created.append(alert)
            self.stdout.write(f'   ✓ Created additional {hazard_type} alert with {severity} severity by user (ID: {alert.id}, Status: PENDING)')
        
        self.stdout.write(f'   📊 Total alerts created: {len(alerts_created)}')