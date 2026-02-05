/**
 * Admin notifications section component
 * Contains Telegram binding card for admin notification management
 */

import { AdminTelegramBindingCard } from '@/features/telegram';

export const AdminNotificationsSection = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminTelegramBindingCard />
    </div>
  );
};
