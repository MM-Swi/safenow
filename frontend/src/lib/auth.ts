// Authentication utility functions for token management

const TOKEN_KEY = 'safenow_access_token';
const REFRESH_TOKEN_KEY = 'safenow_refresh_token';
const USER_KEY = 'safenow_user';

// Token storage functions with security considerations
export const tokenStorage = {
  // Get access token from localStorage
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  // Get refresh token from localStorage
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  // Set access token in localStorage
  setAccessToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting access token:', error);
    }
  },

  // Set refresh token in localStorage
  setRefreshToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting refresh token:', error);
    }
  },

  // Remove all tokens from localStorage
  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },

  // Check if access token exists
  hasAccessToken: (): boolean => {
    return !!tokenStorage.getAccessToken();
  },

  // Check if refresh token exists
  hasRefreshToken: (): boolean => {
    return !!tokenStorage.getRefreshToken();
  },
};

// User data storage functions
export const userStorage = {
  // Get user data from localStorage
  getUser: () => {
    if (typeof window === 'undefined') return null;
    try {
      const userData = localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Set user data in localStorage
  setUser: (user: unknown): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting user data:', error);
    }
  },

  // Remove user data from localStorage
  clearUser: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  },
};

// JWT token utility functions
export const jwtUtils = {
  // Decode JWT token (basic implementation without verification)
  decodeToken: (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  // Check if token is expired
  isTokenExpired: (token: string): boolean => {
    try {
      const decoded = jwtUtils.decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  },

  // Get token expiration time
  getTokenExpiration: (token: string): Date | null => {
    try {
      const decoded = jwtUtils.decodeToken(token);
      if (!decoded || !decoded.exp) return null;
      
      return new Date(decoded.exp * 1000);
    } catch (error) {
      console.error('Error getting token expiration:', error);
      return null;
    }
  },

  // Check if token will expire soon (within 5 minutes)
  willTokenExpireSoon: (token: string): boolean => {
    try {
      const decoded = jwtUtils.decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      const fiveMinutesFromNow = currentTime + (5 * 60); // 5 minutes in seconds
      
      return decoded.exp < fiveMinutesFromNow;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  },
};

// Authentication state helpers
export const authHelpers = {
  // Initialize authentication state from localStorage
  initializeAuthState: () => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    const user = userStorage.getUser();

    // Check if we have valid tokens and user data
    const hasValidTokens = accessToken && refreshToken && !jwtUtils.isTokenExpired(accessToken);
    const isAuthenticated = hasValidTokens && user;

    return {
      isAuthenticated: !!isAuthenticated,
      user: isAuthenticated ? user : null,
      hasTokens: !!(accessToken && refreshToken),
    };
  },

  // Clear all authentication data
  clearAuthData: () => {
    tokenStorage.clearTokens();
    userStorage.clearUser();
  },

  // Store authentication data
  storeAuthData: (tokens: { access: string; refresh: string }, user: unknown) => {
    tokenStorage.setAccessToken(tokens.access);
    tokenStorage.setRefreshToken(tokens.refresh);
    userStorage.setUser(user);
  },

  // Debug function to clear all auth data (can be called from console)
  debugClearAuth: () => {
    console.log('🧹 Clearing all authentication data...');
    authHelpers.clearAuthData();
    console.log('✅ Authentication data cleared. Refresh the page.');
  },
};

// Make debug function available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).clearSafeNowAuth = authHelpers.debugClearAuth;
  console.log('🔧 Debug: Use clearSafeNowAuth() in console to clear authentication data');
}
