/**
 * USDT Settings Form
 * Form for configuring USDT payment settings with two-column layout
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';
import { cardStyles } from '@/lib/ui-styles';
import {
  FormSection,
  FormField,
  FormActions,
} from './FormField';
import { SecretInput } from './SecretInput';
import { SourceBadge } from './SourceBadge';
import type {
  USDTSettingsResponse,
  UpdateUSDTSettingsRequest,
} from '@/api/setting';

// Polygon address: 0x + 40 hex characters (EVM compatible)
const POLYGON_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

// Tron address: T + 33 base58 characters (no 0, O, I, l)
const TRON_ADDRESS_REGEX = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

// Maximum addresses per network (matches backend limit)
const MAX_ADDRESSES_PER_NETWORK = 10;

/**
 * Validate wallet addresses from multi-line text
 * Returns null if valid, or error message if invalid
 */
const validateAddresses = (
  text: string | undefined,
  regex: RegExp,
  networkName: string
): string | null => {
  if (!text) return null;
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return null;

  // Check max address limit
  if (lines.length > MAX_ADDRESSES_PER_NETWORK) {
    return `Maximum ${MAX_ADDRESSES_PER_NETWORK} addresses allowed, got ${lines.length}`;
  }

  const invalidAddresses: string[] = [];
  for (const addr of lines) {
    if (!regex.test(addr)) {
      invalidAddresses.push(addr.length > 20 ? `${addr.slice(0, 10)}...${addr.slice(-6)}` : addr);
    }
  }

  if (invalidAddresses.length > 0) {
    return `Invalid ${networkName} address format: ${invalidAddresses.join(', ')}`;
  }
  return null;
};

/**
 * Status badge component
 */
const StatusBadge = ({ enabled }: { enabled: boolean }) => {
  const { t } = useTranslation();

  return enabled ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success ring-1 ring-success/20">
      <span className="size-1.5 rounded-full bg-success" />
      {t('common.status.enabled')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground" />
      {t('common.status.disabled')}
    </span>
  );
};

const usdtSettingsSchema = z.object({
  enabled: z.boolean(),
  polReceivingAddresses: z
    .string()
    .optional()
    .superRefine((val, ctx) => {
      const error = validateAddresses(val, POLYGON_ADDRESS_REGEX, 'Polygon');
      if (error) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
      }
    }),
  trcReceivingAddresses: z
    .string()
    .optional()
    .superRefine((val, ctx) => {
      const error = validateAddresses(val, TRON_ADDRESS_REGEX, 'Tron');
      if (error) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
      }
    }),
  polygonscanApiKey: z.string().optional(),
  trongridApiKey: z.string().optional(),
  paymentTtlMinutes: z.number().int().min(1).max(1440).optional(),
  polConfirmations: z.number().int().min(1).max(100).optional(),
  trcConfirmations: z.number().int().min(1).max(100).optional(),
});

type USDTSettingsFormData = z.infer<typeof usdtSettingsSchema>;

