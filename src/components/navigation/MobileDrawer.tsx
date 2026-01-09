/**
 * Mobile Drawer Navigation Component - iOS 26 Liquid Glass Edition
 *
 * Modern slide-out navigation drawer for mobile devices.
 * Features:
 * - iOS 26 Liquid Glass material design
 * - User profile section with avatar
 * - Smooth slide animation with spring physics
 * - Follow-finger swipe gesture support
 * - Clear visual hierarchy with grouped navigation
 * - Touch-friendly targets (min 44px)
 * - Active state with glass pill indicator
 * - Quick actions footer (theme, logout)
 * - Respects reduced-motion preferences
 * - Safe area insets support for notched devices
 */

import { useMemo } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as Separator from '@radix-ui/react-separator';
import { X, LogOut, Shield, ChevronRight } from 'lucide-react';
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
  showAdminSwitch?: boolean;
  onAdminClick?: () => void;
  onLogout?: () => void;
  /** Drag progress from swipe gesture (0-1) */
  dragProgress?: number;
  /** Whether user is actively dragging */
  isDragging?: boolean;
}

export const MobileDrawer = ({
  open,
  onClose,
  navigationItems,
  brandName = 'Orris',
  user,
  showAdminSwitch = false,
  onAdminClick,
  onLogout,
  dragProgress,
  isDragging = false,
}: MobileDrawerProps) => {
  const location = useLocation();
  const initials = user?.initials || user?.displayName?.charAt(0).toUpperCase() || '?';

  // Calculate styles based on drag state
  // When dragging, use transform to position drawer; when not, let CSS animations handle it
  const shouldShowDragState = isDragging && dragProgress !== undefined;

  // Overlay opacity follows drag progress
  const overlayStyle = shouldShowDragState
    ? { opacity: dragProgress * 0.5, transition: 'none' }
    : undefined;

  // Drawer position follows drag progress
  const drawerStyle = shouldShowDragState
    ? {
        transform: `translateX(${(dragProgress - 1) * 100}%)`,
        transition: 'none',
      }
    : undefined;

  const renderNavigationItems = useMemo(() => {
    return navigationItems.map((item) => {
      if (item.divider) {
        return (
          <Separator.Root
            key={item.id}
            className="my-2 shrink-0 bg-border/60 h-px w-full"
          />
        );
      }

      const Icon = item.icon;
      const isActive = location.pathname === item.path;

      return (
        <RouterLink
          key={item.id}
          to={item.path}
          onClick={onClose}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            // Base styles
            'group relative flex items-center gap-3 rounded-2xl px-3 py-3',
            // Touch target
            'min-h-[48px]',
            // Transition - iOS 26 spring timing
            'transition-all duration-[var(--duration-normal)] ease-[var(--spring-bounce)]',
            'motion-reduce:transition-none',
            // States - iOS 26 glass active style
            isActive
              ? 'glass-interactive bg-primary/15 text-primary'
              : 'text-muted-foreground active:bg-foreground/5 active:scale-[0.98]',
            // Disabled state
            item.disabled && 'pointer-events-none opacity-50'
          )}
        >
          {Icon && (
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl',
                'transition-all duration-[var(--duration-fast)] ease-[var(--spring-smooth)]',
                'motion-reduce:transition-none',
                isActive
                  ? 'bg-primary/20'
                  : 'bg-muted/50 group-active:bg-foreground/10'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground group-active:text-foreground'
                )}
                aria-hidden="true"
              />
            </span>
          )}
          <span className={cn(
            'text-sm font-medium',
            isActive ? 'text-primary' : 'text-foreground'
          )}>
            {item.label}
          </span>
          {isActive && (
            <ChevronRight
              className="ml-auto h-4 w-4 text-primary/60"
              aria-hidden="true"
            />
          )}
        </RouterLink>
      );
    });
  }, [navigationItems, location.pathname, onClose]);

  // Determine if we should render the drawer
  // Show when: open is true, OR when dragging with progress > 0
  const shouldRender = open || (isDragging && dragProgress !== undefined && dragProgress > 0);

  return (
    <Dialog.Root open={shouldRender} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        {/* Backdrop with iOS 26 blur */}
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50',
            'bg-black/30 backdrop-blur-xl',
            // Only use animations when not dragging
            !shouldShowDragState && 'data-[state=open]:animate-in data-[state=closed]:animate-out',
            !shouldShowDragState && 'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            !shouldShowDragState && 'data-[state=closed]:duration-200 data-[state=open]:duration-300',
            'motion-reduce:animate-none'
          )}
          style={overlayStyle}
        />

        {/* Drawer Content - iOS 26 Liquid Glass */}
        <Dialog.Content
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex h-full w-[300px] max-w-[85vw] flex-col',
            // iOS 26 Liquid Glass material
            'glass-elevated',
            'border-l-0 border-y-0 rounded-r-3xl',
            // Only use animations when not dragging
            !shouldShowDragState && 'data-[state=open]:animate-in data-[state=closed]:animate-out',
            !shouldShowDragState && 'data-[state=closed]:duration-300 data-[state=open]:duration-400',
            !shouldShowDragState && 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
            'motion-reduce:animate-none',
            // Safe area support
            'pb-safe'
          )}
          style={drawerStyle}
        >
          {/* Header with close button - iOS 26 style */}
          <div className="flex h-14 items-center justify-between border-b border-border/50 px-4">
            <Dialog.Title className="text-lg font-bold text-foreground">
              {brandName}
            </Dialog.Title>
            <Dialog.Close
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                'glass-interactive',
                'text-muted-foreground',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                'motion-reduce:transition-none'
              )}
            >
              <X className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Close menu</span>
            </Dialog.Close>
          </div>

          {/* User Profile Section - iOS 26 style */}
          {user && (
            <div className="border-b border-border/50 px-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  {user.avatarUrl && (
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={user.displayName || 'User avatar'}
                    />
                  )}
                  <AvatarFallback className="h-full w-full bg-primary/15 text-primary text-base font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user.displayName || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-3 px-3">
            <nav
              className="space-y-1"
              role="navigation"
              aria-label="Mobile navigation"
            >
              {renderNavigationItems}
            </nav>
          </div>

          {/* Footer Actions - iOS 26 style */}
          <div className="border-t border-border/50 px-3 py-3 space-y-1">
            {/* Admin Switch */}
            {showAdminSwitch && onAdminClick && (
              <button
                onClick={() => {
                  onAdminClick();
                  onClose();
                }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-2xl px-3 py-3',
                  'min-h-[48px]',
                  'text-primary',
                  'transition-all duration-[var(--duration-fast)] ease-[var(--spring-bounce)]',
                  'active:bg-primary/10 active:scale-[0.98]',
                  'motion-reduce:transition-none'
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                  <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium">切换到管理端</span>
                <ChevronRight className="ml-auto h-4 w-4 text-primary/60" aria-hidden="true" />
              </button>
            )}

            {/* Theme Toggle Row */}
            <div className={cn(
              'flex items-center justify-between rounded-2xl px-3 py-2',
              'min-h-[48px]'
            )}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50">
                  <ThemeToggle />
                </span>
                <span className="text-sm font-medium text-foreground">主题</span>
              </div>
            </div>

            {/* Logout */}
            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-2xl px-3 py-3',
                  'min-h-[48px]',
                  'text-destructive',
                  'transition-all duration-[var(--duration-fast)] ease-[var(--spring-bounce)]',
                  'active:bg-destructive/10 active:scale-[0.98]',
                  'motion-reduce:transition-none'
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10">
                  <LogOut className="h-5 w-5 text-destructive" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium">退出登录</span>
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
