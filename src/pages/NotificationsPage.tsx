/**
 * Notifications settings page
 * Modern Bento Grid layout for notification preferences and Telegram binding
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  BellOff,
  Clock,
  Activity,
  Send,
  Settings,
} from 'lucide-react';

import { DashboardLayout } from '@/layouts/DashboardLayout';
import { TelegramBindingCard, useTelegramBinding } from '@/features/telegram';
import { cn } from '@/lib/utils';
import { usePageTitle } from '@/shared/hooks';
import {
  BentoStatCard,
  SectionHeader,
  QuickActionLink,
} from '@/components/common/bento';

export const NotificationsPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('notifications.title'));

  const { isLoading, isBound, binding, isNotConfigured } = useTelegramBinding();

  const notificationStats = useMemo(() => {
    const hasExpiringNotify = binding?.notifyExpiring ?? false;
    const hasTrafficNotify = binding?.notifyTraffic ?? false;
    const activeCount = (hasExpiringNotify ? 1 : 0) + (hasTrafficNotify ? 1 : 0);
    const totalChannels = 1;

    return {
      hasExpiringNotify,
      hasTrafficNotify,
      activeCount,
      totalChannels,
      expiringDays: binding?.expiringDays ?? 7,
      trafficThreshold: binding?.trafficThreshold ?? 80,
    };
  }, [binding]);

  const isPageLoading = isLoading;

  const heroStatusMessage = useMemo(() => {
    if (isPageLoading) return undefined;
    if (isBound) return t('notifications.hero.bound', { count: notificationStats.activeCount });
    if (isNotConfigured) return t('notifications.hero.notConfigured');
    return t('notifications.hero.unbound');
  }, [isPageLoading, isBound, isNotConfigured, notificationStats.activeCount, t]);

  return (
    <DashboardLayout
      pageTitle={t('notifications.title')}
      pageDescription={
        <div className="space-y-1">
          <div>{t('notifications.subtitle')}</div>
          {heroStatusMessage && <div>{heroStatusMessage}</div>}
        </div>
      }
    >
      <div className="space-y-6 pb-safe">

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Telegram Status Card - Custom layout */}
          <div className="col-span-2 p-4 sm:p-5 rounded-xl bg-card ring-1 ring-border transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={cn(
                  'p-2 rounded-lg ring-1',
                  isNotConfigured
                    ? 'bg-muted ring-border'
                    : isBound
                      ? 'bg-brand-telegram/10 ring-brand-telegram/20'
                      : 'bg-warning/10 ring-warning/20'
                )}
              >
                <Send
                  className={cn(
                    'size-4 sm:size-5',
                    isNotConfigured
                      ? 'text-muted-foreground'
                      : isBound
                        ? 'text-brand-telegram'
                        : 'text-warning'
                  )}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {t('notifications.telegram.label')}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className={cn(
                  'text-xl sm:text-2xl font-bold',
                  isNotConfigured
                    ? 'text-muted-foreground'
                    : isBound
                      ? 'text-success'
                      : 'text-warning'
                )}
              >
                {isPageLoading
                  ? '-'
                  : isNotConfigured
                    ? t('notifications.status.notConfigured')
                    : isBound
                      ? t('notifications.status.bound')
                      : t('notifications.status.unbound')}
              </span>
            </div>
            {isBound && binding?.telegramUsername && (
              <p className="text-sm text-muted-foreground">
                @{binding.telegramUsername}
              </p>
            )}
          </div>

          {/* Active Notifications - Custom with dynamic icon */}
          <div className="p-4 sm:p-5 rounded-xl bg-card ring-1 ring-border transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <div
                className={cn(
                  'p-1.5 rounded-lg ring-1',
                  isBound && notificationStats.activeCount > 0
                    ? 'bg-success/10 ring-success/20'
                    : 'bg-muted ring-border'
                )}
              >
                {isBound && notificationStats.activeCount > 0 ? (
                  <Bell className="size-4 text-success" />
                ) : (
                  <BellOff className="size-4 text-muted-foreground" />
                )}
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {t('common.status.active')}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-semibold tabular-nums text-foreground">
                {isPageLoading ? '-' : notificationStats.activeCount}
              </span>
              <span className="text-sm text-muted-foreground">/ 2</span>
            </div>
          </div>

          {/* Channels */}
          <BentoStatCard
            icon={Settings}
            label={t('notifications.stats.channels')}
            value={isPageLoading ? '-' : notificationStats.totalChannels}
            unit={t('notifications.stats.channelUnit')}
            variant="primary"
          />
        </section>

        {/* Notification Types Section */}
        <section>
          <SectionHeader icon={Bell} title={t('notifications.types.title')} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Expiry Reminder Card */}
            <div
              className={cn(
                'p-4 sm:p-5 rounded-xl cursor-default',
                'transition-all duration-200',
                'bg-card ring-1',
                notificationStats.hasExpiringNotify ? 'ring-warning/20' : 'ring-border'
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg shrink-0 ring-1',
                      notificationStats.hasExpiringNotify
                        ? 'bg-warning/10 ring-warning/20'
                        : 'bg-muted ring-border'
                    )}
                  >
                    <Clock
                      className={cn(
                        'size-4',
                        notificationStats.hasExpiringNotify ? 'text-warning' : 'text-muted-foreground'
                      )}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {t('notifications.expiring.title')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('notifications.expiring.description')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span
                  className={cn(
                    'text-sm font-medium',
                    notificationStats.hasExpiringNotify ? 'text-success' : 'text-muted-foreground'
                  )}
                >
                  {notificationStats.hasExpiringNotify
                    ? t('common.status.enabled')
                    : t('common.status.disabled')}
                </span>
                {notificationStats.hasExpiringNotify && (
                  <span className="text-xs text-muted-foreground">
                    {t('notifications.expiring.daysAhead', { days: notificationStats.expiringDays })}
                  </span>
                )}
              </div>
            </div>

            {/* Traffic Alert Card */}
            <div
              className={cn(
                'p-4 sm:p-5 rounded-xl cursor-default',
                'transition-all duration-200',
                'bg-card ring-1',
                notificationStats.hasTrafficNotify ? 'ring-primary/20' : 'ring-border'
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg shrink-0 ring-1',
                      notificationStats.hasTrafficNotify
                        ? 'bg-primary/10 ring-primary/20'
                        : 'bg-muted ring-border'
                    )}
                  >
                    <Activity
                      className={cn(
                        'size-4',
                        notificationStats.hasTrafficNotify ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {t('notifications.traffic.title')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('notifications.traffic.description')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span
                  className={cn(
                    'text-sm font-medium',
                    notificationStats.hasTrafficNotify ? 'text-success' : 'text-muted-foreground'
                  )}
                >
                  {notificationStats.hasTrafficNotify
                    ? t('common.status.enabled')
                    : t('common.status.disabled')}
                </span>
                {notificationStats.hasTrafficNotify && (
                  <span className="text-xs text-muted-foreground">
                    {t('notifications.traffic.threshold', { percent: notificationStats.trafficThreshold })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Telegram Binding Section */}
        <section>
          <SectionHeader icon={Send} title={t('notifications.channels.title')} />
          <TelegramBindingCard />
        </section>

        {/* Quick Actions */}
        {isBound && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickActionLink
              to="/dashboard"
              icon={Activity}
              title={t('notifications.quickActions.viewDashboard')}
              description={t('notifications.quickActions.viewDashboardDesc')}
              variant="primary"
            />
            <QuickActionLink
              to="/dashboard/settings"
              icon={Settings}
              title={t('notifications.quickActions.viewSettings')}
              description={t('notifications.quickActions.viewSettingsDesc')}
              variant="success"
            />
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};
