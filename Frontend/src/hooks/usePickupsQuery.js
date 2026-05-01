import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';

export const pickupKeys = {
  all: ['pickups'],
  lists: () => [...pickupKeys.all, 'list'],
  list: (filters) => [...pickupKeys.lists(), { filters }],
  dashboardStats: (filters) => [...pickupKeys.all, 'dashboardStats', { filters }],
};

/**
 * 🔄 USE QUERY: Shared Pickups List
 */
export function usePickups(filters = { limit: 500 }) {
  return useQuery({
    queryKey: pickupKeys.list(filters),
    queryFn: () => api.fetchPickups(filters),
  });
}

/**
 * 🔄 USE QUERY: Dashboard Stats
 * This is an example of lazily loading non-critical data.
 */
export function useDashboardStats(filters = {}) {
  return useQuery({
    queryKey: pickupKeys.dashboardStats(filters),
    queryFn: () => api.fetchDashboardStats({ limit: 2000, ...filters }),
    // Dashboard stats don't change by the second, keeping them stale longer reduces DB hits
    staleTime: 2 * 60 * 1000, 
  });
}

/**
 * ⚡ USE MUTATION: Create a Pickup
 */
export function useCreatePickup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.recordPickup(data),
    onSuccess: () => {
      // ✅ Invalidate pickups and dashboard stats to reflect new data across the app
      queryClient.invalidateQueries({ queryKey: pickupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pickupKeys.dashboardStats({}) });
    },
  });
}
