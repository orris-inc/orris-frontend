/**
 * MobileStatsGrid Component
 *
 * A grid-based stat cards container with iOS 26 Liquid Glass styling.
 * Features:
 * - 3-column grid layout - no scrolling needed
 * - High information density
 * - Skeleton loading states
 * - Touch-friendly with press feedback
 */

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/common/Skeleton';

interface StatItem {
  /** Display title for the stat */
  title: string;
  /** Stat value (string or number) */
  value: string | number;
  /** Icon element to display */
  icon: React.ReactNode;
  /** Background class for icon container */
  iconBg: string;
  /** Color class for icon */
  iconColor: string;
  /** Show loading skeleton */
  loading?: boolean;
}

interface MobileStatsScrollerProps {
  /** Array of stat items to display */
  stats: StatItem[];
  /** Additional class names */
  className?: string;
}

/**
 * Compact stat card for grid layout
 * Vertical layout with centered content for maximum density
 */
const StatCard = ({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  loading,
}: StatItem) => {
  if (loading) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center',
          'px-1.5 py-2 rounded-lg',
          'bg-card',
          'ring-1 ring-border/60'
        )}
      >
        <Skeleton className="size-5 rounded mb-1" />
        <Skeleton className="h-3.5 w-10 mb-0.5" />
        <Skeleton className="h-2 w-8" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        // Centered vertical layout
        'flex flex-col items-center justify-center',
        // More compact padding
        'px-1.5 py-2 rounded-lg',
        // Glass style
        'bg-card',
        'ring-1 ring-border/60',
        // Press feedback
        'motion-safe:transition-transform motion-safe:active:scale-[0.98]'
      )}
    >
      {/* Icon - smaller for higher density */}
      <div className={cn('size-5 rounded flex items-center justify-center mb-0.5', iconBg)}>
        <span className={cn(iconColor, '[&_svg]:size-3')}>{icon}</span>
      </div>

      {/* Value */}
      <div className="text-[13px] font-semibold text-foreground tabular-nums leading-tight text-center">
        {value}
      </div>

      {/* Title */}
      <div className="text-[10px] text-muted-foreground leading-tight text-center truncate w-full">
        {title}
      </div>
    </div>
  );
};

/**
 * Grid container for mobile stat cards
 * 3-column layout - all cards visible without scrolling
 */
export const MobileStatsScroller = ({ stats, className }: MobileStatsScrollerProps) => {
  return (
    <div
      className={cn(
        // 3-column grid with tighter gap
        'grid grid-cols-3 gap-1.5',
        className
      )}
    >
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
};

MobileStatsScroller.displayName = 'MobileStatsScroller';
