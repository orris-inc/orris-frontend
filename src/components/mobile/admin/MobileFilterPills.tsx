/**
 * MobileFilterPills - Horizontal scrollable filter pills
 *
 * Tailwind Application UI style filter component:
 * - Horizontal scrolling with hidden scrollbar
 * - Pills with counts
 * - Active state with inverted colors
 * - Hide zero-count options (configurable)
 */

import { cn } from '@/lib/utils';

export interface FilterPillOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;
  /** Hide this option when count is 0 (default: false for 'all', true for others) */
  hideWhenZero?: boolean;
}

export interface MobileFilterPillsProps<T extends string = string> {
  options: FilterPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Show count badges (default: true) */
  showCounts?: boolean;
  className?: string;
}

export function MobileFilterPills<T extends string = string>({
  options,
  value,
  onChange,
  showCounts = true,
  className,
}: MobileFilterPillsProps<T>) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4',
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        const count = option.count ?? 0;

        // Determine if should hide when zero
        const shouldHideWhenZero =
          option.hideWhenZero ?? option.value !== 'all';

        // Hide options with 0 count if configured
        if (shouldHideWhenZero && count === 0) return null;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 shrink-0',
              'px-3 py-1.5 rounded-full text-sm font-medium',
              'transition-colors whitespace-nowrap active:scale-[0.98]',
              isActive
                ? 'bg-foreground text-background'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
          >
            {option.label}
            {showCounts && count > 0 && (
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
  );
}

MobileFilterPills.displayName = 'MobileFilterPills';
