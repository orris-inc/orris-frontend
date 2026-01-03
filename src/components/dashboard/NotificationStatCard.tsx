/**
 * Notification Stat Card Component
 * Displays notification status in Bento Grid layout
 */

import { ReactNode } from 'react';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';

interface NotificationStatCardProps {
  icon: ReactNode;
  iconBgClass: string;
  iconColorClass: string;
  title: string;
  status: string;
  statusType: 'success' | 'warning' | 'muted';
  subtitle?: string;
  isLoading?: boolean;
  className?: string;
}

const statusColorMap = {
  success: 'text-success',
  warning: 'text-warning',
  muted: 'text-muted-foreground',
};

/**
 * Stat card for displaying notification channel status
 */
export const NotificationStatCard = ({
  icon,
  iconBgClass,
  iconColorClass,
  title,
  status,
  statusType,
  subtitle,
  isLoading = false,
  className,
}: NotificationStatCardProps) => {
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
        <Skeleton className="h-6 w-20 mb-1" />
        <Skeleton className="h-4 w-24" />
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

      {/* Status */}
      <div className={cn('text-lg font-semibold', statusColorMap[statusType])}>
        {status}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
};
