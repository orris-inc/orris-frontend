/**
 * Bento Stat Card Component
 * Reusable statistics card for Bento Grid layout
 *
 * Mobile-first: compact padding/font on mobile, larger on sm+
 * Supports large (col-span-2) and small card variants
 */

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';

type ColorVariant = 'primary' | 'success' | 'warning' | 'destructive' | 'muted' | 'custom';

interface BentoStatCardProps {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Label text shown next to icon */
  label: string;
  /** Main value to display */
  value: string | number;
  /** Unit or suffix after value */
  unit?: string;
  /** Color variant for icon background */
  variant?: ColorVariant;
  /** Custom icon background class (when variant is 'custom') */
  iconBgClass?: string;
  /** Custom icon color class (when variant is 'custom') */
  iconColorClass?: string;
  /** Whether this is a large card (col-span-2) */
  large?: boolean;
  /** Whether the card is loading */
  isLoading?: boolean;
  /** Additional className */
  className?: string;
  /** Optional children for extra content (e.g., progress bar) */
  children?: ReactNode;
}

const variantStyles: Record<Exclude<ColorVariant, 'custom'>, { bg: string; ring: string; text: string }> = {
  primary: {
    bg: 'bg-primary/10',
    ring: 'ring-primary/20',
    text: 'text-primary',
  },
  success: {
    bg: 'bg-success/10',
    ring: 'ring-success/20',
    text: 'text-success',
  },
  warning: {
    bg: 'bg-warning/10',
    ring: 'ring-warning/20',
    text: 'text-warning',
  },
  destructive: {
    bg: 'bg-destructive/10',
    ring: 'ring-destructive/20',
    text: 'text-destructive',
  },
  muted: {
    bg: 'bg-muted',
    ring: 'ring-border',
    text: 'text-muted-foreground',
  },
};

/**
 * Stat card for displaying metrics in Bento Grid layout
 * Large cards span 2 columns and have bigger padding/font
 * Mobile: compact p-3, sm+: p-4/p-5
 */
export const BentoStatCard = ({
  icon: Icon,
  label,
  value,
  unit,
  variant = 'primary',
  iconBgClass,
  iconColorClass,
  large = false,
  isLoading = false,
  className,
  children,
}: BentoStatCardProps) => {
  const styles = variant === 'custom' ? null : variantStyles[variant];

  if (isLoading) {
    return (
      <div
        className={cn(
          // Mobile: compact, sm+: larger padding
          'p-3 sm:p-4 rounded-xl bg-card ring-1 ring-border',
          large && 'col-span-2 sm:p-5',
          className
        )}
      >
        <div className={cn('flex items-center mb-2 sm:mb-3', large ? 'gap-2 sm:gap-3' : 'gap-2')}>
          <Skeleton className={cn('rounded-lg', large ? 'size-7 sm:size-9' : 'size-6 sm:size-7')} />
          <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
        </div>
        <Skeleton className={cn('w-16 sm:w-20 mb-1', large ? 'h-6 sm:h-8' : 'h-5 sm:h-6')} />
        {children && <Skeleton className="h-2 w-full mt-2" />}
      </div>
    );
  }

  return (
    <div
      className={cn(
        // Mobile: compact p-3, sm+: p-4, large cards get p-5 on sm+
        'p-3 sm:p-4 rounded-xl bg-card ring-1 ring-border',
        'transition-shadow hover:shadow-md',
        large && 'col-span-2 sm:p-5',
        className
      )}
    >
      {/* Header with icon */}
      <div className={cn('flex items-center mb-2 sm:mb-3', large ? 'gap-2 sm:gap-3' : 'gap-2')}>
        <div
          className={cn(
            'rounded-lg ring-1',
            // Mobile: smaller icon container
            large ? 'p-1.5 sm:p-2' : 'p-1 sm:p-1.5',
            styles ? cn(styles.bg, styles.ring) : iconBgClass
          )}
        >
          <Icon
            className={cn(
              // Mobile: smaller icons
              large ? 'size-3.5 sm:size-4 lg:size-5' : 'size-3 sm:size-4',
              styles ? styles.text : iconColorClass
            )}
          />
        </div>
        <span
          className={cn(
            'text-muted-foreground',
            // Mobile: text-xs, sm+: text-sm
            large ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs lg:text-sm'
          )}
        >
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-0.5 sm:gap-1">
        <span
          className={cn(
            'font-semibold tabular-nums text-foreground',
            // Mobile: smaller fonts
            large ? 'text-xl sm:text-2xl lg:text-3xl font-bold' : 'text-lg sm:text-xl lg:text-2xl'
          )}
        >
          {value}
        </span>
        {unit && (
          <span
            className={cn(
              'text-muted-foreground',
              large ? 'text-sm sm:text-base lg:text-lg' : 'text-xs sm:text-sm'
            )}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Optional children (e.g., progress bar) */}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
};
