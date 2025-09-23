import { useAuth as useAuthContext, useRequireAuth as useRequireAuthContext } from '@/contexts/AuthContext';

// Re-export hooks for convenience
export const useAuth = useAuthContext;
export const useRequireAuth = useRequireAuthContext;

// Additional auth-related hooks
export { useAuth as default };
