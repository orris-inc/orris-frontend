/**
 * Subscription Entry Card Component
 * Displays subscription summary with click-to-navigate functionality
 *
 * Uses ViewTransitionLink for proper keyboard navigation and accessibility
 */

import { useTranslation } from 'react-i18next';
import { Calendar, ChevronRight, Clock, Activity, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBadgeClass } from '@/lib/ui-styles';
import { ViewTransitionLink } from '@/components/common/ViewTransitionLink';
import type { DashboardSubscription } from '@/api/user/types';
import type { TFunction } from 'i18next';

interface SubscriptionEntryCardProps {
  subscription: DashboardSubscription;
  className?: string;
  compact?: boolean;
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
      return { label: t('common.status.enabled'), variant: 'success' as const };
    case 'trialing':
      return { label: t('subscriptionStatus.trialing'), variant: 'info' as const };
    case 'past_due':
      return { label: t('subscriptionStatus.pastDue'), variant: 'warning' as const };
    case 'pending_payment':
      return { label: t('subscriptionStatus.pendingPayment'), variant: 'warning' as const };
    case 'suspended':
      return { label: t('common.status.suspended'), variant: 'destructive' as const };
    case 'expired':
      return { label: t('common.status.expired'), variant: 'destructive' as const };
    case 'cancelled':
      return { label: t('common.status.cancelled'), variant: 'outline' as const };
    case 'inactive':
      return { label: t('common.status.disabled'), variant: 'secondary' as const };
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

import { formatDate, isNeverExpiresDate } from '@/shared/utils/date-utils';

/**
 * Get progress bar color based on usage percentage
 */
const getProgressColor = (percent: number) => {
  if (percent > 90) return 'bg-destructive';
  if (percent > 70) return 'bg-warning';
  return 'bg-success';
};

/**
 * Get card ring style based on status
 */
const getCardRingStyle = (status: string, isActive: boolean) => {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'ring-success/20 hover:ring-success/40';
    case 'past_due':
    case 'pending_payment':
      return 'ring-warning/30 hover:ring-warning/50';
    case 'suspended':
      return 'ring-destructive/30 hover:ring-destructive/50';
    default:
      return isActive
        ? 'ring-success/20 hover:ring-success/40'
        : 'ring-border hover:ring-border/80';
  }
};

/**
 * Subscription entry card - displays subscription summary and navigates to detail page
 * Uses ViewTransitionLink for proper keyboard navigation and accessibility (card-as-link pattern)
 * Mobile-first: compact padding on mobile, larger on sm+
 */
