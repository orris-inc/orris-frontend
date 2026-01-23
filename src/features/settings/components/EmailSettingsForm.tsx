/**
 * Email Settings Form
 * Form for configuring SMTP email settings with two-column layout
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2, Send, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import {
  FormSection,
  FormField,
  FormActions,
  FormSectionSkeleton,
} from './FormField';
import { SecretInput } from './SecretInput';
import { cn } from '@/lib/utils';
import type {
  EmailSettingsResponse,
  UpdateEmailSettingsRequest,
  EmailTestResponse,
} from '@/api/admin';

const emailSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  fromAddress: z.string().email().optional().or(z.literal('')),
  fromName: z.string().optional(),
});

type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;

interface EmailSettingsFormProps {
  settings: EmailSettingsResponse;
  onSubmit: (data: UpdateEmailSettingsRequest) => Promise<void>;
  onTest: (recipientEmail: string) => Promise<EmailTestResponse>;
  isSubmitting: boolean;
  isTesting: boolean;
  testResult?: EmailTestResponse | null;
}

/**
 * Email settings form component
 */
export const EmailSettingsForm = ({
  settings,
  onSubmit,
  onTest,
  isSubmitting,
  isTesting,
  testResult,
}: EmailSettingsFormProps) => {
  const { t } = useTranslation();
  const [testEmail, setTestEmail] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<EmailSettingsFormData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpHost: (settings.smtpHost.value as string) || '',
      smtpPort: (settings.smtpPort.value as number) || 587,
      smtpUser: (settings.smtpUser.value as string) || '',
      smtpPassword: (settings.smtpPassword.value as string) || '',
      fromAddress: (settings.fromAddress.value as string) || '',
      fromName: (settings.fromName.value as string) || '',
    },
  });

  // Reset form when settings change
  useEffect(() => {
    reset({
      smtpHost: (settings.smtpHost.value as string) || '',
      smtpPort: (settings.smtpPort.value as number) || 587,
      smtpUser: (settings.smtpUser.value as string) || '',
      smtpPassword: (settings.smtpPassword.value as string) || '',
      fromAddress: (settings.fromAddress.value as string) || '',
      fromName: (settings.fromName.value as string) || '',
    });
  }, [settings, reset]);

  const handleFormSubmit = async (data: EmailSettingsFormData) => {
    const updates: UpdateEmailSettingsRequest = {};

    if (data.smtpHost !== settings.smtpHost.value) {
      updates.smtpHost = data.smtpHost || undefined;
    }
    if (data.smtpPort !== settings.smtpPort.value) {
      updates.smtpPort = data.smtpPort || undefined;
    }
    if (data.smtpUser !== settings.smtpUser.value) {
      updates.smtpUser = data.smtpUser || undefined;
    }
    if (data.smtpPassword && !data.smtpPassword.includes('*')) {
      updates.smtpPassword = data.smtpPassword;
    }
    if (data.fromAddress !== settings.fromAddress.value) {
      updates.fromAddress = data.fromAddress || undefined;
    }
    if (data.fromName !== settings.fromName.value) {
      updates.fromName = data.fromName || undefined;
    }

    if (Object.keys(updates).length > 0) {
      await onSubmit(updates);
    }
  };

  const handleTest = async () => {
    if (!testEmail) return;
    await onTest(testEmail);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormSection
        title={t('admin.settings.email.title')}
        description={t('admin.settings.email.description')}
      >
        {/* SMTP Host */}
        <FormField
          label={t('admin.settings.email.smtpHost')}
          description={t('admin.settings.email.smtpHostDesc')}
        >
          <Controller
            name="smtpHost"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="smtp.example.com"
                className="font-mono text-sm"
              />
            )}
          />
        </FormField>

        {/* SMTP Port */}
        <FormField
          label={t('admin.settings.email.smtpPort')}
          description={t('admin.settings.email.smtpPortDesc')}
        >
          <Controller
            name="smtpPort"
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                value={field.value || ''}
                onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                placeholder="587"
                className="font-mono text-sm w-32"
                min={1}
                max={65535}
              />
            )}
          />
        </FormField>

        {/* SMTP User */}
        <FormField
          label={t('admin.settings.email.smtpUser')}
          description={t('admin.settings.email.smtpUserDesc')}
        >
          <Controller
            name="smtpUser"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="user@example.com"
                className="font-mono text-sm"
              />
            )}
          />
        </FormField>

        {/* SMTP Password */}
        <FormField
          label={t('admin.settings.email.smtpPassword')}
          description={t('admin.settings.email.smtpPasswordDesc')}
        >
          <Controller
            name="smtpPassword"
            control={control}
            render={({ field }) => (
              <SecretInput
                value={field.value || ''}
                onChange={field.onChange}
                placeholder={t('admin.settings.email.smtpPasswordPlaceholder')}
              />
            )}
          />
        </FormField>

        {/* From Address */}
        <FormField
          label={t('admin.settings.email.fromAddress')}
          description={t('admin.settings.email.fromAddressDesc')}
        >
          <Controller
            name="fromAddress"
            control={control}
            render={({ field }) => (
              <Input
                type="email"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="noreply@example.com"
                className="font-mono text-sm"
              />
            )}
          />
        </FormField>

        {/* From Name */}
        <FormField
          label={t('admin.settings.email.fromName')}
          description={t('admin.settings.email.fromNameDesc')}
        >
          <Controller
            name="fromName"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="My App"
                className="text-sm"
              />
            )}
          />
        </FormField>

        {/* Test Connection Section */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder={t('admin.settings.email.testEmailPlaceholder')}
              className="flex-1 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={isTesting || !testEmail}
              className="gap-2 shrink-0"
            >
              {isTesting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {t('admin.settings.email.testConnection')}
            </Button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg text-sm',
                testResult.success
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              {testResult.success ? (
                <>
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{t('admin.settings.email.testSuccessMessage')}</span>
                </>
              ) : (
                <>
                  <XCircle className="size-4 shrink-0" />
                  <span className="truncate">{testResult.error}</span>
                </>
              )}
            </div>
          )}
        </div>

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
export const EmailSettingsFormSkeleton = () => (
  <FormSectionSkeleton fieldCount={6} />
);
