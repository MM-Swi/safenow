'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmergencyCard } from '@/components/EmergencyCard';
import { MapPlaceholder } from '@/components/MapPlaceholder';
import { EmergencyModeToggle } from '@/components/EmergencyModeToggle';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { emergencyData } from '@/data/emergencies';
import { EmergencyType, ActiveEmergency } from '@/types/emergency';
import { AlertTriangle, ArrowLeft, Phone } from 'lucide-react';

export default function EmergencyPage() {
  const [activeEmergency, setActiveEmergency] = useState<ActiveEmergency | null>(null);
  const [showMap, setShowMap] = useState(false);
  const router = useRouter();

  // Simulate receiving emergency data from backend
  useEffect(() => {
    // This would normally come from your backend API
    const simulateEmergencyData = () => {
      const emergencyTypes: EmergencyType[] = ['missile_attack', 'flood', 'wildfire'];
      const randomType = emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)];
      
      setActiveEmergency({
        type: randomType,
        location: {
          lat: 52.2297,
          lng: 21.0122,
          name: 'Schronienie Centrum',
          type: 'shelter',
          distance: 0.8
        },
        isActive: true,
        timestamp: new Date()
      });
    };

    // Simulate delay for loading emergency data
    const timer = setTimeout(simulateEmergencyData, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleEmergencyToggle = (isEmergency: boolean) => {
    if (!isEmergency) {
      router.push('/');
    }
  };

  const handleFindShelter = () => {
    setShowMap(true);
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  if (!activeEmergency) {
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

  const emergency = emergencyData[activeEmergency.type];

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
        <div className="mb-6">
          <EmergencyCard 
            emergency={emergency}
            onFindShelter={handleFindShelter}
          />
        </div>

        {/* Map Section */}
        {showMap && activeEmergency.location && (
          <div className="mb-6">
            <MapPlaceholder
              shelterName={activeEmergency.location.name}
              distance={`${activeEmergency.location.distance} km`}
              address="ul. Przykładowa 123, Warszawa"
            />
          </div>
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
          <p>Ostatnia aktualizacja: {activeEmergency.timestamp.toLocaleTimeString('pl-PL')}</p>
          <p className="mt-1 font-semibold">To jest tryb awaryjny - w przypadku zagrożenia życia dzwoń 112</p>
        </div>
      </div>
    </div>
  );
}
