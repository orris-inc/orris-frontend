/**
 * MobileSubscriptionCard - Tailwind Application UI style list item
 *
 * Design principles:
 * - Clean stacked list item (used with divide-y parent)
 * - Two-line layout: user + plan | end date + auto renew
 * - Status badge on the right
 * - Tap to open detail sheet
 */

import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  User as UserIcon,
  Calendar,
} from 'lucide-react';
import { AdminBadge } from '@/components/admin';
import { cn } from '@/lib/utils';
import { mobileListItemStyles } from '@/lib/ui-styles';
import { formatDate, isNeverExpiresDate } from '@/shared/utils/date-utils';
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
}

// ============================================================================
// Main Component
// ============================================================================

export const MobileSubscriptionCard = ({
  subscription,
  user,
  onCardPress,
}: MobileSubscriptionCardProps) => {
  const { t } = useTranslation();
  const statusConfig = SUBSCRIPTION_STATUS_CONFIG[subscription.status] || {
    labelKey: 'common.status.unknown',
    variant: 'default' as const,
  };

  // Get user display name
  const userDisplayName = user?.name || user?.email || subscription.userId;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCardPress(subscription)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardPress(subscription);
        }
      }}
      className={mobileListItemStyles}
    >
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: User Name + Plan */}
        <div className="flex items-center gap-2 mb-1">
          <UserIcon className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">
            {userDisplayName}
          </span>
          <span className="text-border">·</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CreditCard className="size-3" />
            <span className="truncate max-w-[100px]">
              {subscription.plan?.name || t('subscription.unknownPlan')}
            </span>
          </div>
        </div>

        {/* Row 2: End Date + Auto Renew */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div
            className={cn(
              'flex items-center gap-1',
              subscription.isExpired ? 'text-destructive' : ''
            )}
          >
            <Calendar className="size-3" />
            <span className="tabular-nums">{subscription.endDate && !isNeverExpiresDate(subscription.endDate) ? formatDate(subscription.endDate) : t('common.fields.neverExpires')}</span>
          </div>

          {/* Auto-renew display hidden - feature not complete */}
        </div>
      </div>

      {/* Right side: Status */}
      <AdminBadge
        variant={statusConfig.variant}
        className="text-[10px] px-1.5 py-0 shrink-0"
      >
        {t(statusConfig.labelKey)}
      </AdminBadge>
    </div>
  );
};

MobileSubscriptionCard.displayName = 'MobileSubscriptionCard';
