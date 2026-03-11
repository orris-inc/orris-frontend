/**
 * MobileListToolbar - Unified toolbar for mobile list pages
 *
 * Tailwind Application UI style:
 * - Compact search input with inline action buttons
 * - Horizontal scrolling filter pills below
 * - Single component for all list page toolbar needs
 */

import { type ReactNode, useState, useRef, useEffect } from 'react';
import { Search, X, RefreshCw, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Filter Pill Types
// ============================================================================

export interface FilterPillOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;
  hideWhenZero?: boolean;
}

// ============================================================================
// Toolbar Props
// ============================================================================

export interface MobileListToolbarProps<T extends string = string> {
  /** Search input value */
  searchValue: string;
  /** Search input change handler */
  onSearchChange: (value: string) => void;
  /** Search placeholder text */
  searchPlaceholder?: string;

  /** Filter options */
  filterOptions?: FilterPillOption<T>[];
  /** Current filter value */
  filterValue?: T;
  /** Filter change handler */
  onFilterChange?: (value: T) => void;
  /** Show filter counts (default: true) */
  showFilterCounts?: boolean;

  /** Refresh handler (shows refresh button if provided) */
  onRefresh?: () => void;
  /** Whether refresh is in progress */
  refreshing?: boolean;

  /** Create handler (shows create button if provided) */
  onCreate?: () => void;
  /** Create button title/label */
  createLabel?: string;

  /** Extra action buttons to render */
  extraActions?: ReactNode;

  /** Additional class names */
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function MobileListToolbar<T extends string = string>({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filterOptions,
  filterValue,
  onFilterChange,
  showFilterCounts = true,
  onRefresh,
  refreshing = false,
  onCreate,
  createLabel,
  extraActions,
  className,
}: MobileListToolbarProps<T>) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle escape key to blur search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchFocused) {
        searchInputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchFocused]);

  const handleClear = () => {
    onSearchChange('');
    searchInputRef.current?.focus();
  };

  const hasFilters = filterOptions && filterOptions.length > 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search bar with action buttons */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div
          className={cn(
            'relative flex-1 min-w-0',
            'transition-all duration-150'
          )}
        >
          <Search
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 size-4 pointer-events-none',
              'transition-colors duration-150',
              isSearchFocused ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={searchPlaceholder}
            className={cn(
              'w-full h-11 pl-9 pr-9',
              // Use text-base (16px) to prevent iOS auto-zoom on focus
              'text-base sm:text-sm text-foreground placeholder:text-muted-foreground',
              'bg-background ring-1 ring-border/60 rounded-lg',
              'transition-shadow duration-150',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
              // Touch optimization
              'pointer-coarse:h-11'
            )}
          />
          {searchValue && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2',
                'p-1.5 rounded-full',
                'hover:bg-muted active:bg-muted/80',
                'transition-colors'
              )}
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Extra actions */}
        {extraActions}

        {/* Refresh button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={cn(
              'size-10 rounded-lg shrink-0',
              'flex items-center justify-center',
              'border border-input bg-background',
              'hover:bg-muted active:bg-muted/80 active:scale-[0.98]',
              'transition-colors disabled:opacity-50',
              // Touch optimization
              'pointer-coarse:size-11'
            )}
          >
            <RefreshCw
              className={cn(
                'size-4 text-muted-foreground',
                refreshing && 'animate-spin'
              )}
            />
          </button>
        )}

        {/* Create button */}
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className={cn(
              'size-10 rounded-lg shrink-0',
              'flex items-center justify-center',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 active:bg-primary/80 active:scale-[0.98]',
              'transition-colors',
              // Touch optimization
              'pointer-coarse:size-11'
            )}
            title={createLabel}
          >
            <Plus className="size-4" />
          </button>
        )}
      </div>

      {/* Filter pills */}
      {hasFilters && (
        <div
          className={cn(
            'flex items-center gap-2',
            'overflow-x-auto pb-0.5 scrollbar-none',
            '-mx-3 px-3' // Extend to edges with padding for scroll
          )}
        >
          {filterOptions.map((option) => {
            const isActive = option.value === filterValue;
            const count = option.count ?? 0;
            const shouldHideWhenZero =
              option.hideWhenZero ?? option.value !== 'all';

            if (shouldHideWhenZero && count === 0) return null;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onFilterChange?.(option.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 shrink-0',
                  'px-3 py-1.5 rounded-full text-xs font-medium',
                  'whitespace-nowrap',
                  'transition-all duration-150 active:scale-[0.98]',
                  // Touch optimization
                  'pointer-coarse:py-2',
                  isActive
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted active:bg-muted/80'
                )}
              >
                {option.label}
                {showFilterCounts && count > 0 && (
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      isActive ? 'text-background/70' : 'text-muted-foreground/70'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

MobileListToolbar.displayName = 'MobileListToolbar';
