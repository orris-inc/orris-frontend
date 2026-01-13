/**
 * MobileSubscriptionCard - iOS-style subscription card with swipe actions
 *
 * Redesigned for better mobile UX:
 * - Compact layout showing key info at a glance
 * - Swipe left to reveal actions (View, Activate/Cancel, Renew, Delete)
 * - Tap to open details sheet
 * - Clear visual hierarchy
 */

import { useTranslation } from 'react-i18next';
import {
  Eye,
  Play,
  RotateCw,
  XCircle,
  Trash2,
  CreditCard,
  User as UserIcon,
  Calendar,
} from 'lucide-react';
import { MobileSwipeCard, type SwipeAction } from '@/components/mobile';
import { AdminBadge } from '@/components/admin';
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
  onCardPress: (subscription: Subscription) => void;
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
  onCardPress,
  onViewDetail,
  onActivate,
  onCancel,
  onRenew,
  onDelete,
}: MobileSubscriptionCardProps) => {
  const { t } = useTranslation();
  const statusConfig = SUBSCRIPTION_STATUS_CONFIG[subscription.status] || {
    labelKey: 'common.status.unknown',
    variant: 'default' as const,
  };

  // Get user display name
  const userDisplayName = user?.name || user?.email || subscription.userId;

  // Build swipe actions dynamically based on subscription status
  const swipeActions: SwipeAction[] = [
    {
      key: 'view',
      icon: <Eye className="size-5" />,
      label: t('common.actions.view'),
      bgColor: 'bg-primary',
      onClick: () => onViewDetail(subscription),
    },
  ];

  if (canActivate(subscription)) {
    swipeActions.push({
      key: 'activate',
      icon: <Play className="size-5" />,
      label: t('subscription.activate'),
      bgColor: 'bg-success',
      onClick: () => onActivate(subscription),
    });
  }

  if (canRenew(subscription)) {
    swipeActions.push({
      key: 'renew',
      icon: <RotateCw className="size-5" />,
      label: t('subscription.renew'),
      bgColor: 'bg-info',
      onClick: () => onRenew(subscription),
    });
  }

  if (canCancel(subscription)) {
    swipeActions.push({
      key: 'cancel',
      icon: <XCircle className="size-5" />,
      label: t('common.actions.cancel'),
      bgColor: 'bg-warning',
      onClick: () => onCancel(subscription),
    });
  }

  swipeActions.push({
    key: 'delete',
    icon: <Trash2 className="size-5" />,
    label: t('common.actions.delete'),
    bgColor: 'bg-destructive',
    onClick: () => onDelete(subscription),
  });

  return (
    <MobileSwipeCard actions={swipeActions}>
      <div
        onClick={() => onCardPress(subscription)}
        className="px-4 py-3 min-h-[72px] cursor-pointer active:bg-muted/30 transition-colors"
      >
        {/* Row 1: User Name + Status */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <UserIcon className="size-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium text-foreground truncate">
              {userDisplayName}
            </span>
          </div>
          <AdminBadge
            variant={statusConfig.variant}
            className="text-[10px] px-1.5 py-0 shrink-0"
          >
            {t(statusConfig.labelKey)}
          </AdminBadge>
        </div>

        {/* Row 2: Plan + End Date + Auto Renew */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {/* Plan */}
          <div className="flex items-center gap-1">
            <CreditCard className="size-3" />
            <span className="truncate max-w-[100px]">{subscription.plan?.name || t('subscription.unknownPlan')}</span>
          </div>

          <span className="text-border">·</span>

          {/* End Date */}
          <div className={cn(
            'flex items-center gap-1',
            subscription.isExpired ? 'text-destructive' : ''
          )}>
            <Calendar className="size-3" />
            <span className="tabular-nums">{formatDate(subscription.endDate)}</span>
          </div>

          {/* Auto Renew */}
          {subscription.autoRenew && (
            <>
              <span className="text-border">·</span>
              <span className="text-success flex items-center gap-0.5">
                <RotateCw className="size-3" />
                <span>{t('subscription.autoRenewal')}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Swipe hint indicator */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
        <div className="flex gap-0.5">
          <div className="w-0.5 h-4 rounded-full bg-foreground" />
          <div className="w-0.5 h-4 rounded-full bg-foreground" />
        </div>
      </div>
    </MobileSwipeCard>
  );
};

MobileSubscriptionCard.displayName = 'MobileSubscriptionCard';
