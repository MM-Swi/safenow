import axios from 'axios';
import type {
	HealthResponse,
	Shelter,
	Alert,
	SafetyInstructions,
	SafetyInstructionsParams,
	EmergencyEducation,
	LoginRequest,
	LoginResponse,
	RegisterRequest,
	RegisterResponse,
	TokenRefreshRequest,
	TokenRefreshResponse,
	LogoutRequest,
	User,
	UserProfile,
	UserPreferencesUpdateRequest,
	ChangePasswordRequest,
	UserAlert,
	DashboardStats,
	VoteHistory,
	UserActivity,
	Notification,
	NearbySheltersParams,
	ActiveAlertsParams,
	DeviceRegisterRequest,
	DeviceRegisterResponse,
	SafetyStatusRequest,
	SafetyStatusResponse,
	SimulateAlertRequest,
	SimulateAlertResponse,
	UserUpdateRequest,
} from '@/types/api';
import { tokenStorage, authHelpers } from './auth';

// API Configuration
const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

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
	'/simulate-alert/',
];

// Request interceptor for authentication and logging
apiClient.interceptors.request.use(
	(config) => {
		// Only add authentication token to protected endpoints
		const isPublicEndpoint = PUBLIC_ENDPOINTS.some((endpoint) =>
			config.url?.includes(endpoint)
		);
		const token = tokenStorage.getAccessToken();

		// Always attach token if available and not a public endpoint
		if (token && !isPublicEndpoint) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		console.log(
			`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${
				config.url
			}`,
			{
				params: config.params,
				data: config.data,
				hasAuth: !!config.headers.Authorization,
				isPublic: isPublicEndpoint,
				token: token ? token.substring(0, 20) + '...' : 'none',
			}
		);
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
		console.log(
			`✅ API Response: ${
				response.status
			} ${response.config.method?.toUpperCase()} ${response.config.url}`,
			{
				dataLength: Array.isArray(response.data)
					? response.data.length
					: typeof response.data,
			}
		);
		return response;
	},
	async (error) => {
		const originalRequest = error.config;

		console.error('❌ API Error:', {
			status: error.response?.status,
			statusText: error.response?.statusText,
			data: error.response?.data,
			message: error.message,
			url: error.config?.url,
		});

		// Handle 401 errors with token refresh
		if (error.response?.status === 401 && !originalRequest._retry) {
			if (isRefreshing) {
				// If already refreshing, queue this request
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then((token) => {
						originalRequest.headers.Authorization = `Bearer ${token}`;
						return apiClient(originalRequest);
					})
					.catch((err) => {
						return Promise.reject(err);
					});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			const refreshToken = tokenStorage.getRefreshToken();

			if (refreshToken) {
				try {
					const response = await apiClient.post<TokenRefreshResponse>(
						'/auth/token/refresh/',
						{
							refresh: refreshToken,
						}
					);

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
	// Health check
	getHealth: (): Promise<HealthResponse> =>
		apiClient.get('/health/').then((response) => response.data),

	// Nearby Shelters
	getNearbyShelters: async (
		params: NearbySheltersParams
	): Promise<Shelter[]> => {
		const response = await apiClient.get<Shelter[]>('/nearby-shelters/', {
			params: {
				lat: params.lat,
				lon: params.lon,
				limit: params.limit || 3,
				radius: params.radius, // Optional radius parameter
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
				...(params.search_radius !== undefined && { search_radius: params.search_radius }),
			},
		});
		return response.data;
	},

	// Device Registration
	registerDevice: async (
		data: DeviceRegisterRequest
	): Promise<DeviceRegisterResponse> => {
		const response = await apiClient.post<DeviceRegisterResponse>(
			'/devices/register/',
			data
		);
		return response.data;
	},

	// Safety Status Update
	updateSafetyStatus: async (
		data: SafetyStatusRequest
	): Promise<SafetyStatusResponse> => {
		const response = await apiClient.post<SafetyStatusResponse>(
			'/status/',
			data
		);
		return response.data;
	},

	// Simulate Alert
	simulateAlert: async (
		data: SimulateAlertRequest
	): Promise<SimulateAlertResponse> => {
		const response = await apiClient.post<SimulateAlertResponse>(
			'/simulate-alert/',
			data
		);
		return response.data;
	},

	// Safety Instructions
	getSafetyInstructions: async (
		params: SafetyInstructionsParams
	): Promise<SafetyInstructions> => {
		const response = await apiClient.get<SafetyInstructions>(
			'/safety-instructions/',
			{
				params: {
					hazard_type: params.hazard_type,
					eta_seconds: params.eta_seconds || 0,
				},
			}
		);
		return response.data;
	},

	// Emergency Education
	getEmergencyEducation: async (): Promise<EmergencyEducation[]> => {
		const response = await apiClient.get<EmergencyEducation[]>(
			'/emergency-education/'
		);
		return response.data;
	},

	// Authentication endpoints
	auth: {
		// User login
		login: async (credentials: LoginRequest): Promise<LoginResponse> => {
			const response = await apiClient.post<{
				tokens: { access: string; refresh: string };
				user: User;
			}>('/auth/login/', credentials);
			
			// Transform backend response to match frontend expectations
			return {
				access: response.data.tokens.access,
				refresh: response.data.tokens.refresh,
				user: response.data.user,
			};
		},

		// User registration
		register: async (data: RegisterRequest): Promise<RegisterResponse> => {
			const response = await apiClient.post<{
				tokens: { access: string; refresh: string };
				user: User;
			}>('/auth/register/', data);
			
			// Transform backend response to match frontend expectations
			return {
				access: response.data.tokens.access,
				refresh: response.data.tokens.refresh,
				user: response.data.user,
			};
		},

		// Token refresh
		refreshToken: async (
			data: TokenRefreshRequest
		): Promise<TokenRefreshResponse> => {
			const response = await apiClient.post<TokenRefreshResponse>(
				'/auth/token/refresh/',
				data
			);
			return response.data;
		},

		// User logout
		logout: async (data: LogoutRequest): Promise<{ message: string }> => {
			const response = await apiClient.post<{ message: string }>(
				'/auth/logout/',
				data
			);
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
		updatePreferences: async (
			data: UserPreferencesUpdateRequest
		): Promise<UserProfile> => {
			const response = await apiClient.put<UserProfile>(
				'/auth/preferences/',
				data
			);
			return response.data;
		},

		// Change password
		changePassword: async (
			data: ChangePasswordRequest
		): Promise<{ message: string }> => {
			const response = await apiClient.post<{ message: string }>(
				'/auth/change-password/',
				data
			);
			return response.data;
		},
	},

	// Dashboard endpoints
	dashboard: {
		// Get user's alerts
		getUserAlerts: async (): Promise<UserAlert[]> => {
			const response = await apiClient.get<UserAlert[]>('/alerts/user/');
			return response.data;
		},

		// Get dashboard statistics
		getStats: async (): Promise<DashboardStats> => {
			const response = await apiClient.get<DashboardStats>('/dashboard/stats/');
			return response.data;
		},

		// Get voting history
		getVotingHistory: async (): Promise<VoteHistory[]> => {
			const response = await apiClient.get<VoteHistory[]>('/dashboard/votes/');
			return response.data;
		},

		// Get recent activity
		getRecentActivity: async (): Promise<UserActivity[]> => {
			const response = await apiClient.get<UserActivity[]>(
				'/dashboard/activity/'
			);
			return response.data;
		},

		// Get notifications
		getNotifications: async (): Promise<Notification[]> => {
			const response = await apiClient.get<Notification[]>(
				'/dashboard/notifications/'
			);
			return response.data;
		},

		// Mark notification as read
		markNotificationRead: async (
			notificationId: number
		): Promise<{ message: string }> => {
			const response = await apiClient.patch<{ message: string }>(
				`/dashboard/notifications/${notificationId}/read/`
			);
			return response.data;
		},

		// Delete user alert
		deleteAlert: async (alertId: number): Promise<{ message: string }> => {
			const response = await apiClient.delete<{ message: string }>(
				`/alerts/${alertId}/`
			);
			return response.data;
		},

		// Update user alert
		updateAlert: async (alertId: number, data: Partial<UserAlert>): Promise<UserAlert> => {
			const response = await apiClient.patch<UserAlert>(
				`/alerts/${alertId}/`,
				data
			);
			return response.data;
		},

		// Create new alert
		createAlert: async (data: {
			hazard_type: string;
			severity: string;
			center_lat: number;
			center_lon: number;
			radius_m: number;
			source: string;
			valid_minutes: number;
		}): Promise<UserAlert> => {
			// Round coordinates to 6 decimal places to match backend requirements
			const alertData = {
				...data,
				center_lat: Math.round(data.center_lat * 1000000) / 1000000,
				center_lon: Math.round(data.center_lon * 1000000) / 1000000,
			};
			const response = await apiClient.post<UserAlert>('/alerts/', alertData);
			return response.data;
		},
	},

	// Voting endpoints
	voting: {
		// Vote on an alert
		voteOnAlert: async (alertId: number, voteType: 'UPVOTE' | 'DOWNVOTE'): Promise<{ message: string }> => {
			const response = await apiClient.post<{ message: string }>(
				`/alerts/${alertId}/vote/`,
				{ vote_type: voteType }
			);
			return response.data;
		},

		// Get vote summary for an alert
		getVoteSummary: async (alertId: number): Promise<{
			upvotes: number;
			downvotes: number;
			total_votes: number;
			verification_score: number;
			user_vote: 'UPVOTE' | 'DOWNVOTE' | null;
		}> => {
			const response = await apiClient.get(`/alerts/${alertId}/votes/`);
			return response.data;
		},
		updateAlert: async (
			alertId: number,
			data: Partial<UserAlert>
		): Promise<UserAlert> => {
			const response = await apiClient.patch<UserAlert>(
				`/alerts/${alertId}/`,
				data
			);
			return response.data;
		},

		// Create new alert (dashboard version)
		createAlert: async (data: Partial<UserAlert>): Promise<UserAlert> => {
			// Round coordinates to 6 decimal places to match backend requirements
			const alertData = {
				...data,
				center_lat: data.center_lat ? Math.round(data.center_lat * 1000000) / 1000000 : data.center_lat,
				center_lon: data.center_lon ? Math.round(data.center_lon * 1000000) / 1000000 : data.center_lon,
			};
			const response = await apiClient.post<UserAlert>('/alerts/', alertData);
			return response.data;
		},
	},

	// Admin endpoints
	admin: {
		// Get all alerts for admin management
		getAllAlerts: async (): Promise<UserAlert[]> => {
			const response = await apiClient.get<UserAlert[]>('/admin/alerts/');
			return response.data;
		},

		// Bulk update alert statuses
		bulkUpdateAlertStatus: async (data: {
			alert_ids: number[];
			status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'ACTIVE';
		}): Promise<{
			message: string;
			updated_count: number;
			updated_alerts: number[];
		}> => {
			const response = await apiClient.post('/admin/alerts/', data);
			return response.data;
		},
	},
};

export default apiClient;
