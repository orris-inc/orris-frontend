/**
 * Dashboard Main Page - User Overview
 * Modern Bento Grid layout with usage stats and subscription management
 */

import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CircleAlert,
  CreditCard,
  Loader2,
  Activity,
  Sparkles,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Clock,
  History,
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { usePageTitle } from '@/shared/hooks';
import { getDashboard } from '@/api/user';
import { getTrafficStats } from '@/api/subscription';
import type { DashboardResponse, DashboardSubscription } from '@/api/user/types';
import { SubscriptionEntryCard } from '@/components/dashboard/SubscriptionEntryCard';
import { getBadgeClass, getButtonClass } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';
import { ViewTransitionLink } from '@/components/common/ViewTransitionLink';
import {
  SectionHeader,
  EmptyState,
  QuickActionLink,
} from '@/components/common/bento';
import { formatDate } from '@/shared/utils/date-utils';

/**
 * Subscription status groups for display
 */
type SubscriptionGroup = 'active' | 'attention' | 'history';

/**
 * Categorize subscription by status
 */
const getSubscriptionGroup = (status: string): SubscriptionGroup => {
  // Active subscriptions: currently usable
  if (['active', 'trialing', 'past_due'].includes(status)) {
    return 'active';
  }
  // Attention needed: requires user action
  if (['pending_payment', 'suspended'].includes(status)) {
    return 'attention';
  }
  // History: ended subscriptions
  return 'history';
};

/**
 * Group subscriptions by status category
 */
const groupSubscriptions = (subscriptions: DashboardSubscription[]) => {
  const groups: Record<SubscriptionGroup, DashboardSubscription[]> = {
    active: [],
    attention: [],
    history: [],
  };

  subscriptions.forEach((sub) => {
    const group = getSubscriptionGroup(sub.status);
    groups[group].push(sub);
  });

  return groups;
};

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

/** Status message type for dynamic welcome message */
type StatusType = 'noSubscription' | 'expiringSoon' | 'highUsage' | 'allGood';

interface StatusMessage {
  type: StatusType;
  message: string;
  variant: 'warning' | 'info' | 'success';
}

const statusVariantStyles: Record<StatusMessage['variant'], string> = {
  warning: 'text-warning',
  info: 'text-muted-foreground',
  success: 'text-success',
};

/**
 * Calculate days until subscription expires
 */
const getDaysUntilExpiry = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Get dynamic status message based on user's subscription state
 */
const getStatusMessage = (
  t: ReturnType<typeof useTranslation>['t'],
  subscriptions: DashboardResponse['subscriptions']
): StatusMessage => {
  if (subscriptions.length === 0) {
    return {
      type: 'noSubscription',
      message: t('user.dashboard.status.noSubscription'),
      variant: 'info',
    };
  }

  const activeSubscriptions = subscriptions.filter((s) => s.isActive);

  const expiringSoon = activeSubscriptions.find((s) => {
    const days = getDaysUntilExpiry(s.currentPeriodEnd);
    return days > 0 && days <= 7;
  });

  if (expiringSoon) {
    const days = getDaysUntilExpiry(expiringSoon.currentPeriodEnd);
    return {
      type: 'expiringSoon',
      message: t('user.dashboard.status.expiringSoon', { days, plan: expiringSoon.plan?.name ?? '' }),
      variant: 'warning',
    };
  }

  const highUsage = activeSubscriptions.find((s) => {
    const limits = s.plan?.limits as { trafficLimit?: number } | undefined;
    const trafficLimit = limits?.trafficLimit ?? 0;
    if (trafficLimit <= 0) return false;
    const usagePercent = (s.usage.total / trafficLimit) * 100;
    return usagePercent >= 80;
  });

  if (highUsage) {
    const limits = highUsage.plan?.limits as { trafficLimit?: number } | undefined;
    const trafficLimit = limits?.trafficLimit ?? 0;
    const usagePercent = Math.round((highUsage.usage.total / trafficLimit) * 100);
    return {
      type: 'highUsage',
      message: t('user.dashboard.status.highUsage', { percent: usagePercent }),
      variant: 'warning',
    };
  }

  return {
    type: 'allGood',
    message: t('user.dashboard.status.allGood', { count: activeSubscriptions.length }),
    variant: 'success',
  };
};

/**
 * Trend range helper
 */
const getTrendDays = (range: '7d' | '30d' | '90d') => (range === '7d' ? 7 : range === '30d' ? 30 : 90);

/**
 * Build day keys for a date range
 */
const buildDayKeys = (from: Date, days: number) =>
  Array.from({ length: days }, (_, index) => {
    const d = new Date(from);
    d.setDate(from.getDate() + index);
    return d.toISOString().slice(0, 10);
  });

