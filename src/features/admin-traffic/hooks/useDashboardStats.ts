/**
 * useDashboardStats Hook
 * Fetches admin dashboard snapshot via GET /admin/dashboard
 */

import { useQuery } from '@tanstack/react-query';
import { getAdminDashboard } from '@/api/admin';
import type { AdminDashboardResponse } from '@/api/admin';

interface UseDashboardStatsReturn {
  dashboard: AdminDashboardResponse | null;
  loading: boolean;
  refetch: () => void;
}

// Cache time: 5 minutes for dashboard stats
const STALE_TIME = 5 * 60 * 1000;

/**
 * Fetch admin dashboard snapshot with a single API call
 *
 * Replaces 4 parallel queries with one GET /admin/dashboard call,
 * returning users, subscriptions, nodes, forward, and trafficToday.
 *
 * @returns Dashboard snapshot with loading state
 *
 * @example
 * ```typescript
 * const { dashboard, loading } = useDashboardStats();
 * console.log(dashboard?.users.total);
 * console.log(dashboard?.subscriptions.active);
 * ```
 */
export const useDashboardStats = (): UseDashboardStatsReturn => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: getAdminDashboard,
    staleTime: STALE_TIME,
  });

  return {
    dashboard: data ?? null,
    loading: isLoading,
    refetch,
  };
};
