/**
 * Mobile Drawer Header Component
 *
 * Displays user info (avatar, name, email) and close button.
 * Follows Tailwind Application UI patterns.
 */

import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Drawer } from 'vaul';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/common/Avatar';

import type { MobileDrawerHeaderProps } from './types';

export const MobileDrawerHeader = ({
  user,
  title,
  onClose,
}: MobileDrawerHeaderProps) => {
  const { t } = useTranslation();
  const initials = user?.initials || user?.displayName?.charAt(0).toUpperCase() || '?';

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      {user ? (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="size-9 shrink-0">
            {user.avatarUrl && (
              <AvatarImage
                src={user.avatarUrl}
                alt={user.displayName || 'User avatar'}
              />
            )}
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Drawer.Title className="text-sm font-semibold text-foreground truncate">
              {user.displayName || t('common.role.user')}
            </Drawer.Title>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
      ) : (
        <Drawer.Title className="text-base font-semibold text-foreground">
          {title || t('nav.menu')}
        </Drawer.Title>
      )}

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className={cn(
          'flex size-9 items-center justify-center rounded-md',
          'text-muted-foreground hover:text-foreground',
          'hover:bg-muted active:bg-muted/80',
          'transition-colors duration-150'
        )}
        aria-label={t('common.actions.close')}
      >
        <X className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
};
