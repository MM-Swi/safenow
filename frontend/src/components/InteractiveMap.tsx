'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Alert, Shelter } from '@/types/api';

interface InteractiveMapProps {
  alerts: Alert[];
  shelters: Shelter[];
  userLocation: { lat: number; lon: number } | null;
  alertSearchRadius: number;
  shelterSearchRadius: number;
  isLoading?: boolean;
  className?: string;
}

// Dynamic import of the map content to avoid SSR issues
const MapContent = dynamic(
  () => import('./MapContent'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-600">Ładowanie mapy...</div>
        </div>
      </div>
    )
  }
);

// Main InteractiveMap component
export default function InteractiveMap(props: InteractiveMapProps) {
  return <MapContent {...props} />;
}
