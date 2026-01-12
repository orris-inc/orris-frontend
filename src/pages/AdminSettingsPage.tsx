/**
 * Admin Settings Page
 * System configuration page for administrators
 *
 * Design:
 * - Desktop: Fixed layout with sidebar navigation
 * - Mobile: Top tab navigation with scrollable content
 */

import { useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { usePageTitle } from "@/shared/hooks";
import { useBreakpoint } from "@/hooks/useBreakpoint";
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

/**
 * Desktop navigation item
 */
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
 * Mobile segmented control with sliding indicator
 * Modern iOS-style tab navigation
 */
interface MobileSegmentedControlProps {
  tabs: {
    id: SettingsTab;
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
  }[];
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

const MobileSegmentedControl = ({
  tabs,
  activeTab,
  onChange,
}: MobileSegmentedControlProps) => {
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

  return (
    <div className="relative p-1.5 bg-muted/80 backdrop-blur-sm rounded-xl border border-border/50">
      {/* Sliding indicator */}
      <div
        className={cn(
          "absolute top-1.5 bottom-1.5 rounded-lg",
          "bg-background shadow-sm ring-1 ring-border/50",
          "transition-all duration-300 ease-out"
        )}
        style={{
          width: `calc((100% - 12px) / ${tabs.length})`,
          left: `calc(6px + ${activeIndex} * (100% - 12px) / ${tabs.length})`,
        }}
      />

      {/* Tab buttons */}
      <div className="relative flex">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                "flex-1 flex items-center justify-center gap-2",
                "min-h-[48px] px-4 py-3 rounded-lg",
                "text-sm font-medium",
                "transition-colors duration-200",
                "relative z-10",
                isActive
                  ? "text-foreground"
                  : tab.disabled
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : "text-muted-foreground active:text-foreground"
              )}
            >
              <span
                className={cn(
                  "transition-transform duration-200",
                  isActive && "scale-110"
                )}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

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

  const { isMobile } = useBreakpoint();
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

  // Settings content component (shared between mobile and desktop)
  const settingsContent = (
    <div className={cn("space-y-6", isMobile ? "pb-6" : "max-w-2xl")}>
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
  );

  return (
    <AdminLayout>
      {/* Mobile Layout */}
      {isMobile ? (
        <div className="flex flex-col min-h-0">
          {/* Mobile Header */}
          <header className="shrink-0 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Settings className="size-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  系统设置
                </h1>
                <p className="text-xs text-muted-foreground">
                  管理系统配置和个人偏好
                </p>
              </div>
            </div>
          </header>

          {/* Mobile Tab Navigation - iOS-style Segmented Control */}
          <div className="shrink-0 mb-5">
            <MobileSegmentedControl
              tabs={[
                {
                  id: "system",
                  icon: <Server className="size-4" strokeWidth={1.5} />,
                  label: "系统配置",
                },
                {
                  id: "personal",
                  icon: <Bell className="size-4" strokeWidth={1.5} />,
                  label: "个人设置",
                  disabled: !isTelegramEnabled,
                },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>

          {/* Mobile Content - Natural scroll */}
          <div className="flex-1">{settingsContent}</div>
        </div>
      ) : (
        /* Desktop Layout */
        <div className="h-[calc(100dvh-3.5rem)] flex flex-col">
          {/* Desktop Header */}
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

          {/* Desktop Content - Fixed height with internal scroll */}
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
            <div className="flex-1 min-w-0 overflow-y-auto">{settingsContent}</div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
