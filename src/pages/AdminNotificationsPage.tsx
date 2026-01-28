/**
 * Admin Notifications Page
 * Notification settings page for administrators
 *
 * Layout: Tailwind Application UI Stacked Layout pattern
 * - Page header with description
 * - Status overview cards
 * - Telegram binding section with notification preferences
 * Mobile-first responsive design
 */

import { useMemo } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageHeader } from "@/components/admin";
import { usePageTitle } from "@/shared/hooks";
import { Bell, Send, CheckCircle2, XCircle, Settings2 } from "lucide-react";
import { AdminTelegramBindingCard, useAdminTelegramBinding } from "@/features/telegram";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/common/Skeleton";
import { SectionHeader } from "@/components/common/bento";

/**
 * Status Card Component - Simple stat display
 */
interface StatusCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  valueColor?: string;
  iconBg?: string;
  iconColor?: string;
  loading?: boolean;
}

const StatusCard = ({
  icon: Icon,
  label,
  value,
  valueColor = "text-foreground",
  iconBg = "bg-muted",
  iconColor = "text-muted-foreground",
  loading = false,
}: StatusCardProps) => (
  <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
    <div className="flex items-center gap-3 mb-3">
      <div className={cn("p-2 rounded-lg ring-1 ring-border/50", iconBg)}>
        <Icon className={cn("size-4 sm:size-5", iconColor)} />
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    {loading ? (
      <Skeleton className="h-7 w-20" />
    ) : (
      <p className={cn("text-xl sm:text-2xl font-semibold", valueColor)}>
        {value}
      </p>
    )}
  </div>
);

/**
 * Admin Notifications Page Component
 */
export const AdminNotificationsPage = () => {
  const { t } = useTranslation();
  usePageTitle(t("notifications.title"));

  const { isLoading, isBound, isNotConfigured, binding } =
    useAdminTelegramBinding();

  // Calculate notification stats
  const stats = useMemo(() => {
    if (!binding) {
      return { activeCount: 0, totalCount: 6 };
    }
    const activeCount = [
      binding.notifyNodeOffline,
      binding.notifyAgentOffline,
      binding.notifyNewUser,
      binding.notifyPaymentSuccess,
      binding.notifyDailySummary,
      binding.notifyWeeklySummary,
    ].filter(Boolean).length;
    return { activeCount, totalCount: 6 };
  }, [binding]);

  // Status display values
  const bindingStatus = useMemo(() => {
    if (isNotConfigured) {
      return {
        value: t("telegramAdmin.binding.notEnabled"),
        color: "text-muted-foreground",
        iconBg: "bg-muted",
        iconColor: "text-muted-foreground",
      };
    }
    if (isBound) {
      return {
        value: t("telegramAdmin.binding.bound"),
        color: "text-success",
        iconBg: "bg-success/10",
        iconColor: "text-success",
      };
    }
    return {
      value: t("telegramAdmin.binding.unbound"),
      color: "text-warning",
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
    };
  }, [isNotConfigured, isBound, t]);

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-0 space-y-6">
        {/* Page Header */}
        <PageHeader
          title={t("notifications.title")}
          description={t("notifications.subtitle")}
          icon={Bell}
        />

        {/* Status Overview - Grid of stat cards */}
        <section className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Telegram Status */}
          <StatusCard
            icon={Send}
            label={t("notifications.telegram.label")}
            value={isLoading ? "-" : bindingStatus.value}
            valueColor={bindingStatus.color}
            iconBg={bindingStatus.iconBg}
            iconColor={bindingStatus.iconColor}
            loading={isLoading}
          />

          {/* Active Notifications */}
          <StatusCard
            icon={isBound && stats.activeCount > 0 ? CheckCircle2 : XCircle}
            label={t("telegramAdmin.binding.notifications", { count: 0 }).replace("0", "")}
            value={
              isLoading
                ? "-"
                : `${stats.activeCount} / ${stats.totalCount}`
            }
            valueColor={
              isBound && stats.activeCount > 0
                ? "text-success"
                : "text-muted-foreground"
            }
            iconBg={
              isBound && stats.activeCount > 0 ? "bg-success/10" : "bg-muted"
            }
            iconColor={
              isBound && stats.activeCount > 0
                ? "text-success"
                : "text-muted-foreground"
            }
            loading={isLoading}
          />

          {/* Telegram Username - Only show when bound */}
          {isBound && binding?.telegramUsername && (
            <StatusCard
              icon={Settings2}
              label={t("telegramAdmin.binding.account")}
              value={`@${binding.telegramUsername}`}
              valueColor="text-foreground"
              iconBg="bg-primary/10"
              iconColor="text-primary"
            />
          )}
        </section>

        {/* Telegram Binding Section */}
        <section>
          <SectionHeader
            icon={Send}
            title={t("telegramAdmin.binding.title")}
            className="mb-4"
          />
          <div className="max-w-3xl">
            <AdminTelegramBindingCard />
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};
