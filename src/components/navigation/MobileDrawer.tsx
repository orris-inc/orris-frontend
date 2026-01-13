/**
 * Mobile Drawer Navigation Component - iOS 26 Liquid Glass Edition
 *
 * A floating, modern slide-out navigation drawer for mobile devices.
 * Powered by Vaul for native iOS-like gesture handling.
 *
 * Features:
 * - iOS 26 Liquid Glass floating design with rounded corners
 * - Native iOS-like swipe gestures (powered by Vaul)
 * - Physics-based spring animations
 * - Clear visual hierarchy with grouped navigation
 * - Touch-friendly targets (min 44px)
 * - Active state with subtle highlight
 * - Quick actions footer (theme, logout)
 * - Respects reduced-motion preferences
 * - Safe area insets support for notched devices
 *
 * @see https://github.com/emilkowalski/vaul
 */

import { useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Drawer } from 'vaul';
import { LogOut, Shield, ArrowLeftRight, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/common/Avatar';
import { getAdminNavItemsByGroup } from '@/config/navigation';

import type { NavigationItem, NavigationGroup } from '../../types/navigation.types';

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
  onAdminClick,
  onLogout,
}: MobileDrawerProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const initials = user?.initials || user?.displayName?.charAt(0).toUpperCase() || '?';

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

  // Render a single navigation item
  const renderNavItem = useCallback((item: NavigationItem) => {
    if (item.divider) {
      return (
        <div key={item.id} className="px-2 py-2">
          <div className="h-px bg-border/40" />
        </div>
      );
    }

    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleNavigation(item.path)}
        aria-current={isActive ? 'page' : undefined}
        disabled={item.disabled}
        className={cn(
          // Base styles
          'group relative flex items-center gap-3 px-2.5 py-2.5 w-full text-left',
          // Touch target
          'min-h-[48px]',
          // Border radius
          'rounded-xl',
          // Transition
          'transition-all duration-200 ease-out',
          'motion-reduce:transition-none',
          // Background and states
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground active:bg-black/[0.04] dark:active:bg-white/[0.06]',
          // Disabled state
          item.disabled && 'pointer-events-none opacity-50'
        )}
      >
        {Icon && (
          <Icon
            className="h-[18px] w-[18px] flex-shrink-0"
            aria-hidden="true"
          />
        )}
        <span className="flex-1 min-w-0 text-[13px] font-medium">
          {t(item.labelKey)}
        </span>
        {isActive && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-foreground"
            aria-hidden="true"
          />
        )}
      </button>
    );
  }, [location.pathname, handleNavigation, t]);

  // Render grouped navigation (admin view)
  const renderGroupedNavigation = useMemo(() => {
    if (!groupedItems) return null;

    return Array.from(groupedItems.entries()).map(([group, items]: [NavigationGroup, NavigationItem[]]) => (
      <div
        key={group.id}
        className={cn(
          // Glass morphism card styling
          'rounded-xl overflow-hidden',
          'bg-white/60 dark:bg-white/[0.06]',
          'backdrop-blur-[var(--glass-blur-md)]',
          'border border-black/[0.04] dark:border-white/[0.08]',
          'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
          'dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]',
          'p-2'
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
          {items.map(renderNavItem)}
        </div>
      </div>
    ));
  }, [groupedItems, renderNavItem, t]);

  // Render flat navigation (user view)
  const renderFlatNavigation = useMemo(() => {
    return navigationItems.map(renderNavItem);
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

          {/* Navigation List */}
          <div
            data-vaul-no-drag
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
        : 'text-muted-foreground active:bg-black/[0.04] dark:active:bg-white/[0.06] hover:text-foreground'
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

  const cardClassName = cn(
    'rounded-xl',
    'bg-white/60 dark:bg-white/[0.06]',
    'backdrop-blur-[var(--glass-blur-md)]',
    'border border-black/[0.04] dark:border-white/[0.08]',
    'shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
  );

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
