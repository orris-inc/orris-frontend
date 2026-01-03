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
      'grid grid-cols-1 sm:grid-cols-2 gap-3',
      className
    )}>
      {/* Upgrade subscription */}
      <a
        href="/pricing"
        className={cn(
          'flex items-center gap-4 p-4 rounded-xl bg-card border',
          'hover:border-primary/50 hover:shadow-md',
          'transition-all group cursor-pointer'
        )}
      >
        <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <Zap className="size-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground">升级订阅</div>
          <div className="text-sm text-muted-foreground truncate">获取更多流量</div>
        </div>
        <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </a>

      {/* View plans */}
      <a
        href="/pricing"
        className={cn(
          'flex items-center gap-4 p-4 rounded-xl bg-card border',
          'hover:border-primary/50 hover:shadow-md',
          'transition-all group cursor-pointer'
        )}
      >
        <div className="p-2.5 rounded-xl bg-success/10 ring-1 ring-success/20">
          <CreditCard className="size-5 text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground">查看套餐</div>
          <div className="text-sm text-muted-foreground truncate">对比所有方案</div>
        </div>
        <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </a>
    </div>
  );
};
