/**
 * Data prefetching utilities
 * Preload data on hover/focus to reduce perceived latency
 */

import { useCallback, useRef } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

interface PrefetchOptions {
  // Delay before prefetching (ms) - prevents prefetch on quick mouse movements
  delay?: number;
  // How long data stays fresh (ms)
  staleTime?: number;
}

/**
 * Hook to prefetch query data on user interaction
 * Usage:
 *   const { prefetchProps } = usePrefetch(
 *     ['users', 'list', { page: 2 }],
 *     () => fetchUsers({ page: 2 })
 *   );
 *   <button {...prefetchProps}>Next Page</button>
 */
export function usePrefetch<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options: PrefetchOptions = {}
) {
  const { delay = 100, staleTime = 5 * 60 * 1000 } = options;
  const queryClient = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefetch = useCallback(() => {
    // Clear any pending prefetch
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Delay prefetch to avoid unnecessary fetches on quick interactions
    timeoutRef.current = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime,
      });
    }, delay);
  }, [queryClient, queryKey, queryFn, delay, staleTime]);

  const cancelPrefetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Props to spread on interactive elements
  const prefetchProps = {
    onMouseEnter: prefetch,
    onFocus: prefetch,
    onMouseLeave: cancelPrefetch,
    onBlur: cancelPrefetch,
  };

  return {
    prefetch,
    cancelPrefetch,
    prefetchProps,
  };
}

/**
 * Hook to prefetch next/previous page data for pagination
 */
export function usePaginationPrefetch<TParams extends { page?: number }>(
  baseQueryKey: string[],
  queryFn: (params: TParams) => Promise<unknown>,
  currentParams: TParams,
  totalPages: number,
  options: PrefetchOptions = {}
) {
  const queryClient = useQueryClient();
  const { staleTime = 5 * 60 * 1000 } = options;
  const currentPage = currentParams.page ?? 1;

  const prefetchPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages || page === currentPage) return;

      const params = { ...currentParams, page };
      queryClient.prefetchQuery({
        queryKey: [...baseQueryKey, params],
        queryFn: () => queryFn(params),
        staleTime,
      });
    },
    [queryClient, baseQueryKey, queryFn, currentParams, currentPage, totalPages, staleTime]
  );

  // Prefetch adjacent pages
  const prefetchAdjacentPages = useCallback(() => {
    // Prefetch next page
    if (currentPage < totalPages) {
      prefetchPage(currentPage + 1);
    }
    // Prefetch previous page
    if (currentPage > 1) {
      prefetchPage(currentPage - 1);
    }
  }, [currentPage, totalPages, prefetchPage]);

  // Props for next page button
  const nextPagePrefetchProps = {
    onMouseEnter: () => prefetchPage(currentPage + 1),
    onFocus: () => prefetchPage(currentPage + 1),
  };

  // Props for previous page button
  const prevPagePrefetchProps = {
    onMouseEnter: () => prefetchPage(currentPage - 1),
    onFocus: () => prefetchPage(currentPage - 1),
  };

  return {
    prefetchPage,
    prefetchAdjacentPages,
    nextPagePrefetchProps,
    prevPagePrefetchProps,
  };
}
