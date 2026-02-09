/**
 * Legal Settings Form
 * Form for configuring legal URLs (terms of service, privacy policy)
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';
import { cardStyles } from '@/lib/ui-styles';
import { FormSection, FormField, FormActions } from './FormField';
import { SourceBadge } from './SourceBadge';
import type {
  LegalSettingsResponse,
  UpdateLegalSettingsRequest,
} from '@/api/setting';

const legalSettingsSchema = z.object({
  termsOfServiceUrl: z.string().url().max(500).or(z.literal('')),
  privacyPolicyUrl: z.string().url().max(500).or(z.literal('')),
});

type LegalSettingsFormData = z.infer<typeof legalSettingsSchema>;

interface LegalSettingsFormProps {
  settings: LegalSettingsResponse;
  onSubmit: (data: UpdateLegalSettingsRequest) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Legal settings form component
 */
export const LegalSettingsForm = ({
  settings,
  onSubmit,
  isSubmitting,
}: LegalSettingsFormProps) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<LegalSettingsFormData>({
    resolver: zodResolver(legalSettingsSchema),
    defaultValues: {
      termsOfServiceUrl: settings.termsOfServiceUrl.value as string,
      privacyPolicyUrl: settings.privacyPolicyUrl.value as string,
    },
  });

  // Reset form when settings change
  useEffect(() => {
    reset({
      termsOfServiceUrl: settings.termsOfServiceUrl.value as string,
      privacyPolicyUrl: settings.privacyPolicyUrl.value as string,
    });
  }, [settings, reset]);

  const handleFormSubmit = async (data: LegalSettingsFormData) => {
    const updates: UpdateLegalSettingsRequest = {};

    if (data.termsOfServiceUrl !== settings.termsOfServiceUrl.value) {
      updates.termsOfServiceUrl = data.termsOfServiceUrl;
    }
    if (data.privacyPolicyUrl !== settings.privacyPolicyUrl.value) {
      updates.privacyPolicyUrl = data.privacyPolicyUrl;
    }

    if (Object.keys(updates).length > 0) {
      await onSubmit(updates);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormSection
        title={t('admin.settings.legal.title')}
        description={t('admin.settings.legal.description')}
      >
        {/* Terms of Service URL */}
        <FormField
          label={t('admin.settings.legal.termsOfService')}
          description={t('admin.settings.legal.termsOfServiceDesc')}
          labelRight={<SourceBadge source={settings.termsOfServiceUrl.source} />}
        >
          <Input
            {...register('termsOfServiceUrl')}
            type="url"
            placeholder="https://example.com/terms"
            className="max-w-md"
          />
          {errors.termsOfServiceUrl && (
            <p className="text-sm text-destructive mt-1">
              {t('common.validation.url')}
            </p>
          )}
        </FormField>

        {/* Privacy Policy URL */}
        <FormField
          label={t('admin.settings.legal.privacyPolicy')}
          description={t('admin.settings.legal.privacyPolicyDesc')}
          labelRight={<SourceBadge source={settings.privacyPolicyUrl.source} />}
        >
          <Input
            {...register('privacyPolicyUrl')}
            type="url"
            placeholder="https://example.com/privacy"
            className="max-w-md"
          />
          {errors.privacyPolicyUrl && (
            <p className="text-sm text-destructive mt-1">
              {t('common.validation.url')}
            </p>
          )}
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
export const LegalSettingsFormSkeleton = () => (
  <div className={cn(cardStyles, 'overflow-hidden')}>
    {/* Header skeleton */}
    <div className="flex items-center justify-between p-5 pb-4 border-b border-border/50">
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3.5 w-52" />
      </div>
    </div>
    {/* Fields skeleton */}
    <div className="divide-y divide-border/50">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-5">
          <div className="sm:pt-2 space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="sm:col-span-2">
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
