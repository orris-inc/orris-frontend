/**
 * Admin Notifications Page
 * Notification settings page for administrators
 *
 * Contains: Telegram binding and notification preferences
 * Mobile-first responsive design
 */

import { AdminLayout } from "@/layouts/AdminLayout";
import { PageHeader } from "@/components/admin";
import { usePageTitle } from "@/shared/hooks";
import { Bell } from "lucide-react";
import { AdminTelegramBindingCard } from "@/features/telegram";
import { useTranslation } from "react-i18next";

/**
 * Admin Notifications Page Component
 */
export const AdminNotificationsPage = () => {
  const { t } = useTranslation();
  usePageTitle(t("notifications.title"));

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-0 space-y-4 md:space-y-6">
        {/* Page Header - Using PageHeader component */}
        <PageHeader
          title={t("notifications.title")}
          description={t("notifications.subtitle")}
          icon={Bell}
        />

        {/* Content Area - Mobile-optimized padding */}
        <div className="flex-1 pb-4 md:pb-6">
          <div className="max-w-2xl">
            <AdminTelegramBindingCard />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
