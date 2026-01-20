/**
 * Stat Card Component
 * Reusable statistics card for Bento Grid layout
 * Uses container queries for true component-level responsiveness
 */

import { ReactNode } from 'react';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: ReactNode;
  iconBgClass: string;
  iconColorClass: string;
  title: string;
  value: string | number;
  subtitle?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * Reusable stat card for displaying metrics
 * Automatically adapts layout based on container width using @container queries
 */
export const StatCard = ({
  icon,
  iconBgClass,
  iconColorClass,
  title,
  value,
  subtitle,
  isLoading = false,
  className,
}: StatCardProps) => {
  if (isLoading) {
    return (
      <div className={cn(
        '@container',
        'col-span-2 md:col-span-3',
        'p-4 @sm:p-5 rounded-xl bg-card border',
        className
      )}>
        <div className="flex items-center gap-2 @sm:gap-3 mb-2 @sm:mb-3">
          <Skeleton className="size-8 @sm:size-9 rounded-lg" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-7 @sm:h-8 w-20 mb-1" />
        <Skeleton className="h-4 w-12" />
      </div>
    );
  }

  return (
    <div className={cn(
      '@container',
      'col-span-2 md:col-span-3',
      'p-4 @sm:p-5 rounded-xl bg-card border',
      'transition-shadow hover:shadow-md',
      className
    )}>
      {/* Header with icon - stacks vertically in small containers */}
      <div className="flex items-center gap-2 @sm:gap-3 mb-2 @sm:mb-3">
        <div className={cn('p-1.5 @sm:p-2 rounded-lg ring-1', iconBgClass)}>
          <div className={cn(iconColorClass, '[&>svg]:size-4 @sm:[&>svg]:size-5')}>
            {icon}
          </div>
        </div>
        <span className="text-xs @sm:text-sm text-muted-foreground line-clamp-1">
          {title}
        </span>
      </div>

      {/* Value - scales with container */}
      <div className="text-xl @sm:text-2xl @md:text-3xl font-semibold text-foreground tabular-nums">
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs @sm:text-sm text-muted-foreground mt-1 line-clamp-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};
