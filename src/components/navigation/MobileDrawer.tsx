/**
 * Mobile Drawer Navigation Component - iOS 26 Liquid Glass Edition
 *
 * A floating, modern slide-out navigation drawer for mobile devices.
 * Features:
 * - iOS 26 Liquid Glass floating design with rounded corners
 * - Smooth spring animations with follow-finger gestures
 * - Clear visual hierarchy with grouped navigation
 * - Touch-friendly targets (min 44px)
 * - Active state with subtle highlight
 * - Quick actions footer (theme, logout)
 * - Respects reduced-motion preferences
 * - Safe area insets support for notched devices
 * - 120Hz ProMotion optimized with direct DOM manipulation
 */

import { useMemo, useEffect, type RefObject } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
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
  /** Whether user is actively dragging */
  isDragging?: boolean;
  /** Computed overlay styles from swipe gesture */
  overlayStyle?: React.CSSProperties;
  /** Computed drawer styles from swipe gesture */
  drawerStyle?: React.CSSProperties;
  /** Ref for overlay element - enables direct DOM manipulation for 120Hz */
  overlayRef?: RefObject<HTMLElement | null>;
  /** Ref for drawer element - enables direct DOM manipulation for 120Hz */
  drawerRef?: RefObject<HTMLElement | null>;
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
  isDragging = false,
  overlayStyle,
  drawerStyle,
  overlayRef,
  drawerRef,
}: MobileDrawerProps) => {
  const location = useLocation();
  const initials = user?.initials || user?.displayName?.charAt(0).toUpperCase() || '?';

  // Whether we should use drag styles (disabling CSS animations)
  const shouldShowDragState = isDragging && (overlayStyle !== undefined || drawerStyle !== undefined);

  const renderNavigationItems = useMemo(() => {
    return navigationItems.map((item, index) => {
      if (item.divider) {
        return (
          <div key={item.id} className="px-2 py-3">
            <div className="h-px bg-border/40" />
          </div>
        );
      }

      const Icon = item.icon;
      const isActive = location.pathname === item.path;
      const isFirst = index === 0 || navigationItems[index - 1]?.divider;
      const isLast = index === navigationItems.length - 1 || navigationItems[index + 1]?.divider;

      return (
        <RouterLink
          key={item.id}
          to={item.path}
          onClick={onClose}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            // Base styles
            'group relative flex items-center gap-3 px-4 py-3',
            // Touch target
            'min-h-[52px]',
            // Border radius for grouped items
            isFirst && isLast && 'rounded-2xl',
            isFirst && !isLast && 'rounded-t-2xl',
            !isFirst && isLast && 'rounded-b-2xl',
            // Transition - iOS 26 spring timing
            'transition-all duration-[var(--duration-fast)] ease-[var(--spring-smooth)]',
            'motion-reduce:transition-none',
            // Background and states
            isActive
              ? 'bg-primary/10'
              : 'bg-card/60 active:bg-muted/80',
            // Border between items
            !isLast && !isFirst && 'border-b border-border/30',
            isFirst && !isLast && 'border-b border-border/30',
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
        </RouterLink>
      );
    });
  }, [navigationItems, location.pathname, onClose]);

  // Determine if we should render the drawer
  const shouldRender = open || (isDragging && (overlayStyle !== undefined || drawerStyle !== undefined));

  // Bind refs to DOM elements for direct 120Hz manipulation
  // Uses data attributes to find elements after Radix renders them
  useEffect(() => {
    if (!shouldRender) return;

    // Wait for next frame to ensure Radix has rendered
    const rafId = requestAnimationFrame(() => {
      if (overlayRef) {
        const overlay = document.querySelector('[data-drawer-overlay]') as HTMLElement | null;
        if (overlay) {
          (overlayRef as React.MutableRefObject<HTMLElement | null>).current = overlay;
        }
      }
      if (drawerRef) {
        const drawer = document.querySelector('[data-drawer-content]') as HTMLElement | null;
        if (drawer) {
          (drawerRef as React.MutableRefObject<HTMLElement | null>).current = drawer;
        }
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      // Clear refs on unmount
      if (overlayRef) {
        (overlayRef as React.MutableRefObject<HTMLElement | null>).current = null;
      }
      if (drawerRef) {
        (drawerRef as React.MutableRefObject<HTMLElement | null>).current = null;
      }
    };
  }, [shouldRender, overlayRef, drawerRef]);

  // Merge custom drawer styles with floating offset
  const computedDrawerStyle = useMemo(() => {
    if (!drawerStyle) return undefined;
    // Extract translateX from the drawerStyle transform
    const transformMatch = drawerStyle.transform?.toString().match(/translateX\(([^)]+)\)/);
    if (transformMatch) {
      const translateValue = transformMatch[1];
      // Parse the percentage and adjust for the margin offset
      if (translateValue.includes('%')) {
        const percent = parseFloat(translateValue);
        // When fully closed, we want translateX(-100% - 12px) to hide behind left edge
        // When fully open, we want translateX(0) + margin-left: 12px
        return {
          ...drawerStyle,
          transform: `translateX(calc(${percent}% - ${12 + percent * 0.12}px))`,
        };
      }
    }
    return drawerStyle;
  }, [drawerStyle]);

  return (
    <Dialog.Root open={shouldRender} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        {/* Backdrop with blur - data-drawer-overlay for 120Hz ref binding */}
        <Dialog.Overlay
          data-drawer-overlay
          className={cn(
            'fixed inset-0 z-50',
            'bg-black/20 backdrop-blur-sm',
            // GPU acceleration hint during drag
            isDragging && 'will-change-[opacity]',
            // Only use animations when not dragging
            !shouldShowDragState && 'data-[state=open]:animate-in data-[state=closed]:animate-out',
            !shouldShowDragState && 'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            !shouldShowDragState && 'data-[state=closed]:duration-200 data-[state=open]:duration-300',
            'motion-reduce:animate-none'
          )}
          style={overlayStyle}
        />

        {/* Floating Drawer Container - data-drawer-content for 120Hz ref binding */}
        <Dialog.Content
          data-drawer-content
          className={cn(
            // Floating positioning with margins
            'fixed z-50',
            'top-3 bottom-3 left-3',
            'w-[min(300px,calc(85vw-24px))]',
            // Flex layout
            'flex flex-col',
            // iOS 26 Liquid Glass floating design
            'rounded-[28px]',
            'bg-background/95 dark:bg-card/95',
            'backdrop-blur-xl',
            'border border-border/50',
            'shadow-2xl shadow-black/20 dark:shadow-black/40',
            // GPU acceleration hints during drag for 120Hz
            isDragging && 'will-change-transform',
            // Optimize paint containment for better performance
            'contain-layout contain-style',
            // Only use animations when not dragging - iOS native spring timing via CSS
            !shouldShowDragState && 'data-[state=open]:animate-in data-[state=closed]:animate-out',
            !shouldShowDragState && 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
            'motion-reduce:animate-none',
            // Safe area support
            'pb-safe'
          )}
          style={{
            ...computedDrawerStyle,
            // iOS native spring animation timing (overrides tailwind duration)
            ...(!shouldShowDragState && {
              animationTimingFunction: 'var(--spring-ios-interactive)',
              animationDuration: 'var(--spring-ios-interactive-duration)',
            }),
          }}
        >
          {/* Header with user profile */}
          <div className="flex-shrink-0 p-4 pb-2">
            {/* Close button - floating top right */}
            <Dialog.Close
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
            </Dialog.Close>

            {/* User Profile Card */}
            {user && (
              <div className="flex items-center gap-3 pr-10">
                <Avatar className="h-14 w-14 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                  {user.avatarUrl && (
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={user.displayName || 'User avatar'}
                    />
                  )}
                  <AvatarFallback className="h-full w-full bg-primary/10 text-primary text-lg font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-base font-semibold text-foreground truncate">
                    {user.displayName || 'User'}
                  </Dialog.Title>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            )}

            {/* Fallback title when no user */}
            {!user && (
              <Dialog.Title className="text-lg font-bold text-foreground pr-10">
                {title || 'Menu'}
              </Dialog.Title>
            )}
          </div>

          {/* Navigation List */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2">
            <nav
              className="space-y-1"
              role="navigation"
              aria-label="Mobile navigation"
            >
              {/* Grouped navigation items */}
              <div className="rounded-2xl overflow-hidden shadow-sm shadow-black/5">
                {renderNavigationItems}
              </div>
            </nav>
          </div>

          {/* Footer Actions */}
          <div className="flex-shrink-0 p-3 pt-0 space-y-2">
            {/* Action buttons group */}
            <div className="rounded-2xl overflow-hidden shadow-sm shadow-black/5">
              {/* Admin/User Switch */}
              {showAdminSwitch && onAdminClick && (
                <button
                  onClick={() => {
                    onAdminClick();
                    onClose();
                  }}
                  className={cn(
                    'group flex w-full items-center gap-3 px-4 py-3',
                    'min-h-[52px]',
                    'bg-card/60',
                    'text-primary',
                    'transition-colors duration-150',
                    'active:bg-primary/10',
                    'motion-reduce:transition-none',
                    onLogout && 'border-b border-border/30'
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
                    'group flex w-full items-center gap-3 px-4 py-3',
                    'min-h-[52px]',
                    'bg-card/60',
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
            </div>

            {/* Theme toggle - separate floating button */}
            <div className="flex justify-center pt-1">
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
