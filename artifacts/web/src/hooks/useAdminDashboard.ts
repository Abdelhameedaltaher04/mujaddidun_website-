import { useQuery } from '@tanstack/react-query';
import { adminDashboardApi } from '@/services/adminDashboard';

/**
 * React Query hooks for the admin dashboard overview. The query keys are
 * stable so the future Laravel-backed service swap is invisible to pages.
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: adminDashboardApi.getStats,
  });
}

export function useDashboardCharts() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'charts'],
    queryFn: adminDashboardApi.getChartData,
  });
}

export function useDashboardActivities() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'activities'],
    queryFn: adminDashboardApi.getRecentActivities,
  });
}
