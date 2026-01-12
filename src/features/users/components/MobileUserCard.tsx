/**
 * MobileUserCard - iOS-style user card with swipe actions
 *
 * Redesigned for better mobile UX:
 * - Compact layout showing key info at a glance
 * - Swipe left to reveal actions (Edit, Subscription, Password, Delete)
 * - Tap to select/view details
 * - Clear visual hierarchy
 */

import {
  Edit,
  Trash2,
  CreditCard,
  KeyRound,
  Mail,
  Shield,
  Crown,
} from 'lucide-react';
import { MobileSwipeCard, type SwipeAction } from '@/components/mobile';
import { AdminBadge } from '@/components/admin';
import { cn } from '@/lib/utils';
import { ACTIVE_STATUS_CONFIG, ROLE_CONFIG } from '@/shared/constants/status-config';
import type { UserResponse } from '@/api/user';

// ============================================================================
// Types
// ============================================================================

interface MobileUserCardProps {
  user: UserResponse;
  onCardPress: (user: UserResponse) => void;
  onEdit: (user: UserResponse) => void;
  onDelete: (user: UserResponse) => void;
  onAssignSubscription: (user: UserResponse) => void;
  onResetPassword: (user: UserResponse) => void;
}

// ============================================================================
// Helper Components
// ============================================================================

const UserAvatar = ({ name, email, role }: { name?: string; email: string; role?: string }) => {
  const initial = (name || email).charAt(0).toUpperCase();
  const isAdmin = role === 'admin';

  return (
    <div
      className={cn(
        'relative size-11 rounded-full flex items-center justify-center',
        'text-base font-semibold',
        isAdmin
          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
          : 'bg-primary/10 text-primary'
      )}
    >
      {initial}
      {isAdmin && (
        <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-amber-500 flex items-center justify-center">
          <Crown className="size-2.5 text-white" />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const MobileUserCard = ({
  user,
  onCardPress,
  onEdit,
  onDelete,
  onAssignSubscription,
  onResetPassword,
}: MobileUserCardProps) => {
  const statusConfig = ACTIVE_STATUS_CONFIG[user.status] || { label: user.status, variant: 'default' as const };
  const roleConfig = ROLE_CONFIG[user.role || 'user'] || { label: '用户', variant: 'default' as const };

  // Swipe actions
  const swipeActions: SwipeAction[] = [
    {
      key: 'edit',
      icon: <Edit className="size-5" />,
      label: '编辑',
      bgColor: 'bg-primary',
      onClick: () => onEdit(user),
    },
    {
      key: 'subscription',
      icon: <CreditCard className="size-5" />,
      label: '订阅',
      bgColor: 'bg-success',
      onClick: () => onAssignSubscription(user),
    },
    {
      key: 'password',
      icon: <KeyRound className="size-5" />,
      label: '密码',
      bgColor: 'bg-warning',
      onClick: () => onResetPassword(user),
    },
    {
      key: 'delete',
      icon: <Trash2 className="size-5" />,
      label: '删除',
      bgColor: 'bg-destructive',
      onClick: () => onDelete(user),
    },
  ];

  return (
    <MobileSwipeCard actions={swipeActions}>
      <div
        onClick={() => onCardPress(user)}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-muted/30 transition-colors"
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
              {statusConfig.label}
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
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Shield className="size-3" />
              <span className="text-[10px] font-medium">{roleConfig.label}</span>
            </div>
          </div>
        )}
      </div>

      {/* Swipe hint indicator - subtle visual cue */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
        <div className="flex gap-0.5">
          <div className="w-0.5 h-4 rounded-full bg-foreground" />
          <div className="w-0.5 h-4 rounded-full bg-foreground" />
        </div>
      </div>
    </MobileSwipeCard>
  );
};

MobileUserCard.displayName = 'MobileUserCard';
