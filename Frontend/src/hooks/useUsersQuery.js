import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';

/**
 * 🔑 QUERY KEYS
 * Using consistent query keys is critical for cache invalidation.
 */
export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (filters) => [...userKeys.lists(), { filters }],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id],
};

/**
 * 🔄 USE QUERY: Fetch and cache users list
 * This hook will prevent duplicate API calls across different pages.
 * Data is cached globally and shared.
 */
export function useUsers(filters = { limit: 200 }) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => api.fetchUsers(filters),
    // Example: users rarely change instantly, so we can increase staleTime if needed
    // staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * ⚡ USE MUTATION: Create a user
 * Demonstrates how to mutate data and invalidate the cache.
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData) => api.createUser(userData),
    onSuccess: () => {
      // ✅ Invalidate the users list so the next time it's accessed, it refetches.
      // Active queries will refetch immediately.
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * ⚡ USE MUTATION: Update a user
 * Demonstrates optimistic updates or targeted invalidation.
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }) => api.updateUser(id, patch),
    onSuccess: (data, variables) => {
      // ✅ Invalidate the entire list to ensure consistency
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      // ✅ Invalidate the specific user detail if it's cached
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
    },
  });
}

/**
 * ⚡ USE MUTATION: Delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
