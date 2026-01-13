/**
 * Admin Settings Page
 * System configuration page for administrators
 *
 * Contains: Telegram bot configuration (Token, Webhook)
 */

import { AdminLayout } from "@/layouts/AdminLayout";
import { usePageTitle } from "@/shared/hooks";
import { Send, Settings, Wrench } from "lucide-react";
import { useTelegramSettings } from "@/features/telegram/hooks/useTelegramSettings";
import {
  TelegramSettingsForm,
  TelegramSettingsFormSkeleton,
} from "@/features/telegram/components/TelegramSettingsForm";
import { cn } from "@/lib/utils";

/**
 * Status badge component
 */
const StatusBadge = ({ enabled }: { enabled: boolean }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
      enabled
        ? "bg-success/10 text-success ring-1 ring-success/20"
        : "bg-muted text-muted-foreground"
    )}
  >
    <span
      className={cn(
        "size-1.5 rounded-full",
        enabled ? "bg-success" : "bg-muted-foreground"
      )}
    />
    {enabled ? "已启用" : "未启用"}
  </span>
);

/**
 * Admin Settings Page Component
 */
export const AdminSettingsPage = () => {
  usePageTitle("系统设置");

  const {
    config,
    isLoading,
    updateConfig,
    isUpdating,
    testConnection,
    isTesting,
    testResult,
  } = useTelegramSettings();

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-0">
        {/* Page Header */}
        <header className="shrink-0 py-4 sm:py-6 md:py-8">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Settings
                className="size-5 sm:size-6 text-primary"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                系统设置
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                管理系统配置
              </p>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 pb-6">
          <div className="max-w-2xl">
            {/* Telegram Settings Card */}
            <div className="glass-elevated rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#26A5E4]/10 ring-1 ring-[#26A5E4]/20">
                    <Send className="size-5 text-[#26A5E4]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Telegram 设置
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      配置机器人 Token 和 Webhook
                    </p>
                  </div>
                </div>
                {config && <StatusBadge enabled={config.enabled} />}
              </div>
              {/* Content */}
              <div className="p-5">
                {isLoading ? (
                  <TelegramSettingsFormSkeleton />
                ) : config ? (
                  <TelegramSettingsForm
                    config={config}
                    onSubmit={updateConfig}
                    onTestConnection={testConnection}
                    isSubmitting={isUpdating}
                    isTesting={isTesting}
                    testResult={testResult}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="size-8 mx-auto mb-2 opacity-50" />
                    <p>无法加载配置</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
