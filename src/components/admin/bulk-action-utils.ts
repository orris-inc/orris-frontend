/**
 * Bulk Action Utilities
 * Preset actions and hook for bulk selection
 */

import { useState, useCallback, useMemo } from 'react';
import { Download, Trash2 } from 'lucide-react';
import type { BulkAction } from './BulkActionBar';

// ============================================================================
// Preset Actions (helpers for common use cases)
// ============================================================================

export const createExportAction = (onClick: () => void, label?: string): BulkAction => ({
  key: 'export',
  label: label || 'Export',
  icon: Download,
  onClick,
  variant: 'outline',
});

export const createDeleteAction = (
  onClick: () => void,
  label?: string,
  disabled?: boolean
): BulkAction => ({
  key: 'delete',
  label: label || 'Delete',
  icon: Trash2,
  onClick,
  variant: 'destructive',
  disabled,
});

// ============================================================================
// Hook for managing bulk selection state
// ============================================================================

export interface UseBulkSelectionReturn<T> {
  /** Currently selected item IDs */
  selectedIds: Set<string>;
  /** Number of selected items */
  selectedCount: number;
  /** Check if an item is selected */
  isSelected: (id: string) => boolean;
  /** Toggle selection for a single item */
  toggleSelection: (id: string) => void;
  /** Select all items */
  selectAll: (items: T[], getId: (item: T) => string) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Check if all items are selected */
  isAllSelected: (items: T[], getId: (item: T) => string) => boolean;
  /** Check if some (but not all) items are selected */
  isSomeSelected: (items: T[], getId: (item: T) => string) => boolean;
}

export function useBulkSelection<T>(): UseBulkSelectionReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((items: T[], getId: (item: T) => string) => {
    setSelectedIds(new Set(items.map(getId)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = useCallback(
    (items: T[], getId: (item: T) => string) => {
      if (items.length === 0) return false;
      return items.every((item) => selectedIds.has(getId(item)));
    },
    [selectedIds]
  );

  const isSomeSelected = useCallback(
    (items: T[], getId: (item: T) => string) => {
      if (items.length === 0) return false;
      const selected = items.filter((item) => selectedIds.has(getId(item)));
      return selected.length > 0 && selected.length < items.length;
    },
    [selectedIds]
  );

  return {
    selectedIds,
    selectedCount,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    isAllSelected,
    isSomeSelected,
  };
}
