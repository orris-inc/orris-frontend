/**
 * MobileSubscriptionCard - iOS 26 Liquid Glass styled subscription card for mobile
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
  Eye,
  RotateCw,
  XCircle,
  Trash2,
  Calendar,
  Hash,
  CreditCard,
  User as UserIcon,
  Play,
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
import { SUBSCRIPTION_STATUS_CONFIG } from '@/shared/constants/status-config';
import type { Subscription } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user';

// ============================================================================
// Types
// ============================================================================

export interface MobileSubscriptionCardProps {
  subscription: Subscription;
  user?: UserResponse;
  onViewDetail: (subscription: Subscription) => void;
  onActivate: (subscription: Subscription) => void;
  onCancel: (subscription: Subscription) => void;
  onRenew: (subscription: Subscription) => void;
  onDelete: (subscription: Subscription) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if subscription can be activated
 */
const canActivate = (subscription: Subscription): boolean => {
  return subscription.status === 'pending' || subscription.status === 'cancelled';
};

/**
 * Check if subscription can be cancelled
 */
const canCancel = (subscription: Subscription): boolean => {
  return subscription.status === 'active' || subscription.status === 'renewed';
};

/**
 * Check if subscription can be renewed
 */
const canRenew = (subscription: Subscription): boolean => {
  return subscription.status === 'expired' || subscription.status === 'cancelled';
};

// ============================================================================
// Main Component
// ============================================================================

export const MobileSubscriptionCard = ({
  subscription,
  user,
  onViewDetail,
  onActivate,
  onCancel,
  onRenew,
  onDelete,
}: MobileSubscriptionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = SUBSCRIPTION_STATUS_CONFIG[subscription.status] || {
    label: subscription.status,
    variant: 'default' as const,
  };

  // Get user display name
  const userDisplayName = user?.name || user?.email || subscription.userId;

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
        {/* Subscription Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-foreground truncate">{userDisplayName}</span>
            <AdminBadge
              variant={statusConfig.variant}
              className="text-[10px] px-1.5 py-0 shrink-0"
            >
              {statusConfig.label}
            </AdminBadge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CreditCard className="size-3 shrink-0" />
            <span className="truncate">{subscription.plan?.name || '未知计划'}</span>
            <span className="text-border">·</span>
            <span className="tabular-nums">{formatDate(subscription.endDate)}</span>
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
            <Hash className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                ID
              </div>
              <div className="text-xs font-mono text-foreground truncate">{subscription.id}</div>
            </div>
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <UserIcon className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                用户
              </div>
              <div className="text-xs text-foreground truncate">
                {user?.email || subscription.userId}
              </div>
            </div>
          </div>

          {/* Plan */}
          <div className="flex items-center gap-3">
            <CreditCard className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                订阅计划
              </div>
              <div className="text-xs text-foreground">{subscription.plan?.name || '未知计划'}</div>
            </div>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-3">
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                开始时间
              </div>
              <div className="text-xs text-foreground">{formatDate(subscription.startDate)}</div>
            </div>
          </div>

          {/* End Date */}
          <div className="flex items-center gap-3">
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                到期时间
              </div>
              <div className="text-xs text-foreground">{formatDate(subscription.endDate)}</div>
            </div>
          </div>

          {/* Current Period */}
          <div className="flex items-center gap-3">
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                当前周期
              </div>
              <div className="text-xs text-foreground">
                {formatDate(subscription.currentPeriodStart)} -{' '}
                {formatDate(subscription.currentPeriodEnd)}
              </div>
            </div>
          </div>

          {/* Auto Renew */}
          <div className="flex items-center gap-3">
            <RotateCw className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                自动续费
              </div>
              <AdminBadge
                variant={subscription.autoRenew ? 'success' : 'default'}
                className="text-[10px] px-1.5 py-0"
              >
                {subscription.autoRenew ? '已开启' : '已关闭'}
              </AdminBadge>
            </div>
          </div>

          {/* Cancel Reason (if cancelled) */}
          {subscription.cancelReason && (
            <div className="flex items-start gap-3">
              <XCircle className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                  取消原因
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {subscription.cancelReason}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="border-t border-border/30 px-4 py-3">
          <div className="flex gap-1.5 flex-wrap">
            <MobileActionButton
              icon={<Eye className="size-3.5" />}
              label="详情"
              onClick={() => onViewDetail(subscription)}
              variant="primary"
            />
            {canActivate(subscription) && (
              <MobileActionButton
                icon={<Play className="size-3.5" />}
                label="激活"
                onClick={() => onActivate(subscription)}
              />
            )}
            {canRenew(subscription) && (
              <MobileActionButton
                icon={<RotateCw className="size-3.5" />}
                label="续费"
                onClick={() => onRenew(subscription)}
              />
            )}
            {canCancel(subscription) && (
              <MobileActionButton
                icon={<XCircle className="size-3.5" />}
                label="取消"
                onClick={() => onCancel(subscription)}
                variant="destructive"
              />
            )}
            <MobileActionButton
              icon={<Trash2 className="size-3.5" />}
              label="删除"
              onClick={() => onDelete(subscription)}
              variant="destructive"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

MobileSubscriptionCard.displayName = 'MobileSubscriptionCard';
