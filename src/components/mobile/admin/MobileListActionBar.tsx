/**
 * MobileListActionBar - Shared action bar for mobile list pages
 *
 * Tailwind Application UI style:
 * - Outline search input
 * - Icon buttons for refresh and create
 * - Optional extra actions slot
 */

import { type ReactNode } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { MobileSearchBar } from './MobileSearchBar';
import { cn } from '@/lib/utils';

export interface MobileListActionBarProps {
  /** Search input value */
  searchValue: string;
  /** Search input change handler */
  onSearchChange: (value: string) => void;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Refresh button handler */
  onRefresh: () => void;
  /** Whether refresh is in progress */
  refreshing?: boolean;
  /** Create button handler (if undefined, button is hidden) */
  onCreate?: () => void;
  /** Create button title/label */
  createLabel?: string;
  /** Extra action buttons to render before refresh/create */
  extraActions?: ReactNode;
  /** Additional class names */
  className?: string;
}

export function MobileListActionBar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  onRefresh,
  refreshing = false,
  onCreate,
  createLabel,
  extraActions,
  className,
}: MobileListActionBarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <MobileSearchBar
        value={searchValue}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        variant="outline"
        className="flex-1"
      />
      {extraActions}
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className={cn(
          'size-11 rounded-lg shrink-0',
          'flex items-center justify-center',
          'border border-input bg-background',
          'hover:bg-muted transition-colors motion-reduce:transition-none',
          'active:scale-[0.98] motion-reduce:active:scale-100',
          'disabled:opacity-50'
        )}
        title={createLabel}
      >
        <RefreshCw
          className={cn('size-4 text-muted-foreground', refreshing && 'animate-spin')}
        />
      </button>
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className={cn(
            'size-11 rounded-lg shrink-0',
            'flex items-center justify-center',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 transition-colors motion-reduce:transition-none',
            'active:scale-[0.98] motion-reduce:active:scale-100'
          )}
          title={createLabel}
        >
          <Plus className="size-4" />
        </button>
      )}
    </div>
  );
}

MobileListActionBar.displayName = 'MobileListActionBar';
