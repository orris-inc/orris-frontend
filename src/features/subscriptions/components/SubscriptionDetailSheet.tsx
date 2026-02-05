/**
 * SubscriptionDetailSheet - Mobile subscription details with actions
 *
 * Features:
 * - Full subscription details in a bottom sheet
 * - Primary actions in footer
 * - ActionSheet for secondary actions
 * - iOS-style design
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  Link as LinkIcon,
  User,
  XCircle,
  Receipt,
  Eye,
  MoreHorizontal,
  Play,
  PlayCircle,
  Pause,
  Trash2,
  RotateCw,
  RefreshCcw,
  ArrowRightLeft,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/common/sheet/Sheet';
import { ActionSheet } from '@/components/common/sheet/ActionSheet';
import { Separator } from '@/components/common/Separator';
import { TruncatedId } from '@/components/admin';
import { SubscriptionLinkSelector } from '@/components/subscription';
import { formatDate, isNeverExpiresDate } from '@/shared/utils/date-utils';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { cn } from '@/lib/utils';
import type { Subscription, SubscriptionStatus, PlanType } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

// ============================================================================
// Types
// ============================================================================

interface SubscriptionDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: Subscription | null;
  user?: UserResponse;
  onActivate?: (subscription: Subscription) => void;
  onCancel?: (subscription: Subscription) => void;
  onRenew?: (subscription: Subscription) => void;
  onSuspend?: (subscription: Subscription) => void;
  onUnsuspend?: (subscription: Subscription) => void;
  onResetUsage?: (subscription: Subscription) => void;
  onDelete?: (subscription: Subscription) => void;
  onChangePlan?: (subscription: Subscription) => void;
}

// Status configuration using CSS variables (synced with SDK 2025-01-14)
const STATUS_CONFIG: Record<SubscriptionStatus, { labelKey: string; color: string }> = {
  inactive: { labelKey: 'common.status.inactive', color: 'bg-muted text-muted-foreground' },
  pending_payment: { labelKey: 'subscriptionStatus.pendingPayment', color: 'bg-warning/10 text-warning' },
  trialing: { labelKey: 'subscriptionStatus.trialing', color: 'bg-info/10 text-info' },
  active: { labelKey: 'common.status.active', color: 'bg-success/10 text-success' },
  past_due: { labelKey: 'subscriptionStatus.pastDue', color: 'bg-warning/10 text-warning' },
  suspended: { labelKey: 'common.status.suspended', color: 'bg-destructive/10 text-destructive' },
  cancelled: { labelKey: 'common.status.cancelled', color: 'bg-destructive/10 text-destructive' },
  expired: { labelKey: 'common.status.expired', color: 'bg-muted text-muted-foreground' },
};

// Plan type configuration using CSS variables
const PLAN_TYPE_CONFIG: Record<PlanType, { labelKey: string; color: string }> = {
  node: { labelKey: 'planType.node', color: 'bg-info/10 text-info' },
  forward: { labelKey: 'planType.forward', color: 'bg-warning/10 text-warning' },
  hybrid: { labelKey: 'planType.hybrid', color: 'bg-primary/10 text-primary' },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if subscription can be activated
 * Updated: 2025-01-14 - Synced with backend status.go
 */
const canActivate = (subscription: Subscription): boolean => {
  const status = subscription.status;
  return status === 'inactive' || status === 'pending_payment';
};

/**
 * Check if subscription can be unsuspended
 */
const canUnsuspend = (subscription: Subscription): boolean => {
  return subscription.status === 'suspended';
};

/**
 * Check if subscription can be cancelled
 * Updated: 2025-01-14 - Synced with backend status.go
 */
const canCancel = (subscription: Subscription): boolean => {
  const status = subscription.status;
  return status === 'active' || status === 'trialing' || status === 'past_due';
};

/**
 * Check if subscription can be suspended
 */
const canSuspend = (subscription: Subscription): boolean => {
  return subscription.status === 'active';
};

/**
 * Check if subscription can be renewed
 * Allowed statuses: active (extend before expiration), past_due, expired
 * Not allowed: suspended (must unsuspend first), cancelled, inactive, pending_payment, trialing
 * Note: Lifetime subscriptions cannot be renewed (checked in UI component)
 */
const canRenew = (subscription: Subscription): boolean => {
  return subscription.status === 'active' || subscription.status === 'past_due' || subscription.status === 'expired';
};

/**
 * Check if subscription usage can be reset
 * Can reset for active or suspended subscriptions
 */
const canResetUsage = (subscription: Subscription): boolean => {
  return subscription.status === 'active' || subscription.status === 'suspended';
};

/**
 * Check if subscription plan can be changed
 * Only active subscriptions can change plans
 */
const canChangePlan = (subscription: Subscription): boolean => {
  return subscription.status === 'active';
};

// ============================================================================
// Helper Components
// ============================================================================

// Detail section component
const DetailSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
      {title}
    </h4>
    <div className="rounded-xl bg-muted/30 border border-border/50 divide-y divide-border/30">
      {children}
    </div>
  </div>
);