export const SubscriptionEntryCard = ({
  subscription,
  className,
  compact = false,
}: SubscriptionEntryCardProps) => {
  const { t } = useTranslation();
  const statusConfig = getStatusConfig(subscription.status, t);
  const isActive = subscription.isActive;
  const limits = subscription.plan?.limits as { trafficLimit?: number } | undefined;
  const trafficLimit = limits?.trafficLimit ?? 0;
  const usagePercent = trafficLimit > 0 ? (subscription.usage.total / trafficLimit) * 100 : 0;
  const neverExpires = isNeverExpiresDate(subscription.currentPeriodEnd);
  const daysRemaining = neverExpires ? null : getDaysRemaining(subscription.currentPeriodEnd);

  const usedFormatted = formatTraffic(subscription.usage.total);
  const limitFormatted = formatTraffic(trafficLimit);

  const ringStyle = getCardRingStyle(subscription.status, isActive);

  return (
    <ViewTransitionLink
      to={`/dashboard/subscriptions/${subscription.id}`}
      className={cn(
        // Mobile: compact p-2 when compact, otherwise p-3; sm+: p-3/p-4
        compact ? 'relative block p-2 sm:p-3 lg:p-4 rounded-xl touch-target' : 'relative block p-3 sm:p-4 lg:p-5 rounded-xl touch-target',
        'transition-all duration-200 group',
        'bg-card ring-1 hover:shadow-md',
        ringStyle,
        'active:scale-[0.98]',
        // Focus visible for keyboard navigation
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      {/* Header: Plan name + Status badge */}
      <div
        className={cn(
          'flex items-start justify-between gap-2 sm:gap-3',
          compact ? 'mb-1.5 sm:mb-2' : 'mb-2 sm:mb-3'
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className={cn(
              // Mobile: smaller icon container
              'p-1.5 sm:p-2 rounded-lg shrink-0',
              subscription.status === 'active' || subscription.status === 'trialing'
                ? 'bg-success/10 ring-1 ring-success/20'
                : subscription.status === 'past_due' || subscription.status === 'pending_payment'
                  ? 'bg-warning/10 ring-1 ring-warning/20'
                  : subscription.status === 'suspended'
                    ? 'bg-destructive/10 ring-1 ring-destructive/20'
                    : 'bg-muted ring-1 ring-border'
            )}
          >
            <Activity
              className={cn(
                // Mobile: smaller icon
                'size-3.5 sm:size-4',
                subscription.status === 'active' || subscription.status === 'trialing'
                  ? 'text-success'
                  : subscription.status === 'past_due' || subscription.status === 'pending_payment'
                    ? 'text-warning'
                    : subscription.status === 'suspended'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
              )}
            />
          </div>
          <div className="min-w-0">
            {/* Mobile: smaller font */}
            <h3 className={cn('font-semibold text-foreground truncate', compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base')}>
              {subscription.plan?.name || t('user.dashboard.subscription.unknownPlan')}
            </h3>
            {isActive && (neverExpires || daysRemaining !== null) && (
              <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="size-2.5 sm:size-3" />
                {neverExpires ? t('common.fields.neverExpires') : t('common.time.days', { count: daysRemaining ?? 0 })}
              </span>
            )}
          </div>
        </div>
        {/* Mobile: smaller badge */}
        <span className={cn(getBadgeClass(statusConfig.variant), 'text-[10px] sm:text-xs shrink-0')}>
          {statusConfig.label}
        </span>
      </div>

      {/* Traffic Usage Section — keeps card heights consistent across capped/unlimited plans */}
      {isActive && (
        <div className={cn(compact ? 'hidden sm:block mb-2' : 'mb-2 sm:mb-3')}>
          <div className="flex items-center justify-between mb-1 sm:mb-1.5">
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {t('user.dashboard.stats.totalTraffic')}
            </span>
            {trafficLimit > 0 ? (
              <span className="text-[10px] sm:text-xs tabular-nums text-muted-foreground">
                {usagePercent.toFixed(0)}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
                <InfinityIcon className="size-3 sm:size-3.5" strokeWidth={2} />
                <span>{t('common.unlimited')}</span>
              </span>
            )}
          </div>
          {trafficLimit > 0 ? (
            <div className="h-1.5 sm:h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  getProgressColor(usagePercent)
                )}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          ) : (
            <div
              className="h-1.5 sm:h-2 rounded-full"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, var(--color-muted) 0 4px, transparent 4px 8px)',
              }}
              aria-hidden="true"
            />
          )}
          <div className="flex items-center justify-between mt-1 sm:mt-1.5">
            <span className="text-xs sm:text-sm font-medium tabular-nums text-foreground">
              {usedFormatted.value} <span className="text-muted-foreground">{usedFormatted.unit}</span>
            </span>
            {trafficLimit > 0 && (
              <span className="text-[10px] sm:text-xs tabular-nums text-muted-foreground">
                / {limitFormatted.value} {limitFormatted.unit}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer: Expiry date + Navigate arrow */}
      <div className={cn('flex items-center justify-between border-t border-border/50', compact ? 'pt-1.5' : 'pt-2')}>
        <span className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
          <Calendar className="size-3 sm:size-3.5" />
          {neverExpires ? t('common.fields.neverExpires') : formatDate(subscription.currentPeriodEnd)}
        </span>
        <ChevronRight className="size-3.5 sm:size-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </ViewTransitionLink>
  );
};
