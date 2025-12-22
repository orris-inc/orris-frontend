/**
 * useNodeTrafficStats Hook
 * Fetches paginated node traffic statistics with TanStack Query
 */

import { useQuery } from '@tanstack/react-query';
import { getNodeTrafficStats } from '@/api/admin';
import type { NodeTrafficStatsItem, TrafficStatsQueryParams } from '@/api/admin';

/**
 * Parameters for useNodeTrafficStats hook
 */
interface UseNodeTrafficStatsParams {
  /** Date range for traffic statistics */
  dateRange: {
    /** Start date in YYYY-MM-DD format (e.g., "2025-01-01") */
    from: string;
    /** End date in YYYY-MM-DD format (e.g., "2025-01-31") */
    to: string;
  };
  /** Page number (default: 1) */
  page?: number;
  /** Page size (default: 20) */
  pageSize?: number;
  /** Enable/disable query (default: true) */
  enabled?: boolean;
}

/**
 * Return type for useNodeTrafficStats hook
 */
interface UseNodeTrafficStatsReturn {
  /** Array of node traffic statistics items */
  items: NodeTrafficStatsItem[];
  /** Pagination information */
  pagination: {
    /** Current page number */
    page: number;
    /** Items per page */
    pageSize: number;
    /** Total number of items */
    total: number;
  };
  /** Loading state */
  isLoading: boolean;
  /** Function to refetch data */
  refetch: () => void;
}

/**
 * Hook to fetch node traffic statistics with pagination
 *
 * @param params - Query parameters including date range and pagination
 * @returns Node traffic statistics with pagination info and loading state
 *
 * @example
 * ```typescript
 * const { items, pagination, isLoading, refetch } = useNodeTrafficStats({
 *   dateRange: {
 *     from: '2025-01-01',
 *     to: '2025-01-31',
 *   },
 *   page: 1,
 *   pageSize: 20,
 * });
 * ```
 */
export const useNodeTrafficStats = (
  params: UseNodeTrafficStatsParams
): UseNodeTrafficStatsReturn => {
  const { dateRange, page = 1, pageSize = 20, enabled = true } = params;

  // Build query parameters
  const queryParams: TrafficStatsQueryParams = {
    from: dateRange.from,
    to: dateRange.to,
    page,
    pageSize,
  };

  // Query node traffic stats
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'traffic-stats', 'nodes', queryParams],
    queryFn: () => getNodeTrafficStats(queryParams),
    enabled,
  });

  return {
    items: data?.items ?? [],
    pagination: {
      page: data?.page ?? page,
      pageSize: data?.pageSize ?? pageSize,
      total: data?.total ?? 0,
    },
    isLoading,
    refetch,
  };
};