/**
 * Build trend bars from traffic stats records
 */
const buildTrendBars = (
  records: { total: number; period: string }[],
  range: '7d' | '30d' | '90d'
) => {
  const days = getTrendDays(range);
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);

  const dayKeys = buildDayKeys(from, days);
  const totalsByDay = dayKeys.reduce<Record<string, number>>((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

  records.forEach((record) => {
    const date = new Date(record.period);
    if (Number.isNaN(date.getTime())) return;
    const key = date.toISOString().slice(0, 10);
    if (key in totalsByDay) {
      totalsByDay[key] += record.total;
    }
  });

  const dailyTotals = dayKeys.map((key) => totalsByDay[key]);
  const bucketCount = range === '7d' ? 7 : range === '30d' ? 12 : 18;
  const bucketSize = Math.ceil(dailyTotals.length / bucketCount);
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const start = index * bucketSize;
    const end = Math.min(dailyTotals.length, start + bucketSize);
    const slice = dailyTotals.slice(start, end);
    return slice.reduce((sum, value) => sum + value, 0);
  });

  const maxValue = Math.max(...buckets, 1);
  return buckets.map((value) => Math.max(6, Math.round((value / maxValue) * 100)));
};

/**
 * Get status badge for subscription
 */
const getStatusBadge = (status: string, t: ReturnType<typeof useTranslation>['t']) => {
  switch (status) {
    case 'active':
      return { label: t('common.status.active'), variant: 'success' as const };
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
      return { label: t('common.status.inactive'), variant: 'secondary' as const };
    default:
      return { label: status, variant: 'secondary' as const };
  }
};

