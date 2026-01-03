/**
 * Desktop Navigation Component
 *
 * Modern pill-style navigation with smooth transitions.
 * Features:
 * - Pill indicator for active state
 * - Subtle hover effects with backdrop blur
 * - Respects reduced-motion preferences
 * - Touch-friendly targets (min 44px)
 */

import { Link as RouterLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

import type { NavigationItem } from '../../types/navigation.types';

interface DesktopNavProps {
  navigationItems: NavigationItem[];
}

export const DesktopNav = ({ navigationItems }: DesktopNavProps) => {
  const location = useLocation();

  return (
    <nav
      className="hidden md:flex items-center gap-1 ml-6 flex-grow"
      role="navigation"
      aria-label="Main navigation"
    >
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <RouterLink
            key={item.id}
            to={item.path}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              // Base styles
              'relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg',
              // Touch target
              'min-h-[44px]',
              // Transition
              'transition-colors duration-200 ease-out',
              // Reduced motion support
              'motion-reduce:transition-none',
              // States
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  'h-4 w-4 flex-shrink-0',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
                aria-hidden="true"
              />
            )}
            <span>{item.label}</span>
            {/* Active indicator dot */}
            {isActive && (
              <span
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                aria-hidden="true"
              />
            )}
          </RouterLink>
        );
      })}
    </nav>
  );
};
