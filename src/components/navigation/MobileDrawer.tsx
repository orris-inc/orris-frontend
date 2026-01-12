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
import { Drawer } from 'vaul';
import { X, LogOut, Shield, ArrowLeftRight, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/common/Avatar';
import { ThemeToggle } from '@/components/common/ThemeToggle';

import type { NavigationItem } from '../../types/navigation.types';

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
  const initials = user?.initials || user?.displayName?.charAt(0).toUpperCase() || '?';

  // Navigate and close drawer
  const handleNavigation = useCallback((path: string) => {
    onClose();
    // Navigate after drawer starts closing
    requestAnimationFrame(() => {
      navigate(path);
    });
  }, [navigate, onClose]);

  const renderNavigationItems = useMemo(() => {
    return navigationItems.map((item) => {
      if (item.divider) {
        return (
          <div key={item.id} className="px-2 py-3">
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
            'group relative flex items-center gap-3 px-3 py-3 w-full text-left',
            // Touch target
            'min-h-[52px]',
            // Border radius
            'rounded-xl',
            // Transition - iOS 26 spring timing
            'transition-all duration-[var(--duration-fast)] ease-[var(--spring-smooth)]',
            'motion-reduce:transition-none',
            // Background and states
            isActive
              ? 'bg-primary/10'
              : 'active:bg-muted/60',
            // Disabled state
            item.disabled && 'pointer-events-none opacity-50'
          )}
        >
          {Icon && (
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                'transition-colors duration-[var(--duration-fast)]',
                'motion-reduce:transition-none',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground group-active:bg-muted'
              )}
            >
              <Icon
                className="h-5 w-5 flex-shrink-0"
                aria-hidden="true"
              />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <span className={cn(
              'text-sm font-medium',
              isActive ? 'text-primary' : 'text-foreground'
            )}>
              {item.label}
            </span>
          </div>
          {isActive && (
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
          )}
        </button>
      );
    });
  }, [navigationItems, location.pathname, handleNavigation]);

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
            'bg-background/95 dark:bg-card/95',
            'backdrop-blur-xl',
            'border border-border/50',
            'shadow-2xl shadow-black/20 dark:shadow-black/40',
            // Focus outline
            'outline-none',
            // Safe area support
            'pb-safe'
          )}
        >
          {/* Header with user profile */}
          <div className="flex-shrink-0 p-4 pb-2">
            {/* Close button - floating top right */}
            <Drawer.Close
              className={cn(
                'absolute top-3 right-3',
                'flex h-8 w-8 items-center justify-center rounded-full',
                'bg-muted/60 hover:bg-muted',
                'text-muted-foreground hover:text-foreground',
                'transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                'motion-reduce:transition-none'
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Close menu</span>
            </Drawer.Close>

            {/* User Profile Card */}
            {user && (
              <div className="flex items-center gap-3 pr-10">
                <Avatar className="h-12 w-12">
                  {user.avatarUrl && (
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={user.displayName || 'User avatar'}
                    />
                  )}
                  <AvatarFallback className="h-full w-full bg-primary/10 text-primary text-base font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Drawer.Title className="text-base font-semibold text-foreground truncate">
                    {user.displayName || 'User'}
                  </Drawer.Title>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            )}

            {/* Fallback title when no user */}
            {!user && (
              <Drawer.Title className="text-lg font-bold text-foreground pr-10">
                {title || 'Menu'}
              </Drawer.Title>
            )}
          </div>

          {/* Navigation List - data-vaul-no-drag prevents drag-to-close while scrolling */}
          <div
            data-vaul-no-drag
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide px-4 py-2"
          >
            <nav
              role="navigation"
              aria-label="Mobile navigation"
            >
              {renderNavigationItems}
            </nav>
          </div>

          {/* Footer Actions */}
          <div className="flex-shrink-0 px-4 pb-3 space-y-1">
            {/* Admin/User Switch */}
            {showAdminSwitch && onAdminClick && (
              <button
                onClick={() => {
                  onAdminClick();
                  onClose();
                }}
                className={cn(
                  'group flex w-full items-center gap-3 px-3 py-3',
                  'min-h-[52px]',
                  'rounded-xl',
                  'text-primary',
                  'transition-colors duration-150',
                  'active:bg-primary/10',
                  'motion-reduce:transition-none'
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  {isAdminView ? (
                    <ArrowLeftRight className="h-5 w-5 text-primary" aria-hidden="true" />
                  ) : (
                    <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                  )}
                </span>
                <span className="flex-1 text-left text-sm font-medium">
                  {isAdminView ? '切换到用户视图' : '切换到管理端'}
                </span>
                <ChevronRight className="h-5 w-5 text-primary/50" aria-hidden="true" />
              </button>
            )}

            {/* Logout */}
            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className={cn(
                  'group flex w-full items-center gap-3 px-3 py-3',
                  'min-h-[52px]',
                  'rounded-xl',
                  'text-destructive',
                  'transition-colors duration-150',
                  'active:bg-destructive/10',
                  'motion-reduce:transition-none'
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                  <LogOut className="h-5 w-5 text-destructive" aria-hidden="true" />
                </span>
                <span className="flex-1 text-left text-sm font-medium">退出登录</span>
              </button>
            )}

            {/* Theme toggle */}
            <div className="flex justify-center pt-2">
              <div className={cn(
                'inline-flex items-center gap-2 px-4 py-2',
                'rounded-full',
                'bg-muted/40',
                'text-sm text-muted-foreground'
              )}>
                <span>主题</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
