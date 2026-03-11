/**
 * MobileSegmentedFilter - iOS-style segmented control for filtering
 *
 * Features:
 * - Horizontal scrollable segments
 * - Active segment indicator with smooth animation
 * - Touch-friendly sizing (44px height)
 * - Supports badges for showing counts
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface SegmentOption<T extends string = string> {
  /** Unique value for the segment */
  value: T;
  /** Display label */
  label: string;
  /** Optional count badge */
  count?: number;
  /** Whether to hide when count is 0 */
  hideWhenZero?: boolean;
}

export interface MobileSegmentedFilterProps<T extends string = string> {
  /** Available options */
  options: SegmentOption<T>[];
  /** Currently selected value */
  value: T;
  /** Change handler */
  onChange: (value: T) => void;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const MobileSegmentedFilter = <T extends string = string>({
  options,
  value,
  onChange,
  className,
}: MobileSegmentedFilterProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Filter out options that should be hidden - memoize to prevent infinite loops
  const visibleOptions = useMemo(
    () => options.filter(
      (opt) => !opt.hideWhenZero || (opt.count !== undefined && opt.count > 0)
    ),
    [options]
  );

  // Update indicator position when value changes
  useEffect(() => {
    if (!containerRef.current) return;

    const activeIndex = visibleOptions.findIndex((opt) => opt.value === value);
    if (activeIndex === -1) return;

    const buttons = containerRef.current.querySelectorAll('button');
    const activeButton = buttons[activeIndex];

    if (activeButton) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      setIndicatorStyle({
        left: buttonRect.left - containerRect.left + containerRef.current.scrollLeft,
        width: buttonRect.width,
      });

      // Scroll active button into view
      activeButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [value, visibleOptions]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex gap-1 p-1',
        'bg-muted/50 rounded-lg',
        'overflow-x-auto scrollbar-none',
        '-mx-3 px-3', // Bleed to edges
        className
      )}
    >
      {/* Active indicator */}
      <div
        className={cn(
          'absolute top-1 bottom-1',
          'bg-background rounded-lg',
          'shadow-sm',
          'transition-all duration-150 ease-out',
          'motion-reduce:transition-none'
        )}
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
      />

      {/* Segment buttons */}
      {visibleOptions.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10',
              'flex items-center justify-center gap-2',
              'px-3 py-2 min-h-[44px]',
              'text-[13px] font-medium whitespace-nowrap',
              'rounded-lg',
              'transition-colors duration-150',
              'motion-reduce:transition-none',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80'
            )}
          >
            <span>{option.label}</span>
            {option.count !== undefined && option.count > 0 && (
              <span
                className={cn(
                  'px-1.5 py-0.5 min-w-[18px]',
                  'text-[10px] font-medium',
                  'rounded-full',
                  'text-center',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'bg-foreground/10 text-muted-foreground'
                )}
              >
                {option.count > 99 ? '99+' : option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

MobileSegmentedFilter.displayName = 'MobileSegmentedFilter';
