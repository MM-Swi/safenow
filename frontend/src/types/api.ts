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

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'ACTIVE';
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

// Emergency Education Types
export interface EmergencyEducation {
  hazard_type: HazardType;
  title: string;
  description: string;
  priority: string;
  icon: string;
  practical_tips: string[];
  warning_signs: string[];
  preparation_steps: string[];
}

// Authentication Types
export type UserRole = 'USER' | 'ADMIN';
export type Language = 'pl' | 'en' | 'uk';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: UserRole;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  profile: UserProfile;
}

export interface UserProfile {
  preferred_language: Language;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  auto_location: boolean;
  alert_radius: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password2: string;
  phone_number?: string;
}

export interface RegisterResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface TokenRefreshRequest {
  refresh: string;
}

export interface TokenRefreshResponse {
  access: string;
  refresh?: string;
}

export interface LogoutRequest {
  refresh: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  new_password2: string;
}

export interface UserUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

export interface UserPreferencesUpdateRequest {
  preferred_language?: Language;
  email_notifications?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
  auto_location?: boolean;
  alert_radius?: number;
}

// Dashboard types
export interface UserAlert {
  id: number;
  hazard_type: HazardType;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  radius: number;
  severity: AlertSeverity;
  status: AlertStatus;
  created_at: string;
  updated_at: string;
  created_by: number;
  verification_score: number;
  is_official: boolean;
  vote_summary: {
    upvotes: number;
    downvotes: number;
    total: number;
    user_vote?: 'UPVOTE' | 'DOWNVOTE' | null;
  };
}

export interface VoteHistory {
  id: number;
  alert: {
    id: number;
    title: string;
    hazard_type: HazardType;
    status: AlertStatus;
  };
  vote_type: 'UPVOTE' | 'DOWNVOTE';
  voted_at: string;
}

export interface UserActivity {
  id: number;
  type: 'alert_created' | 'vote_cast' | 'alert_verified' | 'alert_rejected' | 'profile_updated';
  message: string;
  timestamp: string;
  related_alert_id?: number;
}

export interface DashboardStats {
  alerts_created: number;
  votes_cast: number;
  verified_alerts: number;
  total_score: number;
  profile_completion: number;
}

export interface Notification {
  id: number;
  type: 'alert_status_change' | 'vote_received' | 'system_announcement';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  related_alert_id?: number;
}

// Authentication State Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: UserUpdateRequest) => Promise<void>;
  updatePreferences: (data: UserPreferencesUpdateRequest) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  clearError: () => void;
}
