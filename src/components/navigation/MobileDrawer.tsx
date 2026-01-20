/**
 * Mobile Drawer Navigation Component - iOS 26 Liquid Glass Edition
 *
 * A floating, modern slide-out navigation drawer for mobile devices.
 * Powered by Vaul for native iOS-like gesture handling.
 *
 * Features:
 * - iOS 26 Liquid Glass floating design with rounded corners
 * - Native iOS-like swipe gestures (powered by Vaul)
 * - Physics-based spring animations (using Framer Motion)
 * - Staggered fade-in animation for nav items on drawer open
 * - Animated sliding background indicator for active state
 * - Press feedback animation with scale effect
 * - Clear visual hierarchy with grouped navigation
 * - Touch-friendly targets (min 44px)
 * - Quick actions footer (theme, logout)
 * - Respects reduced-motion preferences
 * - Safe area insets support for notched devices
 *
 * @see https://github.com/emilkowalski/vaul
 */

import { useMemo, useCallback, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Drawer } from 'vaul';
import { motion } from 'framer-motion';
import { LogOut, Shield, ArrowLeftRight, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/common/Avatar';
import { getAdminNavItemsByGroup } from '@/config/navigation';

import type { NavigationItem, NavigationGroup } from '../../types/navigation.types';

// Check for reduced motion preference
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Spring configuration matching iOS system animations
const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
  mass: 1,
};

// Stagger animation variants for nav items
const navItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const, // ease-gentle
    },
  }),
  exit: { opacity: 0, x: -8 },
};

interface MobileDrawerUser {
  displayName?: string;
  email?: string;
  initials?: string;
  avatarUrl?: string;
}

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
  brandName?: string;
  user?: MobileDrawerUser | null;
  /** Show switch button (admin/user toggle) */
  showAdminSwitch?: boolean;
  /** Whether currently in admin view - changes switch button text/icon */
  isAdminView?: boolean;
  /** Title shown in header when no user */
  title?: string;
  /** Server version */
  serverVersion?: string;
  /** Client version */
  clientVersion?: string;
  onAdminClick?: () => void;
  onLogout?: () => void;
}

