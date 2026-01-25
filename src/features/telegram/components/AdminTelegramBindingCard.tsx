/**
 * Admin Telegram Binding Card
 * Displays admin Telegram binding status with notification preferences
 * Enhanced with better visual hierarchy and hover states
 * Mobile-first responsive design with proper touch targets
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, Unlink, CheckCircle2, Bell } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Skeleton } from "@/components/common/Skeleton";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { cn } from "@/lib/utils";
import { useAdminTelegramBinding } from "../hooks/useAdminTelegramBinding";
import { AdminVerifyCodeSection } from "./AdminVerifyCodeSection";
import { AdminNotificationPreferencesForm } from "./AdminNotificationPreferencesForm";

/**
 * Main card component for admin Telegram binding management
 */
export const AdminTelegramBindingCard = () => {
  const { t } = useTranslation();
  const {
    isLoading,
    isNotConfigured,
    isBound,
    binding,
    verifyCode,
    botLink,
    unbind,
    updatePreferences,
    isUnbinding,
    isUpdating,
  } = useAdminTelegramBinding();

  const [showUnbindDialog, setShowUnbindDialog] = useState(false);

  const handleUnbind = async () => {
    await unbind();
    setShowUnbindDialog(false);
  };

  // Count active notifications
  const activeCount = binding
    ? [
        binding.notifyNodeOffline,
        binding.notifyAgentOffline,
        binding.notifyNewUser,
        binding.notifyPaymentSuccess,
        binding.notifyDailySummary,
        binding.notifyWeeklySummary,
      ].filter(Boolean).length
    : 0;

  // Loading state - Mobile-optimized padding
  if (isLoading) {
    return (
      <div className="glass-elevated rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 md:p-5 pb-3 md:pb-4 border-b border-border/50">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="p-4 md:p-5 space-y-3">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Feature not configured - Mobile-optimized padding
  if (isNotConfigured) {
    return (
      <div className="glass-elevated rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 md:p-5 text-muted-foreground">
          <div className="p-2.5 rounded-xl bg-muted shrink-0">
            <Send className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-foreground">
              {t("telegramAdmin.binding.title")}
            </h3>
            <p className="text-sm">{t("telegramAdmin.binding.notEnabled")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-elevated rounded-2xl overflow-hidden">
        {/* Header - Mobile-optimized with proper touch targets */}
        <div className="flex items-center justify-between gap-2 p-4 md:p-5 pb-3 md:pb-4 border-b border-border/50">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "p-2.5 rounded-xl transition-colors duration-200 shrink-0",
                isBound
                  ? "bg-[brand-telegram]/10 ring-1 ring-[brand-telegram]/20"
                  : "bg-muted",
              )}
            >
              <Send
                className={cn(
                  "size-5",
                  isBound ? "text-[brand-telegram]" : "text-muted-foreground",
                )}
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  {t("telegramAdmin.binding.title")}
                </h3>
                {isBound && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success ring-1 ring-success/20">
                    <CheckCircle2 className="size-3" />
                    <span className="hidden sm:inline">{t("telegramAdmin.binding.bound")}</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                {isBound && binding?.telegramUsername && (
                  <p className="text-sm text-muted-foreground truncate">
                    @{binding.telegramUsername}
                  </p>
                )}
                {isBound && activeCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Bell className="size-3" />
                    {t("telegramAdmin.binding.notifications", {
                      count: activeCount,
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
          {isBound && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUnbindDialog(true)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 min-h-11 min-w-11 md:h-8 md:min-w-0 transition-colors duration-150 shrink-0"
            >
              <Unlink className="size-5 md:size-4" />
            </Button>
          )}
        </div>

        {/* Content - Mobile-optimized padding */}
        <div className="px-4 md:px-5 pb-4 md:pb-5">
          {isBound && binding ? (
            <AdminNotificationPreferencesForm
              binding={binding}
              onSubmit={updatePreferences}
              isSubmitting={isUpdating}
            />
          ) : (
            verifyCode && (
              <AdminVerifyCodeSection
                verifyCode={verifyCode}
                botLink={botLink}
              />
            )
          )}
        </div>
      </div>

      {/* Unbind confirmation dialog */}
      <ConfirmDialog
        open={showUnbindDialog}
        onOpenChange={setShowUnbindDialog}
        title={t("telegramAdmin.binding.unbindTitle")}
        description={t("telegramAdmin.binding.unbindDesc")}
        confirmText={t("telegramAdmin.binding.unbind")}
        variant="destructive"
        onConfirm={handleUnbind}
        loading={isUnbinding}
      />
    </>
  );
};
