/**
 * MobileUserCard - User card for mobile list
 *
 * Pattern A style (like MobileForwardAgentCard):
 * - Plain div with role="button" for accessibility
 * - Tap to view details in sheet
 * - No swipe actions (actions moved to detail sheet)
 */

import { useTranslation } from 'react-i18next';
import { Mail, Shield, Crown } from 'lucide-react';
import { AdminBadge } from '@/components/admin';
import { cn } from '@/lib/utils';
import { mobileListItemStyles } from '@/lib/ui-styles';
import { ACTIVE_STATUS_CONFIG, ROLE_CONFIG } from '@/shared/constants/status-config';
import type { UserResponse } from '@/api/user';

// ============================================================================
// Types
// ============================================================================

interface MobileUserCardProps {
  user: UserResponse;
  onCardPress: (user: UserResponse) => void;
}

// ============================================================================
// Helper Components
// ============================================================================

const UserAvatar = ({
  name,
  email,
  role,
}: {
  name?: string;
  email: string;
  role?: string;
}) => {
  const initial = (name || email).charAt(0).toUpperCase();
  const isAdmin = role === 'admin';

  return (
    <div
      className={cn(
        'relative size-11 rounded-full flex items-center justify-center',
        'text-base font-semibold',
        isAdmin
          ? 'bg-gradient-to-br from-warning to-warning/80 text-warning-foreground'
          : 'bg-primary/10 text-primary'
      )}
    >
      {initial}
      {isAdmin && (
        <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-warning flex items-center justify-center">
          <Crown className="size-2.5 text-warning-foreground" />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const MobileUserCard = ({ user, onCardPress }: MobileUserCardProps) => {
  const { t } = useTranslation();
  const statusConfig = ACTIVE_STATUS_CONFIG[user.status] || {
    labelKey: 'common.status.unknown',
    variant: 'default' as const,
  };
  const roleConfig = ROLE_CONFIG[user.role || 'user'] || {
    labelKey: 'common.role.user',
    variant: 'default' as const,
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCardPress(user)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardPress(user);
        }
      }}
      className={mobileListItemStyles}
    >
      {/* Avatar */}
      <UserAvatar name={user.name} email={user.email} role={user.role} />

      {/* User Info */}
      <div className="flex-1 min-w-0">
        {/* Name and Status */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-foreground truncate text-sm">
            {user.name || user.email.split('@')[0]}
          </span>
          <AdminBadge
            variant={statusConfig.variant}
            className="text-[10px] px-1.5 py-0 shrink-0"
          >
            {t(statusConfig.labelKey)}
          </AdminBadge>
        </div>

        {/* Email and Role */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="size-3 shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>
      </div>

      {/* Role Badge - Only show for admin */}
      {user.role === 'admin' && (
        <div className="shrink-0">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-warning/10 text-warning">
            <Shield className="size-3" />
            <span className="text-[10px] font-medium">
              {t(roleConfig.labelKey)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

MobileUserCard.displayName = 'MobileUserCard';
