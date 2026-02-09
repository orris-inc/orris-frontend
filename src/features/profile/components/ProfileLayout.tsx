/**
 * Profile settings layout component
 * Two-column layout with sidebar navigation on desktop, dropdown on mobile
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Select from '@radix-ui/react-select';
import { User, Shield, Bell, Palette, Check, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cardStyles } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';

export type ProfileSection = 'profile' | 'security' | 'notifications' | 'appearance';

interface NavItem {
  id: ProfileSection;
  icon: LucideIcon;
  labelKey: string;
}

const navItems: NavItem[] = [
  { id: 'profile', icon: User, labelKey: 'profile.nav.profile' },
  { id: 'security', icon: Shield, labelKey: 'profile.nav.security' },
  { id: 'notifications', icon: Bell, labelKey: 'profile.nav.notifications' },
  { id: 'appearance', icon: Palette, labelKey: 'profile.nav.appearance' },
];

interface ProfileLayoutProps {
  children: (activeSection: ProfileSection) => React.ReactNode;
}

export const ProfileLayout = ({ children }: ProfileLayoutProps) => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<ProfileSection>('profile');

  return (
    <div className="space-y-6 pb-safe">
      {/* Mobile dropdown navigation */}
      <div className="lg:hidden">
        <Select.Root value={activeSection} onValueChange={(value) => setActiveSection(value as ProfileSection)}>
          <Select.Trigger
            className={cn(cardStyles, 'inline-flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-target active:scale-[0.98]')}

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
              className="overflow-hidden rounded-xl bg-popover ring-1 ring-border shadow-lg z-50 min-w-[220px] animate-in fade-in-0 zoom-in-95"
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
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors active:scale-[0.98] ${
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
            {children(activeSection)}
          </div>
        </main>
      </div>
    </div>
  );
};
