'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { AlertTriangle, Shield, MapPin, Crosshair, Layers } from 'lucide-react';
import { Alert, Shelter } from '@/types/api';
import { formatDistance, formatETA } from '@/lib/utils/api';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

interface MapContentProps {
  alerts: Alert[];
  shelters: Shelter[];
  userLocation: { lat: number; lon: number } | null;
  alertSearchRadius: number;
  shelterSearchRadius: number;
  isLoading?: boolean;
}

// Map controls component
function MapControls({
  userLocation,
  onCenterUser,
  onToggleLayer,
  currentLayer
}: {
  userLocation: { lat: number; lon: number } | null;
  onCenterUser: () => void;
  onToggleLayer: () => void;
  currentLayer: 'street' | 'satellite';
}) {
  return (
    <div className="absolute top-3 right-3 z-40 flex flex-col gap-2">
      <button
        onClick={onCenterUser}
        disabled={!userLocation}
        className="bg-white border-2 border-gray-300 rounded-md w-10 h-10 flex items-center justify-center cursor-pointer shadow-md hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        title="Wyśrodkuj na mojej lokalizacji"
      >
        <Crosshair className="w-5 h-5" />
      </button>
      <button
        onClick={onToggleLayer}
        className="bg-white border-2 border-gray-300 rounded-md w-10 h-10 flex items-center justify-center cursor-pointer shadow-md hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        title={`Przełącz na ${currentLayer === 'street' ? 'satelitę' : 'mapę'}`}
      >
        <Layers className="w-5 h-5" />
      </button>
    </div>
  );
}

// Component to handle map centering
function MapCenterController({
  center,
  shouldCenter
}: {
  center: LatLngExpression | null;
  shouldCenter: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (center && shouldCenter) {
      map.setView(center, 13);
    }
  }, [map, center, shouldCenter]);

  return null;
}

