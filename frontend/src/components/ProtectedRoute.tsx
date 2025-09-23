'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Ładowanie...</p>
    </div>
  </div>
);

const UnauthorizedMessage: React.FC<{ requiredRole?: UserRole }> = ({ requiredRole }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="mb-4">
        <svg
          className="mx-auto h-12 w-12 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Brak dostępu
      </h2>
      <p className="text-gray-600 mb-4">
        {requiredRole 
          ? `Ta strona wymaga uprawnień: ${requiredRole}`
          : 'Musisz być zalogowany, aby uzyskać dostęp do tej strony.'
        }
      </p>
      <button
        onClick={() => window.location.href = '/auth/login'}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Zaloguj się
      </button>
    </div>
  </div>
);

const LoginRedirect: React.FC<{ redirectTo?: string }> = ({ redirectTo }) => {
  React.useEffect(() => {
    const currentPath = window.location.pathname;
    const loginUrl = redirectTo || `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
    window.location.href = loginUrl;
  }, [redirectTo]);

  return <LoadingSpinner />;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback,
  redirectTo,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If not authenticated, redirect to login or show fallback
  if (!isAuthenticated) {
    if (redirectTo !== undefined) {
      return <LoginRedirect redirectTo={redirectTo} />;
    }
    
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return <UnauthorizedMessage />;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    // Special case: if user is ADMIN, they have access to USER routes
    if (!(requiredRole === 'USER' && user?.role === 'ADMIN')) {
      if (fallback) {
        return <>{fallback}</>;
      }
      
      return <UnauthorizedMessage requiredRole={requiredRole} />;
    }
  }

  // User is authenticated and has required role
  return <>{children}</>;
};

// Higher-order component for protecting pages
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: UserRole;
    fallback?: React.ReactNode;
    redirectTo?: string;
  }
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ProtectedRoute;
