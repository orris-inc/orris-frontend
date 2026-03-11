/**
 * MobilePlanCard - Tailwind Application UI style list item
 *
 * Design principles:
 * - Clean stacked list item (used with divide-y parent)
 * - Two-line layout: name + price | type + visibility + metadata
 * - Status badge on the right
 * - Tap to open detail sheet
 */

import { useTranslation } from 'react-i18next';
import {
  Globe,
  Lock,
  Zap,
  ArrowLeftRight,
  Layers,
} from 'lucide-react';
import { AdminBadge } from '@/components/admin';
import { cn } from '@/lib/utils';
import { mobileListItemStyles } from '@/lib/ui-styles';
import { ACTIVE_STATUS_CONFIG, PLAN_TYPE_CONFIG } from '@/shared/constants/status-config';
import type { SubscriptionPlan, PlanStatus, PlanType } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================

export interface MobilePlanCardProps {
  plan: SubscriptionPlan;
  onCardPress: (plan: SubscriptionPlan) => void;
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
}: MobilePlanCardProps) => {
  const { t } = useTranslation();
  const status = plan.status as PlanStatus | undefined;
  const statusConfig = status
    ? ACTIVE_STATUS_CONFIG[status]
    : { labelKey: 'common.status.unknown', variant: 'default' as const };
  const planType = plan.planType as PlanType | undefined;
  const typeConfig = planType
    ? PLAN_TYPE_CONFIG[planType]
    : { labelKey: 'common.planType.node', variant: 'info' as const };
  const pricingCount = getPricingCount(plan);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCardPress(plan)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardPress(plan);
        }
      }}
      className={cn(mobileListItemStyles, 'active:scale-[0.98] transition-transform')}
    >
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: Name + Price */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] font-medium text-foreground truncate">
            {plan.name}
          </span>
          <span className="font-mono text-[13px] font-medium text-primary shrink-0">
            {getPriceDisplay(plan)}
          </span>
        </div>

        {/* Row 2: Type + Visibility + Trial + Pricing Count */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {/* Plan Type */}
          <span className="flex items-center gap-1">
            {planType && PLAN_TYPE_ICONS[planType]}
            <span>{t(typeConfig.labelKey)}</span>
          </span>

          <span className="text-muted-foreground/40">·</span>

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

          {/* Pricing Count */}
          {pricingCount > 1 && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span>{t('admin.plans.table.multipleCycles', { count: pricingCount })}</span>
            </>
          )}
        </div>
      </div>

      {/* Right side: Status */}
      <AdminBadge
        variant={statusConfig.variant}
        className="text-[10px] shrink-0"
      >
        {t(statusConfig.labelKey)}
      </AdminBadge>
    </div>
  );
};

MobilePlanCard.displayName = 'MobilePlanCard';
