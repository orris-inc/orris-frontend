/**
 * Quick Actions Card Component
 * Horizontal layout for quick action buttons in Bento Grid
 */

import { Zap, CreditCard, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionsCardProps {
  className?: string;
}

/**
 * Quick actions with horizontal layout
 */
export const QuickActionsCard = ({ className }: QuickActionsCardProps) => {
  return (
    <div className={cn(
      'col-span-4 md:col-span-6 lg:col-span-12',
      'grid grid-cols-2 gap-2 sm:gap-3',
      className
    )}>
      {/* Upgrade subscription */}
      <a
        href="/pricing"
        className={cn(
          'flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl cursor-pointer touch-target',
          // Mobile: glass-interactive, Desktop: solid card
          'glass-interactive md:bg-card md:border md:shadow-none md:backdrop-blur-none',
          'hover:md:border-primary/50 hover:shadow-sm',
          'transition-all duration-[var(--duration-normal)] ease-[var(--spring-smooth)] group'
        )}
      >
        <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20 shrink-0">
          <Zap className="size-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs sm:text-sm font-medium text-foreground">升级订阅</div>
          <div className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">获取更多流量</div>
        </div>
        <ArrowRight className="size-3.5 sm:size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </a>

      {/* View plans */}
      <a
        href="/pricing"
        className={cn(
          'flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl cursor-pointer touch-target',
          // Mobile: glass-interactive, Desktop: solid card
          'glass-interactive md:bg-card md:border md:shadow-none md:backdrop-blur-none',
          'hover:md:border-primary/50 hover:shadow-sm',
          'transition-all duration-[var(--duration-normal)] ease-[var(--spring-smooth)] group'
        )}
      >
        <div className="p-1.5 sm:p-2 rounded-lg bg-success/10 ring-1 ring-success/20 shrink-0">
          <CreditCard className="size-4 text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs sm:text-sm font-medium text-foreground">查看套餐</div>
          <div className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">对比所有方案</div>
        </div>
        <ArrowRight className="size-3.5 sm:size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </a>
    </div>
  );
};
