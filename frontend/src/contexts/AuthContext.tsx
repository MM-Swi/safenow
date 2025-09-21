'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { safeNowApi } from '@/lib/api';
import { authHelpers, tokenStorage, userStorage, jwtUtils } from '@/lib/auth';
import type {
  AuthContextType,
  AuthState,
  LoginRequest,
  RegisterRequest,
  UserUpdateRequest,
  UserPreferencesUpdateRequest,
  ChangePasswordRequest,
  User,
} from '@/types/api';

// Auth action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User } }
  | { type: 'AUTH_ERROR'; payload: { error: string } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: { user: User } };

// Initial auth state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to check existing auth
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload.user,
      };
    default:
      return state;
  }
};

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Clear any invalid tokens first
        const accessToken = tokenStorage.getAccessToken();
        if (accessToken && jwtUtils.isTokenExpired(accessToken)) {
          console.log('🔐 Clearing expired access token');
          authHelpers.clearAuthData();
        }

        const { isAuthenticated, user, hasTokens } = authHelpers.initializeAuthState();

        console.log('🔐 Auth Initialization:', {
          isAuthenticated,
          hasUser: !!user,
          hasTokens,
          accessToken: tokenStorage.getAccessToken()?.substring(0, 20) + '...',
          refreshToken: tokenStorage.getRefreshToken()?.substring(0, 20) + '...'
        });

        if (isAuthenticated && user) {
          // We have valid tokens and user data, verify with server
          try {
            const currentUser = await safeNowApi.auth.getProfile();
            dispatch({ type: 'AUTH_SUCCESS', payload: { user: currentUser } });
          } catch (error) {
            // Token might be invalid, clear auth data
            authHelpers.clearAuthData();
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } else if (hasTokens) {
          // We have tokens but no user data or expired tokens, try to refresh
          try {
            const refreshToken = tokenStorage.getRefreshToken();
            if (refreshToken) {
              const response = await safeNowApi.auth.refreshToken({ refresh: refreshToken });
              tokenStorage.setAccessToken(response.access);
              if (response.refresh) {
                tokenStorage.setRefreshToken(response.refresh);
              }
              
              // Get user profile after token refresh
              const currentUser = await safeNowApi.auth.getProfile();
              userStorage.setUser(currentUser);
              dispatch({ type: 'AUTH_SUCCESS', payload: { user: currentUser } });
            } else {
              dispatch({ type: 'AUTH_LOGOUT' });
            }
          } catch (error) {
            authHelpers.clearAuthData();
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } else {
          // No authentication data
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  // Listen for logout events from axios interceptor
  useEffect(() => {
    const handleLogout = () => {
      dispatch({ type: 'AUTH_LOGOUT' });
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await safeNowApi.auth.login(credentials);
      const { access, refresh, user } = response;
      
      // Store tokens and user data
      authHelpers.storeAuthData({ access, refresh }, user);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage } });
      throw error;
    }
  }, []);

  // Register function
  const register = useCallback(async (data: RegisterRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await safeNowApi.auth.register(data);
      const { access, refresh, user } = response;
      
      // Store tokens and user data
      authHelpers.storeAuthData({ access, refresh }, user);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage } });
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      
      if (refreshToken) {
        try {
          await safeNowApi.auth.logout({ refresh: refreshToken });
        } catch (error) {
          // Ignore logout API errors, still clear local data
          console.warn('Logout API call failed:', error);
        }
      }
      
      authHelpers.clearAuthData();
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if API call fails
      authHelpers.clearAuthData();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const refreshTokenValue = tokenStorage.getRefreshToken();
      
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }
      
      const response = await safeNowApi.auth.refreshToken({ refresh: refreshTokenValue });
      
      tokenStorage.setAccessToken(response.access);
      if (response.refresh) {
        tokenStorage.setRefreshToken(response.refresh);
      }
    } catch (error) {
      authHelpers.clearAuthData();
      dispatch({ type: 'AUTH_LOGOUT' });
      throw error;
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (data: UserUpdateRequest) => {
    try {
      const updatedUser = await safeNowApi.auth.updateProfile(data);
      userStorage.setUser(updatedUser);
      dispatch({ type: 'UPDATE_USER', payload: { user: updatedUser } });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Profile update failed';
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage } });
      throw error;
    }
  }, []);

  // Update preferences function
  const updatePreferences = useCallback(async (data: UserPreferencesUpdateRequest) => {
    try {
      const updatedPreferences = await safeNowApi.auth.updatePreferences(data);
      
      // Update user object with new preferences
      if (state.user) {
        const updatedUser = { ...state.user, profile: updatedPreferences };
        userStorage.setUser(updatedUser);
        dispatch({ type: 'UPDATE_USER', payload: { user: updatedUser } });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Preferences update failed';
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage } });
      throw error;
    }
  }, [state.user]);

  // Change password function
  const changePassword = useCallback(async (data: ChangePasswordRequest) => {
    try {
      await safeNowApi.auth.changePassword(data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Password change failed';
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage } });
      throw error;
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    updatePreferences,
    changePassword,
    clearError,
  };

  // Debug auth state changes
  console.log('🔐 Auth State:', {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    hasUser: !!state.user,
    error: state.error
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Custom hook for protected routes
export const useRequireAuth = (): AuthContextType => {
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  }, [auth.isAuthenticated, auth.isLoading]);
  
  return auth;
};

export default AuthContext;
