/**
 * Admin Telegram Binding Card
 * Displays admin Telegram binding status with notification preferences
 *
 * Tailwind Application UI design pattern:
 * - Card with header section containing status badge
 * - Stacked list for notification preferences
 * - Mobile-first responsive design with proper touch targets
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, Unlink, AlertCircle } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Skeleton } from "@/components/common/Skeleton";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { cn } from "@/lib/utils";
import { useAdminTelegramBinding } from "../hooks/useAdminTelegramBinding";
import { AdminVerifyCodeSection } from "./AdminVerifyCodeSection";
import { AdminNotificationPreferencesForm } from "./AdminNotificationPreferencesForm";

/**
 * Loading skeleton for the card
 */
const CardSkeleton = () => (
  <div className="rounded-xl border border-border bg-card overflow-hidden">
    <div className="p-4 sm:p-5 border-b border-border">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
    <div className="p-4 sm:p-5 space-y-4">
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  </div>
);

/**
 * Empty state when Telegram is not configured
 */
const NotConfiguredState = () => {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="p-3 rounded-xl bg-muted mb-4">
          <AlertCircle className="size-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          {t("telegramAdmin.binding.title")}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t("telegramAdmin.binding.notEnabled")}
        </p>
      </div>
    </div>
  );
};

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
    deepBindLink,
    expiresAt,
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

  // Loading state
  if (isLoading) {
    return <CardSkeleton />;
  }

  // Feature not configured
  if (isNotConfigured) {
    return <NotConfiguredState />;
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Card Header - Status section */}
        <div className="p-4 sm:p-5 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={cn(
                  "shrink-0 p-2.5 rounded-lg ring-1 transition-colors",
                  isBound
                    ? "bg-brand-telegram/10 ring-brand-telegram/20"
                    : "bg-warning/10 ring-warning/20"
                )}
              >
                <Send
                  className={cn(
                    "size-5",
                    isBound ? "text-brand-telegram" : "text-warning"
                  )}
                />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold text-foreground">
                    {isBound
                      ? t("telegramAdmin.binding.boundTitle")
                      : t("telegramAdmin.binding.unboundTitle")}
                  </h3>
                  {isBound && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success ring-1 ring-inset ring-success/20">
                      {t("common.status.enabled")}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isBound && binding?.telegramUsername
                    ? `@${binding.telegramUsername}`
                    : t("telegramAdmin.binding.unboundDesc")}
                </p>
              </div>
            </div>

            {/* Unbind button */}
            {isBound && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUnbindDialog(true)}
                className={cn(
                  "shrink-0 text-muted-foreground",
                  "hover:text-destructive hover:bg-destructive/10",
                  "min-h-11 min-w-11 sm:min-h-9 sm:min-w-0 sm:px-3",
                  "transition-colors"
                )}
              >
                <Unlink className="size-4 sm:mr-1.5" />
                <span className="hidden sm:inline">
                  {t("telegramAdmin.binding.unbind")}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Card Body - Content area */}
        <div className="p-4 sm:p-5">
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
                deepBindLink={deepBindLink}
                expiresAt={expiresAt}
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
