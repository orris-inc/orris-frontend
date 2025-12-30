/**
 * Subscription List Table Component (Admin)
 * Implemented using TanStack Table
 * Switches to mobile card list on small screens
 */

import { useMemo } from 'react';
import { CheckCircle, X, MoreHorizontal, Play, XCircle, RefreshCw, Eye, Copy, Trash2 } from 'lucide-react';
import { DataTable, AdminBadge, TruncatedId, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { SubscriptionMobileList } from './SubscriptionMobileList';
import { Skeleton } from '@/components/common/Skeleton';
import { Button } from '@/components/common/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { formatDate } from '@/shared/utils/date-utils';
import type { Subscription, SubscriptionStatus } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface SubscriptionListTableProps {
  subscriptions: Subscription[];
  usersMap?: Record<string, UserResponse>;
  usersLoading?: boolean;
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
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

export const SubscriptionListTable: React.FC<SubscriptionListTableProps> = ({
  subscriptions,
  usersMap = {},
  usersLoading = false,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  onDuplicate,
  onActivate,
  onCancel,
  onRenew,
  onDelete,
}) => {
  // Detect mobile screen
  const { isMobile } = useBreakpoint();

  const columns = useMemo<ColumnDef<Subscription>[]>(() => [
    {
      accessorKey: 'id',
      header: '订阅ID',
      size: 120,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => <TruncatedId id={row.original.id} />,
    },
    {
      id: 'user',
      header: '用户',
      size: 160,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        // userId is number, but usersMap key is string (user.id)
        // Convert userId to string for lookup
        const user = usersMap[String(row.original.userId)];
        const isUserLoading = usersLoading || (!user && Object.keys(usersMap).length === 0);

        if (isUserLoading) {
          return (
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          );
        }

        return (
          <div className="space-y-1">
            <div className="font-medium text-slate-900 dark:text-white">
              {user?.name || user?.email || `User #${row.original.userId}`}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {user?.email || `ID: ${row.original.userId}`}
            </div>
          </div>
        );
      },
    },
    {
      id: 'plan',
      header: '计划',
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const plan = row.original.plan;
        const activePricings = plan?.pricings?.filter(p => p.isActive) || [];
        const cycleText = activePricings.length > 0
          ? activePricings.map(p => p.billingCycle).join(', ')
          : plan?.pricings && plan.pricings.length > 0
            ? plan.pricings.map(p => p.billingCycle).join(', ')
            : '-';

        return (
          <div className="space-y-1">
            <div className="font-medium text-slate-900 dark:text-white">
              {plan?.name || '未知计划'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {cycleText}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: '状态',
      size: 72,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const statusConfig = STATUS_CONFIG[row.original.status] || { label: row.original.status, variant: 'default' as const };
        return (
          <AdminBadge variant={statusConfig.variant}>
            {statusConfig.label}
          </AdminBadge>
        );
      },
    },
    {
      accessorKey: 'startDate',
      header: '开始日期',
      size: 100,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <span className="text-slate-700 dark:text-slate-300 text-sm">
          {formatDate(row.original.startDate)}
        </span>
      ),
    },
    {
      accessorKey: 'endDate',
      header: '结束日期',
      size: 100,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <span className="text-slate-700 dark:text-slate-300 text-sm">
          {row.original.endDate ? formatDate(row.original.endDate) : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'autoRenew',
      header: '自动续费',
      size: 80,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        row.original.autoRenew ? (
          <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
        ) : (
          <X className="size-4 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
        )
      ),
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      size: 100,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      size: 120,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const subscription = row.original;
        const status = subscription.status;

        // Activate: can activate if not in active or renewed status
        const canActivate = status !== 'active' && status !== 'renewed';
        // Cancel: can cancel if in active or renewed status
        const canCancel = status === 'active' || status === 'renewed';
        // Renew: can renew if in expired status
        const canRenew = status === 'expired';
        // Delete: can delete if cancelled or expired
        const canDelete = status === 'cancelled' || status === 'expired';

        return (
          <div className="flex items-center gap-1">
            {canActivate && onActivate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950"
                onClick={() => onActivate(subscription)}
              >
                <Play className="size-4" />
                <span className="ml-1">激活</span>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">打开菜单</span>
                </Button>
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
                {(onViewDetail || onDuplicate) && (canRenew || canCancel) && <DropdownMenuSeparator />}
                {canRenew && onRenew && (
                  <DropdownMenuItem onClick={() => onRenew(subscription)}>
                    <RefreshCw className="mr-2 size-4" />
                    续费订阅
                  </DropdownMenuItem>
                )}
                {canRenew && canCancel && onCancel && <DropdownMenuSeparator />}
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
          </div>
        );
      },
    },
  ], [usersMap, usersLoading, onViewDetail, onDuplicate, onActivate, onCancel, onRenew, onDelete]);

  // Render mobile card list on small screens
  if (isMobile) {
    return (
      <SubscriptionMobileList
        subscriptions={subscriptions}
        usersMap={usersMap}
        usersLoading={usersLoading}
        loading={loading}
        onViewDetail={onViewDetail}
        onDuplicate={onDuplicate}
        onActivate={onActivate}
        onCancel={onCancel}
        onRenew={onRenew}
        onDelete={onDelete}
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={subscriptions}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyMessage="暂无订阅数据"
      getRowId={(row) => String(row.id)}
    />
  );
};
