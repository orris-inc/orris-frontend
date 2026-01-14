/**
 * Profile settings page
 * Provides complete personal information editing interface with iOS 26 Liquid Glass style
 */

import * as Separator from '@radix-ui/react-separator';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { usePageTitle } from '@/shared/hooks';
import { AvatarUpload } from '@/features/profile/components/AvatarUpload';
import { BasicInfoTab } from '@/features/profile/components/BasicInfoTab';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import {
  cardTitleStyles,
  cardDescriptionStyles,
  alertDescriptionStyles
} from '@/lib/ui-styles';

export const ProfileSettingsPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('profile.title'));

  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="container max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <p className="text-lg text-muted-foreground">{t('profile.pleaseLogin')}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 pb-safe">
        {/* Page title */}
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          {t('profile.title')}
        </h1>

        {/* Main content area - iOS 26 Liquid Glass card */}
        <div className="glass-elevated rounded-2xl overflow-hidden animate-spring-in">
          {/* Avatar upload section */}
          <div className="flex flex-col space-y-1.5 p-4 sm:p-6 bg-muted/30">
            <h3 className={`${cardTitleStyles} text-xl sm:text-2xl`}>
              {t('profile.avatar.title')}
            </h3>
            <p className={`${cardDescriptionStyles} text-xs sm:text-sm`}>
              {t('profile.avatar.description')}
            </p>
          </div>
          <div className="p-4 pt-4 sm:p-6 sm:pt-6">
            <AvatarUpload avatar={undefined} name={user.displayName} />
          </div>

          {/* Separator with translucent border */}
          <Separator.Root className="my-0 h-[1px] bg-border/50" />

          {/* Basic info form section */}
          <div className="flex flex-col space-y-1.5 p-4 sm:p-6">
            <h3 className={`${cardTitleStyles} text-xl sm:text-2xl`}>
              {t('profile.basicInfo.title')}
            </h3>
          </div>
          <div className="p-4 pt-0 sm:p-6 sm:pt-0">
            <BasicInfoTab user={user} />
          </div>
        </div>

        {/* Help tip - iOS 26 Liquid Glass style */}
        <div className="glass relative w-full rounded-xl p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground">
          <Info className="size-4" />
          <div className={alertDescriptionStyles}>
            {t('profile.tip')}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