// User location marker component
function UserLocationMarker({ location }: { location: { lat: number; lon: number } }) {
  const userIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;

    const svgString = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="#fff" stroke-width="3"/>
      <circle cx="12" cy="12" r="3" fill="#fff"/>
    </svg>`;

    return new Icon({
      iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString),
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  }, []);

  if (!userIcon) return null;

  return (
    <Marker position={[location.lat, location.lon]} icon={userIcon}>
      <Popup>
        <div className="text-center">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <strong>Twoja lokalizacja</strong>
          </div>
          <div className="text-sm text-gray-600">
            <div>Szerokość: {location.lat.toFixed(6)}</div>
            <div>Długość: {location.lon.toFixed(6)}</div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// Alert marker component
function AlertMarker({ alert }: { alert: Alert }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return '#fbbf24';
      case 'MEDIUM': return '#f97316';
      case 'HIGH': return '#ef4444';
      case 'CRITICAL': return '#991b1b';
      default: return '#6b7280';
    }
  };

  const getHazardSymbol = (hazardType: string) => {
    // Normalize hazard type to handle both space and underscore formats
    const normalizedType = hazardType.replace(/ /g, '_');

    const symbolMap: Record<string, string> = {
      'AIR_RAID': 'A',
      'DRONE': 'D',
      'MISSILE': 'M',
      'FLOOD': 'F',
      'FIRE': 'X',
      'INDUSTRIAL': 'I',
      'SHOOTING': 'S',
      'STORM': 'T',
      'TSUNAMI': 'W',
      'CHEMICAL_WEAPON': 'C',
      'BIOHAZARD': 'B',
      'NUCLEAR': 'N',
      'UNMARKED_SOLDIERS': 'U',
      'PANDEMIC': 'P',
      'TERRORIST_ATTACK': 'E',
      'MASS_POISONING': 'O',
      'CYBER_ATTACK': 'Y',
      'EARTHQUAKE': 'Q'
    };
    return symbolMap[normalizedType] || '!';
  };

  const alertIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;

    const svgString = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="${getSeverityColor(alert.severity)}" stroke="#fff" stroke-width="3"/>
      <text x="16" y="20" text-anchor="middle" fill="#fff" font-size="16" font-weight="bold">${getHazardSymbol(alert.hazard_type)}</text>
    </svg>`;

    return new Icon({
      iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString),
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  }, [alert.severity, alert.hazard_type]);

  const getSeverityLabel = (severity: string) => {
    const labels = {
      'LOW': 'Niskie',
      'MEDIUM': 'Średnie',
      'HIGH': 'Wysokie',
      'CRITICAL': 'Krytyczne'
    };
    return labels[severity as keyof typeof labels] || severity;
  };

  const getHazardLabel = (hazardType: string) => {
    // Normalize hazard type to handle both space and underscore formats
    const normalizedType = hazardType.replace(/ /g, '_');

    const labels = {
      'AIR_RAID': 'Alert lotniczy',
      'DRONE': 'Zagrożenie dronami',
      'MISSILE': 'Alert rakietowy',
      'FLOOD': 'Powódź',
      'FIRE': 'Pożar',
      'INDUSTRIAL': 'Awaria przemysłowa',
      'SHOOTING': 'Strzelanina',
      'STORM': 'Burza',
      'TSUNAMI': 'Tsunami',
      'CHEMICAL_WEAPON': 'Broń chemiczna',
      'BIOHAZARD': 'Zagrożenie biologiczne',
      'NUCLEAR': 'Zagrożenie nuklearne',
      'UNMARKED_SOLDIERS': 'Nieoznaczeni żołnierze',
      'PANDEMIC': 'Pandemia',
      'TERRORIST_ATTACK': 'Atak terrorystyczny',
      'MASS_POISONING': 'Masowe zatrucie',
      'CYBER_ATTACK': 'Atak cybernetyczny',
      'EARTHQUAKE': 'Trzęsienie ziemi'
    };
    return labels[normalizedType as keyof typeof labels] || hazardType;
  };

  // Safety check for coordinates and icon
  if (!alert.center_lat || !alert.center_lon || !alertIcon) {
    if (!alert.center_lat || !alert.center_lon) {
      console.warn('Alert missing coordinates:', alert);
    }
    return null;
  }

  return (
    <>
      <Marker position={[alert.center_lat, alert.center_lon]} icon={alertIcon}>
        <Popup>
          <div className="min-w-[250px]">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className={`w-5 h-5 ${
                alert.severity === 'CRITICAL' ? 'text-red-800' :
                alert.severity === 'HIGH' ? 'text-red-600' :
                alert.severity === 'MEDIUM' ? 'text-orange-500' : 'text-yellow-500'
              }`} />
              <strong className="text-lg">{getHazardLabel(alert.hazard_type)}</strong>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Poziom zagrożenia:</span>
                <span className={`font-semibold ${
                  alert.severity === 'CRITICAL' ? 'text-red-800' :
                  alert.severity === 'HIGH' ? 'text-red-600' :
                  alert.severity === 'MEDIUM' ? 'text-orange-500' : 'text-yellow-600'
                }`}>
                  {getSeverityLabel(alert.severity)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Odległość:</span>
                <span className="font-medium">{formatDistance(alert.distance_km)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Zasięg alertu:</span>
                <span className="font-medium">{(alert.radius_m / 1000).toFixed(1)}km</span>
              </div>

              {alert.description && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                  <strong>Opis:</strong><br />
                  {alert.description}
                </div>
              )}

              <div className="mt-3 pt-2 border-t text-xs text-gray-500">
                <div>Utworzono: {new Date(alert.created_at).toLocaleString('pl-PL')}</div>
                <div>Ważne do: {new Date(alert.valid_until).toLocaleString('pl-PL')}</div>
                {alert.within_alert_radius && (
                  <div className="text-red-600 font-medium mt-1">⚠ Jesteś w zasięgu tego alertu</div>
                )}
                {alert.within_search_radius && !alert.within_alert_radius && (
                  <div className="text-orange-600 font-medium mt-1">● Alert w Twoim zasięgu wyszukiwania</div>
                )}
              </div>
            </div>
          </div>
        </Popup>
      </Marker>

      {/* Alert radius circle */}
      <Circle
        center={[alert.center_lat, alert.center_lon]}
        radius={alert.radius_m}
        pathOptions={{
          fillColor: getSeverityColor(alert.severity),
          fillOpacity: 0.1,
          color: getSeverityColor(alert.severity),
          weight: 2,
          dashArray: '5, 5'
        }}
      />
    </>
  );
}

