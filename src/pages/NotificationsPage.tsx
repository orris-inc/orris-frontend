/**
 * Notifications settings page - Bento Grid Style
 * Manage Telegram binding and notification preferences
 */

import { MessageCircle, Bell, BellOff, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { usePageTitle } from '@/shared/hooks';
import { TelegramBindingCard, useTelegramBinding } from '@/features/telegram';
import { NotificationStatCard } from '@/components/dashboard/NotificationStatCard';

export const NotificationsPage = () => {
  usePageTitle('通知设置');

  const { isLoading, isBound, binding, isNotConfigured } = useTelegramBinding();

  // Calculate notification status
  const hasExpiringNotify = binding?.notifyExpiring ?? false;
  const hasTrafficNotify = binding?.notifyTraffic ?? false;
  const activeNotifications = (hasExpiringNotify ? 1 : 0) + (hasTrafficNotify ? 1 : 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">通知设置</h1>
          <p className="text-muted-foreground">管理您的通知偏好和 Telegram 绑定</p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* Telegram Status Card */}
          <NotificationStatCard
            icon={<MessageCircle className="size-5" />}
            iconBgClass="bg-blue-500/10 ring-blue-500/20"
            iconColorClass="text-blue-500"
            title="Telegram"
            status={isLoading ? '...' : (isNotConfigured ? '未配置' : (isBound ? '已绑定' : '未绑定'))}
            statusType={isNotConfigured ? 'muted' : (isBound ? 'success' : 'warning')}
            subtitle={isBound && binding?.telegramUsername ? `@${binding.telegramUsername}` : undefined}
            isLoading={isLoading}
          />

          {/* Notification Status Card */}
          <NotificationStatCard
            icon={isBound && activeNotifications > 0 ? <Bell className="size-5" /> : <BellOff className="size-5" />}
            iconBgClass={isBound && activeNotifications > 0 ? 'bg-success/10 ring-success/20' : 'bg-muted ring-muted-foreground/20'}
            iconColorClass={isBound && activeNotifications > 0 ? 'text-success' : 'text-muted-foreground'}
            title="通知状态"
            status={isLoading ? '...' : (isBound ? (activeNotifications > 0 ? '已开启' : '已关闭') : '未配置')}
            statusType={isBound && activeNotifications > 0 ? 'success' : 'muted'}
            subtitle={isBound ? `${activeNotifications} 项通知` : undefined}
            isLoading={isLoading}
          />

          {/* Expiring Notification Card */}
          <NotificationStatCard
            icon={<AlertTriangle className="size-5" />}
            iconBgClass={hasExpiringNotify ? 'bg-warning/10 ring-warning/20' : 'bg-muted ring-muted-foreground/20'}
            iconColorClass={hasExpiringNotify ? 'text-warning' : 'text-muted-foreground'}
            title="到期提醒"
            status={isLoading ? '...' : (hasExpiringNotify ? '已开启' : '已关闭')}
            statusType={hasExpiringNotify ? 'success' : 'muted'}
            subtitle={hasExpiringNotify && binding ? `提前 ${binding.expiringDays} 天` : undefined}
            isLoading={isLoading}
          />

          {/* Traffic Alert Card */}
          <NotificationStatCard
            icon={<Bell className="size-5" />}
            iconBgClass={hasTrafficNotify ? 'bg-primary/10 ring-primary/20' : 'bg-muted ring-muted-foreground/20'}
            iconColorClass={hasTrafficNotify ? 'text-primary' : 'text-muted-foreground'}
            title="流量告警"
            status={isLoading ? '...' : (hasTrafficNotify ? '已开启' : '已关闭')}
            statusType={hasTrafficNotify ? 'success' : 'muted'}
            subtitle={hasTrafficNotify && binding ? `阈值 ${binding.trafficThreshold}%` : undefined}
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
