/**
 * Auth Methods Settings Form
 * Form for configuring authentication methods (password, passkey, OAuth toggles)
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';
import { cardStyles, getAlertClass } from '@/lib/ui-styles';
import { FormSection, FormField, FormActions } from './FormField';
import { SourceBadge } from './SourceBadge';
import type {
  AuthMethodsSettingsResponse,
  UpdateAuthMethodsSettingsRequest,
} from '@/api/setting';

const authMethodsSettingsSchema = z.object({
  passwordEnabled: z.boolean(),
  passkeyEnabled: z.boolean(),
  oauthEnabled: z.boolean(),
});

type AuthMethodsSettingsFormData = z.infer<typeof authMethodsSettingsSchema>;

interface AuthMethodsSettingsFormProps {
  settings: AuthMethodsSettingsResponse;
  onSubmit: (data: UpdateAuthMethodsSettingsRequest) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Auth methods settings form component
 */
export const AuthMethodsSettingsForm = ({
  settings,
  onSubmit,
  isSubmitting,
}: AuthMethodsSettingsFormProps) => {
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = useForm<AuthMethodsSettingsFormData>({
    resolver: zodResolver(authMethodsSettingsSchema),
    defaultValues: {
      passwordEnabled: settings.passwordEnabled.value as boolean,
      passkeyEnabled: settings.passkeyEnabled.value as boolean,
      oauthEnabled: settings.oauthEnabled.value as boolean,
    },
  });

  // Watch all values to check if at least one is enabled
  const passwordEnabled = watch('passwordEnabled');
  const passkeyEnabled = watch('passkeyEnabled');
  const oauthEnabled = watch('oauthEnabled');
  const atLeastOneEnabled = passwordEnabled || passkeyEnabled || oauthEnabled;

  useEffect(() => {
    if (!isDirty) {
      reset({
        passwordEnabled: settings.passwordEnabled.value as boolean,
        passkeyEnabled: settings.passkeyEnabled.value as boolean,
        oauthEnabled: settings.oauthEnabled.value as boolean,
      });
    }
  }, [settings, reset, isDirty]);

  const handleFormSubmit = async (data: AuthMethodsSettingsFormData) => {
    if (!atLeastOneEnabled) return;

    const updates: UpdateAuthMethodsSettingsRequest = {};

    if (data.passwordEnabled !== settings.passwordEnabled.value) {
      updates.passwordEnabled = data.passwordEnabled;
    }
    if (data.passkeyEnabled !== settings.passkeyEnabled.value) {
      updates.passkeyEnabled = data.passkeyEnabled;
    }
    if (data.oauthEnabled !== settings.oauthEnabled.value) {
      updates.oauthEnabled = data.oauthEnabled;
    }

    if (Object.keys(updates).length > 0) {
      await onSubmit(updates);
      reset(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormSection
        title={t('admin.settings.authMethods.title')}
        description={t('admin.settings.authMethods.description')}
      >
        {/* Password Auth */}
        <FormField
          label={t('admin.settings.authMethods.password')}
          description={t('admin.settings.authMethods.passwordDesc')}
          labelRight={<SourceBadge source={settings.passwordEnabled.source} />}
        >
          <Controller
            name="passwordEnabled"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
            )}
          />
        </FormField>

        {/* Passkey Auth */}
        <FormField
          label={t('admin.settings.authMethods.passkey')}
          description={t('admin.settings.authMethods.passkeyDesc')}
          labelRight={<SourceBadge source={settings.passkeyEnabled.source} />}
        >
          <Controller
            name="passkeyEnabled"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
            )}
          />
        </FormField>

        {/* OAuth Auth */}
        <FormField
          label={t('admin.settings.authMethods.oauth')}
          description={t('admin.settings.authMethods.oauthDesc')}
          labelRight={<SourceBadge source={settings.oauthEnabled.source} />}
        >
          <Controller
            name="oauthEnabled"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
            )}
          />
        </FormField>

        {/* Warning: at least one must be enabled */}
        {!atLeastOneEnabled && (
          <div className="p-5">
            <div className={getAlertClass('destructive')}>
              <AlertTriangle className="size-4 shrink-0" />
              <span className="text-sm">{t('admin.settings.authMethods.atLeastOneRequired')}</span>
            </div>
          </div>
        )}

        {/* Save Button */}
        {isDirty && (
          <FormActions>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !atLeastOneEnabled}
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
export const AuthMethodsSettingsFormSkeleton = () => (
  <div className={cn(cardStyles, 'overflow-hidden')}>
    <div className="flex items-center justify-between p-4 pb-3 border-b border-border/60">
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3.5 w-56" />
      </div>
    </div>
    <div className="divide-y divide-border/60">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-4">
          <div className="sm:pt-2 space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="sm:col-span-2">
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
