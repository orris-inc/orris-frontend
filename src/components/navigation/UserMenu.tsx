/**
 * User Menu Component
 *
 * Compact dropdown menu for user profile actions.
 * Optimized for information density while maintaining usability.
 */

import { useTranslation } from 'react-i18next';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import {
  User as UserIcon,
  Home,
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
  showAdminSwitch?: boolean;
  showUserSwitch?: boolean;
  onProfileClick: () => void;
  onHomeClick?: () => void;
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
  onHomeClick,
  onNotificationsClick,
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
          className={cn(
            'relative flex items-center justify-center',
            'size-9 rounded-full',
            'ring-offset-background transition-all duration-150',
            'hover:ring-2 hover:ring-primary/20',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          aria-label="Open user menu"
        >
          <AvatarPrimitive.Root className="size-8 overflow-hidden rounded-full">
            {user?.avatarUrl && (
              <AvatarPrimitive.Image
                src={user.avatarUrl}
                alt={user.displayName || 'User avatar'}
                className="size-full object-cover"
              />
            )}
            <AvatarPrimitive.Fallback
              className="flex size-full items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold"
            >
              {initials}
            </AvatarPrimitive.Fallback>
          </AvatarPrimitive.Root>
        </button>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          className={cn(
            'z-50 min-w-[180px] overflow-hidden rounded-lg border bg-popover shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-1'
          )}
          align="end"
          sideOffset={4}
        >
          {/* Compact User Header */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border/50">
            <AvatarPrimitive.Root className="size-8 shrink-0 overflow-hidden rounded-full">
              {user?.avatarUrl && (
                <AvatarPrimitive.Image
                  src={user.avatarUrl}
                  alt={user?.displayName || 'User avatar'}
                  className="size-full object-cover"
                />
              )}
              <AvatarPrimitive.Fallback
                className="flex size-full items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold"
              >
                {initials}
              </AvatarPrimitive.Fallback>
            </AvatarPrimitive.Root>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate leading-tight">
                {user?.displayName || 'User'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate leading-tight">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <MenuItem
              icon={UserIcon}
              label={t('nav.profile')}
              onClick={onProfileClick}
            />
            {onNotificationsClick && (
              <MenuItem
                icon={Bell}
                label={t('nav.notifications')}
                onClick={onNotificationsClick}
              />
            )}
            {onHomeClick && (
              <>
                <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border/50" />
                <MenuItem
                  icon={Home}
                  label={t('nav.home')}
                  onClick={onHomeClick}
                />
              </>
            )}

            {/* Admin/User Switch */}
            {(showAdminSwitch && onAdminClick) && (
              <>
                <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border/50" />
                <MenuItem
                  icon={Shield}
                  label={t('nav.switchToAdmin')}
                  onClick={onAdminClick}
                  variant="primary"
                  showArrow
                />
              </>
            )}
            {(showUserSwitch && onUserClick) && (
              <>
                <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border/50" />
                <MenuItem
                  icon={Shield}
                  label={t('nav.switchToUser')}
                  onClick={onUserClick}
                  variant="primary"
                  showArrow
                />
              </>
            )}

            {/* Logout */}
            <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border/50" />
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

/**
 * Compact Menu Item
 */
interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
  showArrow?: boolean;
}

const MenuItem = ({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  showArrow = false,
}: MenuItemProps) => (
  <DropdownMenuPrimitive.Item
    className={cn(
      'flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md',
      'cursor-pointer select-none outline-none',
      'transition-colors duration-100',
      variant === 'default' && 'text-foreground hover:bg-accent focus:bg-accent',
      variant === 'primary' && 'text-primary hover:bg-primary/10 focus:bg-primary/10',
      variant === 'danger' && 'text-destructive hover:bg-destructive/10 focus:bg-destructive/10'
    )}
    onSelect={onClick}
  >
    <Icon
      className={cn(
        'size-4 shrink-0',
        variant === 'default' && 'text-muted-foreground',
        variant === 'primary' && 'text-primary',
        variant === 'danger' && 'text-destructive'
      )}
    />
    <span className="flex-1 text-[13px]">{label}</span>
    {showArrow && <ChevronRight className="size-3.5 text-muted-foreground" />}
  </DropdownMenuPrimitive.Item>
);
