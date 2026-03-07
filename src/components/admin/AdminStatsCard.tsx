/**
 * Admin Stats Card Component
 * Following Tailwind UI Application UI stats pattern
 * @see https://tailwindcss.com/plus/ui-blocks/application-ui/data-display/stats
 *
 * Simple, clean stats display with optional change indicator
 * Mobile-first responsive design
 */

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardStyles } from '@/lib/ui-styles';

// Change type for trend indicator
export type StatsChangeType = 'increase' | 'decrease' | 'neutral';

// Props interface - simplified from previous version
export interface AdminStatsCardProps {
  /** Stats metric name */
  title: string;
  /** Stats value (number or formatted string) */
  value: string | number;
  /** Optional icon */
  icon?: LucideIcon | ReactNode;
  /** Change value (e.g., "+12%", "-5 users") */
  change?: {
    value: string;
    type: StatsChangeType;
  };
  /** Loading state */
  loading?: boolean;
  /** Additional class names */
  className?: string;
  // Legacy props for backward compatibility
  /** @deprecated Use icon prop with LucideIcon instead */
  iconBg?: string;
  /** @deprecated Use icon prop with LucideIcon instead */
  iconColor?: string;
  /** @deprecated Not needed in new design */
  accentColor?: string;
  /** @deprecated Use change.type instead */
  changeType?: StatsChangeType;
}

// Change indicator styles
const changeStyles: Record<StatsChangeType, string> = {
  increase: 'text-success',
  decrease: 'text-destructive',
  neutral: 'text-muted-foreground',
};

// Change indicator icons
const ChangeIcons: Record<StatsChangeType, LucideIcon> = {
  increase: TrendingUp,
  decrease: TrendingDown,
  neutral: Minus,
};

/**
 * Stats Card Component
 * Displays a single metric with optional trend indicator
 * Follows Tailwind UI stats pattern
 */
export const AdminStatsCard = ({
  title,
  value,
  icon,
  change,
  loading = false,
  className,
  // Legacy props
  iconBg,
  iconColor,
  changeType,
}: AdminStatsCardProps) => {
  // Handle legacy change prop format
  const changeData = change || (changeType ? { value: String(value), type: changeType } : undefined);

  if (loading) {
    return (
      <div
        className={cn(
          cardStyles,
          'overflow-hidden rounded-lg px-3.5 py-4',
          className
        )}
      >
        <div className="animate-pulse">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="mt-2 h-7 w-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Render icon - handle both LucideIcon and ReactNode
  const renderIcon = () => {
    if (!icon) return null;

    // Check if it's a LucideIcon (function component)
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return (
        <div className={cn(
          'p-2 rounded-lg',
          iconBg || 'bg-primary/10'
        )}>
          <IconComponent
            className={cn('size-5', iconColor || 'text-primary')}
            strokeWidth={1.5}
          />
        </div>
      );
    }

    // It's a ReactNode (legacy support)
    return (
      <div className={cn(
        'p-2 rounded-lg',
        iconBg || 'bg-primary/10',
        iconColor
      )}>
        {icon}
      </div>
    );
  };

  return (
    <div
      className={cn(
        cardStyles,
        'overflow-hidden rounded-lg px-3.5 py-4',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <dt className="truncate text-xs font-medium text-muted-foreground">
            {title}
          </dt>
          <dd className="mt-1 flex items-baseline justify-between gap-x-2">
            <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums lg:text-2xl">
              {value}
            </span>
            {changeData && (
              <span
                className={cn(
                  'inline-flex items-baseline gap-0.5 text-sm font-semibold',
                  changeStyles[changeData.type]
                )}
              >
                {(() => {
                  const ChangeIcon = ChangeIcons[changeData.type];
                  return <ChangeIcon className="size-4 shrink-0 self-center" />;
                })()}
                <span className="sr-only">
                  {changeData.type === 'increase' ? 'Increased by' : changeData.type === 'decrease' ? 'Decreased by' : ''}
                </span>
                {changeData.value}
              </span>
            )}
          </dd>
        </div>
        {icon && (
          <div className="ml-4 shrink-0">
            {renderIcon()}
          </div>
        )}
      </div>
    </div>
  );
};
