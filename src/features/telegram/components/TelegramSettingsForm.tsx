/**
 * Telegram Settings Form
 * Form for configuring Telegram bot settings
 * Includes sensitive field masking and connection testing
 */

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Globe,
  Key,
  Shield,
} from "lucide-react";
import { Switch, SwitchThumb } from "@/components/common/Switch";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Skeleton } from "@/components/common/Skeleton";
import { cn } from "@/lib/utils";
import type {
  TelegramConfigResponse,
  UpdateTelegramConfigRequest,
  TelegramTestResult,
} from "@/api/admin";

const settingsSchema = z.object({
  enabled: z.boolean(),
  botToken: z.string().optional(),
  webhookUrl: z.string().url("请输入有效的 URL").optional().or(z.literal("")),
  webhookSecret: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface TelegramSettingsFormProps {
  config: TelegramConfigResponse;
  onSubmit: (data: UpdateTelegramConfigRequest) => Promise<void>;
  onTestConnection: () => Promise<TelegramTestResult>;
  isSubmitting: boolean;
  isTesting: boolean;
  testResult?: TelegramTestResult;
}

interface SettingFieldProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description?: string;
  children: React.ReactNode;
}

const SettingField = ({
  icon,
  iconBg,
  label,
  description,
  children,
}: SettingFieldProps) => (
  <div className="py-3 -mx-2 px-2 rounded-lg transition-colors duration-150 space-y-2">
    {/* Header: icon + label always on same row */}
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>{icon}</div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {description}
          </div>
        )}
      </div>
    </div>
    {/* Input: indented to align with text */}
    <div className="ml-11">{children}</div>
  </div>
);

/**
 * Password input with show/hide toggle
 */
const SecretInput = ({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const [show, setShow] = useState(false);
  const isMasked = value?.includes("*");

  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="pr-10 font-mono text-sm"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        disabled={disabled || isMasked}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors",
          disabled || isMasked
            ? "text-muted-foreground/50 cursor-not-allowed"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
};

/**
 * Form for editing Telegram bot configuration
 */
export const TelegramSettingsForm = ({
  config,
  onSubmit,
  onTestConnection,
  isSubmitting,
  isTesting,
  testResult,
}: TelegramSettingsFormProps) => {
  // Track config values individually to avoid unnecessary resets
  const configKey = `${config.enabled}-${config.botToken}-${config.webhookUrl}-${config.webhookSecret}`;

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      enabled: config.enabled,
      botToken: config.botToken,
      webhookUrl: config.webhookUrl,
      webhookSecret: config.webhookSecret,
    },
  });

  // Reset form only when config values actually change
  useEffect(() => {
    reset({
      enabled: config.enabled,
      botToken: config.botToken,
      webhookUrl: config.webhookUrl,
      webhookSecret: config.webhookSecret,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  const enabled = watch("enabled");

  const handleFormSubmit = async (data: SettingsFormData) => {
    // Only include fields that have actually changed
    const updates: UpdateTelegramConfigRequest = {};

    if (data.enabled !== config.enabled) {
      updates.enabled = data.enabled;
    }
    // Only include token/secret if they're not masked values
    if (data.botToken && !data.botToken.includes("*")) {
      updates.botToken = data.botToken;
    }
    if (data.webhookUrl !== config.webhookUrl) {
      updates.webhookUrl = data.webhookUrl;
    }
    if (data.webhookSecret && !data.webhookSecret.includes("*")) {
      updates.webhookSecret = data.webhookSecret;
    }

    await onSubmit(updates);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-1">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between py-3 -mx-2 px-2 rounded-lg hover:bg-accent/50 transition-colors duration-150">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#26A5E4]/10">
            <Send className="size-4 text-[#26A5E4]" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              启用 Telegram 通知
            </div>
            <div className="text-xs text-muted-foreground">
              开启后管理员可以绑定 Telegram 接收通知
            </div>
          </div>
        </div>
        <Controller
          name="enabled"
          control={control}
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange}>
              <SwitchThumb />
            </Switch>
          )}
        />
      </div>

      {/* Bot Token */}
      <SettingField
        icon={<Key className="size-4 text-warning" />}
        iconBg="bg-warning/10"
        label="Bot Token"
        description="从 @BotFather 获取的机器人令牌"
      >
        <Controller
          name="botToken"
          control={control}
          render={({ field }) => (
            <SecretInput
              value={field.value || ""}
              onChange={field.onChange}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              disabled={!enabled}
            />
          )}
        />
      </SettingField>

      {/* Webhook URL */}
      <SettingField
        icon={<Globe className="size-4 text-info" />}
        iconBg="bg-info/10"
        label="Webhook URL"
        description="接收 Telegram 更新的 Webhook 地址"
      >
        <Controller
          name="webhookUrl"
          control={control}
          render={({ field }) => (
            <Input
              type="url"
              value={field.value || ""}
              onChange={field.onChange}
              placeholder="https://your-domain.com/api/webhooks/telegram"
              disabled={!enabled}
              className="font-mono text-sm"
            />
          )}
        />
      </SettingField>

      {/* Webhook Secret */}
      <SettingField
        icon={<Shield className="size-4 text-success" />}
        iconBg="bg-success/10"
        label="Webhook Secret"
        description="用于验证 Webhook 请求的密钥"
      >
        <Controller
          name="webhookSecret"
          control={control}
          render={({ field }) => (
            <SecretInput
              value={field.value || ""}
              onChange={field.onChange}
              placeholder="your-webhook-secret"
              disabled={!enabled}
            />
          )}
        />
      </SettingField>

      {/* Current Mode & Bot Link */}
      {config.mode && (
        <div className="flex items-center gap-3 py-3 -mx-2 px-2 text-sm">
          <span className="text-muted-foreground">当前模式:</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              config.mode === "webhook"
                ? "bg-success/10 text-success"
                : "bg-info/10 text-info"
            )}
          >
            {config.mode === "webhook" ? "Webhook" : "Polling"}
          </span>
          {config.botLink && (
            <a
              href={config.botLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#26A5E4] hover:underline ml-auto"
            >
              {config.botLink.replace("https://t.me/", "@")}
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        {/* Test Connection */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onTestConnection()}
          disabled={isTesting || !enabled}
          className="gap-2"
        >
          {isTesting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          测试连接
        </Button>

        {/* Test Result */}
        {testResult && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-sm",
              testResult.success ? "text-success" : "text-destructive"
            )}
          >
            {testResult.success ? (
              <>
                <CheckCircle2 className="size-4" />
                <span>@{testResult.botUsername}</span>
              </>
            ) : (
              <>
                <XCircle className="size-4" />
                <span className="truncate max-w-[200px]">{testResult.error}</span>
              </>
            )}
          </div>
        )}

        {/* Save Button */}
        {isDirty && (
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="ml-auto gap-2"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            保存更改
          </Button>
        )}
      </div>
    </form>
  );
};

/**
 * Loading skeleton for the form
 */
export const TelegramSettingsFormSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="h-6 w-11 rounded-full" />
    </div>
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-2 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-md ml-11" />
      </div>
    ))}
    <Skeleton className="h-px w-full" />
    <div className="flex items-center gap-3 pt-2">
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
  </div>
);
