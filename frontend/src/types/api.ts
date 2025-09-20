// API Types for SafeNow Backend Integration

export type HazardType = 
  | 'AIR_RAID' 
  | 'DRONE' 
  | 'MISSILE' 
  | 'FLOOD' 
  | 'FIRE' 
  | 'INDUSTRIAL'
  | 'SHOOTING'
  | 'STORM'
  | 'TSUNAMI'
  | 'CHEMICAL WEAPON'
  | 'BIOHAZARD'
  | 'NUCLEAR'
  | 'UNMARKED SOLDIERS'
  | 'PANDEMIC'
  | 'TERRORIST ATTACK'
  | 'MASS POISONING'
  | 'CYBER ATTACK'
  | 'EARTHQUAKE';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SafetyStatusType = 'OK' | 'NEEDS_HELP' | 'IN_SHELTER' | 'UNREACHABLE';

// Health Check Response
export interface HealthResponse {
  status: string;
  version: string;
  counts: {
    shelters: number;
    active_alerts: number;
  };
}

// Shelter Types
export interface Shelter {
  id: number;
  name: string;
  address: string;
  distance_km: number;
  eta_seconds: number;
  is_open_now: boolean;
}

// Alert Types
export interface Alert {
  id: number;
  hazard_type: HazardType;
  severity: Severity;
  center_lat: number;
  center_lon: number;
  radius_m: number;
  distance_km: number;
  valid_until: string;
  source: string;
  created_at: string;
}

// Device Types
export interface DeviceRegisterRequest {
  device_id: string;
  push_token?: string;
}

export interface DeviceRegisterResponse {
  device_id: string;
  message: string;
  last_seen_at: string;
}

// Safety Status Types
export interface SafetyStatusRequest {
  device_id: string;
  status: SafetyStatusType;
  shelter_id?: number;
}

export interface SafetyStatusResponse {
  device_id: string;
  status: SafetyStatusType;
  shelter_id?: number;
  updated_at: string;
  message: string;
}

// Simulate Alert Types
export interface SimulateAlertRequest {
  hazard_type: HazardType;
  severity: Severity;
  center_lat: number;
  center_lon: number;
  radius_m: number;
  valid_minutes: number;
  source?: string;
}

export interface SimulateAlertResponse {
  id: number;
  hazard_type: HazardType;
  severity: Severity;
  center_lat: number;
  center_lon: number;
  radius_m: number;
  valid_until: string;
  source: string;
  created_at: string;
  message: string;
}

// Safety Instructions Types
export interface SafetyInstructions {
  title: string;
  steps: string[];
  do_not: string[];
  eta_hint: string;
}

// API Error Response
export interface ApiError {
  error: {
    code: number;
    message: string;
  };
}

// Query Parameters
export interface NearbySheltersParams {
  lat: number;
  lon: number;
  limit?: number;
}

export interface ActiveAlertsParams {
  lat: number;
  lon: number;
}

export interface SafetyInstructionsParams {
  hazard_type: HazardType;
  eta_seconds?: number;
}
