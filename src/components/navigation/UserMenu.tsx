/**
 * User Menu Component
 *
 * Dropdown menu for user profile actions following Tailwind Application UI patterns.
 * Features:
 * - User info header with avatar
 * - Grouped menu sections with dividers
 * - Keyboard navigation with focus states
 * - Support for admin/user view switching
 */

import { useTranslation } from 'react-i18next';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import {
  User as UserIcon,
  ArrowLeftRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface UserMenuProps {
  user: {
    displayName?: string;
    email?: string;
    initials?: string;
    avatarUrl?: string;
  } | null;
  showAdminSwitch?: boolean;
  showUserSwitch?: boolean;
  onProfileClick: () => void;
  onAdminClick?: () => void;
  onUserClick?: () => void;
  onLogout: () => void;
}

// ============================================================================
// Subcomponents
// ============================================================================

interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

const MenuItem = ({
  icon: Icon,
  label,
  description,
  onClick,
  variant = 'default',
}: MenuItemProps) => (
  <DropdownMenuPrimitive.Item
    className={cn(
      'group flex w-full items-center gap-3 rounded-lg px-3 py-2',
      'cursor-default select-none outline-none',
      'text-sm',
      // Default state
      variant === 'default' && [
        'text-foreground',
        'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
      ],
      // Danger variant
      variant === 'danger' && [
        'text-destructive',
        'data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive',
      ]
    )}
    onSelect={onClick}
  >
    <Icon
      className={cn(
        'size-4 shrink-0',
        variant === 'default' && 'text-muted-foreground group-data-[highlighted]:text-foreground',
        variant === 'danger' && 'text-destructive'
      )}
    />
    <div className="flex-1 min-w-0">
      <span className="block truncate">{label}</span>
      {description && (
        <span className="block truncate text-xs text-muted-foreground">
          {description}
        </span>
      )}
    </div>
  </DropdownMenuPrimitive.Item>
);

const MenuDivider = () => (
  <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border" />
);

// ============================================================================
// UserMenu Component
// ============================================================================

export const UserMenu = ({
  user,
  showAdminSwitch = false,
  showUserSwitch = false,
  onProfileClick,
  onAdminClick,
  onUserClick,
  onLogout,
}: UserMenuProps) => {
  const { t } = useTranslation();
  const initials = user?.initials || user?.displayName?.charAt(0).toUpperCase() || '?';

  const hasViewSwitch = (showAdminSwitch && onAdminClick) || (showUserSwitch && onUserClick);

  return (
    <DropdownMenuPrimitive.Root modal={false}>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'relative flex items-center justify-center',
            'size-9 rounded-full',
            'ring-offset-background',
            'transition-opacity hover:opacity-80',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
          aria-label={t('common.openUserMenu')}
        >
          <AvatarPrimitive.Root className="size-8 overflow-hidden rounded-full ring-1 ring-border">
            {user?.avatarUrl && (
              <AvatarPrimitive.Image
                src={user.avatarUrl}
                alt={user.displayName || 'User avatar'}
                className="size-full object-cover"
              />
            )}
            <AvatarPrimitive.Fallback
              className={cn(
                'flex size-full items-center justify-center',
                'bg-muted text-muted-foreground',
                'text-xs font-medium'
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
            'z-50 w-56 overflow-hidden rounded-xl',
            'bg-popover text-popover-foreground',
            'border border-border shadow-lg',
            // Animation
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2',
            'data-[side=top]:slide-in-from-bottom-2'
          )}
          align="end"
          sideOffset={8}
        >
          {/* User Info Header */}
          <div className="px-3 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <AvatarPrimitive.Root className="size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
                {user?.avatarUrl && (
                  <AvatarPrimitive.Image
                    src={user.avatarUrl}
                    alt={user?.displayName || 'User avatar'}
                    className="size-full object-cover"
                  />
                )}
                <AvatarPrimitive.Fallback
                  className={cn(
                    'flex size-full items-center justify-center',
                    'bg-muted text-muted-foreground',
                    'text-sm font-medium'
                  )}
                >
                  {initials}
                </AvatarPrimitive.Fallback>
              </AvatarPrimitive.Root>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Section */}
          <div className="p-1">
            <MenuItem
              icon={UserIcon}
              label={t('nav.profile')}
              onClick={onProfileClick}
            />
          </div>

          {/* View Switch Section */}
          {hasViewSwitch && (
            <>
              <MenuDivider />
              <div className="p-1">
                {showAdminSwitch && onAdminClick && (
                  <MenuItem
                    icon={ArrowLeftRight}
                    label={t('nav.switchToAdmin')}
                    onClick={onAdminClick}
                  />
                )}
                {showUserSwitch && onUserClick && (
                  <MenuItem
                    icon={ArrowLeftRight}
                    label={t('nav.switchToUser')}
                    onClick={onUserClick}
                  />
                )}
              </div>
            </>
          )}

          {/* Logout Section */}
          <MenuDivider />
          <div className="p-1">
            <MenuItem
              icon={LogOut}
              label={t('nav.logout')}
              onClick={onLogout}
              variant="danger"
            />
          </div>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
};

export type { UserMenuProps };
