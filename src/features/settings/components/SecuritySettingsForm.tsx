/**
 * Security Settings Form
 * Form for configuring security settings (password policy, session, login protection)
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Skeleton } from '@/components/common/Skeleton';
import { FormSection, FormField, FormActions } from './FormField';
import { SourceBadge } from './SourceBadge';
import type {
  SecuritySettingsResponse,
  UpdateSecuritySettingsRequest,
} from '@/api/setting';

const securitySettingsSchema = z.object({
  // Password policy
  passwordMinLength: z.number().min(8).max(32),
  passwordRequireUppercase: z.boolean(),
  passwordRequireLowercase: z.boolean(),
  passwordRequireNumber: z.boolean(),
  passwordRequireSpecial: z.boolean(),
  passwordExpiryDays: z.number().min(0).max(365),
  // Session settings
  sessionTimeoutMinutes: z.number().min(5).max(43200),
  // Login protection
  maxLoginAttempts: z.number().min(3).max(20),
  lockoutDurationMinutes: z.number().min(1).max(1440),
});

type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;

interface SecuritySettingsFormProps {
  settings: SecuritySettingsResponse;
  onSubmit: (data: UpdateSecuritySettingsRequest) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Security settings form component
 */
export const SecuritySettingsForm = ({
  settings,
  onSubmit,
  isSubmitting,
}: SecuritySettingsFormProps) => {
  const { t } = useTranslation();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SecuritySettingsFormData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      passwordMinLength: settings.passwordMinLength.value as number,
      passwordRequireUppercase: settings.passwordRequireUppercase.value as boolean,
      passwordRequireLowercase: settings.passwordRequireLowercase.value as boolean,
      passwordRequireNumber: settings.passwordRequireNumber.value as boolean,
      passwordRequireSpecial: settings.passwordRequireSpecial.value as boolean,
      passwordExpiryDays: settings.passwordExpiryDays.value as number,
      sessionTimeoutMinutes: settings.sessionTimeoutMinutes.value as number,
      maxLoginAttempts: settings.maxLoginAttempts.value as number,
      lockoutDurationMinutes: settings.lockoutDurationMinutes.value as number,
    },
  });

  // Reset form when settings change
  useEffect(() => {
    reset({
      passwordMinLength: settings.passwordMinLength.value as number,
      passwordRequireUppercase: settings.passwordRequireUppercase.value as boolean,
      passwordRequireLowercase: settings.passwordRequireLowercase.value as boolean,
      passwordRequireNumber: settings.passwordRequireNumber.value as boolean,
      passwordRequireSpecial: settings.passwordRequireSpecial.value as boolean,
      passwordExpiryDays: settings.passwordExpiryDays.value as number,
      sessionTimeoutMinutes: settings.sessionTimeoutMinutes.value as number,
      maxLoginAttempts: settings.maxLoginAttempts.value as number,
      lockoutDurationMinutes: settings.lockoutDurationMinutes.value as number,
    });
  }, [settings, reset]);

  const handleFormSubmit = async (data: SecuritySettingsFormData) => {
    const updates: UpdateSecuritySettingsRequest = {};

    if (data.passwordMinLength !== settings.passwordMinLength.value) {
      updates.passwordMinLength = data.passwordMinLength;
    }
    if (data.passwordRequireUppercase !== settings.passwordRequireUppercase.value) {
      updates.passwordRequireUppercase = data.passwordRequireUppercase;
    }
    if (data.passwordRequireLowercase !== settings.passwordRequireLowercase.value) {
      updates.passwordRequireLowercase = data.passwordRequireLowercase;
    }
    if (data.passwordRequireNumber !== settings.passwordRequireNumber.value) {
      updates.passwordRequireNumber = data.passwordRequireNumber;
    }
    if (data.passwordRequireSpecial !== settings.passwordRequireSpecial.value) {
      updates.passwordRequireSpecial = data.passwordRequireSpecial;
    }
    if (data.passwordExpiryDays !== settings.passwordExpiryDays.value) {
      updates.passwordExpiryDays = data.passwordExpiryDays;
    }
    if (data.sessionTimeoutMinutes !== settings.sessionTimeoutMinutes.value) {
      updates.sessionTimeoutMinutes = data.sessionTimeoutMinutes;
    }
    if (data.maxLoginAttempts !== settings.maxLoginAttempts.value) {
      updates.maxLoginAttempts = data.maxLoginAttempts;
    }
    if (data.lockoutDurationMinutes !== settings.lockoutDurationMinutes.value) {
      updates.lockoutDurationMinutes = data.lockoutDurationMinutes;
    }

    if (Object.keys(updates).length > 0) {
      await onSubmit(updates);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Password Policy Section */}
      <FormSection
        title={t('admin.settings.security.passwordPolicy')}
        description={t('admin.settings.security.passwordPolicyDesc')}
      >
        {/* Min Length */}
        <FormField
          label={t('admin.settings.security.minLength')}
          description={t('admin.settings.security.minLengthDesc')}
          labelRight={<SourceBadge source={settings.passwordMinLength.source} />}
        >
          <Input
            type="number"
            {...register('passwordMinLength', { valueAsNumber: true })}
            min={8}
            max={32}
            className="w-24"
          />
          {errors.passwordMinLength && (
            <p className="text-sm text-destructive mt-1">{errors.passwordMinLength.message}</p>
          )}
        </FormField>

        {/* Require Uppercase */}
        <FormField
          label={t('admin.settings.security.requireUppercase')}
          description={t('admin.settings.security.requireUppercaseDesc')}
          labelRight={<SourceBadge source={settings.passwordRequireUppercase.source} />}
        >
          <Controller
            name="passwordRequireUppercase"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
            )}
          />
        </FormField>

        {/* Require Lowercase */}
        <FormField
          label={t('admin.settings.security.requireLowercase')}
          description={t('admin.settings.security.requireLowercaseDesc')}
          labelRight={<SourceBadge source={settings.passwordRequireLowercase.source} />}
        >
          <Controller
            name="passwordRequireLowercase"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
            )}
          />
        </FormField>

        {/* Require Number */}
        <FormField
          label={t('admin.settings.security.requireNumber')}
          description={t('admin.settings.security.requireNumberDesc')}
          labelRight={<SourceBadge source={settings.passwordRequireNumber.source} />}
        >
          <Controller
            name="passwordRequireNumber"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
            )}
          />
        </FormField>

        {/* Require Special */}
        <FormField
          label={t('admin.settings.security.requireSpecial')}
          description={t('admin.settings.security.requireSpecialDesc')}
          labelRight={<SourceBadge source={settings.passwordRequireSpecial.source} />}
        >
          <Controller
            name="passwordRequireSpecial"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
            )}
          />
        </FormField>

        {/* Password Expiry */}
        <FormField
          label={t('admin.settings.security.passwordExpiry')}
          description={t('admin.settings.security.passwordExpiryDesc')}
          labelRight={<SourceBadge source={settings.passwordExpiryDays.source} />}
        >
          <div className="flex items-center gap-2">
            <Input
              type="number"
              {...register('passwordExpiryDays', { valueAsNumber: true })}
              min={0}
              max={365}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">
              {t('admin.settings.security.days')}
            </span>
          </div>
          {errors.passwordExpiryDays && (
            <p className="text-sm text-destructive mt-1">{errors.passwordExpiryDays.message}</p>
          )}
        </FormField>
      </FormSection>

      {/* Session Settings Section */}
      <FormSection
        title={t('admin.settings.security.sessionSettings')}
        description={t('admin.settings.security.sessionSettingsDesc')}
      >
        {/* Session Timeout */}
        <FormField
          label={t('admin.settings.security.sessionTimeout')}
          description={t('admin.settings.security.sessionTimeoutDesc')}
          labelRight={<SourceBadge source={settings.sessionTimeoutMinutes.source} />}
        >
          <div className="flex items-center gap-2">
            <Input
              type="number"
              {...register('sessionTimeoutMinutes', { valueAsNumber: true })}
              min={5}
              max={43200}
              className="w-28"
            />
            <span className="text-sm text-muted-foreground">
              {t('admin.settings.security.minutes')}
            </span>
          </div>
          {errors.sessionTimeoutMinutes && (
            <p className="text-sm text-destructive mt-1">{errors.sessionTimeoutMinutes.message}</p>
          )}
        </FormField>
      </FormSection>

      {/* Login Protection Section */}
      <FormSection
        title={t('admin.settings.security.loginProtection')}
        description={t('admin.settings.security.loginProtectionDesc')}
      >
        {/* Max Login Attempts */}
        <FormField
          label={t('admin.settings.security.maxLoginAttempts')}
          description={t('admin.settings.security.maxLoginAttemptsDesc')}
          labelRight={<SourceBadge source={settings.maxLoginAttempts.source} />}
        >
          <Input
            type="number"
            {...register('maxLoginAttempts', { valueAsNumber: true })}
            min={3}
            max={20}
            className="w-24"
          />
          {errors.maxLoginAttempts && (
            <p className="text-sm text-destructive mt-1">{errors.maxLoginAttempts.message}</p>
          )}
        </FormField>

        {/* Lockout Duration */}
        <FormField
          label={t('admin.settings.security.lockoutDuration')}
          description={t('admin.settings.security.lockoutDurationDesc')}
          labelRight={<SourceBadge source={settings.lockoutDurationMinutes.source} />}
        >
          <div className="flex items-center gap-2">
            <Input
              type="number"
              {...register('lockoutDurationMinutes', { valueAsNumber: true })}
              min={1}
              max={1440}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">
              {t('admin.settings.security.minutes')}
            </span>
          </div>
          {errors.lockoutDurationMinutes && (
            <p className="text-sm text-destructive mt-1">{errors.lockoutDurationMinutes.message}</p>
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
export const SecuritySettingsFormSkeleton = () => (
  <div className="space-y-6">
    {/* Password Policy Section */}
    <div className="bg-card rounded-lg ring-1 ring-border overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-4 border-b border-border/50">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3.5 w-56" />
        </div>
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-5">
            <div className="sm:pt-2 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="sm:col-span-2">
              <Skeleton className={i < 1 || i === 5 ? "h-10 w-24" : "h-6 w-11 rounded-full"} />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Session Settings Section */}
    <div className="bg-card rounded-lg ring-1 ring-border overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-4 border-b border-border/50">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3.5 w-48" />
        </div>
      </div>
      <div className="divide-y divide-border/50">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-5">
          <div className="sm:pt-2 space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-52" />
          </div>
          <div className="sm:col-span-2">
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </div>
    </div>

    {/* Login Protection Section */}
    <div className="bg-card rounded-lg ring-1 ring-border overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-4 border-b border-border/50">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3.5 w-48" />
        </div>
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-5">
            <div className="sm:pt-2 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="sm:col-span-2">
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
