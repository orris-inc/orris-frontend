/**
 * Registration Settings Form
 * Form for configuring registration settings (open registration, email verification)
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';
import { cardStyles } from '@/lib/ui-styles';
import { FormSection, FormField, FormActions } from './FormField';
import { SourceBadge } from './SourceBadge';
import type {
  RegistrationSettingsResponse,
  UpdateRegistrationSettingsRequest,
} from '@/api/setting';

const registrationSettingsSchema = z.object({
  registrationEnabled: z.boolean(),
  emailVerificationRequired: z.boolean(),
});

type RegistrationSettingsFormData = z.infer<typeof registrationSettingsSchema>;

interface RegistrationSettingsFormProps {
  settings: RegistrationSettingsResponse;
  onSubmit: (data: UpdateRegistrationSettingsRequest) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Registration settings form component
 */
export const RegistrationSettingsForm = ({
  settings,
  onSubmit,
  isSubmitting,
}: RegistrationSettingsFormProps) => {
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<RegistrationSettingsFormData>({
    resolver: zodResolver(registrationSettingsSchema),
    defaultValues: {
      registrationEnabled: settings.registrationEnabled.value as boolean,
      emailVerificationRequired: settings.emailVerificationRequired.value as boolean,
    },
  });

  // Reset form when settings change
  useEffect(() => {
    reset({
      registrationEnabled: settings.registrationEnabled.value as boolean,
      emailVerificationRequired: settings.emailVerificationRequired.value as boolean,
    });
  }, [settings, reset]);

  const handleFormSubmit = async (data: RegistrationSettingsFormData) => {
    const updates: UpdateRegistrationSettingsRequest = {};

    if (data.registrationEnabled !== settings.registrationEnabled.value) {
      updates.registrationEnabled = data.registrationEnabled;
    }
    if (data.emailVerificationRequired !== settings.emailVerificationRequired.value) {
      updates.emailVerificationRequired = data.emailVerificationRequired;
    }

    if (Object.keys(updates).length > 0) {
      await onSubmit(updates);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormSection
        title={t('admin.settings.registration.title')}
        description={t('admin.settings.registration.description')}
      >
        {/* Registration Enabled */}
        <FormField
          label={t('admin.settings.registration.enabled')}
          description={t('admin.settings.registration.enabledDesc')}
          labelRight={<SourceBadge source={settings.registrationEnabled.source} />}
        >
          <Controller
            name="registrationEnabled"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
            )}
          />
        </FormField>

        {/* Email Verification Required */}
        <FormField
          label={t('admin.settings.registration.emailVerification')}
          description={t('admin.settings.registration.emailVerificationDesc')}
          labelRight={<SourceBadge source={settings.emailVerificationRequired.source} />}
        >
          <Controller
            name="emailVerificationRequired"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
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
export const RegistrationSettingsFormSkeleton = () => (
  <div className={cn(cardStyles, 'overflow-hidden')}>
    {/* Header skeleton */}
    <div className="flex items-center justify-between p-5 pb-4 border-b border-border/50">
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3.5 w-48" />
      </div>
    </div>
    {/* Fields skeleton */}
    <div className="divide-y divide-border/50">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-5">
          <div className="sm:pt-2 space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-56" />
          </div>
          <div className="sm:col-span-2">
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
