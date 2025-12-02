/**
 * 订阅计划列表表格组件（管理端）
 * 使用 TanStack Table 实现
 */

import { useMemo } from 'react';
import { Edit, Power, Network, MoreHorizontal } from 'lucide-react';
import { DataTable, AdminBadge, type ColumnDef } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { BillingCycleBadge } from './BillingCycleBadge';
import type { SubscriptionPlan, PlanStatus } from '../types/subscription-plans.types';

// 获取计划的价格范围（支持多定价）
const getPriceRange = (plan: SubscriptionPlan) => {
  const currencySymbol = plan.Currency === 'CNY' ? '¥' : '$';

  // 如果有多定价，计算价格范围
  if (plan.pricings && plan.pricings.length > 1) {
    const activePricings = plan.pricings.filter(p => p.is_active);
    if (activePricings.length > 1) {
      const prices = activePricings.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      if (minPrice !== maxPrice) {
        return {
          display: `${currencySymbol}${(minPrice / 100).toFixed(2)} - ${currencySymbol}${(maxPrice / 100).toFixed(2)}`,
          details: activePricings.map(p => ({
            cycle: p.billing_cycle,
            price: `${p.currency === 'CNY' ? '¥' : '$'}${(p.price / 100).toFixed(2)}`,
          })),
        };
      }
    }
  }

  // 单一价格
  return {
    display: `${currencySymbol}${(plan.Price / 100).toFixed(2)}`,
    details: null,
  };
};

interface PlanListTableProps {
  plans: SubscriptionPlan[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (plan: SubscriptionPlan) => void;
  onToggleStatus: (plan: SubscriptionPlan) => void;
  onManageNodeGroups?: (plan: SubscriptionPlan) => void;
}

const STATUS_CONFIG: Record<PlanStatus, { label: string; variant: 'success' | 'default' | 'danger' }> = {
  active: { label: '激活', variant: 'success' },
  inactive: { label: '未激活', variant: 'default' },
  archived: { label: '已归档', variant: 'danger' },
};

export const PlanListTable: React.FC<PlanListTableProps> = ({
  plans,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onToggleStatus,
  onManageNodeGroups,
}) => {
  const columns = useMemo<ColumnDef<SubscriptionPlan>[]>(() => [
    {
      accessorKey: 'Name',
      header: '计划名称',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-[15px] text-slate-900 dark:text-white leading-tight">
            {row.original.Name}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 leading-tight font-mono">
            {row.original.Slug}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'Price',
      header: '价格',
      size: 100,
      cell: ({ row }) => {
        const priceRange = getPriceRange(row.original);
        return priceRange.details ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 cursor-help group">
                <span className="font-mono text-[15px] tabular-nums text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {priceRange.display}
                </span>
                <svg className="size-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <p className="font-semibold text-white mb-1.5">所有定价选项：</p>
                {priceRange.details.map((detail, idx) => (
                  <p key={idx} className="font-mono text-indigo-100">{detail.cycle}: {detail.price}</p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="font-mono text-[15px] tabular-nums text-slate-900 dark:text-white">
            {priceRange.display}
          </span>
        );
      },
    },
    {
      accessorKey: 'BillingCycle',
      header: '计费周期',
      size: 80,
      cell: ({ row }) => <BillingCycleBadge billingCycle={row.original.BillingCycle} />,
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
      accessorKey: 'IsPublic',
      header: '公开',
      size: 64,
      cell: ({ row }) => (
        <AdminBadge variant={row.original.IsPublic ? 'success' : 'outline'}>
          {row.original.IsPublic ? '是' : '否'}
        </AdminBadge>
      ),
    },
    {
      accessorKey: 'TrialDays',
      header: '试用天数',
      size: 80,
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
          {row.original.TrialDays ? `${row.original.TrialDays}天` : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'SortOrder',
      header: '排序',
      size: 56,
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
          {row.original.SortOrder || '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      size: 56,
      enableSorting: false,
      cell: ({ row }) => {
        const plan = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 group">
                <MoreHorizontal className="size-4 group-hover:scale-110 transition-transform" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(plan)}>
                <Edit className="mr-2 size-4" />
                编辑
              </DropdownMenuItem>
              {onManageNodeGroups && (
                <DropdownMenuItem onClick={() => onManageNodeGroups(plan)}>
                  <Network className="mr-2 size-4" />
                  管理节点组
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleStatus(plan)}>
                <Power className="mr-2 size-4" />
                {plan.Status === 'active' ? '停用' : '激活'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [onEdit, onToggleStatus, onManageNodeGroups]);

  return (
    <DataTable
      columns={columns}
      data={plans}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyMessage="暂无订阅计划"
      getRowId={(row) => String(row.ID)}
    />
  );
};
