'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MapPin, Navigation } from 'lucide-react';

interface MapPlaceholderProps {
  shelterName?: string;
  distance?: string;
  address?: string;
}

export function MapPlaceholder({ shelterName, distance, address }: MapPlaceholderProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-600" />
          Mapa - Najbliższe schronienie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 rounded-lg h-64 flex flex-col items-center justify-center space-y-4">
          <div className="text-center space-y-2">
            <Navigation className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-gray-600 font-medium">Integracja z Google Maps</p>
            <p className="text-sm text-gray-500">Tutaj zostanie wyświetlona mapa z lokalizacją</p>
          </div>
          
          {shelterName && (
            <div className="bg-white p-4 rounded-lg shadow-sm border w-full max-w-sm">
              <h3 className="font-semibold text-sm mb-2">Najbliższe schronienie:</h3>
              <p className="text-sm font-medium">{shelterName}</p>
              {distance && (
                <p className="text-xs text-gray-600 mt-1">Odległość: {distance}</p>
              )}
              {address && (
                <p className="text-xs text-gray-600">{address}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
