/**
 * User Menu Component
 *
 * Modern dropdown menu for user profile actions.
 * Features:
 * - Clean header with larger avatar
 * - Touch-friendly targets (min 44px)
 * - Smooth 200ms transitions
 * - Focus visible states for accessibility
 * - Grouped menu items with visual separation
 */

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import {
  User as UserIcon,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  user: {
    displayName?: string;
    email?: string;
    initials?: string;
    avatarUrl?: string;
  } | null;
  /** Show switch to admin button (for user dashboard) */
  showAdminSwitch?: boolean;
  /** Show switch to user view button (for admin panel) */
  showUserSwitch?: boolean;
  onProfileClick: () => void;
  onNotificationsClick?: () => void;
  onAdminClick?: () => void;
  onUserClick?: () => void;
  onLogout: () => void;
}

export const UserMenu = ({
  user,
  showAdminSwitch = false,
  showUserSwitch = false,
  onProfileClick,
  onNotificationsClick,
  onAdminClick,
  onUserClick,
  onLogout,
}: UserMenuProps) => {
  const initials = user?.initials || user?.displayName?.charAt(0).toUpperCase() || '?';

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          className={cn(
            'relative flex items-center justify-center',
            'h-10 w-10 rounded-full',
            'ring-offset-background transition-all duration-200',
            'hover:ring-2 hover:ring-primary/20',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'motion-reduce:transition-none'
          )}
          aria-label="Open user menu"
        >
          <AvatarPrimitive.Root className="h-9 w-9 overflow-hidden rounded-full">
            {user?.avatarUrl && (
              <AvatarPrimitive.Image
                src={user.avatarUrl}
                alt={user.displayName || 'User avatar'}
                className="h-full w-full object-cover"
              />
            )}
            <AvatarPrimitive.Fallback
              className={cn(
                'flex h-full w-full items-center justify-center rounded-full',
                'bg-primary text-primary-foreground',
                'text-sm font-semibold'
              )}
            >
              {initials}
            </AvatarPrimitive.Fallback>
          </AvatarPrimitive.Root>
        </button>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          className={cn(
            'z-50 w-72 overflow-hidden rounded-xl border bg-popover shadow-lg',
            // Animation
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2',
            'data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2',
            'data-[side=top]:slide-in-from-bottom-2',
            'motion-reduce:animate-none'
          )}
          align="end"
          sideOffset={8}
        >
          {/* User Header */}
          <div className="bg-muted/50 px-4 py-4">
            <div className="flex items-center gap-3">
              <AvatarPrimitive.Root className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-background">
                {user?.avatarUrl && (
                  <AvatarPrimitive.Image
                    src={user.avatarUrl}
                    alt={user?.displayName || 'User avatar'}
                    className="h-full w-full object-cover"
                  />
                )}
                <AvatarPrimitive.Fallback
                  className={cn(
                    'flex h-full w-full items-center justify-center rounded-full',
                    'bg-primary text-primary-foreground',
                    'text-base font-semibold'
                  )}
                >
                  {initials}
                </AvatarPrimitive.Fallback>
              </AvatarPrimitive.Root>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {/* Profile & Settings Group */}
            <div className="space-y-1">
              <MenuItem
                icon={UserIcon}
                label="个人资料"
                onClick={onProfileClick}
              />
              {onNotificationsClick && (
                <MenuItem
                  icon={Bell}
                  label="通知设置"
                  onClick={onNotificationsClick}
                />
              )}
            </div>

            {/* Admin Switch (for user dashboard) */}
            {showAdminSwitch && onAdminClick && (
              <>
                <DropdownMenuPrimitive.Separator className="my-2 h-px bg-border" />
                <MenuItem
                  icon={Shield}
                  label="切换到管理端"
                  onClick={onAdminClick}
                  variant="primary"
                  showArrow
                />
              </>
            )}

            {/* User Switch (for admin panel) */}
            {showUserSwitch && onUserClick && (
              <>
                <DropdownMenuPrimitive.Separator className="my-2 h-px bg-border" />
                <MenuItem
                  icon={Shield}
                  label="切换到用户视图"
                  onClick={onUserClick}
                  variant="primary"
                  showArrow
                />
              </>
            )}

            {/* Logout */}
            <DropdownMenuPrimitive.Separator className="my-2 h-px bg-border" />
            <MenuItem
              icon={LogOut}
              label="退出登录"
              onClick={onLogout}
              variant="danger"
            />
          </div>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
};

/**
 * Menu Item Component
 */
interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
  showArrow?: boolean;
  disabled?: boolean;
}

const MenuItem = ({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  showArrow = false,
  disabled = false,
}: MenuItemProps) => {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        // Base styles
        'group relative flex items-center gap-3 rounded-lg px-3',
        // Touch target
        'min-h-[44px]',
        // Cursor
        'cursor-pointer select-none',
        // Transition
        'transition-colors duration-200',
        'motion-reduce:transition-none',
        // Focus
        'outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        // Variants
        variant === 'default' && [
          'text-foreground',
          'hover:bg-accent',
          'focus:bg-accent',
        ],
        variant === 'primary' && [
          'text-primary',
          'hover:bg-primary/10',
          'focus:bg-primary/10',
        ],
        variant === 'danger' && [
          'text-destructive',
          'hover:bg-destructive/10',
          'focus:bg-destructive/10',
        ],
        // Disabled
        disabled && 'pointer-events-none opacity-50'
      )}
      onSelect={onClick}
      disabled={disabled}
    >
      <Icon
        className={cn(
          'h-5 w-5 flex-shrink-0',
          variant === 'default' && 'text-muted-foreground group-hover:text-foreground',
          variant === 'primary' && 'text-primary',
          variant === 'danger' && 'text-destructive'
        )}
        aria-hidden="true"
      />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {showArrow && (
        <ChevronRight
          className="h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </DropdownMenuPrimitive.Item>
  );
};