interface USDTSettingsFormProps {
  settings: USDTSettingsResponse;
  onSubmit: (data: UpdateUSDTSettingsRequest) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * USDT settings form component
 */
export const USDTSettingsForm = ({
  settings,
  onSubmit,
  isSubmitting,
}: USDTSettingsFormProps) => {
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, errors },
  } = useForm<USDTSettingsFormData>({
    resolver: zodResolver(usdtSettingsSchema),
    defaultValues: {
      enabled: settings.enabled.value as boolean,
      polReceivingAddresses: ((settings.polReceivingAddresses.value as string[]) || []).join('\n'),
      trcReceivingAddresses: ((settings.trcReceivingAddresses.value as string[]) || []).join('\n'),
      polygonscanApiKey: (settings.polygonscanApiKey.value as string) || '',
      trongridApiKey: (settings.trongridApiKey.value as string) || '',
      paymentTtlMinutes: (settings.paymentTtlMinutes.value as number) || 10,
      polConfirmations: (settings.polConfirmations.value as number) || 12,
      trcConfirmations: (settings.trcConfirmations.value as number) || 19,
    },
  });

  // Sync form with API values only when the user has no unsaved edits.
  // After a successful save, handleFormSubmit calls reset() to clear isDirty,
  // so this effect will pick up the refreshed settings from the next query refetch.
  useEffect(() => {
    if (!isDirty) {
      reset({
        enabled: settings.enabled.value as boolean,
        polReceivingAddresses: ((settings.polReceivingAddresses.value as string[]) || []).join('\n'),
        trcReceivingAddresses: ((settings.trcReceivingAddresses.value as string[]) || []).join('\n'),
        polygonscanApiKey: (settings.polygonscanApiKey.value as string) || '',
        trongridApiKey: (settings.trongridApiKey.value as string) || '',
        paymentTtlMinutes: (settings.paymentTtlMinutes.value as number) || 10,
        polConfirmations: (settings.polConfirmations.value as number) || 12,
        trcConfirmations: (settings.trcConfirmations.value as number) || 19,
      });
    }
  }, [settings, reset, isDirty]);

  const enabled = watch('enabled');

  // Helper to convert multi-line text to address array
  const parseAddresses = (text: string | undefined): string[] => {
    if (!text) return [];
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  // Helper to compare address arrays
  const addressesEqual = (a: string[], b: unknown): boolean => {
    const bArr = Array.isArray(b) ? b : [];
    if (a.length !== bArr.length) return false;
    return a.every((addr, i) => addr === bArr[i]);
  };

  const handleFormSubmit = async (data: USDTSettingsFormData) => {
    const updates: UpdateUSDTSettingsRequest = {};

    if (data.enabled !== settings.enabled.value) {
      updates.enabled = data.enabled;
    }

    const polAddresses = parseAddresses(data.polReceivingAddresses);
    if (!addressesEqual(polAddresses, settings.polReceivingAddresses.value)) {
      updates.polReceivingAddresses = polAddresses.length > 0 ? polAddresses : undefined;
    }

    const trcAddresses = parseAddresses(data.trcReceivingAddresses);
    if (!addressesEqual(trcAddresses, settings.trcReceivingAddresses.value)) {
      updates.trcReceivingAddresses = trcAddresses.length > 0 ? trcAddresses : undefined;
    }

    if (data.polygonscanApiKey && !data.polygonscanApiKey.includes('*')) {
      updates.polygonscanApiKey = data.polygonscanApiKey;
    }
    if (data.trongridApiKey && !data.trongridApiKey.includes('*')) {
      updates.trongridApiKey = data.trongridApiKey;
    }
    if (data.paymentTtlMinutes !== settings.paymentTtlMinutes.value) {
      updates.paymentTtlMinutes = data.paymentTtlMinutes || undefined;
    }
    if (data.polConfirmations !== settings.polConfirmations.value) {
      updates.polConfirmations = data.polConfirmations || undefined;
    }
    if (data.trcConfirmations !== settings.trcConfirmations.value) {
      updates.trcConfirmations = data.trcConfirmations || undefined;
    }

    if (Object.keys(updates).length > 0) {
      await onSubmit(updates);
      // Clear isDirty so the useEffect can sync with refreshed API values
      reset(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormSection
        title={t('admin.settings.usdt.title')}
        description={t('admin.settings.usdt.description')}
        headerRight={<StatusBadge enabled={settings.enabled.value as boolean} />}
      >
        {/* Enable USDT */}
        <FormField
          label={t('admin.settings.usdt.enable')}
          description={t('admin.settings.usdt.enableDesc')}
          labelRight={<SourceBadge source={settings.enabled.source} />}
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

        {/* Polygon Receiving Addresses */}
        <FormField
          label={t('admin.settings.usdt.polReceivingAddresses')}
          description={t('admin.settings.usdt.polReceivingAddressesDesc')}
          labelRight={<SourceBadge source={settings.polReceivingAddresses.source} />}
          disabled={!enabled}
        >
          <Controller
            name="polReceivingAddresses"
            control={control}
            render={({ field }) => (
              <div className="space-y-1.5">
                <textarea
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="0x..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!enabled}
                  rows={3}
                />
                {errors.polReceivingAddresses && (
                  <p className="text-xs text-destructive">{errors.polReceivingAddresses.message}</p>
                )}
              </div>
            )}
          />
        </FormField>

        {/* Tron Receiving Addresses */}
        <FormField
          label={t('admin.settings.usdt.trcReceivingAddresses')}
          description={t('admin.settings.usdt.trcReceivingAddressesDesc')}
          labelRight={<SourceBadge source={settings.trcReceivingAddresses.source} />}
          disabled={!enabled}
        >
          <Controller
            name="trcReceivingAddresses"
            control={control}
            render={({ field }) => (
              <div className="space-y-1.5">
                <textarea
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="T..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!enabled}
                  rows={3}
                />
                {errors.trcReceivingAddresses && (
                  <p className="text-xs text-destructive">{errors.trcReceivingAddresses.message}</p>
                )}
              </div>
            )}
          />
        </FormField>

        {/* PolygonScan API Key */}
        <FormField
          label={t('admin.settings.usdt.polygonscanApiKey')}
          description={t('admin.settings.usdt.polygonscanApiKeyDesc')}
          labelRight={<SourceBadge source={settings.polygonscanApiKey.source} />}
          disabled={!enabled}
        >
          <Controller
            name="polygonscanApiKey"
            control={control}
            render={({ field }) => (
              <SecretInput
                value={field.value || ''}
                onChange={field.onChange}
                placeholder={t('admin.settings.usdt.apiKeyPlaceholder')}
                disabled={!enabled}
              />
            )}
          />
        </FormField>

        {/* TronGrid API Key */}
        <FormField
          label={t('admin.settings.usdt.trongridApiKey')}
          description={t('admin.settings.usdt.trongridApiKeyDesc')}
          labelRight={<SourceBadge source={settings.trongridApiKey.source} />}
          disabled={!enabled}
        >
          <Controller
            name="trongridApiKey"
            control={control}
            render={({ field }) => (
              <SecretInput
                value={field.value || ''}
                onChange={field.onChange}
                placeholder={t('admin.settings.usdt.apiKeyPlaceholder')}
                disabled={!enabled}
              />
            )}
          />
        </FormField>

        {/* Payment TTL */}
        <FormField
          label={t('admin.settings.usdt.paymentTtlMinutes')}
          description={t('admin.settings.usdt.paymentTtlMinutesDesc')}
          labelRight={<SourceBadge source={settings.paymentTtlMinutes.source} />}
          disabled={!enabled}
        >
          <Controller
            name="paymentTtlMinutes"
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                value={field.value || ''}
                onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                placeholder="30"
                className="font-mono text-sm w-32"
                min={1}
                max={1440}
                disabled={!enabled}
              />
            )}
          />
        </FormField>

        {/* Polygon Confirmations */}
        <FormField
          label={t('admin.settings.usdt.polConfirmations')}
          description={t('admin.settings.usdt.polConfirmationsDesc')}
          labelRight={<SourceBadge source={settings.polConfirmations.source} />}
          disabled={!enabled}
        >
          <Controller
            name="polConfirmations"
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                value={field.value || ''}
                onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                placeholder="12"
                className="font-mono text-sm w-32"
                min={1}
                max={100}
                disabled={!enabled}
              />
            )}
          />
        </FormField>

        {/* Tron Confirmations */}
        <FormField
          label={t('admin.settings.usdt.trcConfirmations')}
          description={t('admin.settings.usdt.trcConfirmationsDesc')}
          labelRight={<SourceBadge source={settings.trcConfirmations.source} />}
          disabled={!enabled}
        >
          <Controller
            name="trcConfirmations"
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                value={field.value || ''}
                onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                placeholder="20"
                className="font-mono text-sm w-32"
                min={1}
                max={100}
                disabled={!enabled}
              />
            )}
          />
        </FormField>

        {/* Save Button */}
        {isDirty && (
          <FormActions>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {t('admin.settings.saveChanges')}
            </Button>
          </FormActions>
        )}
      </FormSection>
    </form>
  );
};

/**
 * Loading skeleton for the form
 */
export const USDTSettingsFormSkeleton = () => (
  <div className={cn(cardStyles, 'overflow-hidden')}>
    {/* Header skeleton */}
    <div className="flex items-center justify-between p-4 pb-3 border-b border-border/60">
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3.5 w-52" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    {/* Fields skeleton */}
    <div className="divide-y divide-border/60">
      {/* Enable switch */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-4">
        <div className="sm:pt-2 space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-44" />
        </div>
        <div className="sm:col-span-2">
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>
      </div>
      {/* Form fields */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-4"
        >
          <div className="sm:pt-2 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="sm:col-span-2">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      ))}
      {/* Number fields */}
      {[1, 2, 3].map((i) => (
        <div
          key={`num-${i}`}
          className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-4"
        >
          <div className="sm:pt-2 space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="sm:col-span-2">
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
