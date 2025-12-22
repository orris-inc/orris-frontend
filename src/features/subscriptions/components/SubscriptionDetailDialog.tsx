/**
 * 订阅详情对话框组件
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
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Separator } from '@/components/common/Separator';
import { AdminBadge, TruncatedId } from '@/components/admin';
import { formatDate } from '@/shared/utils/date-utils';
import { useNotificationStore } from '@/shared/stores/notification-store';
import type { Subscription, SubscriptionStatus, PlanType } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface SubscriptionDetailDialogProps {
  open: boolean;
  subscription: Subscription | null;
  user?: UserResponse;
  onClose: () => void;
}

// Status configuration
const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; variant: 'success' | 'default' | 'warning' | 'danger' }> = {
  active: { label: '激活', variant: 'success' },
  renewed: { label: '已续费', variant: 'success' },
  pending: { label: '待处理', variant: 'warning' },
  cancelled: { label: '已取消', variant: 'danger' },
  expired: { label: '已过期', variant: 'danger' },
};

// Plan type configuration
const PLAN_TYPE_CONFIG: Record<PlanType, { label: string; variant: 'info' | 'warning' }> = {
  node: { label: '节点订阅', variant: 'info' },
  forward: { label: '端口转发', variant: 'warning' },
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
      showSuccess('已复制到剪贴板');
    }
  };

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 text-slate-400 dark:text-slate-500">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{label}</div>
        <div className="text-sm text-slate-900 dark:text-white break-all">{value}</div>
      </div>
      {copyable && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={handleCopy}
        >
          <Copy className="size-3.5" />
        </Button>
      )}
    </div>
  );
};

export const SubscriptionDetailDialog: React.FC<SubscriptionDetailDialogProps> = ({
  open,
  subscription,
  user,
  onClose,
}) => {
  const { showSuccess } = useNotificationStore();
  const [copying, setCopying] = useState(false);

  if (!subscription) return null;

  const statusConfig = STATUS_CONFIG[subscription.status] || { label: subscription.status, variant: 'default' as const };
  const planTypeConfig = subscription.plan?.planType
    ? PLAN_TYPE_CONFIG[subscription.plan.planType]
    : { label: '节点订阅', variant: 'info' as const };

  const handleCopyUrl = async () => {
    if (subscription.subscribeUrl) {
      setCopying(true);
      try {
        await navigator.clipboard.writeText(subscription.subscribeUrl);
        showSuccess('订阅链接已复制');
      } finally {
        setCopying(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            订阅详情
            <AdminBadge variant={statusConfig.variant}>{statusConfig.label}</AdminBadge>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            订阅 ID: <TruncatedId id={subscription.id} fullWidth />
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="space-y-4 py-2">
          {/* 订阅链接 */}
          {subscription.subscribeUrl && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">订阅链接</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                  disabled={copying}
                  className="h-7 text-xs"
                >
                  <Copy className="size-3 mr-1" />
                  {copying ? '复制中...' : '复制'}
                </Button>
              </div>
              <code className="text-xs text-slate-700 dark:text-slate-300 break-all block">
                {subscription.subscribeUrl}
              </code>
            </div>
          )}

          <Separator />

          {/* 用户信息 */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">用户信息</h4>
            <DetailItem
              icon={<User className="size-4" />}
              label="用户"
              value={user ? (
                <div>
                  <div>{user.name || '未设置名称'}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
              ) : `用户 ID: ${subscription.userId}`}
            />
          </div>

          <Separator />

          {/* 计划信息 */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">计划信息</h4>
            {subscription.plan ? (
              <>
                <DetailItem
                  icon={<CreditCard className="size-4" />}
                  label="计划名称"
                  value={
                    <div className="flex items-center gap-2">
                      <span>{subscription.plan.name}</span>
                      <AdminBadge variant={planTypeConfig.variant} className="text-[10px]">
                        {planTypeConfig.label}
                      </AdminBadge>
                    </div>
                  }
                />
                <DetailItem
                  icon={<Clock className="size-4" />}
                  label="定价选项"
                  value={
                    subscription.plan.pricings && subscription.plan.pricings.length > 0 ? (
                      <div className="space-y-1">
                        {subscription.plan.pricings.map((pricing) => (
                          <div key={pricing.billingCycle} className="text-sm">
                            {pricing.billingCycle}: {pricing.price} {pricing.currency}
                            {!pricing.isActive && <span className="text-xs text-slate-400 ml-1">(未启用)</span>}
                          </div>
                        ))}
                      </div>
                    ) : '-'
                  }
                />
              </>
            ) : (
              <div className="text-sm text-slate-500">未关联计划</div>
            )}
          </div>

          <Separator />

          {/* 日期信息 */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">日期信息</h4>
            <DetailItem
              icon={<Calendar className="size-4" />}
              label="开始日期"
              value={formatDate(subscription.startDate)}
            />
            <DetailItem
              icon={<Calendar className="size-4" />}
              label="结束日期"
              value={subscription.endDate ? formatDate(subscription.endDate) : '-'}
            />
            <DetailItem
              icon={<Clock className="size-4" />}
              label="当前周期"
              value={`${formatDate(subscription.currentPeriodStart)} ~ ${formatDate(subscription.currentPeriodEnd)}`}
            />
            <DetailItem
              icon={<Clock className="size-4" />}
              label="创建时间"
              value={formatDate(subscription.createdAt)}
            />
          </div>

          <Separator />

          {/* 状态信息 */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">状态信息</h4>
            <DetailItem
              icon={subscription.autoRenew ? <CheckCircle className="size-4 text-emerald-500" /> : <XCircle className="size-4 text-slate-400" />}
              label="自动续费"
              value={subscription.autoRenew ? '已开启' : '未开启'}
            />
            <DetailItem
              icon={subscription.isActive ? <CheckCircle className="size-4 text-emerald-500" /> : <XCircle className="size-4 text-red-500" />}
              label="是否激活"
              value={subscription.isActive ? '是' : '否'}
            />
            <DetailItem
              icon={subscription.isExpired ? <XCircle className="size-4 text-red-500" /> : <CheckCircle className="size-4 text-emerald-500" />}
              label="是否过期"
              value={subscription.isExpired ? '已过期' : '未过期'}
            />
            {subscription.cancelledAt && (
              <DetailItem
                icon={<XCircle className="size-4 text-red-500" />}
                label="取消时间"
                value={formatDate(subscription.cancelledAt)}
              />
            )}
            {subscription.cancelReason && (
              <DetailItem
                icon={<XCircle className="size-4 text-red-500" />}
                label="取消原因"
                value={subscription.cancelReason}
              />
            )}
          </div>

          <Separator />

          {/* UUID 信息 */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">标识信息</h4>
            <DetailItem
              icon={<LinkIcon className="size-4" />}
              label="UUID"
              value={<TruncatedId id={subscription.uuid} fullWidth />}
            />
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