// Detail row component
const DetailRow = ({
  icon,
  label,
  value,
  copyable,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  copyable?: string;
}) => {
  const { t } = useTranslation();
  const { showSuccess } = useNotificationStore();

  const handleCopy = async () => {
    if (copyable) {
      await navigator.clipboard.writeText(copyable);
      showSuccess(t('common.messages.copySuccess'));
    }
  };

  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm break-all">{value}</div>
      </div>
      {copyable && (
        <button
          onClick={handleCopy}
          className={cn(
            'size-7 flex items-center justify-center rounded-full shrink-0',
            'bg-muted/60 active:bg-muted',
            'text-muted-foreground active:text-foreground',
            'transition-colors duration-150',
            'touch-manipulation'
          )}
        >
          <Copy className="size-3" />
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const SubscriptionDetailSheet: React.FC<SubscriptionDetailSheetProps> = ({
  open,
  onOpenChange,
  entity: subscription,
  user,
  onActivate,
  onCancel,
  onRenew,
  onSuspend,
  onUnsuspend,
  onResetUsage,
  onDelete,
  onChangePlan,
}) => {
  const { t } = useTranslation();
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  if (!subscription) return null;

  const statusConfig = STATUS_CONFIG[subscription.status] || { labelKey: subscription.status, color: 'bg-muted text-muted-foreground' };
  const planTypeConfig = subscription.plan?.planType
    ? PLAN_TYPE_CONFIG[subscription.plan.planType]
    : { labelKey: 'planType.node', color: 'bg-info/10 text-info' };

  // Build action sheet actions based on subscription status
  const moreActions = [];

  if (canActivate(subscription) && onActivate) {
    moreActions.push({
      label: t('subscription.activateSubscription'),
      icon: <Play className="size-5" />,
      onPress: async () => {
        onActivate(subscription);
        onOpenChange(false);
      },
    });
  }

  if (canUnsuspend(subscription) && onUnsuspend) {
    moreActions.push({
      label: t('subscription.unsuspend'),
      icon: <PlayCircle className="size-5" />,
      onPress: async () => {
        onUnsuspend(subscription);
        onOpenChange(false);
      },
    });
  }

  if (canChangePlan(subscription) && onChangePlan) {
    moreActions.push({
      label: t('subscription.changePlan'),
      icon: <ArrowRightLeft className="size-5" />,
      onPress: async () => {
        onChangePlan(subscription);
        onOpenChange(false);
      },
    });
  }

  if (canRenew(subscription) && onRenew) {
    moreActions.push({
      label: t('subscription.renewSubscription'),
      icon: <RotateCw className="size-5" />,
      onPress: async () => {
        onRenew(subscription);
        onOpenChange(false);
      },
    });
  }

  if (canSuspend(subscription) && onSuspend) {
    moreActions.push({
      label: t('subscription.suspend'),
      icon: <Pause className="size-5" />,
      onPress: async () => {
        onSuspend(subscription);
        onOpenChange(false);
      },
    });
  }

  if (canResetUsage(subscription) && onResetUsage) {
    moreActions.push({
      label: t('subscription.resetUsage'),
      icon: <RefreshCcw className="size-5" />,
      onPress: async () => {
        onResetUsage(subscription);
        onOpenChange(false);
      },
    });
  }

  if (canCancel(subscription) && onCancel) {
    moreActions.push({
      label: t('subscription.cancel'),
      icon: <XCircle className="size-5" />,
      onPress: async () => {
        onCancel(subscription);
        onOpenChange(false);
      },
      variant: 'destructive' as const,
    });
  }

  if (onDelete) {
    moreActions.push({
      label: t('subscription.delete'),
      icon: <Trash2 className="size-5" />,
      onPress: async () => {
        onDelete(subscription);
        onOpenChange(false);
      },
      variant: 'destructive' as const,
    });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent showClose>
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'size-12 rounded-xl flex items-center justify-center',
                  'bg-primary/10 text-primary'
                )}
              >
                <Receipt className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <SheetTitle className="truncate">{t('subscription.details')}</SheetTitle>
                  <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium shrink-0', statusConfig.color)}>
                    {t(statusConfig.labelKey)}
                  </span>
                </div>
                <SheetDescription className="flex items-center gap-1 text-xs">
                  ID: <TruncatedId id={subscription.id} />
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <SheetBody className="space-y-4 pb-4">
            {/* Subscription Link */}
            {subscription.subscribeUrl && (
              <div className="rounded-xl border p-3 bg-muted/30">
                <div className="text-xs font-medium text-muted-foreground mb-2">{t('subscription.link')}</div>
                <SubscriptionLinkSelector subscribeUrl={subscription.subscribeUrl} compact />
              </div>
            )}

            {/* User Info */}
            <DetailSection title={t('subscription.userInfo')}>
              <DetailRow
                icon={<User className="size-3.5" />}
                label={t('common.role.user')}
                value={user ? (
                  <div>
                    <div className="font-medium">{user.name || t('userInfo.noNameSet')}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                ) : `${t('common.role.user')} ID: ${subscription.userId}`}
              />
            </DetailSection>

            {/* Plan Info */}
            <DetailSection title={t('subscription.planInfo')}>
              {subscription.plan ? (
                <>
                  <DetailRow
                    icon={<CreditCard className="size-3.5" />}
                    label={t('subscription.plan')}
                    value={
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium">{subscription.plan.name}</span>
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', planTypeConfig.color)}>
                          {t(planTypeConfig.labelKey)}
                        </span>
                      </div>
                    }
                  />
                  {subscription.plan.pricings && subscription.plan.pricings.length > 0 && (
                    <DetailRow
                      icon={<Clock className="size-3.5" />}
                      label={t('subscription.pricing')}
                      value={
                        <div className="space-y-0.5">
                          {subscription.plan.pricings.slice(0, 3).map((pricing) => (
                            <div key={pricing.billingCycle} className="text-xs">
                              {pricing.billingCycle}: ¥{(pricing.price / 100).toFixed(2)}
                              {!pricing.isActive && <span className="text-muted-foreground ml-1">({t('common.status.inactive')})</span>}
                            </div>
                          ))}
                        </div>
                      }
                    />
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground py-3 px-3">{t('subscription.noPlan')}</div>
              )}
            </DetailSection>

            {/* Date Info */}
            <DetailSection title={t('subscription.dateInfo')}>
              <div className="grid grid-cols-2 gap-2 px-3 py-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                    <Calendar className="size-3.5" />
                    <span className="text-xs">{t('subscription.startDate')}</span>
                  </div>
                  <div className="text-sm">{formatDate(subscription.startDate)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                    <Calendar className="size-3.5" />
                    <span className="text-xs">{t('subscription.endDate')}</span>
                  </div>
                  <div className="text-sm">{subscription.endDate && !isNeverExpiresDate(subscription.endDate) ? formatDate(subscription.endDate) : t('common.fields.neverExpires')}</div>
                </div>
              </div>
              <DetailRow
                icon={<Clock className="size-3.5" />}
                label={t('subscription.currentPeriod')}
                value={`${formatDate(subscription.currentPeriodStart)} ~ ${formatDate(subscription.currentPeriodEnd)}`}
              />
            </DetailSection>

            {/* Status Info */}
            <DetailSection title={t('subscription.statusInfo')}>
              <div className="grid grid-cols-2 gap-2 px-3 py-2.5">
                {/* Auto-renew card hidden - feature not complete */}
                <div className="text-center p-2 rounded-xl bg-muted/30">
                  {subscription.isActive ? (
                    <CheckCircle className="size-4 text-success mx-auto" />
                  ) : (
                    <XCircle className="size-4 text-destructive mx-auto" />
                  )}
                  <div className="text-xs mt-1">{subscription.isActive ? t('common.status.active') : t('common.status.inactive')}</div>
                </div>
                <div className="text-center p-2 rounded-xl bg-muted/30">
                  {subscription.isExpired ? (
                    <XCircle className="size-4 text-destructive mx-auto" />
                  ) : (
                    <CheckCircle className="size-4 text-success mx-auto" />
                  )}
                  <div className="text-xs mt-1">{subscription.isExpired ? t('common.status.expired') : t('subscriptionStatus.notExpired')}</div>
                </div>
              </div>

              {(subscription.cancelledAt || subscription.cancelReason) && (
                <>
                  <Separator className="my-0" />
                  {subscription.cancelledAt && (
                    <DetailRow
                      icon={<XCircle className="size-3.5 text-destructive" />}
                      label={t('subscription.cancelledAt')}
                      value={formatDate(subscription.cancelledAt)}
                    />
                  )}
                  {subscription.cancelReason && (
                    <DetailRow
                      icon={<XCircle className="size-3.5 text-destructive" />}
                      label={t('subscription.cancelReason')}
                      value={subscription.cancelReason}
                    />
                  )}
                </>
              )}
            </DetailSection>

            {/* UUID */}
            <DetailSection title={t('subscription.identifyInfo')}>
              <DetailRow
                icon={<LinkIcon className="size-3.5" />}
                label={t('subscription.uuid')}
                value={<TruncatedId id={subscription.uuid} />}
                copyable={subscription.uuid}
              />
            </DetailSection>
          </SheetBody>

          {/* Footer with actions */}
          {moreActions.length > 0 && (
            <SheetFooter>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2',
                    'h-11 rounded-xl',
                    'bg-muted text-foreground',
                    'text-sm font-medium',
                    'active:scale-[0.97] transition-transform'
                  )}
                >
                  <Eye className="size-4" />
                  {t('common.actions.close')}
                </button>
                <button
                  type="button"
                  onClick={() => setActionSheetOpen(true)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2',
                    'h-11 rounded-xl',
                    'bg-primary text-primary-foreground',
                    'text-sm font-medium',
                    'active:scale-[0.97] transition-transform'
                  )}
                >
                  <MoreHorizontal className="size-4" />
                  {t('tableColumns.operations')}
                </button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* More Actions ActionSheet */}
      <ActionSheet
        open={actionSheetOpen}
        onOpenChange={setActionSheetOpen}
        actions={moreActions}
        title={t('subscription.operations')}
      />
    </>
  );
};

SubscriptionDetailSheet.displayName = 'SubscriptionDetailSheet';
