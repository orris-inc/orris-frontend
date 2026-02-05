/**
 * Admin profile settings page
 * Different navigation items from user dashboard:
 * - Profile, Security, Notifications, Appearance (shared)
 * - System settings (admin only)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Select from '@radix-ui/react-select';
import { User, Shield, Palette, Settings, Bell, Check, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { usePageTitle } from '@/shared/hooks';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProfileSection } from '@/features/profile/components/sections/ProfileSection';
import { SecuritySection } from '@/features/profile/components/sections/SecuritySection';
import { AppearanceSection } from '@/features/profile/components/sections/AppearanceSection';
import { SystemSection } from '@/features/profile/components/sections/SystemSection';
import { AdminNotificationsSection } from '@/features/profile/components/sections/AdminNotificationsSection';

type AdminProfileSectionType = 'profile' | 'security' | 'notifications' | 'appearance' | 'system';

interface NavItem {
  id: AdminProfileSectionType;
  icon: LucideIcon;
  labelKey: string;
}

const navItems: NavItem[] = [
  { id: 'profile', icon: User, labelKey: 'profile.nav.profile' },
  { id: 'security', icon: Shield, labelKey: 'profile.nav.security' },
  { id: 'notifications', icon: Bell, labelKey: 'profile.nav.notifications' },
  { id: 'appearance', icon: Palette, labelKey: 'profile.nav.appearance' },
  { id: 'system', icon: Settings, labelKey: 'profile.nav.system' },
];

const sectionComponents: Record<AdminProfileSectionType, React.ComponentType> = {
  profile: ProfileSection,
  security: SecuritySection,
  notifications: AdminNotificationsSection,
  appearance: AppearanceSection,
  system: SystemSection,
};

export const AdminProfilePage = () => {
  const { t } = useTranslation();
  usePageTitle(t('profile.title'));

  const user = useAuthStore((state) => state.user);
  const [activeSection, setActiveSection] = useState<AdminProfileSectionType>('profile');

  if (!user) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-lg text-muted-foreground">{t('profile.pleaseLogin')}</p>
        </div>
      </AdminLayout>
    );
  }

  const SectionComponent = sectionComponents[activeSection];

  return (
    <AdminLayout>
      <div className="space-y-6 pb-safe">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t('profile.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('profile.tip')}
          </p>
        </div>

        {/* Mobile dropdown navigation */}
        <div className="lg:hidden">
          <Select.Root value={activeSection} onValueChange={(value) => setActiveSection(value as AdminProfileSectionType)}>
            <Select.Trigger
              className="inline-flex items-center justify-between w-full rounded-xl bg-card border px-4 py-3 text-sm font-medium hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-target"
              aria-label={t('profile.nav.selectSection')}
            >
              <span className="flex items-center gap-3">
                {(() => {
                  const item = navItems.find((item) => item.id === activeSection);
                  if (!item) return null;
                  const Icon = item.icon;
                  return (
                    <>
                      <Icon className="size-5 text-muted-foreground" />
                      <span>{t(item.labelKey)}</span>
                    </>
                  );
                })()}
              </span>
              <Select.Icon>
                <ChevronDown className="size-5 text-muted-foreground" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                className="overflow-hidden rounded-xl bg-popover border shadow-lg z-50 min-w-[220px] animate-in fade-in-0 zoom-in-95"
                position="popper"
                sideOffset={4}
              >
                <Select.Viewport className="p-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Select.Item
                        key={item.id}
                        value={item.id}
                        className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer select-none data-[highlighted]:bg-accent data-[state=checked]:bg-accent/50"
                      >
                        <Icon className="size-5 text-muted-foreground" />
                        <Select.ItemText>{t(item.labelKey)}</Select.ItemText>
                        <Select.ItemIndicator className="absolute right-3">
                          <Check className="size-4 text-primary" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    );
                  })}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        {/* Desktop two-column layout */}
        <div className="flex gap-8">
          {/* Sidebar navigation - desktop only */}
          <nav className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-6 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <Icon className="size-5" />
                    {t(item.labelKey)}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main content */}
          <main className="flex-1 min-w-0 max-w-3xl">
            <div key={activeSection} className="animate-in fade-in-0 duration-200">
              <SectionComponent />
            </div>
          </main>
        </div>
      </div>
    </AdminLayout>
  );
};
