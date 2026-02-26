/**
 * System Settings Form
 * Form for configuring core system settings with two-column layout
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2, Lock } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import {
  FormSection,
  FormField,
  FormActions,
  FormSectionSkeleton,
} from './FormField';
import { SourceBadge } from './SourceBadge';
import type {
  SystemSettingsResponse,
  UpdateSystemSettingsRequest,
} from '@/api/admin';

const systemSettingsSchema = z.object({
  subscriptionBaseUrl: z.string().url().optional().or(z.literal('')),
  frontendUrl: z.string().url().optional().or(z.literal('')),
});

type SystemSettingsFormData = z.infer<typeof systemSettingsSchema>;

interface SystemSettingsFormProps {
  settings: SystemSettingsResponse;
  onSubmit: (data: UpdateSystemSettingsRequest) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Read-only badge component
 */
const ReadOnlyBadge = () => {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground ring-1 ring-border">
      <Lock className="size-3" />
      {t('admin.settings.readOnly')}
    </span>
  );
};

/**
 * System settings form component
 */
export const SystemSettingsForm = ({
  settings,
  onSubmit,
  isSubmitting,
}: SystemSettingsFormProps) => {
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<SystemSettingsFormData>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      subscriptionBaseUrl: (settings.subscriptionBaseUrl.value as string) || '',
      frontendUrl: (settings.frontendUrl.value as string) || '',
    },
  });

  // Sync form with API values only when the user has no unsaved edits.
  // After a successful save, handleFormSubmit calls reset() to clear isDirty,
  // so this effect will pick up the refreshed settings from the next query refetch.
  useEffect(() => {
    if (!isDirty) {
      reset({
        subscriptionBaseUrl: (settings.subscriptionBaseUrl.value as string) || '',
        frontendUrl: (settings.frontendUrl.value as string) || '',
      });
    }
  }, [settings, reset, isDirty]);

  const handleFormSubmit = async (data: SystemSettingsFormData) => {
    const updates: UpdateSystemSettingsRequest = {};

    if (data.subscriptionBaseUrl !== settings.subscriptionBaseUrl.value) {
      updates.subscriptionBaseUrl = data.subscriptionBaseUrl || undefined;
    }
    if (data.frontendUrl !== settings.frontendUrl.value) {
      updates.frontendUrl = data.frontendUrl || undefined;
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
        title={t('admin.settings.system.title')}
        description={t('admin.settings.system.description')}
      >
        {/* API Base URL (Read-only) */}
        <FormField
          label={t('admin.settings.system.apiBaseUrl')}
          description={t('admin.settings.system.apiBaseUrlDesc')}
          disabled={settings.apiBaseUrl.isReadOnly}
          labelRight={
            <>
              <SourceBadge source={settings.apiBaseUrl.source} />
              {settings.apiBaseUrl.isReadOnly && <ReadOnlyBadge />}
            </>
          }
        >
          <Input
            type="url"
            value={(settings.apiBaseUrl.value as string) || ''}
            disabled
            className="font-mono text-sm bg-muted/50"
          />
        </FormField>

        {/* Subscription Base URL */}
        <FormField
          label={t('admin.settings.system.subscriptionBaseUrl')}
          description={t('admin.settings.system.subscriptionBaseUrlDesc')}
          labelRight={<SourceBadge source={settings.subscriptionBaseUrl.source} />}
        >
          <Controller
            name="subscriptionBaseUrl"
            control={control}
            render={({ field }) => (
              <Input
                type="url"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="https://subscribe.example.com"
                className="font-mono text-sm"
              />
            )}
          />
        </FormField>

        {/* Frontend URL */}
        <FormField
          label={t('admin.settings.system.frontendUrl')}
          description={t('admin.settings.system.frontendUrlDesc')}
          labelRight={<SourceBadge source={settings.frontendUrl.source} />}
        >
          <Controller
            name="frontendUrl"
            control={control}
            render={({ field }) => (
              <Input
                type="url"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="https://app.example.com"
                className="font-mono text-sm"
              />
            )}
          />
        </FormField>

        {/* Timezone (Read-only) */}
        <FormField
          label={t('admin.settings.system.timezone')}
          description={t('admin.settings.system.timezoneDesc')}
          labelRight={<SourceBadge source={settings.timezone.source} />}
        >
          <Input
            type="text"
            value={(settings.timezone.value as string) || 'UTC'}
            disabled
            className="font-mono text-sm bg-muted/50"
          />
        </FormField>

        {/* Actions */}
        {isDirty && (
          <FormActions>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2">
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
export const SystemSettingsFormSkeleton = () => (
  <FormSectionSkeleton fieldCount={4} />
);
