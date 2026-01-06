/**
 * Admin Telegram Binding Card
 * Displays admin Telegram binding status with notification preferences
 * Enhanced with better visual hierarchy and hover states
 */

import { useState } from "react";
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

  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <Skeleton className="size-10 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Feature not configured
  if (isNotConfigured) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="p-2.5 rounded-lg bg-muted">
            <Send className="size-5" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Telegram 通知</h3>
            <p className="text-sm">功能暂未启用</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2.5 rounded-lg transition-colors duration-200",
                isBound
                  ? "bg-[#26A5E4]/10 ring-1 ring-[#26A5E4]/20"
                  : "bg-muted",
              )}
            >
              <Send
                className={cn(
                  "size-5",
                  isBound ? "text-[#26A5E4]" : "text-muted-foreground",
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">Telegram 通知</h3>
                {isBound && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success ring-1 ring-success/20">
                    <CheckCircle2 className="size-3" />
                    已绑定
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {isBound && binding?.telegramUsername && (
                  <p className="text-sm text-muted-foreground">
                    @{binding.telegramUsername}
                  </p>
                )}
                {isBound && activeCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Bell className="size-3" />
                    {activeCount} 项通知
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
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 transition-colors duration-150"
            >
              <Unlink className="size-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="px-5 pb-5">
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
        title="解除 Telegram 绑定"
        description="解除绑定后，您将不再通过 Telegram 接收任何管理通知。"
        confirmText="解除绑定"
        variant="destructive"
        onConfirm={handleUnbind}
        loading={isUnbinding}
      />
    </>
  );
};
