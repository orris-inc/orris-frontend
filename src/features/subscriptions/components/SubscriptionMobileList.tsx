/**
 * Subscription Mobile List Component
 * Mobile-friendly card list with Accordion for expanded details
 */

import {
  MoreHorizontal,
  Play,
  XCircle,
  RefreshCw,
  Eye,
  Copy,
  Trash2,
  CheckCircle,
  X,
  User,
  Calendar,
} from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/common/Accordion';
import { AdminBadge } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Skeleton } from '@/components/common/Skeleton';
import { formatDate } from '@/shared/utils/date-utils';
import type { Subscription, SubscriptionStatus } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface SubscriptionMobileListProps {
  subscriptions: Subscription[];
  usersMap?: Record<string, UserResponse>;
  usersLoading?: boolean;
  loading?: boolean;
  onViewDetail?: (subscription: Subscription) => void;
  onDuplicate?: (subscription: Subscription) => void;
  onActivate?: (subscription: Subscription) => void;
  onCancel?: (subscription: Subscription) => void;
  onRenew?: (subscription: Subscription) => void;
  onDelete?: (subscription: Subscription) => void;
}

// Status configuration
const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; variant: 'success' | 'default' | 'warning' | 'danger' }> = {
  active: { label: '激活', variant: 'success' },
  renewed: { label: '已续费', variant: 'success' },
  pending: { label: '待处理', variant: 'warning' },
  cancelled: { label: '已取消', variant: 'danger' },
  expired: { label: '已过期', variant: 'danger' },
};

// Loading skeleton for mobile cards
const MobileCardSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
);

export const SubscriptionMobileList: React.FC<SubscriptionMobileListProps> = ({
  subscriptions,
  usersMap = {},
  usersLoading = false,
  loading = false,
  onViewDetail,
  onDuplicate,
  onActivate,
  onCancel,
  onRenew,
  onDelete,
}) => {
  // Render dropdown menu
  const renderDropdownMenu = (subscription: Subscription) => {
    const status = subscription.status;
    const canActivate = status !== 'active' && status !== 'renewed';
    const canCancel = status === 'active' || status === 'renewed';
    const canRenew = status === 'expired';
    const canDelete = status === 'cancelled' || status === 'expired';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4 text-slate-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onViewDetail && (
            <DropdownMenuItem onClick={() => onViewDetail(subscription)}>
              <Eye className="mr-2 size-4" />
              查看详情
            </DropdownMenuItem>
          )}
          {onDuplicate && (
            <DropdownMenuItem onClick={() => onDuplicate(subscription)}>
              <Copy className="mr-2 size-4" />
              复制订阅
            </DropdownMenuItem>
          )}
          {(onViewDetail || onDuplicate) && (canActivate || canRenew || canCancel) && <DropdownMenuSeparator />}
          {canActivate && onActivate && (
            <DropdownMenuItem onClick={() => onActivate(subscription)}>
              <Play className="mr-2 size-4" />
              激活
            </DropdownMenuItem>
          )}
          {canRenew && onRenew && (
            <DropdownMenuItem onClick={() => onRenew(subscription)}>
              <RefreshCw className="mr-2 size-4" />
              续费订阅
            </DropdownMenuItem>
          )}
          {canCancel && onCancel && (
            <DropdownMenuItem
              onClick={() => onCancel(subscription)}
              className="text-destructive focus:text-destructive"
            >
              <XCircle className="mr-2 size-4" />
              取消订阅
            </DropdownMenuItem>
          )}
          {canDelete && onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(subscription)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                删除订阅
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (loading) {
    return <MobileCardSkeleton />;
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        暂无订阅数据
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-1.5">
      {subscriptions.map((subscription) => {
        const statusConfig = STATUS_CONFIG[subscription.status] || { label: subscription.status, variant: 'default' as const };
        const user = usersMap[String(subscription.userId)];
        const isUserLoading = usersLoading || (!user && Object.keys(usersMap).length === 0);
        const plan = subscription.plan;
        const status = subscription.status;
        const canActivate = status !== 'active' && status !== 'renewed';

        return (
          <AccordionItem
            key={subscription.id}
            value={subscription.id}
            className="border rounded-lg bg-white dark:bg-slate-800 overflow-hidden"
          >
            {/* Card Header - Always visible */}
            <div className="px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* User and status */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {isUserLoading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                        {user?.name || user?.email || `User #${subscription.userId}`}
                      </span>
                    )}
                    <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      {statusConfig.label}
                    </AdminBadge>
                  </div>

                  {/* Plan name */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate">{plan?.name || '未知计划'}</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="flex items-center gap-0.5">
                      <Calendar className="size-3" />
                      {formatDate(subscription.startDate)}
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {canActivate && onActivate && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onActivate(subscription)}
                          className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                        >
                          <Play className="size-3.5 text-green-500 hover:text-green-600" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>激活</TooltipContent>
                    </Tooltip>
                  )}
                  {onViewDetail && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onViewDetail(subscription)}
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Eye className="size-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>详情</TooltipContent>
                    </Tooltip>
                  )}
                  {renderDropdownMenu(subscription)}
                </div>
              </div>
            </div>

            {/* Accordion Trigger */}
            <AccordionTrigger className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-700 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-xs text-slate-400 dark:text-slate-500">详情</span>
            </AccordionTrigger>

            {/* Accordion Content - Expanded details */}
            <AccordionContent>
              <div className="px-3 pb-2 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-2">
                {/* Subscription ID */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">ID</span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">{subscription.id}</span>
                </div>

                {/* User info */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">用户</span>
                  {isUserLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 min-w-0">
                      <User className="size-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{user?.email || `ID: ${subscription.userId}`}</span>
                    </div>
                  )}
                </div>

                {/* Plan */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">计划</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{plan?.name || '未知计划'}</span>
                </div>

                {/* Date range */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">日期</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {formatDate(subscription.startDate)} ~ {subscription.endDate ? formatDate(subscription.endDate) : '无限期'}
                  </span>
                </div>

                {/* Auto renew */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">续费</span>
                  {subscription.autoRenew ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="size-3" />
                      自动续费
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                      <X className="size-3" />
                      手动续费
                    </span>
                  )}
                </div>

                {/* Created at */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">创建</span>
                  <span className="text-xs text-slate-500">{formatDate(subscription.createdAt)}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
