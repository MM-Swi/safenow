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
  EmergencyEducation,
  NearbySheltersParams,
  ActiveAlertsParams,
  SafetyInstructionsParams,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  LogoutRequest,
  ChangePasswordRequest,
  UserUpdateRequest,
  UserPreferencesUpdateRequest,
  User,
  UserProfile,
} from '@/types/api';
import { tokenStorage, authHelpers } from './auth';

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

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/health/',
  '/active-alerts/',
  '/nearby-shelters/',
  '/safety-instructions/',
  '/emergency-education/',
  '/devices/register/',
  '/status/',
  '/simulate-alert/'
];

// Request interceptor for authentication and logging
apiClient.interceptors.request.use(
  (config) => {
    // Only add authentication token to protected endpoints
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => config.url?.includes(endpoint));
    const token = tokenStorage.getAccessToken();
    
    if (token && !config.headers.Authorization && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
      params: config.params,
      data: config.data,
      hasAuth: !!config.headers.Authorization,
      isPublic: isPublicEndpoint
    });
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh and error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      dataLength: Array.isArray(response.data) ? response.data.length : typeof response.data
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error('❌ API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    });

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();
      
      if (refreshToken) {
        try {
          const response = await apiClient.post<TokenRefreshResponse>('/auth/token/refresh/', {
            refresh: refreshToken,
          });

          const { access, refresh: newRefresh } = response.data;
          
          // Store new tokens
          tokenStorage.setAccessToken(access);
          if (newRefresh) {
            tokenStorage.setRefreshToken(newRefresh);
          }

          // Update authorization header
          apiClient.defaults.headers.common.Authorization = `Bearer ${access}`;
          originalRequest.headers.Authorization = `Bearer ${access}`;

          processQueue(null, access);

          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          
          // Clear tokens and redirect to login
          authHelpers.clearAuthData();
          
          // Emit custom event for auth context to handle
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token available, clear auth data
        authHelpers.clearAuthData();
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      }
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

  // Emergency Education
  getEmergencyEducation: async (): Promise<EmergencyEducation[]> => {
    const response = await apiClient.get<EmergencyEducation[]>('/emergency-education/');
    return response.data;
  },

  // Authentication endpoints
  auth: {
    // User login
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
      const response = await apiClient.post<LoginResponse>('/auth/login/', credentials);
      return response.data;
    },

    // User registration
    register: async (data: RegisterRequest): Promise<RegisterResponse> => {
      const response = await apiClient.post<RegisterResponse>('/auth/register/', data);
      return response.data;
    },

    // Token refresh
    refreshToken: async (data: TokenRefreshRequest): Promise<TokenRefreshResponse> => {
      const response = await apiClient.post<TokenRefreshResponse>('/auth/token/refresh/', data);
      return response.data;
    },

    // User logout
    logout: async (data: LogoutRequest): Promise<{ message: string }> => {
      const response = await apiClient.post<{ message: string }>('/auth/logout/', data);
      return response.data;
    },

    // Get current user profile
    getProfile: async (): Promise<User> => {
      const response = await apiClient.get<User>('/auth/me/');
      return response.data;
    },

    // Update user profile
    updateProfile: async (data: UserUpdateRequest): Promise<User> => {
      const response = await apiClient.put<User>('/auth/me/', data);
      return response.data;
    },

    // Get user preferences
    getPreferences: async (): Promise<UserProfile> => {
      const response = await apiClient.get<UserProfile>('/auth/preferences/');
      return response.data;
    },

    // Update user preferences
    updatePreferences: async (data: UserPreferencesUpdateRequest): Promise<UserProfile> => {
      const response = await apiClient.put<UserProfile>('/auth/preferences/', data);
      return response.data;
    },

    // Change password
    changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
      const response = await apiClient.post<{ message: string }>('/auth/change-password/', data);
      return response.data;
    },
  },
};

export default apiClient;
