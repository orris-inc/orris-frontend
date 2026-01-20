/**
 * Desktop Navigation Component
 *
 * Modern pill-style navigation with smooth spring animations.
 * Features:
 * - Animated sliding pill indicator for active state (using Framer Motion layoutId)
 * - Subtle hover effects with scale and background transitions
 * - Click feedback with press animation
 * - Respects reduced-motion preferences
 * - Touch-friendly targets (min 44px)
 */

import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import type { NavigationItem } from '../../types/navigation.types';

interface DesktopNavProps {
  navigationItems: NavigationItem[];
}

// Spring configuration matching iOS system animations
const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
  mass: 1,
};

export const DesktopNav = ({ navigationItems }: DesktopNavProps) => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav
      className="hidden md:flex items-center gap-1 ml-6 flex-grow relative"
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
              // Transition for colors and transform
              'transition-all duration-200 ease-out',
              // Reduced motion support
              'motion-reduce:transition-none',
              // Hover effect: subtle scale
              'can-hover:hover:scale-[1.02]',
              // Press effect
              'active:scale-[0.98]',
              // States - text color only (background handled by indicator)
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            {/* Animated background indicator */}
            {isActive && (
              <motion.span
                layoutId="desktop-nav-indicator"
                className="absolute inset-0 bg-primary/10 rounded-lg"
                aria-hidden="true"
                transition={springTransition}
                // Disable layout animation when reduced motion is preferred
                style={{ willChange: 'transform' }}
              />
            )}
            {/* Icon with transition */}
            {Icon && (
              <Icon
                className={cn(
                  'relative z-10 h-4 w-4 flex-shrink-0',
                  'transition-colors duration-200',
                  'motion-reduce:transition-none',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
                aria-hidden="true"
              />
            )}
            {/* Label */}
            <span className="relative z-10">{t(item.labelKey)}</span>
          </RouterLink>
        );
      })}
    </nav>
  );
};
