/**
 * Stat Card Component
 * Reusable statistics card for Bento Grid layout
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
        'col-span-2 md:col-span-3',
        'p-5 rounded-xl bg-card border',
        className
      )}>
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-4 w-12" />
      </div>
    );
  }

  return (
    <div className={cn(
      'col-span-2 md:col-span-3',
      'p-5 rounded-xl bg-card border',
      'transition-shadow hover:shadow-md',
      className
    )}>
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('p-2 rounded-lg ring-1', iconBgClass)}>
          <div className={iconColorClass}>
            {icon}
          </div>
        </div>
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>

      {/* Value */}
      <div className="text-2xl font-semibold text-foreground tabular-nums">
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
};
