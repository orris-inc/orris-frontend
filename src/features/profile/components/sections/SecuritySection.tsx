/**
 * Security section component
 * Contains password change, passkey management, and OAuth bindings
 */

import { useTranslation } from 'react-i18next';
import { ChangePasswordForm } from '../ChangePasswordForm';
import { PasskeyManagement } from '../PasskeyManagement';
import { cardTitleStyles, cardDescriptionStyles } from '@/lib/ui-styles';

export const SecuritySection = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Change password section */}
      <div className="rounded-xl bg-card ring-1 ring-border overflow-hidden">
        <div className="flex flex-col space-y-1.5 p-5 sm:p-6 border-b">
          <h3 className={`${cardTitleStyles} text-lg`}>
            {t('profile.security.changePasswordTitle')}
          </h3>
          <p className={`${cardDescriptionStyles} text-sm`}>
            {t('profile.security.changePasswordDesc')}
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <ChangePasswordForm />
        </div>
      </div>

      {/* Passkey management section */}
      <div className="rounded-xl bg-card ring-1 ring-border overflow-hidden">
        <div className="p-5 sm:p-6">
          <PasskeyManagement />
        </div>
      </div>

      {/* OAuth binding section */}
      <div className="rounded-xl bg-card ring-1 ring-border overflow-hidden">
        <div className="flex flex-col space-y-1.5 p-5 sm:p-6 border-b">
          <h3 className={`${cardTitleStyles} text-lg`}>
            {t('profile.security.oauthBindingTitle')}
          </h3>
          <p className={`${cardDescriptionStyles} text-sm`}>
            {t('profile.security.oauthBindingDesc')}
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-sm text-muted-foreground">
            {t('profile.security.oauthComingSoon')}
          </p>
        </div>
      </div>

      {/* Danger zone section */}
      <div className="rounded-xl bg-card ring-1 ring-destructive/50 overflow-hidden">
        <div className="flex flex-col space-y-1.5 p-5 sm:p-6 border-b border-destructive/30 bg-destructive/5">
          <h3 className={`${cardTitleStyles} text-lg text-destructive`}>
            {t('profile.security.dangerZoneTitle')}
          </h3>
          <p className={`${cardDescriptionStyles} text-sm`}>
            {t('profile.security.dangerZoneDesc')}
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-sm text-muted-foreground">
            {t('profile.security.deleteAccountComingSoon')}
          </p>
        </div>
      </div>
    </div>
  );
};
