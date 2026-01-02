/**
 * Page Stats Card Component
 * Compact statistics display for management pages
 * Reusable across NodeManagementPage, ForwardRulesPage, etc.
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
        'group relative overflow-hidden',
        'bg-card backdrop-blur-xl rounded-xl',
        'p-2.5 sm:p-3',
        'border border-border',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200 ease-out',
        className
      )}
    >
      <div className="relative z-10 flex items-center gap-2 sm:gap-2.5">
        <div
          className={cn(
            iconBg,
            'p-1.5 sm:p-2 rounded-lg shrink-0',
            'ring-1 ring-border/50',
            'relative'
          )}
        >
          <div className={iconColor}>{icon}</div>
          {showPulse && (
            <div className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-success animate-pulse ring-1 ring-card" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm sm:text-base lg:text-lg font-bold text-foreground tracking-tight tabular-nums truncate">
            {loading ? (
              <div className="h-4 sm:h-5 w-8 sm:w-10 bg-muted rounded animate-pulse" />
            ) : (
              value
            )}
          </div>
          <div className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};
