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
import type { SubscriptionPlan, PlanStatus, BillingCycle } from '@/api/subscription/types';

// 计费周期显示名称
const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: '周付',
  monthly: '月付',
  quarterly: '季付',
  semi_annual: '半年付',
  yearly: '年付',
  lifetime: '终身',
};

// 获取计划的价格范围（支持多定价）
const getPriceRange = (plan: SubscriptionPlan) => {
  // 优先使用 pricings 数组
  if (plan.pricings && plan.pricings.length > 0) {
    const activePricings = plan.pricings.filter(p => p.isActive);

    if (activePricings.length === 0) {
      // 没有激活的定价，使用废弃字段向后兼容
      const currencySymbol = plan.currency === 'CNY' ? '¥' : '$';
      return {
        display: `${currencySymbol}${(plan.price / 100).toFixed(2)}`,
        details: null,
        primaryCycle: plan.billingCycle as BillingCycle,
      };
    }

    if (activePricings.length === 1) {
      const p = activePricings[0];
      const currencySymbol = p.currency === 'CNY' ? '¥' : '$';
      return {
        display: `${currencySymbol}${(p.price / 100).toFixed(2)}`,
        details: null,
        primaryCycle: p.billingCycle,
      };
    }

    // 多个激活的定价
    const prices = activePricings.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const currency = activePricings[0].currency;
    const currencySymbol = currency === 'CNY' ? '¥' : '$';

    return {
      display: minPrice === maxPrice
        ? `${currencySymbol}${(minPrice / 100).toFixed(2)}`
        : `${currencySymbol}${(minPrice / 100).toFixed(2)} - ${currencySymbol}${(maxPrice / 100).toFixed(2)}`,
      details: activePricings.map(p => ({
        cycle: p.billingCycle,
        label: BILLING_CYCLE_LABELS[p.billingCycle] || p.billingCycle,
        price: `${p.currency === 'CNY' ? '¥' : '$'}${(p.price / 100).toFixed(2)}`,
      })),
      primaryCycle: activePricings[0].billingCycle,
    };
  }

  // 向后兼容：使用废弃字段
  const currencySymbol = plan.currency === 'CNY' ? '¥' : '$';
  return {
    display: `${currencySymbol}${(plan.price / 100).toFixed(2)}`,
    details: null,
    primaryCycle: plan.billingCycle as BillingCycle,
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

const STATUS_CONFIG: Record<PlanStatus, { label: string; variant: 'success' | 'default' }> = {
  active: { label: '激活', variant: 'success' },
  inactive: { label: '未激活', variant: 'default' },
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
      accessorKey: 'name',
      header: '计划名称',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-[15px] text-slate-900 dark:text-white leading-tight">
            {row.original.name}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 leading-tight font-mono">
            {row.original.slug}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'price',
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
                  <p key={idx} className="font-mono text-indigo-100">{detail.label}: {detail.price}</p>
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
      accessorKey: 'billingCycle',
      header: '计费周期',
      size: 80,
      cell: ({ row }) => {
        const priceRange = getPriceRange(row.original);
        // 如果有多定价，显示数量；否则显示主计费周期
        if (priceRange.details && priceRange.details.length > 1) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 cursor-help text-sm text-slate-600 dark:text-slate-400">
                  {priceRange.details.length} 种周期
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  {priceRange.details.map((detail, idx) => (
                    <p key={idx}>{detail.label}</p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        }
        return <BillingCycleBadge billingCycle={priceRange.primaryCycle} />;
      },
    },
    {
      accessorKey: 'status',
      header: '状态',
      size: 72,
      cell: ({ row }) => {
        const status = row.original.status as PlanStatus | undefined;
        const statusConfig = status ? STATUS_CONFIG[status] : { label: '未知', variant: 'default' as const };
        return (
          <AdminBadge variant={statusConfig.variant}>
            {statusConfig.label}
          </AdminBadge>
        );
      },
    },
    {
      accessorKey: 'isPublic',
      header: '公开',
      size: 64,
      cell: ({ row }) => (
        <AdminBadge variant={row.original.isPublic ? 'success' : 'outline'}>
          {row.original.isPublic ? '是' : '否'}
        </AdminBadge>
      ),
    },
    {
      accessorKey: 'trialDays',
      header: '试用天数',
      size: 80,
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
          {row.original.trialDays ? `${row.original.trialDays}天` : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'sortOrder',
      header: '排序',
      size: 56,
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
          {row.original.sortOrder || '-'}
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
                {plan.status === 'active' ? '停用' : '激活'}
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
      getRowId={(row) => String(row.id)}
    />
  );
};
