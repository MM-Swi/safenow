'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmergencyCard } from '@/components/EmergencyCard';
import { useEmergencyData, useRegisterDevice } from '@/hooks/useApi';
import { 
  formatDistance, 
  formatETA, 
  generateDeviceId 
} from '@/lib/utils/api';
import { AlertTriangle, MapPin, Clock, Shield, Smartphone } from 'lucide-react';

interface EmergencyDashboardProps {
  lat?: number;
  lon?: number;
}

export function EmergencyDashboard({ lat, lon }: EmergencyDashboardProps) {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(
    lat && lon ? { lat, lon } : null
  );
  const [deviceRegistered, setDeviceRegistered] = useState(false);

  const { alerts, shelters, isLoading, isError, refetch } = useEmergencyData(
    location?.lat || 0,
    location?.lon || 0,
    !!location
  );

  const registerDeviceMutation = useRegisterDevice();

  // Get user location if not provided
  useEffect(() => {
    if (!location && 'geolocation' in navigator) {
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
    }
  }, [location]);

  // Register device for push notifications
  useEffect(() => {
    if (location && !deviceRegistered && !registerDeviceMutation.isPending) {
      const deviceId = generateDeviceId();
      registerDeviceMutation.mutate(
        { device_id: deviceId },
        {
          onSuccess: () => {
            setDeviceRegistered(true);
            console.log('Device registered successfully');
          },
          onError: (error) => {
            console.error('Failed to register device:', error);
            // Don't retry immediately to avoid rate limiting
          },
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, deviceRegistered]); // Intentionally excluding registerDeviceMutation to prevent infinite loop

  if (!location) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Pobieranie lokalizacji...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Ładowanie danych awaryjnych...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Błąd połączenia
              </h3>
              <p className="text-red-700 mb-4">
                Nie można pobrać danych z serwera. Sprawdź połączenie internetowe.
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Spróbuj ponownie
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Device Status */}
      {deviceRegistered && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">
                Urządzenie zarejestrowane - otrzymujesz powiadomienia push
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-red-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Aktywne zagrożenia ({alerts.length})
          </h2>
          {alerts.map((alert) => {
            // Find the nearest shelter ETA for safety instructions context
            const nearestShelter = shelters.find(shelter => shelter.is_open_now) || shelters[0];
            const nearestShelterETA = nearestShelter?.eta_seconds;
            
            return (
              <EmergencyCard 
                key={alert.id}
                alert={alert}
                nearestShelterETA={nearestShelterETA}
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
      )}

      {/* No Active Alerts */}
      {alerts.length === 0 && (
        <Card className="border-green-200 bg-green-50">
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

      {/* Nearby Shelters */}
      <div className="space-y-4" data-shelters-section>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Najbliższe schrony ({shelters.length})
        </h2>
        
        {shelters.length > 0 ? (
          <div className="grid gap-4">
            {shelters.map((shelter) => (
              <Card key={shelter.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{shelter.name}</CardTitle>
                  <CardDescription>{shelter.address}</CardDescription>
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
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-600">
                <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p>Brak dostępnych schronów w pobliżu</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Location Info */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4" />
              Twoja lokalizacja
            </div>
            <div className="text-xs">
              {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
