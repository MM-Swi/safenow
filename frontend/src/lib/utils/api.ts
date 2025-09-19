import type { HazardType, Severity } from '@/types/api';

// Utility functions for API data processing

// Format ETA seconds to human readable time
export const formatETA = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes}min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
};

// Format distance to human readable format
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  } else if (km < 10) {
    return `${km.toFixed(1)}km`;
  } else {
    return `${Math.round(km)}km`;
  }
};

// Get hazard type display name in Polish
export const getHazardTypeDisplay = (hazardType: HazardType): string => {
  const hazardTypeMap: Record<HazardType, string> = {
    AIR_RAID: 'Nalot',
    DRONE: 'Atak dronów',
    MISSILE: 'Atak rakietowy',
    FLOOD: 'Powódź',
    FIRE: 'Pożar',
    INDUSTRIAL: 'Awaria przemysłowa',
  };
  return hazardTypeMap[hazardType] || hazardType;
};

// Get severity display name in Polish
export const getSeverityDisplay = (severity: Severity): string => {
  const severityMap: Record<Severity, string> = {
    LOW: 'Niski',
    MEDIUM: 'Średni',
    HIGH: 'Wysoki',
    CRITICAL: 'Krytyczny',
  };
  return severityMap[severity] || severity;
};

// Get severity color class for UI
export const getSeverityColor = (severity: Severity): string => {
  const colorMap: Record<Severity, string> = {
    LOW: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    MEDIUM: 'text-orange-600 bg-orange-50 border-orange-200',
    HIGH: 'text-red-600 bg-red-50 border-red-200',
    CRITICAL: 'text-red-800 bg-red-100 border-red-300',
  };
  return colorMap[severity] || 'text-gray-600 bg-gray-50 border-gray-200';
};

// Get hazard type icon
export const getHazardTypeIcon = (hazardType: HazardType): string => {
  const iconMap: Record<HazardType, string> = {
    AIR_RAID: '✈️',
    DRONE: '🛸',
    MISSILE: '🚀',
    FLOOD: '🌊',
    FIRE: '🔥',
    INDUSTRIAL: '⚠️',
  };
  return iconMap[hazardType] || '⚠️';
};

// Map backend hazard types to frontend emergency types
export const mapHazardTypeToEmergencyType = (hazardType: HazardType): string => {
  const typeMap: Record<HazardType, string> = {
    AIR_RAID: 'missile_attack', // Map air raid to missile attack for learning content
    DRONE: 'drone_attack',
    MISSILE: 'missile_attack',
    FLOOD: 'flood',
    FIRE: 'wildfire',
    INDUSTRIAL: 'chemical_emergency', // Map industrial to chemical emergency
  };
  return typeMap[hazardType] || 'missile_attack';
};

// Generate device ID for the current user
export const generateDeviceId = (): string => {
  // Try to get existing device ID from localStorage
  if (typeof window !== 'undefined') {
    const existingId = localStorage.getItem('safenow_device_id');
    if (existingId) {
      return existingId;
    }
  }

  // Generate new device ID
  const deviceId = `safenow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('safenow_device_id', deviceId);
  }
  
  return deviceId;
};

// Check if coordinates are valid
export const isValidCoordinates = (lat: number, lon: number): boolean => {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};

// Calculate time until alert expires
export const getTimeUntilExpiry = (validUntil: string): number => {
  const expiryTime = new Date(validUntil).getTime();
  const currentTime = new Date().getTime();
  return Math.max(0, expiryTime - currentTime);
};

// Format time until expiry
export const formatTimeUntilExpiry = (validUntil: string): string => {
  const timeLeft = getTimeUntilExpiry(validUntil);
  
  if (timeLeft === 0) {
    return 'Wygasł';
  }
  
  const minutes = Math.floor(timeLeft / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  } else {
    return `${minutes}min`;
  }
};
