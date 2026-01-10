/**
 * MobileUserCard - iOS 26 Liquid Glass styled user card for mobile
 *
 * Designed following iOS Human Interface Guidelines:
 * - Minimum 44px touch targets for all interactive elements
 * - Clear visual hierarchy with primary/secondary information
 * - Expandable details section with smooth animation
 * - Quick action buttons for common operations
 * - Respects prefers-reduced-motion
 */

import { useState } from 'react';
import {
  ChevronDown,
  Edit,
  Trash2,
  CreditCard,
  KeyRound,
  Mail,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/common/Collapsible';
import { AdminBadge } from '@/components/admin';
import { MobileActionButton } from '@/components/mobile';
import { cn } from '@/lib/utils';
import { formatDate } from '@/shared/utils/date-utils';
import type { UserResponse } from '@/api/user';

// ============================================================================
// Types
// ============================================================================

interface MobileUserCardProps {
  user: UserResponse;
  onEdit: (user: UserResponse) => void;
  onDelete: (user: UserResponse) => void;
  onAssignSubscription: (user: UserResponse) => void;
  onResetPassword: (user: UserResponse) => void;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'success' | 'default' | 'warning' | 'danger' }
> = {
  active: { label: '激活', variant: 'success' },
  inactive: { label: '未激活', variant: 'default' },
  pending: { label: '待验证', variant: 'warning' },
  suspended: { label: '封禁', variant: 'danger' },
  deleted: { label: '已删除', variant: 'danger' },
};

const ROLE_CONFIG: Record<string, { label: string; variant: 'info' | 'default' }> = {
  user: { label: '用户', variant: 'default' },
  admin: { label: '管理员', variant: 'info' },
};

// ============================================================================
// Main Component
// ============================================================================

export const MobileUserCard = ({
  user,
  onEdit,
  onDelete,
  onAssignSubscription,
  onResetPassword,
}: MobileUserCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = STATUS_CONFIG[user.status] || { label: user.status, variant: 'default' as const };
  const roleConfig = ROLE_CONFIG[user.role || 'user'] || { label: '用户', variant: 'default' as const };

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className={cn(
        'bg-card/60 backdrop-blur-sm',
        'rounded-2xl',
        'border border-border/50',
        'overflow-hidden'
      )}
    >
      {/* Header - Always visible */}
      <CollapsibleTrigger
        className={cn(
          'w-full px-4 py-3 min-h-[60px]',
          'flex items-center justify-between gap-3',
          'text-left cursor-pointer',
          // Active feedback
          'motion-safe:active:bg-foreground/5'
        )}
      >
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-foreground truncate">
              {user.name || user.email}
            </span>
            <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 shrink-0">
              {statusConfig.label}
            </AdminBadge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {user.name && (
              <>
                <Mail className="size-3 shrink-0" />
                <span className="truncate">{user.email}</span>
                <span className="text-border">·</span>
              </>
            )}
            <AdminBadge variant={roleConfig.variant} className="text-[10px] px-1.5 py-0">
              {roleConfig.label}
            </AdminBadge>
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            'size-5 text-muted-foreground shrink-0',
            'transition-transform duration-200',
            'motion-reduce:transition-none',
            isExpanded && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>

      {/* Expandable Details */}
      <CollapsibleContent>
        {/* Details Section */}
        <div className="border-t border-border/30 px-4 py-3 space-y-2.5">
          {/* ID */}
          <div className="flex items-center gap-3">
            <UserIcon className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">ID</div>
              <div className="text-xs font-mono text-foreground truncate">{user.id}</div>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3">
            <Mail className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">邮箱</div>
              <div className="text-xs text-foreground truncate">{user.email}</div>
            </div>
          </div>

          {/* Name */}
          {user.name && (
            <div className="flex items-center gap-3">
              <UserIcon className="size-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">姓名</div>
                <div className="text-xs text-foreground">{user.name}</div>
              </div>
            </div>
          )}

          {/* Created At */}
          <div className="flex items-center gap-3">
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">创建时间</div>
              <div className="text-xs text-foreground">{formatDate(user.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="border-t border-border/30 px-4 py-3">
          <div className="grid grid-cols-4 gap-1.5">
            <MobileActionButton
              icon={<Edit className="size-3.5" />}
              label="编辑"
              onClick={() => onEdit(user)}
              variant="primary"
            />
            <MobileActionButton
              icon={<CreditCard className="size-3.5" />}
              label="订阅"
              onClick={() => onAssignSubscription(user)}
            />
            <MobileActionButton
              icon={<KeyRound className="size-3.5" />}
              label="密码"
              onClick={() => onResetPassword(user)}
            />
            <MobileActionButton
              icon={<Trash2 className="size-3.5" />}
              label="删除"
              onClick={() => onDelete(user)}
              variant="destructive"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

MobileUserCard.displayName = 'MobileUserCard';
