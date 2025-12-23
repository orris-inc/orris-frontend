/**
 * Notifications settings page
 * Manage Telegram binding and notification preferences
 */

import { Info } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { usePageTitle } from '@/shared/hooks';
import { TelegramBindingCard } from '@/features/telegram';
import { getAlertClass, alertDescriptionStyles } from '@/lib/ui-styles';

export const NotificationsPage = () => {
  usePageTitle('通知设置');

  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-8">
        {/* Page title */}
        <h1 className="mb-6 text-4xl font-bold">通知设置</h1>

        {/* Telegram binding card */}
        <TelegramBindingCard />

        {/* Help tip */}
        <div className={getAlertClass('default', 'mt-6')}>
          <Info className="size-4" />
          <div className={alertDescriptionStyles}>
            提示：绑定 Telegram 后，您可以自定义接收哪些通知以及通知的触发条件。
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
