import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { safeNowApi } from '@/lib/api';
import type {
  NearbySheltersParams,
  ActiveAlertsParams,
  SafetyInstructionsParams,
  DeviceRegisterRequest,
  SafetyStatusRequest,
  SimulateAlertRequest,
} from '@/types/api';

// Query Keys
export const queryKeys = {
  health: ['health'] as const,
  nearbyShelters: (params: NearbySheltersParams) => ['nearby-shelters', params] as const,
  activeAlerts: (params: ActiveAlertsParams) => ['active-alerts', params] as const,
  safetyInstructions: (params: SafetyInstructionsParams) => ['safety-instructions', params] as const,
  emergencyEducation: ['emergency-education'] as const,
};

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
    staleTime: 600000, // 10 minutes (education data doesn't change often)
  });
};

// Combined hook for emergency data (alerts + shelters)
export const useEmergencyData = (lat: number, lon: number, enabled = true) => {
  const alertsQuery = useActiveAlerts({ lat, lon }, enabled);
  const sheltersQuery = useNearbyShelters({ lat, lon, limit: 5 }, enabled);

  return {
    alerts: alertsQuery.data || [],
    shelters: sheltersQuery.data || [],
    isLoading: alertsQuery.isLoading || sheltersQuery.isLoading,
    isError: alertsQuery.isError || sheltersQuery.isError,
    error: alertsQuery.error || sheltersQuery.error,
    refetch: () => {
      alertsQuery.refetch();
      sheltersQuery.refetch();
    },
  };
};
