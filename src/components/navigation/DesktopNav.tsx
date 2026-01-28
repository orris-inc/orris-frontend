/**
 * Desktop Navigation Component
 *
 * Standard top navigation for desktop.
 * Focuses on clear active state and simple hover transitions.
 */

import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

import type { NavigationItem } from '../../types/navigation.types';

interface DesktopNavProps {
  navigationItems: NavigationItem[];
}

export const DesktopNav = ({ navigationItems }: DesktopNavProps) => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav
      className="hidden md:flex items-center gap-5 ml-8"
      role="navigation"
      aria-label="Main navigation"
    >
      {navigationItems.map((item) => {
        const isActive = location.pathname === item.path;

        return (
          <RouterLink
            key={item.id}
            to={item.path}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group inline-flex items-center text-[13px] font-medium tracking-wide',
              'pb-2 border-b-2',
              isActive
                ? 'text-foreground border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/30',
              'transition-colors'
            )}
          >
            {/* Label */}
            <span>{t(item.labelKey)}</span>
          </RouterLink>
        );
      })}
    </nav>
  );
};
