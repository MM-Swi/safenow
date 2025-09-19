import axios from 'axios';
import type {
  HealthResponse,
  Shelter,
  Alert,
  DeviceRegisterRequest,
  DeviceRegisterResponse,
  SafetyStatusRequest,
  SafetyStatusResponse,
  SimulateAlertRequest,
  SimulateAlertResponse,
  SafetyInstructions,
  NearbySheltersParams,
  ActiveAlertsParams,
  SafetyInstructionsParams,
} from '@/types/api';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for logging in development
apiClient.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status}`, response.data);
    }
    return response;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// API Functions
export const safeNowApi = {
  // Health Check
  getHealth: async (): Promise<HealthResponse> => {
    const response = await apiClient.get<HealthResponse>('/health/');
    return response.data;
  },

  // Nearby Shelters
  getNearbyShelters: async (params: NearbySheltersParams): Promise<Shelter[]> => {
    const response = await apiClient.get<Shelter[]>('/nearby-shelters/', {
      params: {
        lat: params.lat,
        lon: params.lon,
        limit: params.limit || 3,
      },
    });
    return response.data;
  },

  // Active Alerts
  getActiveAlerts: async (params: ActiveAlertsParams): Promise<Alert[]> => {
    const response = await apiClient.get<Alert[]>('/active-alerts/', {
      params: {
        lat: params.lat,
        lon: params.lon,
      },
    });
    return response.data;
  },

  // Device Registration
  registerDevice: async (data: DeviceRegisterRequest): Promise<DeviceRegisterResponse> => {
    const response = await apiClient.post<DeviceRegisterResponse>('/devices/register/', data);
    return response.data;
  },

  // Safety Status Update
  updateSafetyStatus: async (data: SafetyStatusRequest): Promise<SafetyStatusResponse> => {
    const response = await apiClient.post<SafetyStatusResponse>('/status/', data);
    return response.data;
  },

  // Simulate Alert
  simulateAlert: async (data: SimulateAlertRequest): Promise<SimulateAlertResponse> => {
    const response = await apiClient.post<SimulateAlertResponse>('/simulate-alert/', data);
    return response.data;
  },

  // Safety Instructions
  getSafetyInstructions: async (params: SafetyInstructionsParams): Promise<SafetyInstructions> => {
    const response = await apiClient.get<SafetyInstructions>('/safety-instructions/', {
      params: {
        hazard_type: params.hazard_type,
        eta_seconds: params.eta_seconds || 0,
      },
    });
    return response.data;
  },
};

export default apiClient;
