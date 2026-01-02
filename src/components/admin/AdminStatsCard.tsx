/**
 * Admin Stats Card Component
 * Modern glassmorphism style with gradient accents
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
}

/**
 * Stats data card
 * For displaying key metrics with enhanced visuals
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
}: AdminStatsCardProps) => {
  const changeStyles = {
    increase: 'text-success bg-success-muted ring-1 ring-success/20',
    decrease: 'text-destructive bg-destructive/10 ring-1 ring-destructive/20',
    neutral: 'text-muted-foreground bg-muted/80 ring-1 ring-muted-foreground/20',
  };

  const ChangeIcon = changeType === 'increase' ? TrendingUp : changeType === 'decrease' ? TrendingDown : Activity;

  return (
    <div className={cn(
      'group relative overflow-hidden',
      'bg-card/80',
      'backdrop-blur-sm',
      'rounded-2xl p-6',
      'border border-border/60',
      'shadow-sm hover:shadow-lg',
      'transition-all duration-300 ease-out',
      'hover:-translate-y-0.5'
    )}>
      {/* Top accent line with gradient */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1',
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
        <div className="flex items-start justify-between mb-5">
          {/* Icon container with glow effect */}
          <div className={cn(
            iconBg,
            'p-3.5 rounded-xl',
            'shadow-sm group-hover:shadow-md',
            'transition-shadow duration-300'
          )}>
            <div className={iconColor}>
              {icon}
            </div>
          </div>

          {/* Change indicator */}
          {change && (
            <div className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
              changeStyles[changeType]
            )}>
              <ChangeIcon className="size-3.5" />
              <span>{change}</span>
            </div>
          )}
        </div>

        {/* Value and title */}
        <div className="space-y-1">
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};
