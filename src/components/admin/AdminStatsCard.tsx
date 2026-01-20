/**
 * Admin Stats Card Component
 * Modern glassmorphism style with gradient accents
 * Uses container queries for component-level responsiveness
 */

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  className?: string;
}

/**
 * Stats data card
 * For displaying key metrics with enhanced visuals
 * Automatically adapts layout based on container width
 */
export const AdminStatsCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  iconBg,
  iconColor,
  accentColor,
  className,
}: AdminStatsCardProps) => {
  const changeStyles = {
    increase: 'text-success bg-success-muted ring-1 ring-success/20',
    decrease: 'text-destructive bg-destructive/10 ring-1 ring-destructive/20',
    neutral: 'text-muted-foreground bg-muted/80 ring-1 ring-muted-foreground/20',
  };

  const ChangeIcon = changeType === 'increase' ? TrendingUp : changeType === 'decrease' ? TrendingDown : Activity;

  return (
    <div className={cn(
      '@container',
      'group relative overflow-hidden',
      'bg-card/80',
      'backdrop-blur-sm',
      'rounded-xl @sm:rounded-2xl',
      'p-4 @sm:p-5 @md:p-6',
      'border border-border/60',
      'shadow-sm hover:shadow-lg',
      'transition-all duration-300 ease-out',
      'hover:-translate-y-0.5',
      className
    )}>
      {/* Top accent line with gradient */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-0.5 @sm:h-1',
        accentColor,
        'opacity-0 group-hover:opacity-100',
        'transition-opacity duration-300'
      )} />

      {/* Subtle background gradient on hover */}
      <div className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-100',
        'bg-gradient-to-br from-muted/50 to-transparent',
        'transition-opacity duration-300',
        'pointer-events-none'
      )} />

      <div className="relative z-10">
        {/* Header: icon and change indicator */}
        <div className="flex items-start justify-between mb-3 @sm:mb-4 @md:mb-5">
          {/* Icon container with glow effect */}
          <div className={cn(
            iconBg,
            'p-2.5 @sm:p-3 @md:p-3.5 rounded-lg @sm:rounded-xl',
            'shadow-sm group-hover:shadow-md',
            'transition-shadow duration-300'
          )}>
            <div className={cn(iconColor, '[&>svg]:size-4 @sm:[&>svg]:size-5 @md:[&>svg]:size-6')}>
              {icon}
            </div>
          </div>

          {/* Change indicator - hidden in very small containers */}
          {change && (
            <div className={cn(
              'hidden @[180px]:flex items-center gap-1',
              'px-2 @sm:px-2.5 py-0.5 @sm:py-1 rounded-full',
              'text-[10px] @sm:text-xs font-semibold',
              changeStyles[changeType]
            )}>
              <ChangeIcon className="size-3 @sm:size-3.5" />
              <span>{change}</span>
            </div>
          )}
        </div>

        {/* Value and title */}
        <div className="space-y-0.5 @sm:space-y-1">
          <div className="text-xl @sm:text-2xl @md:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </div>
          <div className="text-xs @sm:text-sm font-medium text-muted-foreground line-clamp-1">
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};
