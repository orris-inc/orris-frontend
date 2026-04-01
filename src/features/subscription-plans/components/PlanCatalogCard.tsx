/**
 * PlanCatalogCard - Product catalog card for subscription plans
 *
 * Signature: Left color band per plan type (node=blue, forward=amber, hybrid=violet).
 * Layout: type badge + name → price hero → limits row → status footer.
 */

import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import {
  Edit,
  Copy,
  Power,
  Trash2,
  Users,
  MoreHorizontal,
  Globe,
  Lock,
  Zap,
  ArrowLeftRight,
  Layers,
  HardDrive,
  Gauge,
  MonitorSmartphone,
  Link2,
} from 'lucide-react';
import { AdminBadge } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { cn } from '@/lib/utils';
import { cardStyles } from '@/lib/ui-styles';
import { ACTIVE_STATUS_CONFIG, PLAN_TYPE_CONFIG } from '@/shared/constants/status-config';
import type { SubscriptionPlan, PlanType, BillingCycle } from '@/api/subscription/types';

// ============================================================================
// Constants
// ============================================================================

// Type-specific color band (border-left)
const TYPE_BAND_COLOR: Record<PlanType, string> = {
  node: 'border-l-info',
  forward: 'border-l-warning',
  hybrid: 'border-l-primary',
};

// Type-specific icon
const TYPE_ICON: Record<PlanType, React.ElementType> = {
  node: Zap,
  forward: ArrowLeftRight,
  hybrid: Layers,
};

// Billing cycle short label keys
const BILLING_CYCLE_SHORT: Record<BillingCycle, string> = {
  weekly: 'subscription.perWeek',
  monthly: 'subscription.perMonth',
  quarterly: 'subscription.perQuarter',
  semi_annual: 'subscription.perHalfYear',
  yearly: 'subscription.perYear',
  lifetime: 'subscription.lifetime',
};

// ============================================================================
// Helpers
// ============================================================================

interface PriceDisplay {
  primary: string;
  cycleLabel: string;
  extraCount: number;
}

function getPriceDisplay(plan: SubscriptionPlan): PriceDisplay {
  if (!plan.pricings || plan.pricings.length === 0) {
    return { primary: '-', cycleLabel: '', extraCount: 0 };
  }

  const active = plan.pricings.filter((p) => p.isActive);
  if (active.length === 0) {
    return { primary: '-', cycleLabel: '', extraCount: 0 };
  }

  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === 'CNY' ? '¥' : '$';
    return `${symbol}${(price / 100).toFixed(2)}`;
  };

  // Show the cheapest active pricing as primary
  const sorted = [...active].sort((a, b) => a.price - b.price);
  const cheapest = sorted[0];

  return {
    primary: formatPrice(cheapest.price, cheapest.currency),
    cycleLabel: BILLING_CYCLE_SHORT[cheapest.billingCycle] || '',
    extraCount: active.length - 1,
  };
}

interface LimitItem {
  icon: React.ElementType;
  value: string;
  label: string;
}

function getLimits(plan: SubscriptionPlan, t: (key: string) => string): LimitItem[] {
  const limits = plan.limits as Record<string, number | undefined> | undefined;
  if (!limits) return [];

  const items: LimitItem[] = [];

  if (limits.trafficLimit && limits.trafficLimit > 0) {
    const gb = (limits.trafficLimit / (1024 * 1024 * 1024)).toFixed(0);
    items.push({ icon: HardDrive, value: `${gb}GB`, label: t('admin.plans.catalog.traffic') });
  }

  if (limits.deviceLimit && limits.deviceLimit > 0) {
    items.push({ icon: MonitorSmartphone, value: String(limits.deviceLimit), label: t('admin.plans.catalog.devices') });
  }

  if (limits.speedLimit && limits.speedLimit > 0) {
    items.push({ icon: Gauge, value: `${limits.speedLimit}M`, label: t('admin.plans.catalog.speed') });
  }

  if (limits.connectionLimit && limits.connectionLimit > 0) {
    items.push({ icon: Link2, value: String(limits.connectionLimit), label: t('admin.plans.catalog.connections') });
  }

  return items;
}

