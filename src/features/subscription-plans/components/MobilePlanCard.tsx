/**
 * MobilePlanCard - iOS-style plan card with swipe actions
 *
 * Redesigned for better mobile UX:
 * - Compact layout showing key info at a glance
 * - Swipe left to reveal actions (Edit, Duplicate, Toggle, Delete)
 * - Tap to open details sheet
 * - Clear visual hierarchy
 */

import { useTranslation } from 'react-i18next';
import {
  Edit,
  Copy,
  Power,
  Trash2,
  Globe,
  Lock,
  Zap,
  ArrowLeftRight,
  Layers,
} from 'lucide-react';
import { MobileSwipeCard, type SwipeAction } from '@/components/mobile';
import { AdminBadge } from '@/components/admin';
import { cn } from '@/lib/utils';
import { ACTIVE_STATUS_CONFIG, PLAN_TYPE_CONFIG } from '@/shared/constants/status-config';
import type { SubscriptionPlan, PlanStatus, PlanType } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================

export interface MobilePlanCardProps {
  plan: SubscriptionPlan;
  onCardPress: (plan: SubscriptionPlan) => void;
  onEdit: (plan: SubscriptionPlan) => void;
  onDuplicate: (plan: SubscriptionPlan) => void;
  onToggleStatus: (plan: SubscriptionPlan) => void;
  onDelete: (plan: SubscriptionPlan) => void;
}

// ============================================================================
// Constants
// ============================================================================

const PLAN_TYPE_ICONS: Record<PlanType, React.ReactNode> = {
  node: <Zap className="size-3.5" />,
  forward: <ArrowLeftRight className="size-3.5" />,
  hybrid: <Layers className="size-3.5" />,
};

// ============================================================================
// Helpers
// ============================================================================

const getPriceDisplay = (plan: SubscriptionPlan): string => {
  if (!plan.pricings || plan.pricings.length === 0) return '-';

  const activePricings = plan.pricings.filter(p => p.isActive);
  if (activePricings.length === 0) return '-';

  const prices = activePricings.map(p => p.price);
  const minPrice = Math.min(...prices);
  const currency = activePricings[0].currency;
  const currencySymbol = currency === 'CNY' ? '¥' : '$';

  return `${currencySymbol}${(minPrice / 100).toFixed(0)}+`;
};

const getPricingCount = (plan: SubscriptionPlan): number => {
  if (!plan.pricings) return 0;
  return plan.pricings.filter(p => p.isActive).length;
};

// ============================================================================
// Main Component
// ============================================================================

export const MobilePlanCard = ({
  plan,
  onCardPress,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
}: MobilePlanCardProps) => {
  const { t } = useTranslation();
  const status = plan.status as PlanStatus | undefined;
  const statusConfig = status ? ACTIVE_STATUS_CONFIG[status] : { labelKey: 'common.status.unknown', variant: 'default' as const };
  const planType = plan.planType as PlanType | undefined;
  const typeConfig = planType ? PLAN_TYPE_CONFIG[planType] : { labelKey: 'common.planType.node', variant: 'info' as const };
  const pricingCount = getPricingCount(plan);

  // Swipe actions
  const swipeActions: SwipeAction[] = [
    {
      key: 'edit',
      icon: <Edit className="size-5" />,
      label: t('common.actions.edit'),
      bgColor: 'bg-primary',
      onClick: () => onEdit(plan),
    },
    {
      key: 'duplicate',
      icon: <Copy className="size-5" />,
      label: t('common.actions.copy'),
      bgColor: 'bg-info',
      onClick: () => onDuplicate(plan),
    },
    {
      key: 'toggle',
      icon: <Power className="size-5" />,
      label: plan.status === 'active' ? t('common.actions.disable') : t('common.status.active'),
      bgColor: plan.status === 'active' ? 'bg-warning' : 'bg-success',
      onClick: () => onToggleStatus(plan),
    },
    {
      key: 'delete',
      icon: <Trash2 className="size-5" />,
      label: t('common.actions.delete'),
      bgColor: 'bg-destructive',
      onClick: () => onDelete(plan),
    },
  ];

  return (
    <MobileSwipeCard actions={swipeActions}>
      <div
        onClick={() => onCardPress(plan)}
        className="px-4 py-3 min-h-[72px] cursor-pointer active:bg-muted/30 transition-colors"
      >
        {/* Row 1: Name + Price + Status */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-medium text-foreground truncate">
              {plan.name}
            </span>
            <span className="font-mono text-sm font-medium text-primary shrink-0">
              {getPriceDisplay(plan)}
            </span>
          </div>
          <AdminBadge
            variant={statusConfig.variant}
            className="text-[10px] px-1.5 py-0 shrink-0"
          >
            {t(statusConfig.labelKey)}
          </AdminBadge>
        </div>

        {/* Row 2: Type + Visibility + Trial + Pricing Count */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {/* Plan Type */}
          <div className="flex items-center gap-1">
            {planType && PLAN_TYPE_ICONS[planType]}
            <AdminBadge variant={typeConfig.variant} className="text-[10px] px-1.5 py-0">
              {t(typeConfig.labelKey)}
            </AdminBadge>
          </div>

          <span className="text-border">·</span>

          {/* Visibility */}
          <span className={cn(
            'flex items-center gap-0.5',
            plan.isPublic ? 'text-info' : 'text-warning'
          )}>
            {plan.isPublic ? (
              <>
                <Globe className="size-3" />
                <span>{t('admin.plans.public')}</span>
              </>
            ) : (
              <>
                <Lock className="size-3" />
                <span>{t('admin.plans.private')}</span>
              </>
            )}
          </span>

          {/* Trial Days */}
          {plan.trialDays != null && plan.trialDays > 0 && (
            <>
              <span className="text-border">·</span>
              <span>{t('admin.plans.table.daysCount', { count: plan.trialDays })}</span>
            </>
          )}

          {/* Pricing Count */}
          {pricingCount > 1 && (
            <>
              <span className="text-border">·</span>
              <span>{t('admin.plans.table.multipleCycles', { count: pricingCount })}</span>
            </>
          )}
        </div>
      </div>

      {/* Swipe hint indicator */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
        <div className="flex gap-0.5">
          <div className="w-0.5 h-4 rounded-full bg-foreground" />
          <div className="w-0.5 h-4 rounded-full bg-foreground" />
        </div>
      </div>
    </MobileSwipeCard>
  );
};

MobilePlanCard.displayName = 'MobilePlanCard';
