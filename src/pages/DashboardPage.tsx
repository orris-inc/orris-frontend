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
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { usePageTitle } from '@/shared/hooks';
import { getDashboard } from '@/api/user';
import type { DashboardResponse } from '@/api/user/types';
import { SubscriptionEntryCard } from '@/components/dashboard/SubscriptionEntryCard';
import { getButtonClass } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';
import { ViewTransitionLink } from '@/components/common/ViewTransitionLink';
import {
  PageHeroSection,
  BentoStatCard,
  SectionHeader,
  EmptyState,
  QuickActionLink,
} from '@/components/common/bento';

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
 * Get greeting based on time of day
 */
const getGreeting = (t: ReturnType<typeof useTranslation>['t']): string => {
  const hour = new Date().getHours();
  if (hour < 12) return t('user.dashboard.greeting.morning');
  if (hour < 18) return t('user.dashboard.greeting.afternoon');
  return t('user.dashboard.greeting.evening');
};

/** Status message type for dynamic welcome message */
type StatusType = 'noSubscription' | 'expiringSoon' | 'highUsage' | 'allGood';

interface StatusMessage {
  type: StatusType;
  message: string;
  variant: 'warning' | 'info' | 'success';
}

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

  const stats = useMemo(() => {
    if (!dashboardData) return null;
    const { totalUsage, subscriptions } = dashboardData;
    const activeCount = subscriptions.filter((s) => s.isActive).length;
    return {
      upload: formatTraffic(totalUsage.upload),
      download: formatTraffic(totalUsage.download),
      total: formatTraffic(totalUsage.total),
      activeSubscriptions: activeCount,
      totalSubscriptions: subscriptions.length,
    };
  }, [dashboardData]);

  const statusMessage = useMemo(() => {
    if (!dashboardData) return null;
    return getStatusMessage(t, dashboardData.subscriptions);
  }, [dashboardData, t]);

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
  const displayName = user.displayName || user.email?.split('@')[0] || t('user.dashboard.defaultUser');

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-safe">
        {/* Hero Section */}
        <PageHeroSection
          title={displayName}
          subtitle={getGreeting(t)}
          statusMessage={statusMessage?.message}
          statusVariant={statusMessage?.variant}
          icon={Sparkles}
          isLoading={isLoading}
          loadingMessage={t('user.dashboard.loading')}
        />

        {/* Stats Grid */}
        {!isLoading && stats && subscriptions.length > 0 && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <BentoStatCard
              icon={Activity}
              label={t('user.dashboard.stats.totalTraffic')}
              value={stats.total.value}
              unit={stats.total.unit}
              variant="primary"
              large
            />
            <BentoStatCard
              icon={ArrowUpRight}
              label={t('user.dashboard.stats.upload')}
              value={stats.upload.value}
              unit={stats.upload.unit}
              variant="custom"
              iconBgClass="bg-chart-upload/10 ring-chart-upload/20"
              iconColorClass="text-chart-upload"
            />
            <BentoStatCard
              icon={ArrowDownRight}
              label={t('user.dashboard.stats.download')}
              value={stats.download.value}
              unit={stats.download.unit}
              variant="custom"
              iconBgClass="bg-chart-download/10 ring-chart-download/20"
              iconColorClass="text-chart-download"
            />
          </section>
        )}

        {/* Subscriptions Section */}
        <section>
          <SectionHeader
            icon={CreditCard}
            title={t('user.dashboard.mySubscriptions')}
            count={stats?.activeSubscriptions}
            secondaryCount={stats?.totalSubscriptions}
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

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12 bg-card rounded-xl border">
              <Loader2 className="size-5 animate-spin mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('user.dashboard.loading')}</span>
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

          {/* Subscription Cards Grid */}
          {!isLoading && subscriptions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {subscriptions.map((subscription) => (
                <SubscriptionEntryCard key={subscription.id} subscription={subscription} />
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        {!isLoading && subscriptions.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      </div>
    </DashboardLayout>
  );
};