// ============================================================================
// Types
// ============================================================================

export interface PlanCatalogCardProps {
  plan: SubscriptionPlan;
  onEdit: (plan: SubscriptionPlan) => void;
  onDuplicate?: (plan: SubscriptionPlan) => void;
  onToggleStatus: (plan: SubscriptionPlan) => void;
  onViewSubscriptions?: (plan: SubscriptionPlan) => void;
  onDelete?: (plan: SubscriptionPlan) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const PlanCatalogCard = memo(({
  plan,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onViewSubscriptions,
  onDelete,
}: PlanCatalogCardProps) => {
  const { t } = useTranslation();

  const planType = (plan.planType as PlanType) || 'node';
  const statusConfig = ACTIVE_STATUS_CONFIG[plan.status] || { labelKey: 'common.status.unknown', variant: 'default' as const };
  const typeConfig = PLAN_TYPE_CONFIG[planType] || { labelKey: 'common.planType.node', variant: 'info' as const };
  const TypeIcon = TYPE_ICON[planType] || Zap;
  const priceDisplay = getPriceDisplay(plan);
  const limits = getLimits(plan, t);

  const handleEdit = useCallback(() => onEdit(plan), [onEdit, plan]);

  return (
    <div
      className={cn(
        cardStyles,
        'overflow-hidden border-l-[3px] p-4',
        'transition-all duration-150',
        'hover:ring-primary/30 hover:shadow-sm',
        'group',
        TYPE_BAND_COLOR[planType] || 'border-l-border',
      )}
    >
      {/* Row 1: Type badge + action menu */}
      <div className="flex items-center justify-between mb-3">
        <AdminBadge variant={typeConfig.variant} className="text-[10px] gap-1">
          <TypeIcon className="size-3" />
          {t(typeConfig.labelKey)}
        </AdminBadge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'size-7 rounded-lg flex items-center justify-center',
                'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                'transition-all'
              )}
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent align="end" collisionPadding={16}>
              <DropdownMenuItem onSelect={handleEdit}>
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
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      </div>

      {/* Row 2: Name + slug */}
      <button
        type="button"
        onClick={handleEdit}
        className="block w-full text-left mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg -m-1 p-1"
      >
        <SmartTruncate text={plan.name} className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors" />
        <SmartTruncate text={plan.slug} mono font='12px "SF Mono", ui-monospace, monospace' lineHeight={16} className="text-xs text-muted-foreground mt-0.5" />
      </button>

      {/* Row 3: Price hero */}
      <div className="mb-3">
        <span className="text-xl font-bold tabular-nums text-foreground">
          {priceDisplay.primary}
        </span>
        {priceDisplay.cycleLabel && (
          <span className="text-xs text-muted-foreground ml-1">
            {t(priceDisplay.cycleLabel)}
          </span>
        )}
        {priceDisplay.extraCount > 0 && (
          <span className="text-xs text-muted-foreground ml-2">
            +{priceDisplay.extraCount} {t('admin.plans.cycleOptions')}
          </span>
        )}
      </div>

      {/* Row 4: Limits (if any) */}
      {limits.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {limits.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground"
              >
                <Icon className="size-3 shrink-0" />
                <span className="font-medium tabular-nums text-foreground">{item.value}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Row 5: Status footer */}
      <div className="flex items-center gap-2 pt-3 border-t border-border/50">
        <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0">
          {t(statusConfig.labelKey)}
        </AdminBadge>

        <span className={cn(
          'flex items-center gap-1 text-[10px]',
          plan.isPublic ? 'text-muted-foreground' : 'text-warning'
        )}>
          {plan.isPublic ? (
            <>
              <Globe className="size-3" />
              {t('admin.plans.public')}
            </>
          ) : (
            <>
              <Lock className="size-3" />
              {t('admin.plans.private')}
            </>
          )}
        </span>

        {plan.sortOrder > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums ml-auto">
            #{plan.sortOrder}
          </span>
        )}
      </div>
    </div>
  );
});

PlanCatalogCard.displayName = 'PlanCatalogCard';
