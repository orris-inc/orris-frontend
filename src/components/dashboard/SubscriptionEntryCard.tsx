/**
 * Subscription Entry Card Component
 * Displays subscription summary with click-to-navigate functionality
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronRight, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBadgeClass } from '@/lib/ui-styles';
import type { DashboardSubscription } from '@/api/user/types';
import type { TFunction } from 'i18next';

interface SubscriptionEntryCardProps {
  subscription: DashboardSubscription;
  className?: string;
}

/**
 * Format bytes to readable traffic units
 */
const formatTraffic = (bytes: number): { value: string; unit: string } => {
  if (bytes === 0) return { value: '0', unit: 'B' };
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = (bytes / Math.pow(k, i)).toFixed(1);
  return { value, unit: units[i] };
};

/**
 * Get subscription status display configuration
 */
const getStatusConfig = (status: string, t: TFunction) => {
  switch (status) {
    case 'active':
      return { label: t('common.status.active'), variant: 'success' as const };
    case 'expired':
      return { label: t('common.status.expired'), variant: 'destructive' as const };
    case 'cancelled':
      return { label: t('common.status.cancelled'), variant: 'outline' as const };
    case 'pending':
      return { label: t('common.status.pending'), variant: 'secondary' as const };
    case 'renewed':
      return { label: t('common.status.renewed'), variant: 'success' as const };
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

import { formatDate } from '@/shared/utils/date-utils';

/**
 * Get progress bar color based on usage percentage
 */
const getProgressColor = (percent: number) => {
  if (percent > 90) return 'bg-destructive';
  if (percent > 70) return 'bg-warning';
  return 'bg-success';
};

/**
 * Subscription entry card - displays subscription summary and navigates to detail page
 */
export const SubscriptionEntryCard = ({ subscription, className }: SubscriptionEntryCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const statusConfig = getStatusConfig(subscription.status, t);
  const isActive = subscription.isActive;
  const limits = subscription.plan?.limits as { trafficLimit?: number } | undefined;
  const trafficLimit = limits?.trafficLimit ?? 0;
  const usagePercent = trafficLimit > 0 ? (subscription.usage.total / trafficLimit) * 100 : 0;
  const daysRemaining = getDaysRemaining(subscription.currentPeriodEnd);

  const usedFormatted = formatTraffic(subscription.usage.total);
  const limitFormatted = formatTraffic(trafficLimit);

  const handleClick = () => {
    navigate(`/dashboard/subscriptions/${subscription.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative p-4 sm:p-5 rounded-xl cursor-pointer touch-target',
        'transition-all duration-200 group',
        'bg-card border hover:shadow-md',
        isActive
          ? 'border-success/20 hover:border-success/40'
          : 'border-border hover:border-border/80',
        'active:scale-[0.98]',
        className
      )}
    >
      {/* Header: Plan name + Status badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              'p-2 rounded-lg shrink-0',
              isActive
                ? 'bg-success/10 ring-1 ring-success/20'
                : 'bg-muted ring-1 ring-border'
            )}
          >
            <Activity
              className={cn(
                'size-4',
                isActive ? 'text-success' : 'text-muted-foreground'
              )}
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {subscription.plan?.name || t('user.dashboard.subscription.unknownPlan')}
            </h3>
            {isActive && daysRemaining !== null && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="size-3" />
                {t('common.time.days', { count: daysRemaining })}
              </span>
            )}
          </div>
        </div>
        <span className={cn(getBadgeClass(statusConfig.variant), 'text-xs shrink-0')}>
          {statusConfig.label}
        </span>
      </div>

      {/* Traffic Usage Section */}
      {isActive && trafficLimit > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">
              {t('user.dashboard.stats.totalTraffic')}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {usagePercent.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                getProgressColor(usagePercent)
              )}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-sm font-medium tabular-nums text-foreground">
              {usedFormatted.value} <span className="text-muted-foreground">{usedFormatted.unit}</span>
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              / {limitFormatted.value} {limitFormatted.unit}
            </span>
          </div>
        </div>
      )}

      {/* Footer: Expiry date + Navigate arrow */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3.5" />
          {formatDate(subscription.currentPeriodEnd)}
        </span>
        <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
};
