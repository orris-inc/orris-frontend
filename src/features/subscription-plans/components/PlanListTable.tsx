/**
 * Subscription Plan List Table Component (Admin)
 * Design: Catalyst-style clean table with minimal visual hierarchy
 * Switches to mobile card list on small screens
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Power, MoreHorizontal, Users, Copy, Trash2 } from 'lucide-react';
import { DataTable, AdminBadge, TableHoverCardProvider, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { PlanMobileList } from './PlanMobileList';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/common/ContextMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import { ACTIVE_STATUS_CONFIG } from '@/shared/constants/status-config';
import type { SubscriptionPlan, PlanStatus, BillingCycle, PlanType } from '@/api/subscription/types';

// Plan type configuration with semantic colors
const PLAN_TYPE_CONFIG: Record<PlanType, { labelKey: string; className: string }> = {
  node: { labelKey: 'common.planType.node', className: 'bg-info-muted text-info' },
  forward: { labelKey: 'common.planType.forward', className: 'bg-warning-muted text-warning' },
  hybrid: { labelKey: 'common.planType.hybrid', className: 'bg-primary/10 text-primary' },
};

// Billing cycle translation keys
const BILLING_CYCLE_KEYS: Record<BillingCycle, string> = {
  weekly: 'billingCycle.weekly',
  monthly: 'billingCycle.monthly',
  quarterly: 'billingCycle.quarterly',
  semi_annual: 'billingCycle.semiAnnual',
  yearly: 'billingCycle.yearly',
  lifetime: 'billingCycle.lifetime',
};

// Get plan price info (supports multiple pricing)
const getPriceInfo = (plan: SubscriptionPlan): {
  display: string;
  details: Array<{ cycle: BillingCycle; labelKey: string; price: string }> | null;
  primaryCycle: BillingCycle;
} => {
  if (!plan.pricings || plan.pricings.length === 0) {
    return { display: '—', details: null, primaryCycle: 'monthly' as BillingCycle };
  }

  const activePricings = plan.pricings.filter(p => p.isActive);
  if (activePricings.length === 0) {
    return { display: '—', details: null, primaryCycle: 'monthly' as BillingCycle };
  }

  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === 'CNY' ? '¥' : '$';
    return `${symbol}${(price / 100).toFixed(2)}`;
  };

  if (activePricings.length === 1) {
    const p = activePricings[0];
    return {
      display: formatPrice(p.price, p.currency),
      details: null,
      primaryCycle: p.billingCycle,
    };
  }

  // Multiple pricing options - show range
  const prices = activePricings.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const currency = activePricings[0].currency;

  return {
    display: minPrice === maxPrice
      ? formatPrice(minPrice, currency)
      : `${formatPrice(minPrice, currency)} – ${formatPrice(maxPrice, currency)}`,
    details: activePricings.map(p => ({
      cycle: p.billingCycle,
      labelKey: BILLING_CYCLE_KEYS[p.billingCycle] || p.billingCycle,
      price: formatPrice(p.price, p.currency),
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
  const { t } = useTranslation();
  // Detect mobile screen
  const { isMobile } = useBreakpoint();

  // Subscription plan context menu content
  const renderContextMenuActions = useCallback((plan: SubscriptionPlan) => (
    <>
      <ContextMenuItem onClick={() => onEdit(plan)}>
        <Edit className="mr-2 size-4" />
        {t('common.actions.edit')}
      </ContextMenuItem>
      {onDuplicate && (
        <ContextMenuItem onClick={() => onDuplicate(plan)}>
          <Copy className="mr-2 size-4" />
          {t('admin.plans.table.duplicatePlan')}
        </ContextMenuItem>
      )}
      {onViewSubscriptions && (
        <ContextMenuItem onClick={() => onViewSubscriptions(plan)}>
          <Users className="mr-2 size-4" />
          {t('admin.plans.table.viewSubscribers')}
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onToggleStatus(plan)}>
        <Power className="mr-2 size-4" />
        {plan.status === 'active' ? t('common.actions.disable') : t('common.actions.enable')}
      </ContextMenuItem>
      {onDelete && (
        <ContextMenuItem onClick={() => onDelete(plan)} className="text-destructive">
          <Trash2 className="mr-2 size-4" />
          {t('common.actions.delete')}
        </ContextMenuItem>
      )}
    </>
  ), [t, onEdit, onDuplicate, onToggleStatus, onViewSubscriptions, onDelete]);

  // Subscription plan dropdown menu content
  const renderDropdownMenuActions = useCallback((plan: SubscriptionPlan) => (
    <>
      <DropdownMenuItem onSelect={() => onEdit(plan)}>
        <Edit className="mr-2 size-4" />
        {t('common.actions.edit')}
      </DropdownMenuItem>
      {onDuplicate && (
        <DropdownMenuItem onSelect={() => onDuplicate(plan)}>
          <Copy className="mr-2 size-4" />
          {t('admin.plans.table.duplicatePlan')}
        </DropdownMenuItem>
      )}
      {onViewSubscriptions && (
        <DropdownMenuItem onSelect={() => onViewSubscriptions(plan)}>
          <Users className="mr-2 size-4" />
          {t('admin.plans.table.viewSubscribers')}
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => onToggleStatus(plan)}>
        <Power className="mr-2 size-4" />
        {plan.status === 'active' ? t('common.actions.disable') : t('common.actions.enable')}
      </DropdownMenuItem>
      {onDelete && (
        <DropdownMenuItem onSelect={() => onDelete(plan)} className="text-destructive">
          <Trash2 className="mr-2 size-4" />
          {t('common.actions.delete')}
        </DropdownMenuItem>
      )}
    </>
  ), [t, onEdit, onDuplicate, onToggleStatus, onViewSubscriptions, onDelete]);

  const columns = useMemo<ColumnDef<SubscriptionPlan>[]>(() => [
    {
      accessorKey: 'name',
      header: t('admin.plans.table.planName'),
      size: 200,
      meta: { priority: 1, sticky: 'left' } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const plan = row.original;
        const planType = plan.planType as PlanType | undefined;
        const typeConfig = planType ? PLAN_TYPE_CONFIG[planType] : PLAN_TYPE_CONFIG.node;
        return (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <SmartTruncate text={plan.name} className="font-medium text-foreground" />
              <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${typeConfig.className}`}>
                {t(typeConfig.labelKey)}
              </span>
            </div>
            <SmartTruncate text={plan.slug} className="text-[13px] text-muted-foreground mt-0.5" mono />
          </div>
        );
      },
    },
    {
      accessorKey: 'price',
      header: t('admin.plans.table.price'),
      size: 120,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const priceInfo = getPriceInfo(row.original);
        if (priceInfo.details) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-medium tabular-nums text-foreground cursor-help">
                  {priceInfo.display}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  {priceInfo.details.map((detail, idx) => (
                    <div key={idx} className="flex justify-between gap-4 text-xs">
                      <span className="text-muted-foreground">{t(detail.labelKey)}</span>
                      <span className="font-medium tabular-nums">{detail.price}</span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        }
        return (
          <span className="font-medium tabular-nums text-foreground">
            {priceInfo.display}
          </span>
        );
      },
    },
    {
      accessorKey: 'billingCycle',
      header: t('admin.plans.table.billingCycle'),
      size: 100,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const priceInfo = getPriceInfo(row.original);
        if (priceInfo.details && priceInfo.details.length > 1) {
          return (
            <span className="text-muted-foreground">
              {t('admin.plans.table.multipleCycles', { count: priceInfo.details.length })}
            </span>
          );
        }
        return (
          <span className="text-muted-foreground">
            {t(BILLING_CYCLE_KEYS[priceInfo.primaryCycle])}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: t('common.status.label'),
      size: 120,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const plan = row.original;
        const status = plan.status as PlanStatus | undefined;
        const statusConfig = status ? ACTIVE_STATUS_CONFIG[status] : { labelKey: 'common.status.unknown', variant: 'default' as const };
        return (
          <div className="flex items-center gap-2">
            <AdminBadge variant={statusConfig.variant}>
              {t(statusConfig.labelKey)}
            </AdminBadge>
            {!plan.isPublic && (
              <span className="text-xs text-muted-foreground">
                {t('admin.plans.table.privatePlan')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'extras',
      header: t('admin.plans.table.extras'),
      size: 100,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const { sortOrder } = row.original;

        if (!sortOrder || sortOrder === 0) {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <span className="text-muted-foreground tabular-nums">
            #{sortOrder}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      size: 48,
      enableSorting: false,
      meta: { priority: 1, sticky: 'right' } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors">
              <MoreHorizontal className="size-4" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent align="end" collisionPadding={16}>
              {renderDropdownMenuActions(row.original)}
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      ),
    },
  ], [t, renderDropdownMenuActions]);

  // Render mobile card list on small screens
  if (isMobile) {
    return (
      <PlanMobileList
        plans={plans}
        loading={loading}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onToggleStatus={onToggleStatus}
        onViewSubscriptions={onViewSubscriptions}
        onDelete={onDelete}
      />
    );
  }

  return (
    <TableHoverCardProvider>
      <DataTable
        elevated
        columns={columns}
        data={plans}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        emptyMessage={t('admin.plans.table.noPlans')}
        getRowId={(row) => String(row.id)}
        enableContextMenu={true}
        contextMenuContent={renderContextMenuActions}
      />
    </TableHoverCardProvider>
  );
};
