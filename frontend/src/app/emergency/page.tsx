'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmergencyCard } from '@/components/EmergencyCard';

import { ShelterSearchControls } from '@/components/ShelterSearchControls';
import { AlertSearchControls } from '@/components/AlertSearchControls';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Navigation from '@/components/Navigation';
import { useEmergencyData, useUpdateSafetyStatus } from '@/hooks/useApi';
import { generateDeviceId } from '@/lib/utils/api';
import { AlertTriangle, ArrowLeft, Phone, Shield, MapPin, Clock } from 'lucide-react';
import InteractiveMap from '@/components/InteractiveMap';
import { formatDistance, formatETA } from '@/lib/utils/api';

export default function EmergencyPage() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedShelterId, setSelectedShelterId] = useState<number | null>(null);
  const router = useRouter();

  const [shelterRadius, setShelterRadius] = useState(500); // Default 500km radius (max range)
  const [alertSearchRadius, setAlertSearchRadius] = useState(500); // Default 500km (max range)

  const { alerts, shelters, isLoading, error } = useEmergencyData(
    location?.lat || 0,
    location?.lon || 0,
    !!location,
    {
      shelterRadius,
      shelterLimit: 10,
      alertSearchRadius
    }
  );

  // Debug logging
  console.log('Emergency Page Debug:', {
    location,
    alerts: alerts?.length,
    shelters: shelters?.length,
    isLoading,
    error,
    shelterRadius,
    alertSearchRadius
  });

  const updateSafetyStatusMutation = useUpdateSafetyStatus();

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to Warsaw coordinates for demo
          setLocation({ lat: 52.2297, lon: 21.0122 });
        }
      );
    } else {
      // Fallback to Warsaw coordinates
      setLocation({ lat: 52.2297, lon: 21.0122 });
    }
  }, []);

  const handleEmergencyToggle = (isEmergency: boolean) => {
    if (!isEmergency) {
      router.push('/');
    }
  };

  const handleShelterCheckIn = (shelterId: number) => {
    const deviceId = generateDeviceId();
    updateSafetyStatusMutation.mutate({
      device_id: deviceId,
      status: 'IN_SHELTER',
      shelter_id: shelterId,
    }, {
      onSuccess: () => {
        setSelectedShelterId(shelterId);
        alert('Zgłoszono pobyt w schronie. Służby ratunkowe zostały poinformowane.');
      },
      onError: (error) => {
        console.error('Failed to update safety status:', error);
        alert('Nie udało się zgłosić pobytu w schronie. Spróbuj ponownie.');
      },
    });
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  if (!location) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-red-900 mb-2">Pobieranie lokalizacji...</h2>
          <p className="text-red-700">Określamy Twoją pozycję dla najlepszych instrukcji</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-red-900 mb-2">Ładowanie danych awaryjnych...</h2>
          <p className="text-red-700">Sprawdzamy aktualną sytuację w Twojej okolicy</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-red-50">
      <Navigation />


      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={handleBackToHome}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót
          </Button>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
            <h1 className="text-2xl font-bold text-red-900">TRYB AWARYJNY</h1>
          </div>
        </div>

        {/* Emergency Contact - Always Visible */}
        <Card className="mb-6 border-red-300 bg-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-bold text-red-900">NUMER ALARMOWY</h3>
                  <p className="text-red-800">Dzwoń natychmiast w przypadku zagrożenia życia</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-red-600">112</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert Search Controls - Prominent */}
        <div className="mb-6">
          <AlertSearchControls
            currentSearchRadius={alertSearchRadius}
            onSearchRadiusChange={setAlertSearchRadius}
            alertCount={alerts.length}
            isLoading={isLoading}
          />
        </div>

        {/* Active Alerts with First One Expanded */}
        {alerts.length > 0 && (
          <div className="mb-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Aktywne zagrożenia ({alerts.length})
              </h2>
              {alerts.map((alert, index) => {
                // Find the nearest shelter ETA for safety instructions context
                const nearestShelter = shelters.find(shelter => shelter.is_open_now) || shelters[0];
                const nearestShelterETA = nearestShelter?.eta_seconds;

                return (
                  <EmergencyCard
                    key={alert.id}
                    alert={alert}
                    nearestShelterETA={nearestShelterETA}
                    defaultExpanded={index === 0} // Expand the first alert by default
                    onFindShelter={() => {
                      // Scroll to shelters section
                      const sheltersSection = document.querySelector('[data-shelters-section]');
                      if (sheltersSection) {
                        sheltersSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* No Active Alerts */}
        {alerts.length === 0 && (
          <Card className="border-green-200 bg-green-50 mb-6">
            <CardContent className="p-6">
              <div className="text-center">
                <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Brak aktywnych zagrożeń
                </h3>
                <p className="text-green-700">
                  W Twojej okolicy nie ma obecnie aktywnych alertów bezpieczeństwa.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shelter Search Controls - Prominent */}
        <div className="mb-6">
          <ShelterSearchControls
            currentRadius={shelterRadius}
            onRadiusChange={setShelterRadius}
            shelterCount={shelters.length}
            isLoading={isLoading}
          />
        </div>

        {/* Interactive Map */}
        <div className="mb-6">
          <Card className="border-gray-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <MapPin className="w-6 h-6 text-blue-600" />
                🗺️ Mapa sytuacyjna
              </CardTitle>
              <p className="text-sm text-gray-600">
                Interaktywna mapa pokazująca alerty i schrony w Twojej okolicy
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 rounded-b-lg overflow-hidden">
                <InteractiveMap
                  alerts={alerts}
                  shelters={shelters}
                  userLocation={location}
                  alertSearchRadius={alertSearchRadius}
                  shelterSearchRadius={shelterRadius}
                  isLoading={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nearby Shelters */}
        {shelters.length > 0 && (
          <div className="space-y-4 mb-6" data-shelters-section>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Najbliższe schrony ({shelters.length})
            </h2>

            <div className="grid gap-4">
              {shelters.map((shelter) => (
                <Card key={shelter.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{shelter.name}</CardTitle>
                    <div className="text-sm text-gray-600">{shelter.address}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {formatDistance(shelter.distance_km)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatETA(shelter.eta_seconds)} pieszo
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        shelter.is_open_now
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {shelter.is_open_now ? 'Otwarty' : 'Zamknięty'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Shelter Check-in Section */}
        {shelters.length > 0 && (
          <Card className="border-blue-300 bg-blue-50 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Shield className="w-5 h-5" />
                Zgłoś pobyt w schronie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-800 mb-4">
                Jeśli dotarłeś do schronu, zgłoś swój pobyt służbom ratunkowym:
              </p>
              <div className="space-y-2">
                {shelters.slice(0, 3).map((shelter) => (
                  <Button
                    key={shelter.id}
                    onClick={() => handleShelterCheckIn(shelter.id)}
                    variant="outline"
                    className="w-full justify-start"
                    disabled={updateSafetyStatusMutation.isPending || selectedShelterId === shelter.id}
                  >
                    {selectedShelterId === shelter.id ? (
                      <>
                        <Shield className="w-4 h-4 mr-2 text-green-600" />
                        Zgłoszono pobyt - {shelter.name}
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Jestem w: {shelter.name}
                      </>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Emergency Info */}
        <Card className="border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="w-5 h-5" />
              Ważne informacje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-orange-800">
              <li>• Zachowaj spokój i postępuj zgodnie z instrukcjami</li>
              <li>• Słuchaj komunikatów służb ratunkowych</li>
              <li>• Nie rozprzestrzeniaj niepotwierdzone informacji</li>
              <li>• Pomóż innym, jeśli możesz to zrobić bezpiecznie</li>
              <li>• W przypadku wątpliwości dzwoń 112</li>
            </ul>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-red-700 text-sm mt-6">
          <p>Ostatnia aktualizacja: {new Date().toLocaleTimeString('pl-PL')}</p>
          <p className="mt-1 font-semibold">To jest tryb awaryjny - w przypadku zagrożenia życia dzwoń 112</p>
        </div>
      </div>
    </div>
  );
}
