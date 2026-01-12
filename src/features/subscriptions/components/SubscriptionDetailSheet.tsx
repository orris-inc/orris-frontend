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
  RefreshCw,
  Eye,
  MoreHorizontal,
  Play,
  Trash2,
  RotateCw,
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
import { formatDate } from '@/shared/utils/date-utils';
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
  onDelete?: (subscription: Subscription) => void;
}

// Status configuration
const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; color: string }> = {
  active: { label: '激活', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  renewed: { label: '已续费', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  expired: { label: '已过期', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

// Plan type configuration
const PLAN_TYPE_CONFIG: Record<PlanType, { label: string; color: string }> = {
  node: { label: '节点订阅', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  forward: { label: '端口转发', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  hybrid: { label: '混合订阅', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};

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
  const { showSuccess } = useNotificationStore();

  const handleCopy = async () => {
    if (copyable) {
      await navigator.clipboard.writeText(copyable);
      showSuccess('已复制');
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
  onDelete,
}) => {
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  if (!subscription) return null;

  const statusConfig = STATUS_CONFIG[subscription.status] || { label: subscription.status, color: 'bg-gray-100 text-gray-600' };
  const planTypeConfig = subscription.plan?.planType
    ? PLAN_TYPE_CONFIG[subscription.plan.planType]
    : { label: '节点订阅', color: 'bg-blue-100 text-blue-700' };

  // Build action sheet actions based on subscription status
  const moreActions = [];

  if (canActivate(subscription) && onActivate) {
    moreActions.push({
      label: '激活订阅',
      icon: <Play className="size-5" />,
      onPress: async () => {
        onActivate(subscription);
        onOpenChange(false);
      },
    });
  }

  if (canRenew(subscription) && onRenew) {
    moreActions.push({
      label: '续费订阅',
      icon: <RotateCw className="size-5" />,
      onPress: async () => {
        onRenew(subscription);
        onOpenChange(false);
      },
    });
  }

  if (canCancel(subscription) && onCancel) {
    moreActions.push({
      label: '取消订阅',
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
      label: '删除订阅',
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
                  <SheetTitle className="truncate">订阅详情</SheetTitle>
                  <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium shrink-0', statusConfig.color)}>
                    {statusConfig.label}
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
                <div className="text-xs font-medium text-muted-foreground mb-2">订阅链接</div>
                <SubscriptionLinkSelector subscribeUrl={subscription.subscribeUrl} compact />
              </div>
            )}

            {/* User Info */}
            <DetailSection title="用户信息">
              <DetailRow
                icon={<User className="size-3.5" />}
                label="用户"
                value={user ? (
                  <div>
                    <div className="font-medium">{user.name || '未设置名称'}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                ) : `用户 ID: ${subscription.userId}`}
              />
            </DetailSection>

            {/* Plan Info */}
            <DetailSection title="计划信息">
              {subscription.plan ? (
                <>
                  <DetailRow
                    icon={<CreditCard className="size-3.5" />}
                    label="计划"
                    value={
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium">{subscription.plan.name}</span>
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', planTypeConfig.color)}>
                          {planTypeConfig.label}
                        </span>
                      </div>
                    }
                  />
                  {subscription.plan.pricings && subscription.plan.pricings.length > 0 && (
                    <DetailRow
                      icon={<Clock className="size-3.5" />}
                      label="定价"
                      value={
                        <div className="space-y-0.5">
                          {subscription.plan.pricings.slice(0, 3).map((pricing) => (
                            <div key={pricing.billingCycle} className="text-xs">
                              {pricing.billingCycle}: ¥{(pricing.price / 100).toFixed(2)}
                              {!pricing.isActive && <span className="text-muted-foreground ml-1">(未启用)</span>}
                            </div>
                          ))}
                        </div>
                      }
                    />
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground py-3 px-3">未关联计划</div>
              )}
            </DetailSection>

            {/* Date Info */}
            <DetailSection title="日期信息">
              <div className="grid grid-cols-2 gap-2 px-3 py-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                    <Calendar className="size-3.5" />
                    <span className="text-xs">开始日期</span>
                  </div>
                  <div className="text-sm">{formatDate(subscription.startDate)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                    <Calendar className="size-3.5" />
                    <span className="text-xs">结束日期</span>
                  </div>
                  <div className="text-sm">{subscription.endDate ? formatDate(subscription.endDate) : '-'}</div>
                </div>
              </div>
              <DetailRow
                icon={<Clock className="size-3.5" />}
                label="当前周期"
                value={`${formatDate(subscription.currentPeriodStart)} ~ ${formatDate(subscription.currentPeriodEnd)}`}
              />
            </DetailSection>

            {/* Status Info */}
            <DetailSection title="状态信息">
              <div className="grid grid-cols-3 gap-2 px-3 py-2.5">
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  {subscription.autoRenew ? (
                    <RefreshCw className="size-4 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="size-4 text-muted-foreground mx-auto" />
                  )}
                  <div className="text-xs mt-1">{subscription.autoRenew ? '自动续费' : '不续费'}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  {subscription.isActive ? (
                    <CheckCircle className="size-4 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="size-4 text-red-500 mx-auto" />
                  )}
                  <div className="text-xs mt-1">{subscription.isActive ? '已激活' : '未激活'}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  {subscription.isExpired ? (
                    <XCircle className="size-4 text-red-500 mx-auto" />
                  ) : (
                    <CheckCircle className="size-4 text-emerald-500 mx-auto" />
                  )}
                  <div className="text-xs mt-1">{subscription.isExpired ? '已过期' : '未过期'}</div>
                </div>
              </div>

              {(subscription.cancelledAt || subscription.cancelReason) && (
                <>
                  <Separator className="my-0" />
                  {subscription.cancelledAt && (
                    <DetailRow
                      icon={<XCircle className="size-3.5 text-red-500" />}
                      label="取消时间"
                      value={formatDate(subscription.cancelledAt)}
                    />
                  )}
                  {subscription.cancelReason && (
                    <DetailRow
                      icon={<XCircle className="size-3.5 text-red-500" />}
                      label="取消原因"
                      value={subscription.cancelReason}
                    />
                  )}
                </>
              )}
            </DetailSection>

            {/* UUID */}
            <DetailSection title="标识信息">
              <DetailRow
                icon={<LinkIcon className="size-3.5" />}
                label="UUID"
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
                  关闭
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
                  操作
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
        title="订阅操作"
      />
    </>
  );
};

SubscriptionDetailSheet.displayName = 'SubscriptionDetailSheet';