export const MobileDrawer = ({
  open,
  onClose,
  navigationItems,
  user,
  showAdminSwitch = false,
  isAdminView = false,
  title,
  serverVersion,
  clientVersion,
  onAdminClick,
  onLogout,
}: MobileDrawerProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const initials = user?.initials || user?.displayName?.charAt(0).toUpperCase() || '?';

  // Smart scroll detection for drag-to-close
  const navListRef = useRef<HTMLDivElement>(null);
  const [isNavScrolled, setIsNavScrolled] = useState(false);

  const handleNavScroll = useCallback(() => {
    const navList = navListRef.current;
    if (!navList) return;
    // Use a small threshold to avoid floating-point issues
    const scrolled = navList.scrollTop > 1;
    if (scrolled !== isNavScrolled) {
      setIsNavScrolled(scrolled);
    }
  }, [isNavScrolled]);

  // Navigate and close drawer
  const handleNavigation = useCallback((path: string) => {
    onClose();
    // Navigate after drawer starts closing
    requestAnimationFrame(() => {
      navigate(path);
    });
  }, [navigate, onClose]);

  // Get grouped items for admin view
  const groupedItems = useMemo(() => {
    if (isAdminView) {
      return getAdminNavItemsByGroup(navigationItems);
    }
    return null;
  }, [navigationItems, isAdminView]);

  // Render a single navigation item with animation
  const renderNavItem = useCallback((item: NavigationItem, index: number) => {
    if (item.divider) {
      return (
        <motion.div
          key={item.id}
          className="px-2 py-2"
          custom={index}
          variants={prefersReducedMotion() ? undefined : navItemVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="h-px bg-border/40" />
        </motion.div>
      );
    }

    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <motion.button
        key={item.id}
        type="button"
        onClick={() => handleNavigation(item.path)}
        aria-current={isActive ? 'page' : undefined}
        disabled={item.disabled}
        custom={index}
        variants={prefersReducedMotion() ? undefined : navItemVariants}
        initial="hidden"
        animate="visible"
        // Press animation
        whileTap={prefersReducedMotion() ? undefined : { scale: 0.98 }}
        className={cn(
          // Base styles
          'group relative flex items-center gap-3 px-2.5 py-2.5 w-full text-left',
          // Touch target
          'min-h-[48px]',
          // Border radius
          'rounded-xl',
          // Transition for colors
          'transition-colors duration-200 ease-out',
          'motion-reduce:transition-none',
          // Text color states (background handled separately for animation)
          isActive
            ? 'text-primary-foreground'
            : 'text-muted-foreground active:bg-foreground/5',
          // Disabled state
          item.disabled && 'pointer-events-none opacity-50'
        )}
      >
        {/* Animated background indicator */}
        {isActive && (
          <motion.span
            layoutId="mobile-nav-indicator"
            className="absolute inset-0 bg-primary rounded-xl shadow-sm"
            aria-hidden="true"
            transition={springTransition}
            style={{ willChange: 'transform' }}
          />
        )}
        {/* Icon */}
        {Icon && (
          <Icon
            className="relative z-10 h-[18px] w-[18px] flex-shrink-0"
            aria-hidden="true"
          />
        )}
        {/* Label */}
        <span className="relative z-10 flex-1 min-w-0 text-[13px] font-medium">
          {t(item.labelKey)}
        </span>
        {/* Left indicator bar - animated */}
        {isActive && (
          <motion.span
            layoutId="mobile-nav-bar"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-foreground"
            aria-hidden="true"
            transition={springTransition}
          />
        )}
      </motion.button>
    );
  }, [location.pathname, handleNavigation, t]);

  // Render grouped navigation (admin view) with staggered animation
  const renderGroupedNavigation = useMemo(() => {
    if (!groupedItems) return null;

    let globalIndex = 0;
    return Array.from(groupedItems.entries()).map(([group, items]: [NavigationGroup, NavigationItem[]], groupIdx) => (
      <motion.div
        key={group.id}
        custom={groupIdx}
        variants={prefersReducedMotion() ? undefined : navItemVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          // Glass morphism card styling
          'glass-card rounded-xl overflow-hidden p-2'
        )}
      >
        {/* Group label */}
        <div className="px-2 py-1.5 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            {t(group.labelKey)}
          </span>
        </div>

        {/* Navigation items */}
        <div className="space-y-0.5">
          {items.map((item) => {
            const idx = globalIndex++;
            return renderNavItem(item, idx);
          })}
        </div>
      </motion.div>
    ));
  }, [groupedItems, renderNavItem, t]);

  // Render flat navigation (user view) with staggered animation
  const renderFlatNavigation = useMemo(() => {
    return navigationItems.map((item, index) => renderNavItem(item, index));
  }, [navigationItems, renderNavItem]);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      direction="left"
    >
      <Drawer.Portal>
        {/* Backdrop with blur */}
        <Drawer.Overlay
          className={cn(
            'fixed inset-0 z-50',
            'bg-black/20 backdrop-blur-sm'
          )}
        />

        {/* Floating Drawer Container */}
        <Drawer.Content
          className={cn(
            // Floating positioning with margins
            'fixed z-50',
            'top-3 bottom-3 left-3',
            'w-[min(300px,calc(85vw-24px))]',
            // Flex layout
            'flex flex-col',
            // IMPORTANT: Vaul best practice - prevent content overflow
            'overflow-hidden',
            // iOS 26 Liquid Glass floating design
            'rounded-[28px]',
            'bg-muted/30 dark:bg-muted/20',
            'backdrop-blur-xl',
            'border border-border/50',
            'shadow-2xl shadow-black/20 dark:shadow-black/40',
            // Focus outline
            'outline-none',
            // Safe area support
            'pb-safe'
          )}
        >
          {/* Header with user profile and actions */}
          <HeaderSection
            user={user}
            initials={initials}
            title={title}
            showAdminSwitch={showAdminSwitch}
            isAdminView={isAdminView}
            onAdminClick={onAdminClick}
            onLogout={onLogout}
            onClose={onClose}
          />

          {/* Navigation List - Smart drag control: only block when scrolled */}
          <div
            ref={navListRef}
            data-vaul-no-drag={isNavScrolled || undefined}
            onScroll={handleNavScroll}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide px-3 py-2"
          >
            <nav
              role="navigation"
              aria-label="Mobile navigation"
              className="space-y-3"
            >
              {isAdminView ? renderGroupedNavigation : renderFlatNavigation}
            </nav>
          </div>

          {/* Version Info Card */}
          {(serverVersion || clientVersion) && (
            <div className="flex-shrink-0 px-3 py-2">
              <div className="glass-card rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-center gap-4 text-[11px]">
                  {serverVersion && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground/60">{t('app.serverVersion')}</span>
                      <span className="font-mono text-muted-foreground">{serverVersion}</span>
                    </div>
                  )}
                  {clientVersion && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground/60">{t('app.clientVersion')}</span>
                      <span className="font-mono text-muted-foreground">{clientVersion}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

/**
 * Header Action Button Component
 */
const HeaderActionButton = ({
  onClick,
  icon: Icon,
  label,
  variant = 'default',
}: {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  variant?: 'default' | 'destructive';
}) => (
  <button
    onClick={onClick}
    aria-label={label}
    className={cn(
      'flex items-center justify-center',
      'w-9 h-9 rounded-full',
      'transition-colors duration-150',
      'motion-reduce:transition-none',
      variant === 'destructive'
        ? 'text-destructive/70 active:bg-destructive/10 hover:text-destructive'
        : 'text-muted-foreground active:bg-foreground/5 hover:text-foreground'
    )}
  >
    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
  </button>
);

/**
 * Header Section Component - User profile with action buttons
 */
const HeaderSection = ({
  user,
  initials,
  title,
  showAdminSwitch,
  isAdminView,
  onAdminClick,
  onLogout,
  onClose,
}: {
  user?: MobileDrawerUser | null;
  initials: string;
  title?: string;
  showAdminSwitch?: boolean;
  isAdminView?: boolean;
  onAdminClick?: () => void;
  onLogout?: () => void;
  onClose: () => void;
}) => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  const cardClassName = 'glass-card rounded-xl';

  return (
    <div className="flex-shrink-0 p-3 pb-2">
      <div className={cn(cardClassName, 'p-3')}>
        <div className="flex items-center gap-3">
          {/* User Avatar or Title */}
          {user ? (
            <>
              <Avatar className="h-10 w-10 shrink-0">
                {user.avatarUrl && (
                  <AvatarImage
                    src={user.avatarUrl}
                    alt={user.displayName || 'User avatar'}
                  />
                )}
                <AvatarFallback className="h-full w-full bg-primary/10 text-primary text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <Drawer.Title className="text-sm font-semibold text-foreground truncate">
                  {user.displayName || 'User'}
                </Drawer.Title>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </>
          ) : (
            <Drawer.Title className="flex-1 text-base font-bold text-foreground">
              {title || 'Menu'}
            </Drawer.Title>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Theme Toggle */}
            <HeaderActionButton
              onClick={toggleTheme}
              icon={isDark ? Sun : Moon}
              label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            />

            {/* Admin/User Switch */}
            {showAdminSwitch && onAdminClick && (
              <HeaderActionButton
                onClick={() => {
                  onAdminClick();
                  onClose();
                }}
                icon={isAdminView ? ArrowLeftRight : Shield}
                label={isAdminView ? 'Switch to user view' : 'Switch to admin view'}
              />
            )}

            {/* Logout */}
            {onLogout && (
              <HeaderActionButton
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                icon={LogOut}
                label="Logout"
                variant="destructive"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
