/**
 * iOS 26 Mobile Tab Bar Component
 *
 * Floating glass tab bar with iOS 26 design language.
 * Features:
 * - Liquid Glass material with backdrop blur
 * - Capsule shape with floating positioning
 * - Scroll-responsive shrink/expand behavior
 * - Spring-based morphing animations
 * - Active indicator with smooth transitions
 * - Haptic feedback support
 * - Safe area inset support
 * - Respects prefers-reduced-motion
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabItem {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface MobileTabBarProps {
  items: TabItem[];
  /** Enable scroll-responsive shrink behavior */
  shrinkOnScroll?: boolean;
  /** Custom bottom offset */
  bottomOffset?: number;
  className?: string;
}

export const MobileTabBar = ({
  items,
  shrinkOnScroll = true,
  bottomOffset = 16,
  className,
}: MobileTabBarProps) => {
  const location = useLocation();
  const [isCompact, setIsCompact] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Scroll handler for shrink/expand behavior
  const handleScroll = useCallback(() => {
    if (!shrinkOnScroll) return;

    const currentScrollY = window.scrollY;
    const scrollingDown = currentScrollY > lastScrollY.current;
    const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);

    // Only react to significant scroll changes
    if (scrollDelta > 10) {
      setIsCompact(scrollingDown && currentScrollY > 50);
      lastScrollY.current = currentScrollY;
    }

    ticking.current = false;
  }, [shrinkOnScroll]);

  useEffect(() => {
    if (!shrinkOnScroll) return;

    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(handleScroll);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [shrinkOnScroll, handleScroll]);

  // Haptic feedback on tab change
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  return (
    <nav
      className={cn(
        // Positioning - floating at bottom center
        'fixed left-1/2 -translate-x-1/2 z-50',
        // Liquid Glass styling
        'glass-tabbar',
        // Layout
        'flex items-center justify-center',
        // Sizing - adaptive to compact state
        'px-2 transition-all',
        isCompact
          ? 'h-12 gap-1 py-1'
          : 'h-14 gap-2 py-2',
        // Animation timing
        'duration-300 ease-[var(--spring-bounce)]',
        'motion-reduce:transition-none',
        className
      )}
      style={{
        bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom))`,
      }}
      role="tablist"
      aria-label="Main navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <Link
            key={item.id}
            to={item.path}
            onClick={triggerHaptic}
            role="tab"
            aria-selected={isActive}
            aria-label={item.label}
            className={cn(
              // Base styles
              'relative flex items-center justify-center',
              'rounded-full cursor-pointer',
              'transition-all duration-200 ease-[var(--spring-bounce)]',
              'motion-reduce:transition-none',
              // Size based on compact state
              isCompact
                ? 'h-10 min-w-10 px-3'
                : 'h-11 min-w-11 px-4',
              // Active state with glass background
              isActive
                ? 'glass-interactive bg-primary/15'
                : 'hover:bg-foreground/5 active:scale-95',
              // Focus state
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
            )}
          >
            {/* Icon */}
            <Icon
              className={cn(
                'flex-shrink-0 transition-colors duration-200',
                isCompact ? 'w-5 h-5' : 'w-6 h-6',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
              aria-hidden="true"
            />

            {/* Label - only show when active and not compact */}
            {isActive && !isCompact && (
              <span
                className={cn(
                  'ml-2 text-sm font-medium text-primary',
                  'animate-spring-in'
                )}
              >
                {item.label}
              </span>
            )}

            {/* Badge */}
            {item.badge && item.badge > 0 && (
              <span
                className={cn(
                  'absolute -top-1 -right-1',
                  'min-w-[18px] h-[18px] px-1',
                  'flex items-center justify-center',
                  'bg-destructive text-destructive-foreground',
                  'text-xs font-medium rounded-full',
                  'border-2 border-background'
                )}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

MobileTabBar.displayName = 'MobileTabBar';
