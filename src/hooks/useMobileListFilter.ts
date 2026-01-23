/**
 * useMobileListFilter - Generic hook for mobile list filtering
 *
 * Consolidates common filter logic:
 * - Search query state
 * - Status filter state
 * - Filtered items computation
 * - Clear filters function
 * - hasFilter flag
 */

import { useState, useMemo, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface UseMobileListFilterOptions<T, F extends string = string> {
  /** Items to filter */
  items: T[];
  /** Default filter value (default: 'all') */
  defaultFilter?: F;
  /** Fields to search in (can be key or function) */
  searchFields: (keyof T | ((item: T) => string | undefined))[];
  /** Custom filter function for status filter */
  filterFn?: (item: T, filter: F) => boolean;
}

export interface UseMobileListFilterResult<T, F extends string = string> {
  /** Current search query */
  searchQuery: string;
  /** Set search query */
  setSearchQuery: (value: string) => void;
  /** Current status filter */
  statusFilter: F;
  /** Set status filter */
  setStatusFilter: (value: F) => void;
  /** Filtered items based on search and filter */
  filteredItems: T[];
  /** Clear all filters to default */
  clearFilters: () => void;
  /** Whether any filter is active */
  hasFilter: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useMobileListFilter<T, F extends string = string>({
  items,
  defaultFilter = 'all' as F,
  searchFields,
  filterFn,
}: UseMobileListFilterOptions<T, F>): UseMobileListFilterResult<T, F> {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<F>(defaultFilter);

  // Filter items based on search and status
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Apply status filter
      if (filterFn && statusFilter !== defaultFilter) {
        if (!filterFn(item, statusFilter)) return false;
      }

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = searchFields.some((field) => {
          if (typeof field === 'function') {
            const value = field(item);
            return value?.toLowerCase().includes(query);
          } else {
            const value = item[field];
            if (typeof value === 'string') {
              return value.toLowerCase().includes(query);
            }
            if (Array.isArray(value)) {
              return value.some(
                (v) => typeof v === 'string' && v.toLowerCase().includes(query)
              );
            }
            return false;
          }
        });
        if (!matches) return false;
      }

      return true;
    });
  }, [items, searchQuery, statusFilter, defaultFilter, searchFields, filterFn]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter(defaultFilter);
  }, [defaultFilter]);

  // Check if any filter is active
  const hasFilter = searchQuery !== '' || statusFilter !== defaultFilter;

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredItems,
    clearFilters,
    hasFilter,
  };
}
