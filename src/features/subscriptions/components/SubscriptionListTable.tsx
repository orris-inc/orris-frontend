/**
 * 订阅列表表格组件（管理端）
 * 使用 TanStack Table 实现
 */

import { useMemo } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { DataTable, AdminBadge, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import { formatDate } from '@/shared/utils/date-utils';
import type { Subscription, SubscriptionStatus } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface SubscriptionListTableProps {
  subscriptions: Subscription[];
  usersMap?: Record<number, UserResponse>;
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

// 状态配置
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
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}) => {
  const columns = useMemo<ColumnDef<Subscription>[]>(() => [
    {
      accessorKey: 'id',
      header: '订阅ID',
      size: 72,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <span className="font-mono text-slate-600 dark:text-slate-400">
          {row.original.id}
        </span>
      ),
    },
    {
      id: 'user',
      header: '用户',
      size: 160,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const user = usersMap[row.original.userId];
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
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium text-slate-900 dark:text-white">
            {row.original.plan?.name || '未知计划'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {row.original.plan?.billingCycle || '-'}
          </div>
        </div>
      ),
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
  ], [usersMap]);

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