// Shelter marker component
function ShelterMarker({ shelter }: { shelter: Shelter }) {
  const shelterIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;

    const svgString = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="24" height="24" rx="4" fill="${shelter.is_open_now ? '#10b981' : '#6b7280'}" stroke="#fff" stroke-width="3"/>
      <text x="14" y="18" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold">S</text>
    </svg>`;

    return new Icon({
      iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString),
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  }, [shelter.is_open_now]);

  // Safety check for coordinates
  if (!shelter.lat || !shelter.lon || !shelterIcon) {
    if (!shelter.lat || !shelter.lon) {
      console.warn('Shelter missing coordinates:', shelter);
    }
    return null;
  }

  return (
    <Marker position={[shelter.lat, shelter.lon]} icon={shelterIcon}>
      <Popup>
        <div className="min-w-[250px]">
          <div className="flex items-center gap-2 mb-3">
            <Shield className={`w-5 h-5 ${shelter.is_open_now ? 'text-green-600' : 'text-gray-500'}`} />
            <strong className="text-lg">{shelter.name}</strong>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Adres:</span><br />
              <span className="font-medium">{shelter.address}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Odległość:</span>
              <span className="font-medium">{formatDistance(shelter.distance_km)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Czas dojścia:</span>
              <span className="font-medium">{formatETA(shelter.eta_seconds)} pieszo</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-semibold ${shelter.is_open_now ? 'text-green-600' : 'text-red-600'}`}>
                {shelter.is_open_now ? '● Otwarty' : '● Zamknięty'}
              </span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// Main map content component
export default function MapContent({
  alerts,
  shelters,
  userLocation,
  alertSearchRadius,
  shelterSearchRadius,
  isLoading
}: MapContentProps) {
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite'>('street');
  const [centerOnUser, setCenterOnUser] = useState(false);

  // Default center (Krakow, Poland)
  const defaultCenter: LatLngExpression = [50.0647, 19.9450];
  const mapCenter = userLocation ? [userLocation.lat, userLocation.lon] as LatLngExpression : defaultCenter;

  const handleCenterUser = () => {
    if (userLocation) {
      setCenterOnUser(true);
      setTimeout(() => setCenterOnUser(false), 100);
    }
  };

  const handleToggleLayer = () => {
    setMapLayer(prev => prev === 'street' ? 'satellite' : 'street');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-600">Ładowanie mapy...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full z-10">
      <MapContainer
        center={mapCenter}
        zoom={userLocation ? 13 : 10}
        style={{ height: '100%', width: '100%', zIndex: 10 }}
        zoomControl={false}
      >
        <TileLayer
          url={mapLayer === 'street'
            ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          }
          attribution={mapLayer === 'street'
            ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            : '&copy; <a href="https://www.esri.com/">Esri</a>'
          }
        />

        <MapCenterController center={mapCenter} shouldCenter={centerOnUser} />

        {/* User location */}
        {userLocation && <UserLocationMarker location={userLocation} />}

        {/* Search radius circles */}
        {userLocation && alertSearchRadius > 0 && (
          <Circle
            center={[userLocation.lat, userLocation.lon]}
            radius={alertSearchRadius * 1000}
            pathOptions={{
              fillColor: '#3b82f6',
              fillOpacity: 0.05,
              color: '#3b82f6',
              weight: 2,
              dashArray: '10, 5'
            }}
          />
        )}

        {userLocation && shelterSearchRadius > 0 && (
          <Circle
            center={[userLocation.lat, userLocation.lon]}
            radius={shelterSearchRadius * 1000}
            pathOptions={{
              fillColor: '#10b981',
              fillOpacity: 0.05,
              color: '#10b981',
              weight: 2,
              dashArray: '10, 5'
            }}
          />
        )}

        {/* Alert markers */}
        {alerts.map(alert => (
          <AlertMarker key={alert.id} alert={alert} />
        ))}

        {/* Shelter markers */}
        {shelters.map(shelter => (
          <ShelterMarker key={shelter.id} shelter={shelter} />
        ))}
      </MapContainer>

      <MapControls
        userLocation={userLocation}
        onCenterUser={handleCenterUser}
        onToggleLayer={handleToggleLayer}
        currentLayer={mapLayer}
      />
    </div>
  );
}
