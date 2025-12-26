/**
 * Subscription Plan List Table Component (Admin)
 * Implemented using TanStack Table
 */

import { useMemo, useCallback } from 'react';
import { Edit, Power, MoreHorizontal, Users, Copy, Trash2 } from 'lucide-react';
import { DataTable, AdminBadge, TruncatedId, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/common/ContextMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { BillingCycleBadge } from './BillingCycleBadge';
import type { SubscriptionPlan, PlanStatus, BillingCycle, PlanType } from '@/api/subscription/types';

// Plan type display names
const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  node: '节点订阅',
  forward: '端口转发',
  hybrid: '混合订阅',
};

// Billing cycle display names
const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: '周付',
  monthly: '月付',
  quarterly: '季付',
  semi_annual: '半年付',
  yearly: '年付',
  lifetime: '终身',
};

// Get plan price range (supports multiple pricing)
const getPriceRange = (plan: SubscriptionPlan): {
  display: string;
  details: Array<{ cycle: BillingCycle; label: string; price: string }> | null;
  primaryCycle: BillingCycle;
} => {
  // Prevent pricings from being null or undefined (compatible with legacy data)
  if (!plan.pricings || plan.pricings.length === 0) {
    return {
      display: '-',
      details: null,
      primaryCycle: 'monthly' as BillingCycle,
    };
  }

  const activePricings = plan.pricings.filter(p => p.isActive);

  if (activePricings.length === 0) {
    return {
      display: '-',
      details: null,
      primaryCycle: 'monthly' as BillingCycle,
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

  // Multiple active pricing options
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
  onDuplicate?: (plan: SubscriptionPlan) => void;
  onToggleStatus: (plan: SubscriptionPlan) => void;
  onViewSubscriptions?: (plan: SubscriptionPlan) => void;
  onDelete?: (plan: SubscriptionPlan) => void;
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
  onDuplicate,
  onToggleStatus,
  onViewSubscriptions,
  onDelete,
}) => {
  // Subscription plan context menu content
  const renderContextMenuActions = useCallback((plan: SubscriptionPlan) => (
    <>
      <ContextMenuItem onClick={() => onEdit(plan)}>
        <Edit className="mr-2 size-4" />
        编辑
      </ContextMenuItem>
      {onDuplicate && (
        <ContextMenuItem onClick={() => onDuplicate(plan)}>
          <Copy className="mr-2 size-4" />
          复制计划
        </ContextMenuItem>
      )}
      {onViewSubscriptions && (
        <ContextMenuItem onClick={() => onViewSubscriptions(plan)}>
          <Users className="mr-2 size-4" />
          查看订阅用户
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onToggleStatus(plan)}>
        <Power className="mr-2 size-4" />
        {plan.status === 'active' ? '停用' : '激活'}
      </ContextMenuItem>
      {onDelete && (
        <ContextMenuItem onClick={() => onDelete(plan)} className="text-red-600 dark:text-red-400">
          <Trash2 className="mr-2 size-4" />
          删除
        </ContextMenuItem>
      )}
    </>
  ), [onEdit, onDuplicate, onToggleStatus, onViewSubscriptions, onDelete]);

  // Subscription plan dropdown menu content
  const renderDropdownMenuActions = useCallback((plan: SubscriptionPlan) => (
    <>
      <DropdownMenuItem onClick={() => onEdit(plan)}>
        <Edit className="mr-2 size-4" />
        编辑
      </DropdownMenuItem>
      {onDuplicate && (
        <DropdownMenuItem onClick={() => onDuplicate(plan)}>
          <Copy className="mr-2 size-4" />
          复制计划
        </DropdownMenuItem>
      )}
      {onViewSubscriptions && (
        <DropdownMenuItem onClick={() => onViewSubscriptions(plan)}>
          <Users className="mr-2 size-4" />
          查看订阅用户
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onToggleStatus(plan)}>
        <Power className="mr-2 size-4" />
        {plan.status === 'active' ? '停用' : '激活'}
      </DropdownMenuItem>
      {onDelete && (
        <DropdownMenuItem onClick={() => onDelete(plan)} className="text-red-600 dark:text-red-400">
          <Trash2 className="mr-2 size-4" />
          删除
        </DropdownMenuItem>
      )}
    </>
  ), [onEdit, onDuplicate, onToggleStatus, onViewSubscriptions, onDelete]);

  const columns = useMemo<ColumnDef<SubscriptionPlan>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 120,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => <TruncatedId id={row.original.id} />,
    },
    {
      accessorKey: 'name',
      header: '计划名称',
      meta: { priority: 1 } as ResponsiveColumnMeta,
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
      accessorKey: 'planType',
      header: '类型',
      size: 80,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const planType = row.original.planType as PlanType | undefined;
        return (
          <AdminBadge variant={planType === 'forward' ? 'warning' : 'info'}>
            {planType ? PLAN_TYPE_LABELS[planType] : '节点订阅'}
          </AdminBadge>
        );
      },
    },
    {
      accessorKey: 'price',
      header: '价格',
      size: 100,
      meta: { priority: 2 } as ResponsiveColumnMeta,
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
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const priceRange = getPriceRange(row.original);
        // If there are multiple pricing options, show the count; otherwise show the primary billing cycle
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
      meta: { priority: 1 } as ResponsiveColumnMeta,
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
      meta: { priority: 3 } as ResponsiveColumnMeta,
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
      meta: { priority: 3 } as ResponsiveColumnMeta,
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
      meta: { priority: 3 } as ResponsiveColumnMeta,
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
      meta: { priority: 1 } as ResponsiveColumnMeta,
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
              {renderDropdownMenuActions(plan)}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [renderDropdownMenuActions]);

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
      enableContextMenu={true}
      contextMenuContent={renderContextMenuActions}
    />
  );
};
