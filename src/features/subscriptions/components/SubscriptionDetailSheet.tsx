/**
 * Subscription Detail Sheet Component
 * Mobile-optimized bottom sheet for viewing subscription details
 */

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
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from '@/components/common/Sheet';
import { Separator } from '@/components/common/Separator';
import { TruncatedId } from '@/components/admin';
import { SubscriptionLinkSelector } from '@/components/subscription';
import { formatDate } from '@/shared/utils/date-utils';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { cn } from '@/lib/utils';
import type { Subscription, SubscriptionStatus, PlanType } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface SubscriptionDetailSheetProps {
  open: boolean;
  subscription: Subscription | null;
  user?: UserResponse;
  onClose: () => void;
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

// Detail item component
const DetailItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  copyable?: string;
}> = ({ icon, label, value, copyable }) => {
  const { showSuccess } = useNotificationStore();

  const handleCopy = async () => {
    if (copyable) {
      await navigator.clipboard.writeText(copyable);
      showSuccess('已复制');
    }
  };

  return (
    <div className="flex items-start gap-2.5 py-1.5">
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

export const SubscriptionDetailSheet: React.FC<SubscriptionDetailSheetProps> = ({
  open,
  subscription,
  user,
  onClose,
}) => {
  if (!subscription) return null;

  const statusConfig = STATUS_CONFIG[subscription.status] || { label: subscription.status, color: 'bg-gray-100 text-gray-600' };
  const planTypeConfig = subscription.plan?.planType
    ? PLAN_TYPE_CONFIG[subscription.plan.planType]
    : { label: '节点订阅', color: 'bg-blue-100 text-blue-700' };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="max-h-[95vh]" showClose={false}>
        <SheetHeader className="pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Receipt className="size-4 text-primary" />
              </div>
              <span>订阅详情</span>
              <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', statusConfig.color)}>
                {statusConfig.label}
              </span>
            </SheetTitle>
            {/* iOS-style close button */}
            <button
              onClick={onClose}
              className={cn(
                'size-8 flex items-center justify-center rounded-full',
                'bg-muted/80 active:bg-muted',
                'text-muted-foreground active:text-foreground',
                'transition-colors duration-150',
                'touch-manipulation'
              )}
            >
              <X className="size-4" />
            </button>
          </div>
          <SheetDescription className="text-xs flex items-center gap-1">
            ID: <TruncatedId id={subscription.id} />
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-3 space-y-3">
          {/* Subscription Link */}
          {subscription.subscribeUrl && (
            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="text-xs font-medium text-muted-foreground mb-2">订阅链接</div>
              <SubscriptionLinkSelector subscribeUrl={subscription.subscribeUrl} compact />
            </div>
          )}

          {/* User Info */}
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">用户信息</h4>
            <div className="rounded-lg border p-3">
              <DetailItem
                icon={<User className="size-3.5" />}
                label="用户"
                value={user ? (
                  <div>
                    <div className="font-medium">{user.name || '未设置名称'}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                ) : `用户 ID: ${subscription.userId}`}
              />
            </div>
          </div>

          {/* Plan Info */}
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">计划信息</h4>
            <div className="rounded-lg border p-3 space-y-1">
              {subscription.plan ? (
                <>
                  <DetailItem
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
                    <DetailItem
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
                <div className="text-sm text-muted-foreground py-2">未关联计划</div>
              )}
            </div>
          </div>

          {/* Date Info */}
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">日期信息</h4>
            <div className="rounded-lg border p-3 space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <DetailItem
                  icon={<Calendar className="size-3.5" />}
                  label="开始日期"
                  value={formatDate(subscription.startDate)}
                />
                <DetailItem
                  icon={<Calendar className="size-3.5" />}
                  label="结束日期"
                  value={subscription.endDate ? formatDate(subscription.endDate) : '-'}
                />
              </div>
              <DetailItem
                icon={<Clock className="size-3.5" />}
                label="当前周期"
                value={`${formatDate(subscription.currentPeriodStart)} ~ ${formatDate(subscription.currentPeriodEnd)}`}
              />
            </div>
          </div>

          {/* Status Info */}
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">状态信息</h4>
            <div className="rounded-lg border p-3">
              <div className="grid grid-cols-3 gap-2">
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
                  <Separator className="my-2" />
                  {subscription.cancelledAt && (
                    <DetailItem
                      icon={<XCircle className="size-3.5 text-red-500" />}
                      label="取消时间"
                      value={formatDate(subscription.cancelledAt)}
                    />
                  )}
                  {subscription.cancelReason && (
                    <DetailItem
                      icon={<XCircle className="size-3.5 text-red-500" />}
                      label="取消原因"
                      value={subscription.cancelReason}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* UUID */}
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">标识信息</h4>
            <div className="rounded-lg border p-3">
              <DetailItem
                icon={<LinkIcon className="size-3.5" />}
                label="UUID"
                value={<TruncatedId id={subscription.uuid} />}
                copyable={subscription.uuid}
              />
            </div>
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
};
