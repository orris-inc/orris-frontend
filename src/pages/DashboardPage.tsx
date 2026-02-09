/**
 * Dashboard Main Page - User Overview
 * Modern Bento Grid layout with Hero stats and subscription management
 *
 * Hero Section adapts based on subscription count:
 * - Single subscription: Traffic usage (with progress) + Expiry time
 * - Multiple subscriptions: Active count + Nearest expiry + Total traffic
 */

import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
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
  Bell,
  Megaphone,
  Wrench,
  Gift,
  Info,
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { usePageTitle } from '@/shared/hooks';
import { getDashboard } from '@/api/user';
import { listPublicAnnouncements } from '@/api/notification';
import type { Announcement, AnnouncementType } from '@/api/notification/types';
import { queryKeys } from '@/shared/lib/query-client';
import type { DashboardResponse, DashboardSubscription } from '@/api/user/types';
import { SubscriptionEntryCard, HeroStatsSection } from '@/components/dashboard';
import { getButtonClass } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';
import { ViewTransitionLink } from '@/components/common/ViewTransitionLink';
import {
  SectionHeader,
  EmptyState,
  QuickActionLink,
} from '@/components/common/bento';

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
 * Get icon for announcement type
 */
const getAnnouncementIcon = (type: AnnouncementType) => {
  switch (type) {
    case 'system':
      return Info;
    case 'maintenance':
      return Wrench;
    case 'feature':
      return Sparkles;
    case 'promotion':
      return Gift;
    default:
      return Megaphone;
  }
};

/**
 * Get style for announcement type
 */
const getAnnouncementTypeStyle = (type: AnnouncementType) => {
  switch (type) {
    case 'system':
      return 'text-info';
    case 'maintenance':
      return 'text-warning';
    case 'feature':
      return 'text-success';
    case 'promotion':
      return 'text-relay';
    default:
      return 'text-muted-foreground';
  }
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

  // Fetch public announcements
  const { data: announcementsData, isLoading: isAnnouncementsLoading } = useQuery({
    queryKey: queryKeys.announcements.public({ page: 1, pageSize: 5 }),
    queryFn: () => listPublicAnnouncements({ page: 1, pageSize: 5 }),
  });

  const announcements = announcementsData?.items ?? [];

  // Group subscriptions by status category
  const groupedSubscriptions = useMemo(() => {
    if (!dashboardData) return null;
    return groupSubscriptions(dashboardData.subscriptions);
  }, [dashboardData]);

  // Track collapsed state for history section
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const statusMessage = useMemo(() => {
    if (!dashboardData) return null;
    return getStatusMessage(t, dashboardData.subscriptions);
  }, [dashboardData, t]);

  const subscriptions = useMemo(
    () => dashboardData?.subscriptions ?? [],
    [dashboardData?.subscriptions]
  );
  const activeSubscriptions = useMemo(
    () => subscriptions.filter((subscription) => subscription.isActive),
    [subscriptions]
  );
  const totalUsage = dashboardData?.totalUsage ?? { upload: 0, download: 0, total: 0 };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center gap-3 p-4 bg-destructive/10 ring-1 ring-destructive/20 rounded-xl text-destructive">
          <CircleAlert className="size-5" />
          <span>{t('user.dashboard.errorLoadUser')}</span>
        </div>
      </DashboardLayout>
    );
  }

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
        {/* Hero Stats Section - Full width, adaptive display */}
        <HeroStatsSection
          subscriptions={subscriptions}
          totalUsage={totalUsage}
          isLoading={isLoading}
        />

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
                <div className="flex items-center justify-center py-12 bg-card rounded-xl ring-1 ring-border">
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
            {/* Announcements Card */}
            <section className="rounded-xl ring-1 ring-border bg-card p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">
                  {t('user.dashboard.announcements.title')}
                </h3>
              </div>

              {/* Loading State */}
              {isAnnouncementsLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Empty State */}
              {!isAnnouncementsLoading && announcements.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('user.dashboard.announcements.empty')}
                  </p>
                </div>
              )}

              {/* Announcements List */}
              {!isAnnouncementsLoading && announcements.length > 0 && (
                <div className="space-y-3">
                  {announcements.map((announcement: Announcement) => {
                    const Icon = getAnnouncementIcon(announcement.type);
                    const typeStyle = getAnnouncementTypeStyle(announcement.type);
                    const isUnread = !announcement.isRead;
                    return (
                      <div
                        key={announcement.id}
                        className={cn(
                          'group relative flex gap-3 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer',
                          isUnread && 'bg-muted/30'
                        )}
                      >
                        {/* Unread indicator */}
                        {isUnread && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full" />
                        )}
                        <div className={cn('shrink-0 mt-0.5', typeStyle)}>
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors',
                              isUnread ? 'font-semibold' : 'font-medium'
                            )}
                          >
                            {announcement.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(announcement.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

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
