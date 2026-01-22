import * as Separator from '@radix-ui/react-separator';
import { useTranslation } from 'react-i18next';
import { ChangePasswordForm } from './ChangePasswordForm';

/**
 * Security settings tab
 */
export const SecurityTab = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">{t('profile.security.changePasswordTitle')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('profile.security.changePasswordDesc')}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-6">
            <ChangePasswordForm />
          </div>
        </div>
      </div>

      <Separator.Root className="shrink-0 bg-border h-[1px] w-full" />

      {/* OAuth binding management (placeholder) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">{t('profile.security.oauthBindingTitle')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('profile.security.oauthBindingDesc')}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              {t('profile.security.oauthComingSoon')}
            </p>
          </div>
        </div>
      </div>

      <Separator.Root className="shrink-0 bg-border h-[1px] w-full" />

      {/* Danger zone (placeholder) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-destructive">{t('profile.security.dangerZoneTitle')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('profile.security.dangerZoneDesc')}
          </p>
        </div>

        <div className="rounded-lg border border-destructive/50 bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              {t('profile.security.deleteAccountComingSoon')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
