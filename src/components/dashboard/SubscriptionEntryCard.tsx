/**
 * Subscription Entry Card Component
 * Displays subscription summary with click-to-navigate functionality
 */

import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBadgeClass } from '@/lib/ui-styles';
import type { DashboardSubscription } from '@/api/user/types';

interface SubscriptionEntryCardProps {
  subscription: DashboardSubscription;
  className?: string;
}

/**
 * Format bytes to readable traffic units
 */
const formatTraffic = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = (bytes / Math.pow(k, i)).toFixed(1);
  return `${value} ${units[i]}`;
};

/**
 * Get subscription status display configuration
 */
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'active':
      return { label: '激活中', variant: 'success' as const };
    case 'expired':
      return { label: '已过期', variant: 'destructive' as const };
    case 'cancelled':
      return { label: '已取消', variant: 'outline' as const };
    case 'pending':
      return { label: '待处理', variant: 'secondary' as const };
    case 'renewed':
      return { label: '已续费', variant: 'success' as const };
    default:
      return { label: status, variant: 'secondary' as const };
  }
};

/**
 * Calculate remaining days
 */
const getDaysRemaining = (endDate?: string): number | null => {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

/**
 * Format date for display
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Subscription entry card - displays subscription summary and navigates to detail page
 */
export const SubscriptionEntryCard = ({ subscription, className }: SubscriptionEntryCardProps) => {
  const navigate = useNavigate();
  const statusConfig = getStatusConfig(subscription.status);
  const isActive = subscription.isActive;
  const limits = subscription.plan?.limits as { trafficLimit?: number } | undefined;
  const trafficLimit = limits?.trafficLimit ?? 0;
  const usagePercent = trafficLimit > 0 ? (subscription.usage.total / trafficLimit) * 100 : 0;
  const daysRemaining = getDaysRemaining(subscription.currentPeriodEnd);

  const handleClick = () => {
    navigate(`/dashboard/subscriptions/${subscription.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'p-3 sm:p-4 rounded-xl cursor-pointer touch-target',
        'transition-all duration-[var(--duration-normal)] ease-[var(--spring-smooth)] group',
        // Mobile: glass effect, Desktop: solid background
        'glass-elevated md:bg-card md:border md:shadow-none md:backdrop-blur-none',
        isActive
          ? 'md:bg-emerald-500/5 md:border-emerald-500/20 hover:md:border-emerald-500/40 hover:shadow-sm'
          : 'md:bg-muted/30 md:border-border/50 hover:md:border-border hover:shadow-sm',
        // Press feedback for mobile
        'active:scale-[0.98] active:opacity-90',
        className
      )}
    >
      {/* Row 1: Plan name + status badge + days remaining (compact on mobile) */}
      <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-semibold text-sm truncate">{subscription.plan?.name || '未知计划'}</h3>
          {isActive && daysRemaining !== null && (
            <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-0.5">
              <Clock className="size-3" />
              {daysRemaining}天
            </span>
          )}
        </div>
        <span className={cn(getBadgeClass(statusConfig.variant), 'text-xs shrink-0')}>{statusConfig.label}</span>
      </div>

      {/* Row 2: Traffic usage - compact inline layout on mobile */}
      {isActive && trafficLimit > 0 && (
        <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                usagePercent > 90
                  ? 'bg-destructive'
                  : usagePercent > 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              )}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
            {formatTraffic(subscription.usage.total)} / {formatTraffic(trafficLimit)}
          </span>
        </div>
      )}

      {/* Row 3: Expiry date + arrow - compact layout */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="size-3" />
          {formatDate(subscription.currentPeriodEnd)}
        </span>
        <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
};
