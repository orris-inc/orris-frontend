/**
 * Hero Stats Section Component
 * Adaptive stats display that changes based on subscription count
 *
 * Single subscription: Shows traffic usage (with progress) + expiry time
 * Multiple subscriptions: Shows active count + nearest expiry + total traffic
 *
 * Design: Mobile-first with 2-column grid, expands to flex on lg+
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Clock, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeroStatCard } from './HeroStatCard';
import type { DashboardSubscription, UsageSummary } from '@/api/user/types';

interface HeroStatsSectionProps {
  /** All user subscriptions */
  subscriptions: DashboardSubscription[];
  /** Combined usage across all subscriptions */
  totalUsage: UsageSummary;
  /** Whether the data is loading */
  isLoading?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Format bytes to readable traffic units
 */
const formatTraffic = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = (bytes / Math.pow(k, i)).toFixed(1);
  return `${value} ${units[i]}`;
};

/**
 * Calculate days until a date
 */
const getDaysUntil = (dateString: string): number => {
  const target = new Date(dateString);
  const now = new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
};

/**
 * Format date for display
 */
const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

interface DashboardStats {
  activeCount: number;
  isSingleSubscription: boolean;
  primarySubscription: DashboardSubscription | null;
  nearestExpiry: DashboardSubscription | null;
  totalUsage: UsageSummary;
  trafficLimit: number;
  hasTrafficLimit: boolean;
}

/**
 * Compute aggregated statistics from subscriptions
 */
const computeStats = (
  subscriptions: DashboardSubscription[],
  totalUsage: UsageSummary
): DashboardStats => {
  const active = subscriptions.filter((s) => s.isActive);
  const isSingleSubscription = active.length === 1;

  // Find subscription expiring soonest
  const nearestExpiry =
    active
      .filter((s) => s.currentPeriodEnd)
      .sort(
        (a, b) =>
          new Date(a.currentPeriodEnd).getTime() - new Date(b.currentPeriodEnd).getTime()
      )[0] ?? null;

  const primarySubscription = isSingleSubscription ? (active[0] ?? null) : null;

  // Calculate traffic limit for single subscription
  const limits = primarySubscription?.plan?.limits as { trafficLimit?: number } | undefined;
  const trafficLimit = limits?.trafficLimit ?? 0;

  return {
    activeCount: active.length,
    isSingleSubscription,
    primarySubscription,
    nearestExpiry,
    totalUsage,
    trafficLimit,
    hasTrafficLimit: trafficLimit > 0,
  };
};

/**
 * Loading skeleton for Hero stats
 */
const HeroStatsSkeleton = ({ className }: { className?: string }) => (
  <section className={cn('grid grid-cols-2 gap-3 sm:gap-4', className)}>
    {[1, 2].map((i) => (
      <div
        key={i}
        className="rounded-xl border bg-card/80 p-3 sm:p-4 animate-pulse"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="hidden sm:block size-7 rounded-lg bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
        <div className="h-6 w-20 rounded bg-muted" />
        <div className="h-2 w-full rounded bg-muted mt-2" />
      </div>
    ))}
  </section>
);

/**
 * Hero Stats Section - Adaptive display based on subscription count
 * Mobile: 2-column grid; Desktop: flexible horizontal layout
 */
export const HeroStatsSection = ({
  subscriptions,
  totalUsage,
  isLoading = false,
  className,
}: HeroStatsSectionProps) => {
  const { t } = useTranslation();

  const stats = useMemo(
    () => computeStats(subscriptions, totalUsage),
    [subscriptions, totalUsage]
  );

  if (isLoading) {
    return <HeroStatsSkeleton className={className} />;
  }

  // No active subscriptions - don't render hero section
  if (stats.activeCount === 0) {
    return null;
  }

  // Single subscription view
  if (stats.isSingleSubscription && stats.primarySubscription) {
    const sub = stats.primarySubscription;
    const daysRemaining = getDaysUntil(sub.currentPeriodEnd);
    const usageValue = formatTraffic(sub.usage.total);

    return (
      <section
        className={cn(
          // Hero gradient background
          'rounded-xl border bg-gradient-to-br from-primary/5 via-transparent to-transparent',
          'p-3 sm:p-4',
          className
        )}
      >
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:flex lg:gap-6">
          {/* Traffic Usage Card */}
          <HeroStatCard
            className="lg:flex-1"
            icon={Database}
            iconVariant="primary"
            title={t('user.dashboard.hero.trafficUsage')}
            value={usageValue}
            subtitle={
              stats.hasTrafficLimit
                ? `${Math.round((sub.usage.total / stats.trafficLimit) * 100)}% ${t('user.dashboard.hero.of')} ${formatTraffic(stats.trafficLimit)}`
                : t('common.unlimited')
            }
            progress={
              stats.hasTrafficLimit
                ? { value: sub.usage.total, max: stats.trafficLimit }
                : undefined
            }
          />

          {/* Expiry Card */}
          <HeroStatCard
            className="lg:flex-1"
            icon={Clock}
            iconVariant={daysRemaining <= 7 ? 'warning' : 'success'}
            title={t('user.dashboard.hero.expiresIn')}
            value={t('common.time.days', { count: daysRemaining })}
            subtitle={`${sub.plan?.name ?? t('user.dashboard.subscription.unknownPlan')} · ${formatShortDate(sub.currentPeriodEnd)}`}
          />
        </div>
      </section>
    );
  }

  // Multiple subscriptions view
  const nearestDays = stats.nearestExpiry
    ? getDaysUntil(stats.nearestExpiry.currentPeriodEnd)
    : null;

  return (
    <section
      className={cn(
        // Hero gradient background
        'rounded-xl border bg-gradient-to-br from-primary/5 via-transparent to-transparent',
        'p-3 sm:p-4',
        className
      )}
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Active Subscriptions Count */}
        <HeroStatCard
          icon={Activity}
          iconVariant="success"
          title={t('user.dashboard.hero.activeSubscriptions')}
          value={stats.activeCount}
          subtitle={t('user.dashboard.hero.subscriptionsRunning')}
        />

        {/* Total Traffic */}
        <HeroStatCard
          icon={Database}
          iconVariant="primary"
          title={t('user.dashboard.hero.totalTraffic')}
          value={formatTraffic(stats.totalUsage.total)}
          subtitle={t('user.dashboard.hero.thisMonth')}
        />

        {/* Nearest Expiry - Full width row */}
        {stats.nearestExpiry && nearestDays !== null && (
          <div
            className={cn(
              'col-span-2 rounded-xl border bg-card/80 backdrop-blur-sm',
              'p-3 sm:p-4',
              'flex items-center gap-3'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center rounded-lg p-1.5 ring-1',
                nearestDays <= 7
                  ? 'bg-warning/10 ring-warning/20'
                  : 'bg-success/10 ring-success/20'
              )}
            >
              <Clock
                className={cn(
                  'size-3.5 lg:size-4',
                  nearestDays <= 7 ? 'text-warning' : 'text-success'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('user.dashboard.hero.nearestExpiry')}
              </p>
              <p className="text-sm sm:text-base font-medium text-foreground truncate">
                {stats.nearestExpiry.plan?.name ?? t('user.dashboard.subscription.unknownPlan')}{' '}
                <span className="text-muted-foreground">
                  · {t('common.time.days', { count: nearestDays })}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
