/**
 * Admin Notifications Page
 * Notification settings page for administrators
 *
 * Contains: Telegram binding and notification preferences
 */

import { AdminLayout } from "@/layouts/AdminLayout";
import { usePageTitle } from "@/shared/hooks";
import { Bell } from "lucide-react";
import { AdminTelegramBindingCard } from "@/features/telegram";

/**
 * Admin Notifications Page Component
 */
export const AdminNotificationsPage = () => {
  usePageTitle("通知设置");

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-0">
        {/* Page Header */}
        <header className="shrink-0 py-4 sm:py-6 md:py-8">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Bell
                className="size-5 sm:size-6 text-primary"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                通知设置
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                管理通知偏好和绑定
              </p>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 pb-6">
          <div className="max-w-2xl">
            <AdminTelegramBindingCard />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
