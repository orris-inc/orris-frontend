/**
 * Filter Toolbar Component
 * Unified search and filter bar for admin management pages
 *
 * Features:
 * - Search input with icon
 * - Quick filter tabs (horizontal scroll on mobile)
 * - Custom filter slot
 * - Action buttons slot
 *
 * Mobile-first: vertical stack → horizontal on sm breakpoint
 */

import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

// Quick filter item type
export interface QuickFilterItem {
  value: string;
  label: string;
  count?: number;
}

export interface FilterToolbarProps {
  /** Search input value */
  searchValue?: string;
  /** Search input change handler */
  onSearchChange?: (value: string) => void;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Custom filters slot (e.g., Select components) */
  filters?: ReactNode;
  /** Quick filter tabs */
  quickFilters?: QuickFilterItem[];
  /** Currently active quick filter value */
  activeQuickFilter?: string;
  /** Quick filter change handler */
  onQuickFilterChange?: (value: string) => void;
  /** Action buttons slot (right side) */
  actions?: ReactNode;
  /** Additional class names */
  className?: string;
  /** Show clear button when search has value */
  showClearButton?: boolean;
}

/**
 * Filter Toolbar Component
 * Provides unified search and filtering UI for admin pages
 */
export const FilterToolbar = ({
  searchValue = '',
  onSearchChange,
  searchPlaceholder,
  filters,
  quickFilters,
  activeQuickFilter,
  onQuickFilterChange,
  actions,
  className,
  showClearButton = true,
}: FilterToolbarProps) => {
  const { t } = useTranslation();
  const placeholder = searchPlaceholder ?? t('common.placeholders.search');
  const hasSearch = onSearchChange !== undefined;
  const hasQuickFilters = quickFilters && quickFilters.length > 0;
  const hasFilters = filters !== undefined;
  const hasActions = actions !== undefined;

  const handleClear = () => {
    onSearchChange?.('');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Row 1: Search + Actions */}
      {(hasSearch || hasActions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search input */}
          {hasSearch && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={placeholder}
                className="h-10 w-full pl-9 pr-9"
              />
              {showClearButton && searchValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )}

          {/* Actions slot */}
          {hasActions && (
            <div className="flex shrink-0 items-center gap-x-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Row 2: Quick Filters (horizontal scroll on mobile) */}
      {hasQuickFilters && (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-x-2 min-w-max">
            {quickFilters.map((filter) => {
              const isActive = filter.value === activeQuickFilter;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => onQuickFilterChange?.(filter.value)}
                  className={cn(
                    'inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    'min-h-[36px]', // Touch target
                    isActive
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  )}
                >
                  {filter.label}
                  {filter.count !== undefined && (
                    <span
                      className={cn(
                        'ml-1.5 text-xs',
                        isActive ? 'opacity-70' : 'opacity-50'
                      )}
                    >
                      {filter.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Row 3: Custom Filters */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {filters}
        </div>
      )}
    </div>
  );
};

/**
 * Filter Chip Component
 * For displaying active filters that can be removed
 */
export interface FilterChipProps {
  label: string;
  onRemove: () => void;
  className?: string;
}

export const FilterChip = ({ label, onRemove, className }: FilterChipProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-x-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground',
        className
      )}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="group relative -mr-1 size-5 rounded-full hover:bg-muted-foreground/20"
        aria-label={`Remove ${label} filter`}
      >
        <X className="size-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </button>
    </span>
  );
};

/**
 * Reset Filters Button
 * Standard button for clearing all active filters
 */
export interface ResetFiltersButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const ResetFiltersButton = ({
  onClick,
  label,
  className,
}: ResetFiltersButtonProps) => {
  const { t } = useTranslation();
  const displayLabel = label ?? t('common.actions.reset');
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn('text-muted-foreground', className)}
    >
      <X className="mr-2 size-4" />
      {displayLabel}
    </Button>
  );
};
