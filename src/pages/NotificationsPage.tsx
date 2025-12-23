/**
 * Notifications settings page
 * Manage Telegram binding and notification preferences
 */

import { DashboardLayout } from '@/layouts/DashboardLayout';
import { usePageTitle } from '@/shared/hooks';
import { TelegramBindingCard } from '@/features/telegram';

export const NotificationsPage = () => {
  usePageTitle('通知设置');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">通知设置</h1>
          <p className="text-muted-foreground">管理您的通知偏好和 Telegram 绑定</p>
        </div>

        {/* Telegram binding card */}
        <TelegramBindingCard />
      </div>
    </DashboardLayout>
  );
};
