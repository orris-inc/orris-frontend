/**
 * useFiltersSheet Hook
 * Hook for managing filter sheet state
 */

import { useState, useCallback, useMemo } from 'react';
import type { FilterConfig, FilterValues } from './SelectFilters';

// ============================================================================
// Types
// ============================================================================

export interface UseFiltersSheetOptions {
  /** Filter configurations */
  filters: FilterConfig[];
  /** Initial filter values */
  initialValues?: FilterValues;
}

export interface UseFiltersSheetReturn {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Open the sheet */
  open: () => void;
  /** Close the sheet */
  close: () => void;
  /** Toggle the sheet */
  toggle: () => void;
  /** Set open state */
  setOpen: (open: boolean) => void;
  /** Current filter values */
  values: FilterValues;
  /** Update filter values */
  setValues: (values: Partial<FilterValues>) => void;
  /** Whether any filter is active */
  hasActiveFilters: boolean;
  /** Clear all filters */
  clearFilters: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export const useFiltersSheet = ({
  filters,
  initialValues = {},
}: UseFiltersSheetOptions): UseFiltersSheetReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValuesState] = useState<FilterValues>(initialValues);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const setOpen = useCallback((open: boolean) => setIsOpen(open), []);

  const setValues = useCallback((newValues: Partial<FilterValues>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return filters.some((f) => values[f.key] !== undefined);
  }, [filters, values]);

  const clearFilters = useCallback(() => {
    const cleared: FilterValues = {};
    filters.forEach((f) => {
      cleared[f.key] = undefined;
    });
    setValuesState(cleared);
  }, [filters]);

  return {
    isOpen,
    open,
    close,
    toggle,
    setOpen,
    values,
    setValues,
    hasActiveFilters,
    clearFilters,
  };
};
