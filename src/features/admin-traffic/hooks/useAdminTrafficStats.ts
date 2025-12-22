/**
 * useAdminTrafficStats Hook
 * Fetches comprehensive traffic statistics data in parallel using TanStack Query
 */

import { useQueries } from '@tanstack/react-query';
import {
  getTrafficOverview,
  getTrafficTrend,
  getUserTrafficRanking,
  getSubscriptionTrafficRanking,
} from '@/api/admin';
import type {
  TrafficOverview,
  TrafficTrend,
  TrafficRankingItem,
} from '@/api/admin';
import { detectGranularity } from '../utils/date-range';
import type { DateRange } from '../utils/date-range';

interface UseAdminTrafficStatsParams {
  /** Date range for traffic statistics */
  dateRange: DateRange;
  /** Enable or disable queries (default: true) */
  enabled?: boolean;
}

interface UseAdminTrafficStatsResult {
  /** Global traffic overview */
  overview: TrafficOverview | null;
  /** Traffic trend over time */
  trend: TrafficTrend | null;
  /** Top users by traffic usage */
  userRanking: TrafficRankingItem[];
  /** Top subscriptions by traffic usage */
  subscriptionRanking: TrafficRankingItem[];
  /** True if any query is loading */
  isLoading: boolean;
  /** Refetch all queries */
  refetch: () => void;
}

/**
 * Fetch admin traffic statistics with parallel queries
 *
 * This hook performs 4 parallel API calls to fetch comprehensive traffic data:
 * 1. Traffic overview (total traffic, active users, etc.)
 * 2. Traffic trend (time series data)
 * 3. User traffic ranking (top 10)
 * 4. Subscription traffic ranking (top 10)
 *
 * @param params - Date range and enable flag
 * @returns Traffic statistics data and loading state
 *
 * @example
 * ```typescript
 * const { overview, trend, userRanking, subscriptionRanking, isLoading } = useAdminTrafficStats({
 *   dateRange: { from: '2025-01-01', to: '2025-01-31' },
 *   enabled: true,
 * });
 * ```
 */
export const useAdminTrafficStats = ({
  dateRange,
  enabled = true,
}: UseAdminTrafficStatsParams): UseAdminTrafficStatsResult => {
  // Auto-detect granularity based on date range
  const granularity = detectGranularity(dateRange);

  // Parallel queries using useQueries
  const results = useQueries({
    queries: [
      // Query 1: Traffic Overview
      {
        queryKey: ['admin', 'traffic-stats', 'overview', dateRange],
        queryFn: () => getTrafficOverview({
          from: dateRange.from,
          to: dateRange.to,
        }),
        enabled,
      },
      // Query 2: Traffic Trend
      {
        queryKey: ['admin', 'traffic-stats', 'trend', dateRange, granularity],
        queryFn: () => getTrafficTrend({
          from: dateRange.from,
          to: dateRange.to,
          granularity,
        }),
        enabled,
      },
      // Query 3: User Traffic Ranking
      {
        queryKey: ['admin', 'traffic-stats', 'ranking', 'users', dateRange],
        queryFn: () => getUserTrafficRanking({
          from: dateRange.from,
          to: dateRange.to,
          limit: 10,
        }),
        enabled,
      },
      // Query 4: Subscription Traffic Ranking
      {
        queryKey: ['admin', 'traffic-stats', 'ranking', 'subscriptions', dateRange],
        queryFn: () => getSubscriptionTrafficRanking({
          from: dateRange.from,
          to: dateRange.to,
          limit: 10,
        }),
        enabled,
      },
    ],
  });

  // Extract results from queries
  const [overviewQuery, trendQuery, userRankingQuery, subscriptionRankingQuery] = results;

  // Refetch all queries
  const refetch = () => {
    results.forEach((query) => query.refetch());
  };

  // Return structured data
  return {
    overview: overviewQuery.data ?? null,
    trend: trendQuery.data ?? null,
    userRanking: userRankingQuery.data?.items ?? [],
    subscriptionRanking: subscriptionRankingQuery.data?.items ?? [],
    isLoading: results.some((query) => query.isLoading),
    refetch,
  };
};
