/**
 * Profile settings page
 * Two-column layout with sidebar navigation on desktop, dropdown on mobile
 */

import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { usePageTitle } from '@/shared/hooks';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProfileLayout, type ProfileSection } from '@/features/profile/components/ProfileLayout';
import { ProfileSection as ProfileSectionContent } from '@/features/profile/components/sections/ProfileSection';
import { SecuritySection } from '@/features/profile/components/sections/SecuritySection';
import { NotificationsSection } from '@/features/profile/components/sections/NotificationsSection';
import { AppearanceSection } from '@/features/profile/components/sections/AppearanceSection';

const sectionComponents: Record<ProfileSection, React.ComponentType> = {
  profile: ProfileSectionContent,
  security: SecuritySection,
  notifications: NotificationsSection,
  appearance: AppearanceSection,
};

export const ProfileSettingsPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('profile.title'));

  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <DashboardLayout
        pageTitle={t('profile.title')}
        pageDescription={t('profile.tip')}
      >
        <div className="container max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <p className="text-lg text-muted-foreground">{t('profile.pleaseLogin')}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle={t('profile.title')}
      pageDescription={t('profile.tip')}
    >
      <ProfileLayout>
        {(activeSection) => {
          const SectionComponent = sectionComponents[activeSection];
          return <SectionComponent />;
        }}
      </ProfileLayout>
    </DashboardLayout>
  );
};
