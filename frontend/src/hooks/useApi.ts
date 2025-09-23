import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { safeNowApi } from '@/lib/api';
import type {
  NearbySheltersParams,
  ActiveAlertsParams,
  SafetyInstructionsParams,
  DeviceRegisterRequest,
  SafetyStatusRequest,
  SimulateAlertRequest,
  UserAlert,
} from '@/types/api';

// Query Keys
const queryKeys = {
  health: ['health'] as const,
  nearbyShelters: (params: NearbySheltersParams) => ['nearby-shelters', params] as const,
  activeAlerts: (params: ActiveAlertsParams) => ['active-alerts', params] as const,
  safetyInstructions: (params: SafetyInstructionsParams) => ['safety-instructions', params] as const,
  emergencyEducation: ['emergency-education'] as const,
  dashboardStats: ['dashboard-stats'] as const,
  userAlerts: ['user-alerts'] as const,
  votingHistory: ['voting-history'] as const,
  recentActivity: ['recent-activity'] as const,
  notifications: ['notifications'] as const,
} as const;

// Health Check Hook
export const useHealth = () => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: safeNowApi.getHealth,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

// Nearby Shelters Hook
export const useNearbyShelters = (params: NearbySheltersParams, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.nearbyShelters(params),
    queryFn: () => safeNowApi.getNearbyShelters(params),
    enabled: enabled && !!(params.lat && params.lon),
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });
};

// Active Alerts Hook
export const useActiveAlerts = (params: ActiveAlertsParams, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.activeAlerts(params),
    queryFn: () => safeNowApi.getActiveAlerts(params),
    enabled: enabled && !!(params.lat && params.lon),
    staleTime: 10000, // 10 seconds (alerts are time-sensitive)
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Safety Instructions Hook
export const useSafetyInstructions = (params: SafetyInstructionsParams, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.safetyInstructions(params),
    queryFn: () => safeNowApi.getSafetyInstructions(params),
    enabled: enabled && !!params.hazard_type,
    staleTime: 300000, // 5 minutes (instructions don't change often)
  });
};

// Device Registration Mutation
export const useRegisterDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeviceRegisterRequest) => safeNowApi.registerDevice(data),
    onSuccess: () => {
      // Invalidate health query to refresh device counts
      queryClient.invalidateQueries({ queryKey: queryKeys.health });
    },
  });
};

// Safety Status Update Mutation
export const useUpdateSafetyStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SafetyStatusRequest) => safeNowApi.updateSafetyStatus(data),
    onSuccess: () => {
      // Invalidate health query to refresh status counts
      queryClient.invalidateQueries({ queryKey: queryKeys.health });
    },
  });
};

// Simulate Alert Mutation
export const useSimulateAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SimulateAlertRequest) => safeNowApi.simulateAlert(data),
    onSuccess: () => {
      // Invalidate all active alerts queries
      queryClient.invalidateQueries({ queryKey: ['active-alerts'] });
      // Invalidate health query to refresh alert counts
      queryClient.invalidateQueries({ queryKey: queryKeys.health });
    },
  });
};

// Emergency Education Hook
export const useEmergencyEducation = () => {
  return useQuery({
    queryKey: queryKeys.emergencyEducation,
    queryFn: safeNowApi.getEmergencyEducation,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Dashboard hooks
export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: safeNowApi.dashboard.getStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserAlerts = () => {
  return useQuery({
    queryKey: queryKeys.userAlerts,
    queryFn: safeNowApi.dashboard.getUserAlerts,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useVotingHistory = () => {
  return useQuery({
    queryKey: queryKeys.votingHistory,
    queryFn: safeNowApi.dashboard.getVotingHistory,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRecentActivity = () => {
  return useQuery({
    queryKey: queryKeys.recentActivity,
    queryFn: safeNowApi.dashboard.getRecentActivity,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useNotifications = () => {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: safeNowApi.dashboard.getNotifications,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Mutations for dashboard actions
export const useDeleteAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: safeNowApi.dashboard.deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userAlerts });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
};

export const useUpdateAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ alertId, data }: { alertId: number; data: Partial<UserAlert> }) => 
      safeNowApi.dashboard.updateAlert(alertId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userAlerts });
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: safeNowApi.dashboard.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
};

export const useCreateAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: safeNowApi.dashboard.createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userAlerts });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivity });
    },
  });
};

// Voting hooks
export const useVoteOnAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ alertId, voteType }: { alertId: number; voteType: 'UPVOTE' | 'DOWNVOTE' }) => 
      safeNowApi.voting.voteOnAlert(alertId, voteType),
    onSuccess: (data, variables) => {
      // Invalidate queries that might show vote counts
      queryClient.invalidateQueries({ queryKey: ['active-alerts'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.userAlerts });
      queryClient.invalidateQueries({ queryKey: queryKeys.votingHistory });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivity });
      // Invalidate specific alert vote summary
      queryClient.invalidateQueries({ queryKey: ['vote-summary', variables.alertId] });
    },
  });
};

export const useVoteSummary = (alertId: number, enabled = true) => {
  return useQuery({
    queryKey: ['vote-summary', alertId],
    queryFn: () => safeNowApi.voting.getVoteSummary(alertId),
    enabled: enabled && !!alertId,
    staleTime: 30000, // 30 seconds
  });
};

// Combined hook for emergency data (alerts + shelters)
export const useEmergencyData = (
  lat: number, 
  lon: number, 
  enabled = true, 
  options?: { 
    shelterRadius?: number; 
    shelterLimit?: number;
    alertSearchRadius?: number; // New parameter for alert search radius
  }
) => {
  const alertsQuery = useActiveAlerts({ 
    lat, 
    lon, 
    search_radius: options?.alertSearchRadius 
  }, enabled);
  const sheltersQuery = useNearbyShelters({ 
    lat, 
    lon, 
    limit: options?.shelterLimit,
    radius: options?.shelterRadius 
  }, enabled);

  return {
    alerts: alertsQuery.data || [],
    shelters: sheltersQuery.data || [],
    isLoading: alertsQuery.isLoading || sheltersQuery.isLoading,
    error: alertsQuery.error || sheltersQuery.error,
    refetch: () => {
      alertsQuery.refetch();
      sheltersQuery.refetch();
    },
  };
};

// Admin hooks
export const useAdminAllAlerts = () => {
  return useQuery({
    queryKey: ['admin-all-alerts'],
    queryFn: safeNowApi.admin.getAllAlerts,
    staleTime: 30000, // 30 seconds
  });
};

export const useBulkUpdateAlertStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: safeNowApi.admin.bulkUpdateAlertStatus,
    onSuccess: () => {
      // Invalidate all alert-related queries
      queryClient.invalidateQueries({ queryKey: ['admin-all-alerts'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.userAlerts });
      queryClient.invalidateQueries({ queryKey: ['active-alerts'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivity });
    },
  });
};
