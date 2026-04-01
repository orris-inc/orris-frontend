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
import { SmartTruncate } from '@/components/common/SmartTruncate';

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
  onClick: () => void;
  variant?: 'default' | 'danger';
}

const MenuItem = ({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
}: MenuItemProps) => (
  <DropdownMenuPrimitive.Item
    className={cn(
      'group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5',
      'cursor-default select-none outline-none',
      'text-[13px]',
      variant === 'default' && [
        'text-muted-foreground',
        'data-[highlighted]:bg-muted/60 data-[highlighted]:text-foreground',
      ],
      variant === 'danger' && [
        'text-muted-foreground',
        'data-[highlighted]:bg-destructive/8 data-[highlighted]:text-destructive',
      ]
    )}
    onSelect={onClick}
  >
    <Icon
      className={cn(
        'size-[15px] shrink-0',
        variant === 'default' && 'text-muted-foreground/60 group-data-[highlighted]:text-foreground',
        variant === 'danger' && 'text-muted-foreground/60 group-data-[highlighted]:text-destructive'
      )}
    />
    <span className="flex-1 truncate">{label}</span>
  </DropdownMenuPrimitive.Item>
);

const MenuDivider = () => (
  <DropdownMenuPrimitive.Separator className="my-0.5 mx-2 h-px bg-border/60" />
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

  return (
    <DropdownMenuPrimitive.Root modal={false}>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'relative flex items-center justify-center',
            'size-8 rounded-full',
            'ring-offset-background',
            'transition-opacity hover:opacity-80',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
          )}
          aria-label={t('common.openUserMenu')}
        >
          <AvatarPrimitive.Root className="size-7 overflow-hidden rounded-full ring-1 ring-border/60">
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
                'text-[11px] font-medium'
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
            'z-50 w-52 overflow-hidden rounded-lg',
            'bg-popover text-popover-foreground',
            'border border-border/60 shadow-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-1',
            'data-[side=top]:slide-in-from-bottom-1'
          )}
          align="end"
          sideOffset={6}
        >
          {/* User Info Header */}
          <div className="px-3 py-2.5">
            <SmartTruncate text={user?.displayName || 'User'} className="text-[13px] font-medium text-foreground" />
            <SmartTruncate text={user?.email || ''} className="text-xs text-muted-foreground/60" />
          </div>

          <MenuDivider />

          {/* Profile & Switch */}
          <div className="p-1">
            <MenuItem
              icon={UserIcon}
              label={t('nav.profile')}
              onClick={onProfileClick}
            />
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

          <MenuDivider />

          {/* Logout */}
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
