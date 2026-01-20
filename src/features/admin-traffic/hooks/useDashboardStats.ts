/**
 * useDashboardStats Hook
 * Fetches dashboard statistics (users, subscriptions, nodes) with TanStack Query
 */

import { useQueries } from '@tanstack/react-query';
import { listUsers } from '@/api/user';
import { adminListSubscriptions } from '@/api/subscription';
import { listNodes } from '@/api/node';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalNodes: number;
  activeNodes: number;
}

interface UseDashboardStatsReturn {
  stats: DashboardStats;
  loading: boolean;
  refetch: () => void;
}

// Cache time: 5 minutes for dashboard stats
const STALE_TIME = 5 * 60 * 1000;

/**
 * Fetch dashboard statistics with parallel queries and caching
 *
 * Uses TanStack Query for:
 * - Automatic caching (5 min stale time)
 * - Parallel requests
 * - Background refetching
 *
 * @returns Dashboard statistics with loading state
 *
 * @example
 * ```typescript
 * const { stats, loading } = useDashboardStats();
 * console.log(stats.totalUsers); // 100
 * ```
 */
export const useDashboardStats = (): UseDashboardStatsReturn => {
  const results = useQueries({
    queries: [
      {
        queryKey: ['admin', 'dashboard', 'users'],
        queryFn: () => listUsers({ page: 1, pageSize: 1 }),
        staleTime: STALE_TIME,
      },
      {
        queryKey: ['admin', 'dashboard', 'subscriptions'],
        queryFn: () => adminListSubscriptions({ page: 1, pageSize: 1 }),
        staleTime: STALE_TIME,
      },
      {
        queryKey: ['admin', 'dashboard', 'nodes', 'total'],
        queryFn: () => listNodes({ page: 1, pageSize: 1, includeUserNodes: true }),
        staleTime: STALE_TIME,
      },
      {
        queryKey: ['admin', 'dashboard', 'nodes', 'active'],
        queryFn: () => listNodes({ page: 1, pageSize: 1, includeUserNodes: true, status: 'active' }),
        staleTime: STALE_TIME,
      },
    ],
  });

  const [usersQuery, subscriptionsQuery, totalNodesQuery, activeNodesQuery] = results;

  const refetch = () => {
    results.forEach((query) => query.refetch());
  };

  return {
    stats: {
      totalUsers: usersQuery.data?.total ?? 0,
      activeSubscriptions: subscriptionsQuery.data?.total ?? 0,
      totalNodes: totalNodesQuery.data?.total ?? 0,
      activeNodes: activeNodesQuery.data?.total ?? 0,
    },
    loading: results.some((query) => query.isLoading),
    refetch,
  };
};
