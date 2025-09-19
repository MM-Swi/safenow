'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmergencyCard } from '@/components/EmergencyCard';
import { MapPlaceholder } from '@/components/MapPlaceholder';
import { EmergencyModeToggle } from '@/components/EmergencyModeToggle';
import { EmergencyDashboard } from '@/components/EmergencyDashboard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { emergencyData } from '@/data/emergencies';
import { EmergencyType, ActiveEmergency } from '@/types/emergency';
import { useEmergencyData, useUpdateSafetyStatus } from '@/hooks/useApi';
import { mapHazardTypeToEmergencyType, generateDeviceId } from '@/lib/utils/api';
import { AlertTriangle, ArrowLeft, Phone, Shield } from 'lucide-react';

export default function EmergencyPage() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedShelterId, setSelectedShelterId] = useState<number | null>(null);
  const router = useRouter();

  const { alerts, shelters, isLoading, isError } = useEmergencyData(
    location?.lat || 0,
    location?.lon || 0,
    !!location
  );

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

  // Get the most critical alert for emergency instructions
  const criticalAlert = alerts.find(alert => alert.severity === 'CRITICAL') || alerts[0];
  const emergency = criticalAlert ? emergencyData[mapHazardTypeToEmergencyType(criticalAlert.hazard_type)] : null;

  return (
    <div className="min-h-screen bg-red-50">
      <EmergencyModeToggle 
        isEmergencyMode={true} 
        onToggle={handleEmergencyToggle} 
      />
      
      <div className="container mx-auto px-4 py-8">
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

        {/* Emergency Instructions */}
        {emergency && (
          <div className="mb-6">
            <EmergencyCard 
              emergency={emergency}
              onFindShelter={() => {}}
            />
          </div>
        )}

        {/* Real-time Emergency Dashboard */}
        <div className="mb-6">
          <EmergencyDashboard lat={location.lat} lon={location.lon} />
        </div>

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
