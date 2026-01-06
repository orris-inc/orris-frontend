/**
 * Admin Settings Page
 * System configuration page for administrators
 *
 * Design: Fixed layout with sidebar navigation
 * - Left sidebar: Navigation anchors
 * - Right content: Settings panels (scrollable within viewport)
 */

import { useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { usePageTitle } from "@/shared/hooks";
import { Send, Settings, Bell, Server, Wrench } from "lucide-react";
import { useTelegramSettings } from "@/features/telegram/hooks/useTelegramSettings";
import {
  TelegramSettingsForm,
  TelegramSettingsFormSkeleton,
} from "@/features/telegram/components/TelegramSettingsForm";
import { AdminTelegramBindingCard } from "@/features/telegram";
import { cn } from "@/lib/utils";

type SettingsTab = "system" | "personal";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const NavItem = ({
  icon,
  label,
  description,
  active,
  disabled,
  onClick,
}: NavItemProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "w-full text-left px-3 py-3 rounded-lg transition-all duration-200",
      "flex items-center gap-3",
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-accent text-foreground"
    )}
  >
    <div
      className={cn(
        "p-2 rounded-lg shrink-0",
        active ? "bg-primary-foreground/20" : "bg-muted"
      )}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-sm font-medium truncate">{label}</div>
      <div
        className={cn(
          "text-xs truncate",
          active ? "text-primary-foreground/80" : "text-muted-foreground"
        )}
      >
        {description}
      </div>
    </div>
  </button>
);

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
 * Settings card wrapper
 */
interface SettingsCardProps {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  status?: React.ReactNode;
  children: React.ReactNode;
}

const SettingsCard = ({
  icon,
  iconColor,
  iconBg,
  title,
  description,
  status,
  children,
}: SettingsCardProps) => (
  <div className="rounded-xl border bg-card shadow-sm">
    <div className="flex items-start justify-between gap-4 p-5 pb-4 border-b border-border">
      <div className="flex items-center gap-3">
        <div className={cn("p-2.5 rounded-lg ring-1 ring-border/50", iconBg)}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {status}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

/**
 * Admin Settings Page Component
 */
export const AdminSettingsPage = () => {
  usePageTitle("系统设置");

  const [activeTab, setActiveTab] = useState<SettingsTab>("system");

  const {
    config,
    isLoading,
    updateConfig,
    isUpdating,
    testConnection,
    isTesting,
    testResult,
  } = useTelegramSettings();

  const isTelegramEnabled = config?.enabled ?? false;

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        {/* Page Header */}
        <header className="shrink-0 py-6 sm:py-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Settings className="size-6 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                系统设置
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                管理系统配置和个人偏好
              </p>
            </div>
          </div>
        </header>

        {/* Settings Content - Fixed height with internal scroll */}
        <div className="flex-1 min-h-0 flex gap-6 pb-6">
          {/* Left Navigation */}
          <nav className="w-64 shrink-0 space-y-1">
            <NavItem
              icon={
                <Server
                  className="size-4 text-muted-foreground"
                  strokeWidth={1.5}
                />
              }
              label="系统配置"
              description="服务和集成设置"
              active={activeTab === "system"}
              onClick={() => setActiveTab("system")}
            />
            <NavItem
              icon={
                <Bell
                  className={cn(
                    "size-4",
                    isTelegramEnabled
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50"
                  )}
                  strokeWidth={1.5}
                />
              }
              label="个人设置"
              description="通知和偏好"
              active={activeTab === "personal"}
              disabled={!isTelegramEnabled}
              onClick={() => isTelegramEnabled && setActiveTab("personal")}
            />
          </nav>

          {/* Right Content */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="max-w-2xl space-y-6">
              {activeTab === "system" && (
                <SettingsCard
                  icon={<Send className="size-5" strokeWidth={1.5} />}
                  iconColor="text-[#26A5E4]"
                  iconBg="bg-[#26A5E4]/10"
                  title="Telegram 机器人"
                  description="配置 Bot Token 和 Webhook 以启用通知服务"
                  status={config && <StatusBadge enabled={config.enabled} />}
                >
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
                </SettingsCard>
              )}

              {activeTab === "personal" && isTelegramEnabled && (
                <AdminTelegramBindingCard />
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
