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
        'p-4 rounded-xl border cursor-pointer',
        'transition-all group',
        isActive
          ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-sm'
          : 'bg-muted/30 border-border/50 hover:border-border hover:shadow-sm',
        className
      )}
    >
      {/* Row 1: Plan name + status badge */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">{subscription.plan?.name || '未知计划'}</h3>
        <span className={cn(getBadgeClass(statusConfig.variant), 'text-xs')}>{statusConfig.label}</span>
      </div>

      {/* Row 2: Traffic usage progress bar (only for active subscriptions) */}
      {isActive && trafficLimit > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
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
            <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">
              {usagePercent.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatTraffic(subscription.usage.total)}</span>
            <span>/ {formatTraffic(trafficLimit)}</span>
          </div>
        </div>
      )}

      {/* Row 3: Expiry info + arrow indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isActive && daysRemaining !== null ? (
            <>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {daysRemaining}天
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {formatDate(subscription.currentPeriodEnd)}
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {formatDate(subscription.currentPeriodEnd)}
            </span>
          )}
        </div>
        <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
};
