/**
 * Bulk Action Bar Component
 * Fixed bottom bar that appears when rows are selected in a table
 * Features: selected count, clear button, action slots, safe-area support
 */

import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { X, Download, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';

// ============================================================================
// Types
// ============================================================================

export interface BulkAction {
  /** Unique key for the action */
  key: string;
  /** Action label */
  label: string;
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Action handler */
  onClick: () => void;
  /** Button variant */
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
}

export interface BulkActionBarProps {
  /** Number of selected items */
  selectedCount: number;
  /** Handler to clear selection */
  onClearSelection: () => void;
  /** Predefined bulk actions */
  actions?: BulkAction[];
  /** Custom action slot (for more complex UIs) */
  customActions?: ReactNode;
  /** Additional class names */
  className?: string;
  /** Whether the bar is visible (controls animation) */
  visible?: boolean;
}

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
// Main Component
// ============================================================================

export const BulkActionBar = ({
  selectedCount,
  onClearSelection,
  actions = [],
  customActions,
  className,
  visible = true,
}: BulkActionBarProps) => {
  const { t } = useTranslation();

  // Don't render if no items selected
  if (selectedCount === 0 || !visible) {
    return null;
  }

  return (
    <div
      className={cn(
        // Fixed positioning at bottom
        'fixed bottom-0 inset-x-0 z-50',
        // Container padding with safe area support
        'pb-safe px-4 sm:px-6 lg:px-8',
        // Animation
        'animate-in slide-in-from-bottom-4 duration-200',
        className
      )}
    >
      <div
        className={cn(
          // Card styling
          'mx-auto max-w-3xl',
          'bg-card/95 backdrop-blur-sm',
          'border border-border rounded-t-xl shadow-lg',
          // Inner layout
          'flex items-center justify-between gap-4',
          'px-4 py-3 sm:px-6'
        )}
      >
        {/* Left side: Selection info + Clear button */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground tabular-nums">
            {t('common.selected', { count: selectedCount })}
          </span>
          <button
            type="button"
            onClick={onClearSelection}
            className={cn(
              'inline-flex items-center justify-center',
              'size-7 rounded-full',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-label={t('common.actions.clear')}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          {/* Custom actions slot */}
          {customActions}

          {/* Predefined actions */}
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.key}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className="min-w-[44px]"
              >
                {Icon && <Icon className="size-4 mr-2" />}
                <span className="hidden sm:inline">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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
