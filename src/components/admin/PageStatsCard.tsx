/**
 * Page Stats Card Component
 * High-density statistics display for management pages
 * Optimized for maximum data visibility with minimal padding
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageStatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  showPulse?: boolean;
  loading?: boolean;
  className?: string;
}

export const PageStatsCard = ({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  showPulse,
  loading,
  className,
}: PageStatsCardProps) => {
  return (
    <div
      className={cn(
        '@container',
        'group relative overflow-hidden',
        'bg-card rounded-lg',
        'px-2.5 py-2 @sm:px-3 @sm:py-2',
        'border border-border',
        'hover:bg-accent/30',
        'transition-colors duration-150',
        className
      )}
    >
      <div className="relative z-10 flex items-center gap-2">
        <div
          className={cn(
            iconBg,
            'p-1.5 rounded-md shrink-0',
            'relative'
          )}
        >
          <div className={cn(iconColor, '[&>svg]:size-3.5')}>{icon}</div>
          {showPulse && (
            <div className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-success animate-pulse motion-reduce:animate-none ring-1 ring-card" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm @sm:text-base font-semibold text-foreground tracking-tight tabular-nums truncate leading-tight">
            {loading ? (
              <div className="h-4 w-8 bg-muted rounded animate-pulse motion-reduce:animate-none" />
            ) : (
              value
            )}
          </div>
          <div className="text-[10px] font-medium text-muted-foreground truncate leading-tight">
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};
