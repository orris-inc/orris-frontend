/**
 * Profile section component
 * Contains avatar upload and basic information form
 */

import * as Separator from '@radix-ui/react-separator';
import { useTranslation } from 'react-i18next';
import { AvatarUpload } from '../AvatarUpload';
import { BasicInfoTab } from '../BasicInfoTab';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { cardTitleStyles, cardDescriptionStyles } from '@/lib/ui-styles';

export const ProfileSection = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return (
    <div className="rounded-xl bg-card border overflow-hidden">
      {/* Avatar upload section */}
      <div className="flex flex-col space-y-1.5 p-5 sm:p-6 border-b">
        <h3 className={`${cardTitleStyles} text-lg`}>
          {t('profile.avatar.title')}
        </h3>
        <p className={`${cardDescriptionStyles} text-sm`}>
          {t('profile.avatar.description')}
        </p>
      </div>
      <div className="p-5 sm:p-6">
        <AvatarUpload avatar={undefined} name={user.displayName} />
      </div>

      {/* Separator */}
      <Separator.Root className="h-px bg-border" />

      {/* Basic info form section */}
      <div className="flex flex-col space-y-1.5 p-5 sm:p-6 border-b">
        <h3 className={`${cardTitleStyles} text-lg`}>
          {t('profile.basicInfo.title')}
        </h3>
      </div>
      <div className="p-5 sm:p-6">
        <BasicInfoTab user={user} />
      </div>
    </div>
  );
};
