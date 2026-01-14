/**
 * Notifications settings page - Bento Grid Style
 * Manage Telegram binding and notification preferences
 */

import { MessageCircle, Bell, BellOff, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { usePageTitle } from '@/shared/hooks';
import { TelegramBindingCard, useTelegramBinding } from '@/features/telegram';
import { NotificationStatCard } from '@/components/dashboard/NotificationStatCard';

export const NotificationsPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('notifications.title'));

  const { isLoading, isBound, binding, isNotConfigured } = useTelegramBinding();

  // Calculate notification status
  const hasExpiringNotify = binding?.notifyExpiring ?? false;
  const hasTrafficNotify = binding?.notifyTraffic ?? false;
  const activeNotifications = (hasExpiringNotify ? 1 : 0) + (hasTrafficNotify ? 1 : 0);

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 pb-safe">
        {/* Page header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{t('notifications.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t('notifications.subtitle')}</p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* Telegram Status Card */}
          <NotificationStatCard
            icon={<MessageCircle className="size-5" />}
            iconBgClass="bg-blue-500/10 ring-blue-500/20"
            iconColorClass="text-blue-500"
            title={t('notifications.telegram.label')}
            status={isLoading ? '...' : (isNotConfigured ? t('notifications.status.notConfigured') : (isBound ? t('notifications.status.bound') : t('notifications.status.unbound')))}
            statusType={isNotConfigured ? 'muted' : (isBound ? 'success' : 'warning')}
            subtitle={isBound && binding?.telegramUsername ? `@${binding.telegramUsername}` : undefined}
            isLoading={isLoading}
          />

          {/* Notification Status Card */}
          <NotificationStatCard
            icon={isBound && activeNotifications > 0 ? <Bell className="size-5" /> : <BellOff className="size-5" />}
            iconBgClass={isBound && activeNotifications > 0 ? 'bg-success/10 ring-success/20' : 'bg-muted ring-muted-foreground/20'}
            iconColorClass={isBound && activeNotifications > 0 ? 'text-success' : 'text-muted-foreground'}
            title={t('notifications.status.title')}
            status={isLoading ? '...' : (isBound ? (activeNotifications > 0 ? t('notifications.status.enabled') : t('notifications.status.disabled')) : t('notifications.status.notConfigured'))}
            statusType={isBound && activeNotifications > 0 ? 'success' : 'muted'}
            subtitle={isBound ? t('notifications.status.items', { count: activeNotifications }) : undefined}
            isLoading={isLoading}
          />

          {/* Expiring Notification Card */}
          <NotificationStatCard
            icon={<AlertTriangle className="size-5" />}
            iconBgClass={hasExpiringNotify ? 'bg-warning/10 ring-warning/20' : 'bg-muted ring-muted-foreground/20'}
            iconColorClass={hasExpiringNotify ? 'text-warning' : 'text-muted-foreground'}
            title={t('notifications.expiring.title')}
            status={isLoading ? '...' : (hasExpiringNotify ? t('notifications.status.enabled') : t('notifications.status.disabled'))}
            statusType={hasExpiringNotify ? 'success' : 'muted'}
            subtitle={hasExpiringNotify && binding ? t('notifications.expiring.daysAhead', { days: binding.expiringDays }) : undefined}
            isLoading={isLoading}
          />

          {/* Traffic Alert Card */}
          <NotificationStatCard
            icon={<Bell className="size-5" />}
            iconBgClass={hasTrafficNotify ? 'bg-primary/10 ring-primary/20' : 'bg-muted ring-muted-foreground/20'}
            iconColorClass={hasTrafficNotify ? 'text-primary' : 'text-muted-foreground'}
            title={t('notifications.traffic.title')}
            status={isLoading ? '...' : (hasTrafficNotify ? t('notifications.status.enabled') : t('notifications.status.disabled'))}
            statusType={hasTrafficNotify ? 'success' : 'muted'}
            subtitle={hasTrafficNotify && binding ? t('notifications.traffic.threshold', { percent: binding.trafficThreshold }) : undefined}
            isLoading={isLoading}
          />

          {/* Telegram binding card - Full width */}
          <div className="col-span-4 md:col-span-6 lg:col-span-12">
            <TelegramBindingCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
