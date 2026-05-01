import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ Data is considered fresh for 5 minutes. No background refetches will happen if fresh.
      staleTime: 5 * 60 * 1000, 
      
      // ✅ Keep data in memory for 30 minutes before garbage collecting
      gcTime: 30 * 60 * 1000, 

      // ✅ Disable refetching on window focus in production to prevent spamming
      refetchOnWindowFocus: false,
      
      // ✅ Retry failed requests once before giving up
      retry: 1,
    },
  },
});
