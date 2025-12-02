/**
 * 订阅列表表格组件（管理端）
 * 使用 TanStack Table 实现
 */

import { useMemo } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { DataTable, AdminBadge, type ColumnDef } from '@/components/admin';
import { formatDate } from '@/shared/utils/date-utils';
import type { Subscription, SubscriptionStatus } from '../types/subscriptions.types';

interface SubscriptionListTableProps {
  subscriptions: Subscription[];
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
  inactive: { label: '未激活', variant: 'default' },
  pending: { label: '待处理', variant: 'warning' },
  cancelled: { label: '已取消', variant: 'danger' },
  expired: { label: '已过期', variant: 'danger' },
};

export const SubscriptionListTable: React.FC<SubscriptionListTableProps> = ({
  subscriptions,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}) => {
  const columns = useMemo<ColumnDef<Subscription>[]>(() => [
    {
      accessorKey: 'ID',
      header: '订阅ID',
      size: 72,
      cell: ({ row }) => (
        <span className="font-mono text-slate-600 dark:text-slate-400">
          {row.original.ID}
        </span>
      ),
    },
    {
      id: 'user',
      header: '用户',
      size: 160,
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium text-slate-900 dark:text-white">
            {row.original.User?.Name || '-'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {row.original.User?.Email || `User #${row.original.UserID}`}
          </div>
        </div>
      ),
    },
    {
      id: 'plan',
      header: '计划',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium text-slate-900 dark:text-white">
            {row.original.Plan?.Name || '-'}
          </div>
          {row.original.Plan && (
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {(row.original.Plan.Price / 100).toFixed(2)} {row.original.Plan.Currency}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'Status',
      header: '状态',
      size: 72,
      cell: ({ row }) => {
        const statusConfig = STATUS_CONFIG[row.original.Status] || { label: row.original.Status, variant: 'default' as const };
        return (
          <AdminBadge variant={statusConfig.variant}>
            {statusConfig.label}
          </AdminBadge>
        );
      },
    },
    {
      accessorKey: 'StartDate',
      header: '开始日期',
      size: 100,
      cell: ({ row }) => (
        <span className="text-slate-700 dark:text-slate-300 text-sm">
          {formatDate(row.original.StartDate)}
        </span>
      ),
    },
    {
      accessorKey: 'EndDate',
      header: '结束日期',
      size: 100,
      cell: ({ row }) => (
        <span className="text-slate-700 dark:text-slate-300 text-sm">
          {row.original.EndDate ? formatDate(row.original.EndDate) : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'AutoRenew',
      header: '自动续费',
      size: 80,
      cell: ({ row }) => (
        row.original.AutoRenew ? (
          <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
        ) : (
          <X className="size-4 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
        )
      ),
    },
    {
      accessorKey: 'CreatedAt',
      header: '创建时间',
      size: 100,
      cell: ({ row }) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm">
          {formatDate(row.original.CreatedAt)}
        </span>
      ),
    },
  ], []);

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
      getRowId={(row) => String(row.ID)}
    />
  );
};
