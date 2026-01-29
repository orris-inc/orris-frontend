/**
 * Desktop Navigation Component
 *
 * Tailwind Application UI standard navigation following Catalyst patterns:
 * - Pill-style active states with subtle background
 * - Clear hover states for inactive items
 * - Consistent spacing and typography
 */

import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn, isPathActive } from '@/lib/utils';

import type { NavigationItem } from '../../types/navigation.types';

interface DesktopNavProps {
  navigationItems: NavigationItem[];
  className?: string;
}

export const DesktopNav = ({ navigationItems, className }: DesktopNavProps) => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav
      className={cn('flex items-center gap-1', className)}
      role="navigation"
      aria-label="Main navigation"
    >
      {navigationItems.map((item) => {
        const isActive = isPathActive(location.pathname, item.path);

        return (
          <RouterLink
            key={item.id}
            to={item.path}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'relative px-3 py-2 rounded-lg',
              'text-sm font-medium',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            {t(item.labelKey)}
          </RouterLink>
        );
      })}
    </nav>
  );
};