export const DashboardPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('user.dashboard.title'));

  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getDashboard();
        setDashboardData(data);
      } catch {
        // Failed to fetch dashboard data
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group subscriptions by status category
  const groupedSubscriptions = useMemo(() => {
    if (!dashboardData) return null;
    return groupSubscriptions(dashboardData.subscriptions);
  }, [dashboardData]);

  // Track collapsed state for history section
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [trendRange, setTrendRange] = useState<'7d' | '30d' | '90d'>('30d');

  const statusMessage = useMemo(() => {
    if (!dashboardData) return null;
    return getStatusMessage(t, dashboardData.subscriptions);
  }, [dashboardData, t]);

  const [trendLoading, setTrendLoading] = useState(false);
  const [trendBars, setTrendBars] = useState<number[]>([]);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <CircleAlert className="size-5" />
          <span>{t('user.dashboard.errorLoadUser')}</span>
        </div>
      </DashboardLayout>
    );
  }

  const subscriptions = dashboardData?.subscriptions ?? [];
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.isActive);
  const primarySubscription = activeSubscriptions[0];
  const primaryStatus = primarySubscription
    ? getStatusBadge(primarySubscription.status, t)
    : null;
  const remainingDays =
    primarySubscription && primarySubscription.currentPeriodEnd
      ? getDaysUntilExpiry(primarySubscription.currentPeriodEnd)
      : null;
  const trafficLimit =
    (primarySubscription?.plan?.limits as { trafficLimit?: number } | undefined)?.trafficLimit ?? 0;
  const hasTrafficLimit = trafficLimit > 0;
  const usage = primarySubscription?.usage?.total ?? 0;
  const usagePercent = hasTrafficLimit ? Math.min(100, Math.round((usage / trafficLimit) * 100)) : 0;
  const usageUsed = formatTraffic(usage);
  const usageCap = formatTraffic(trafficLimit);

  useEffect(() => {
    const fetchTrend = async () => {
      if (!primarySubscription) {
        setTrendBars([]);
        return;
      }
      setTrendLoading(true);
      try {
        const days = getTrendDays(trendRange);
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - (days - 1));
        from.setHours(0, 0, 0, 0);

        const data = await getTrafficStats(primarySubscription.id, {
          from: from.toISOString(),
          to: to.toISOString(),
          granularity: 'day',
          page: 1,
          pageSize: 1000,
        });

        const bars = buildTrendBars(data.records, trendRange);
        setTrendBars(bars);
      } catch {
        setTrendBars([]);
      } finally {
        setTrendLoading(false);
      }
    };

    fetchTrend();
  }, [primarySubscription?.id, trendRange]);

  return (
    <DashboardLayout
      pageTitle={t('user.dashboard.title')}
      pageDescription={
        isLoading
          ? t('common.table.loading')
          : statusMessage
            ? (
                <span className={statusVariantStyles[statusMessage.variant]}>
                  {statusMessage.message}
                </span>
              )
            : null
      }
      pageActions={
        <>
          <ViewTransitionLink
            to="/dashboard/pricing"
            className={cn(getButtonClass('default', 'sm'), 'w-full sm:w-auto h-9 px-3')}
          >
            {t('user.dashboard.quickActions.upgrade')}
          </ViewTransitionLink>
          <ViewTransitionLink
            to="/dashboard/pricing"
            className={cn(getButtonClass('secondary', 'sm'), 'w-full sm:w-auto h-9 px-3')}
          >
            {t('user.dashboard.viewAllPlans')}
          </ViewTransitionLink>
        </>
      }
    >
      <div className="space-y-6 pb-safe">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <main className="lg:col-span-8 space-y-6">
            {/* Subscriptions Section */}
            <section>
              <SectionHeader
                icon={CreditCard}
                title={t('user.dashboard.mySubscriptions')}
                count={activeSubscriptions.length}
                secondaryCount={subscriptions.length}
                action={
                  <ViewTransitionLink
                    to="/dashboard/pricing"
                    className={cn(
                      'text-sm text-primary hover:text-primary/80 transition-colors',
                      'flex items-center gap-1 touch-target'
                    )}
                  >
                    {t('user.dashboard.viewAllPlans')}
                    <ChevronRight className="size-4" />
                  </ViewTransitionLink>
                }
              />

              {!isLoading && groupedSubscriptions && subscriptions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground mb-3">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/60 px-2 py-0.5">
                    <span className="size-1 rounded-full bg-success" />
                    <span className="tabular-nums">
                      {t('user.dashboard.groups.active')} {groupedSubscriptions.active.length}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/60 px-2 py-0.5">
                    <span className="size-1 rounded-full bg-warning" />
                    <span className="tabular-nums">
                      {t('user.dashboard.groups.attention')} {groupedSubscriptions.attention.length}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/60 px-2 py-0.5">
                    <span className="size-1 rounded-full bg-muted-foreground" />
                    <span className="tabular-nums">
                      {t('user.dashboard.groups.history')} {groupedSubscriptions.history.length}
                    </span>
                  </span>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12 bg-card rounded-xl border">
                  <Loader2 className="size-5 animate-spin mr-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t('common.table.loading')}</span>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && subscriptions.length === 0 && (
                <EmptyState
                  icon={CreditCard}
                  title={t('user.dashboard.empty.title')}
                  description={t('user.dashboard.empty.description')}
                  action={
                    <ViewTransitionLink
                      to="/dashboard/pricing"
                      className={cn(
                        getButtonClass('default', 'default'),
                        'touch-target inline-flex items-center justify-center gap-2'
                      )}
                    >
                      <Sparkles className="size-4" />
                      {t('user.dashboard.empty.viewPlans')}
                    </ViewTransitionLink>
                  }
                />
              )}

              {/* Grouped Subscription Cards */}
              {!isLoading && subscriptions.length > 0 && groupedSubscriptions && (
                <div className="space-y-6">
                  {/* Attention Needed - With warning style */}
                  {groupedSubscriptions.attention.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-warning">
                        <AlertTriangle className="size-4" />
                        <span>{t('user.dashboard.groups.attention')}</span>
                        <span className="opacity-70">({groupedSubscriptions.attention.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupedSubscriptions.attention.map((subscription) => (
                          <SubscriptionEntryCard
                            key={subscription.id}
                            subscription={subscription}
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Subscriptions - Always visible */}
                  {groupedSubscriptions.active.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Activity className="size-4 text-success" />
                        <span>{t('user.dashboard.groups.active')}</span>
                        <span className="text-muted-foreground">
                          ({groupedSubscriptions.active.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupedSubscriptions.active.map((subscription) => (
                          <SubscriptionEntryCard
                            key={subscription.id}
                            subscription={subscription}
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* History - Collapsible with proper Disclosure pattern */}
                  {groupedSubscriptions.history.length > 0 && (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                        aria-expanded={isHistoryExpanded}
                        aria-controls="history-subscriptions"
                        className={cn(
                          'flex items-center gap-2 text-sm font-medium text-muted-foreground',
                          'hover:text-foreground transition-colors touch-target w-full justify-start'
                        )}
                      >
                        <History className="size-4" />
                        <span>{t('user.dashboard.groups.history')}</span>
                        <span className="opacity-70">({groupedSubscriptions.history.length})</span>
                        <ChevronDown
                          className={cn(
                            'size-4 ml-auto transition-transform duration-200',
                            isHistoryExpanded && 'rotate-180'
                          )}
                        />
                      </button>
                      {isHistoryExpanded && (
                        <div
                          id="history-subscriptions"
                          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                        >
                          {groupedSubscriptions.history.map((subscription) => (
                            <SubscriptionEntryCard
                              key={subscription.id}
                              subscription={subscription}
                              compact
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* No active subscriptions but has history */}
                  {groupedSubscriptions.active.length === 0 &&
                    groupedSubscriptions.attention.length === 0 &&
                    groupedSubscriptions.history.length > 0 && (
                      <div className="p-4 bg-muted/50 rounded-xl border border-dashed text-center">
                        <Clock className="size-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {t('user.dashboard.groups.noActiveHint')}
                        </p>
                        <ViewTransitionLink
                          to="/dashboard/pricing"
                          className={cn(
                            getButtonClass('default', 'sm'),
                            'mt-3 inline-flex items-center gap-2'
                          )}
                        >
                          <Sparkles className="size-4" />
                          {t('user.dashboard.empty.viewPlans')}
                        </ViewTransitionLink>
                      </div>
                    )}
                </div>
              )}
            </section>
          </main>

          <aside className="lg:col-span-4 space-y-6">
            {/* Current Plan Card */}
            {primarySubscription && primaryStatus && (
              <section className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {t('user.dashboard.currentPlan.title')}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-foreground truncate">
                      {primarySubscription.plan?.name ||
                        t('user.dashboard.subscription.unknownPlan')}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      getBadgeClass(primaryStatus.variant),
                      'text-[10px] sm:text-xs shrink-0'
                    )}
                  >
                    {primaryStatus.label}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>{t('user.dashboard.currentPlan.expires')}</span>
                    <span className="text-foreground">
                      {formatDate(primarySubscription.currentPeriodEnd)}
                    </span>
                  </div>
                  {remainingDays !== null && remainingDays > 0 && (
                    <div className="flex items-center justify-between">
                      <span>{t('user.dashboard.currentPlan.remaining')}</span>
                      <span className="text-foreground tabular-nums">
                        {t('common.time.days', { count: remainingDays })}
                      </span>
                    </div>
                  )}
                </div>
                <ViewTransitionLink
                  to={`/dashboard/subscriptions/${primarySubscription.id}`}
                  className={cn(
                    getButtonClass('secondary', 'sm'),
                    'mt-4 w-full inline-flex items-center justify-center gap-2'
                  )}
                >
                  {t('user.dashboard.currentPlan.manage')}
                  <ChevronRight className="size-4" />
                </ViewTransitionLink>
              </section>
            )}

            {/* Usage Progress Card */}
            {primarySubscription && (
              <section className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">
                    {t('dashboard.traffic.title')}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {hasTrafficLimit
                      ? `${usagePercent}${t('dashboard.traffic.percentUsed')}`
                      : t('common.unlimited')}
                  </span>
                </div>
                {hasTrafficLimit && (
                  <div className="mt-3 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  {usageUsed.value}
                  {usageUsed.unit}
                  {hasTrafficLimit && (
                    <>
                      {' '}
                      / {usageCap.value}
                      {usageCap.unit}
                    </>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('dashboard.traffic.monthlyUsage')}
                </p>
              </section>
            )}

            {/* Usage Trend Card */}
            {primarySubscription && (
              <section className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">
                      {t('user.dashboard.usageTrend.title')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t('user.dashboard.usageTrend.subtitle')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                    {(['7d', '30d', '90d'] as const).map((range) => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => setTrendRange(range)}
                        aria-pressed={trendRange === range}
                        className={cn(
                          'px-2 py-1 text-[10px] font-medium rounded-full transition-colors',
                          trendRange === range
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {t(`user.dashboard.usageTrend.ranges.${range}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 h-24">
                  {trendLoading ? (
                    <div className="h-full rounded-md bg-muted/60 animate-pulse" />
                  ) : trendBars.length > 0 ? (
                    <div className="flex items-end gap-1.5 h-full">
                      {trendBars.map((value, index) => (
                        <div
                          key={`${trendRange}-${index}`}
                          className="flex-1 rounded-sm bg-muted/60 overflow-hidden"
                        >
                          <div
                            className="w-full rounded-sm bg-primary/70 transition-all"
                            style={{ height: `${value}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      {t('common.messages.noData')}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('user.dashboard.usageTrend.note')}
                </p>
              </section>
            )}

            {/* Quick Actions - Mobile-first full width */}
            {!isLoading && subscriptions.length > 0 && (
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                <QuickActionLink
                  to="/dashboard/pricing"
                  icon={Sparkles}
                  title={t('user.dashboard.quickActions.upgrade')}
                  description={t('user.dashboard.quickActions.upgradeDesc')}
                  variant="primary"
                />
                <QuickActionLink
                  to="/dashboard/pricing"
                  icon={CreditCard}
                  title={t('user.dashboard.quickActions.viewPlans')}
                  description={t('user.dashboard.quickActions.viewPlansDesc')}
                  variant="success"
                />
              </section>
            )}
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};
