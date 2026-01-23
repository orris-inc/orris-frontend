/**
 * Telegram Settings Form
 * Form for configuring Telegram bot settings with two-column layout
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import {
  FormSection,
  FormField,
  FormActions,
} from '@/features/settings/components/FormField';
import { SecretInput } from '@/features/settings/components/SecretInput';
import { cn } from '@/lib/utils';
import type {
  TelegramConfigResponse,
  UpdateTelegramConfigRequest,
  TelegramTestResult,
} from '@/api/admin';

const settingsSchema = z.object({
  enabled: z.boolean(),
  botToken: z.string().optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
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

/**
 * Status badge component
 */
const StatusBadge = ({ enabled }: { enabled: boolean }) => {
  const { t } = useTranslation();

  return enabled ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success ring-1 ring-success/20">
      <span className="size-1.5 rounded-full bg-success" />
      {t('admin.settings.enabled')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground" />
      {t('admin.settings.disabled')}
    </span>
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
  const { t } = useTranslation();
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

  const enabled = watch('enabled');

  const handleFormSubmit = async (data: SettingsFormData) => {
    // Only include fields that have actually changed
    const updates: UpdateTelegramConfigRequest = {};

    if (data.enabled !== config.enabled) {
      updates.enabled = data.enabled;
    }
    // Only include token/secret if they're not masked values
    if (data.botToken && !data.botToken.includes('*')) {
      updates.botToken = data.botToken;
    }
    if (data.webhookUrl !== config.webhookUrl) {
      updates.webhookUrl = data.webhookUrl;
    }
    if (data.webhookSecret && !data.webhookSecret.includes('*')) {
      updates.webhookSecret = data.webhookSecret;
    }

    await onSubmit(updates);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormSection
        title={t('admin.settings.telegram.title')}
        description={t('admin.settings.telegram.description')}
        headerRight={<StatusBadge enabled={config.enabled} />}
      >
        {/* Enable/Disable */}
        <FormField
          label={t('telegramAdmin.settings.enableNotifications')}
          description={t('telegramAdmin.settings.enableNotificationsDesc')}
        >
          <Controller
            name="enabled"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
            )}
          />
        </FormField>

        {/* Bot Token */}
        <FormField
          label="Bot Token"
          description={t('telegramAdmin.settings.botTokenDesc')}
          disabled={!enabled}
        >
          <Controller
            name="botToken"
            control={control}
            render={({ field }) => (
              <SecretInput
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                disabled={!enabled}
              />
            )}
          />
        </FormField>

        {/* Webhook URL */}
        <FormField
          label="Webhook URL"
          description={t('telegramAdmin.settings.webhookUrlDesc')}
          disabled={!enabled}
        >
          <Controller
            name="webhookUrl"
            control={control}
            render={({ field }) => (
              <Input
                type="url"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="https://your-domain.com/api/webhooks/telegram"
                disabled={!enabled}
                className="font-mono text-sm"
              />
            )}
          />
        </FormField>

        {/* Webhook Secret */}
        <FormField
          label="Webhook Secret"
          description={t('telegramAdmin.settings.webhookSecretDesc')}
          disabled={!enabled}
        >
          <Controller
            name="webhookSecret"
            control={control}
            render={({ field }) => (
              <SecretInput
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="your-webhook-secret"
                disabled={!enabled}
              />
            )}
          />
        </FormField>

        {/* Current Mode & Bot Link */}
        {config.mode && (
          <div className="flex items-center gap-3 p-5 text-sm border-t border-border/50">
            <span className="text-muted-foreground">
              {t('telegramAdmin.settings.currentMode')}
            </span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                config.mode === 'webhook'
                  ? 'bg-success/10 text-success'
                  : 'bg-info/10 text-info'
              )}
            >
              {config.mode === 'webhook' ? 'Webhook' : 'Polling'}
            </span>
            {config.botLink && (
              <a
                href={config.botLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[var(--brand-telegram)] hover:underline ml-auto"
              >
                {config.botLink.replace('https://t.me/', '@')}
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        )}

        {/* Actions */}
        <FormActions>
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
            {t('telegramAdmin.settings.testConnection')}
          </Button>

          {/* Test Result */}
          {testResult && (
            <div
              className={cn(
                'flex items-center gap-1.5 text-sm',
                testResult.success ? 'text-success' : 'text-destructive'
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
                  <span className="truncate max-w-[200px]">
                    {testResult.error}
                  </span>
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
              {t('telegramAdmin.settings.saveChanges')}
            </Button>
          )}
        </FormActions>
      </FormSection>
    </form>
  );
};

/**
 * Loading skeleton for the form
 */
export const TelegramSettingsFormSkeleton = () => (
  <div className="bg-card rounded-lg ring-1 ring-border overflow-hidden">
    {/* Header skeleton */}
    <div className="flex items-center justify-between p-5 pb-4 border-b border-border/50">
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3.5 w-48" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    {/* Fields skeleton */}
    <div className="divide-y divide-border/50">
      {/* Enable switch */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-5">
        <div className="sm:pt-2 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="sm:col-span-2">
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>
      </div>
      {/* Form fields */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-5"
        >
          <div className="sm:pt-2 space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="sm:col-span-2">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
    {/* Actions skeleton */}
    <div className="flex items-center justify-end gap-3 p-5 bg-muted/30">
      <Skeleton className="h-8 w-28 rounded-md" />
    </div>
  </div>
);
