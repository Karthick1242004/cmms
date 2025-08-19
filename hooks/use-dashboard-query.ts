import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDashboardStats, fetchRecentActivities } from '@/lib/dashboard-api';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activities: () => [...dashboardKeys.all, 'activities'] as const,
};

// Get dashboard stats
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

// Get dashboard activities
export function useDashboardActivities() {
  return useQuery({
    queryKey: dashboardKeys.activities(),
    queryFn: fetchRecentActivities,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// Helper function to invalidate dashboard queries
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.activities() });
  };
}
