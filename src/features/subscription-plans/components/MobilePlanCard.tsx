/**
 * MobilePlanCard - iOS 26 Liquid Glass styled plan card for mobile
 *
 * Designed following iOS Human Interface Guidelines:
 * - Minimum 44px touch targets for all interactive elements
 * - Clear visual hierarchy with primary/secondary information
 * - Expandable details section with smooth animation
 * - Quick action buttons for common operations
 * - Respects prefers-reduced-motion
 */

import { useState } from 'react';
import {
  Edit,
  Power,
  Users,
  Copy,
  Trash2,
  ChevronDown,
  Globe,
  Lock,
  Hash,
  Calendar,
  FileText,
} from 'lucide-react';
import { AdminBadge } from '@/components/admin';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/common/Collapsible';
import { MobileActionButton } from '@/components/mobile';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan, PlanStatus, BillingCycle, PlanType } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================

export interface MobilePlanCardProps {
  plan: SubscriptionPlan;
  onEdit: (plan: SubscriptionPlan) => void;
  onDuplicate?: (plan: SubscriptionPlan) => void;
  onToggleStatus: (plan: SubscriptionPlan) => void;
  onViewSubscriptions?: (plan: SubscriptionPlan) => void;
  onDelete?: (plan: SubscriptionPlan) => void;
}

// ============================================================================
// Constants
// ============================================================================

const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: '周付',
  monthly: '月付',
  quarterly: '季付',
  semi_annual: '半年付',
  yearly: '年付',
  lifetime: '终身',
};

const PLAN_TYPE_CONFIG: Record<PlanType, { label: string; variant: 'info' | 'warning' | 'default' }> = {
  node: { label: '节点', variant: 'info' },
  forward: { label: '转发', variant: 'warning' },
  hybrid: { label: '混合', variant: 'default' },
};

const STATUS_CONFIG: Record<PlanStatus, { label: string; variant: 'success' | 'default' }> = {
  active: { label: '激活', variant: 'success' },
  inactive: { label: '未激活', variant: 'default' },
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
  const maxPrice = Math.max(...prices);
  const currency = activePricings[0].currency;
  const currencySymbol = currency === 'CNY' ? '¥' : '$';

  if (minPrice === maxPrice) {
    return `${currencySymbol}${(minPrice / 100).toFixed(2)}`;
  }
  return `${currencySymbol}${(minPrice / 100).toFixed(2)} - ${currencySymbol}${(maxPrice / 100).toFixed(2)}`;
};

const getPricingDetails = (plan: SubscriptionPlan): Array<{ cycle: string; price: string }> | null => {
  if (!plan.pricings || plan.pricings.length === 0) return null;

  const activePricings = plan.pricings.filter(p => p.isActive);
  if (activePricings.length <= 1) return null;

  return activePricings.map(p => ({
    cycle: BILLING_CYCLE_LABELS[p.billingCycle] || p.billingCycle,
    price: `${p.currency === 'CNY' ? '¥' : '$'}${(p.price / 100).toFixed(2)}`,
  }));
};

// ============================================================================
// Main Component
// ============================================================================

export const MobilePlanCard = ({
  plan,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onViewSubscriptions,
  onDelete,
}: MobilePlanCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const status = plan.status as PlanStatus | undefined;
  const statusConfig = status ? STATUS_CONFIG[status] : { label: '未知', variant: 'default' as const };
  const planType = plan.planType as PlanType | undefined;
  const typeConfig = planType ? PLAN_TYPE_CONFIG[planType] : { label: '节点', variant: 'info' as const };
  const pricingDetails = getPricingDetails(plan);

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className={cn(
        'bg-card/60 backdrop-blur-sm',
        'rounded-2xl',
        'border border-border/50',
        'overflow-hidden'
      )}
    >
      {/* Header - Always visible */}
      <CollapsibleTrigger
        className={cn(
          'w-full px-4 py-3 min-h-[60px]',
          'flex items-center justify-between gap-3',
          'text-left cursor-pointer',
          'motion-safe:active:bg-foreground/5'
        )}
      >
        {/* Plan Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-foreground truncate">
              {plan.name}
            </span>
            <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 shrink-0">
              {statusConfig.label}
            </AdminBadge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-mono font-medium text-foreground">
              {getPriceDisplay(plan)}
            </span>
            <span className="text-border">·</span>
            <AdminBadge variant={typeConfig.variant} className="text-[10px] px-1.5 py-0">
              {typeConfig.label}
            </AdminBadge>
            {plan.isPublic ? (
              <Globe className="size-3 text-info" />
            ) : (
              <Lock className="size-3 text-warning" />
            )}
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            'size-5 text-muted-foreground shrink-0',
            'transition-transform duration-200',
            'motion-reduce:transition-none',
            isExpanded && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>

      {/* Expandable Details */}
      <CollapsibleContent>
        {/* Details Section */}
        <div className="border-t border-border/30 px-4 py-3 space-y-2.5">
          {/* Slug */}
          <div className="flex items-center gap-3">
            <Hash className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">标识</div>
              <div className="text-xs font-mono text-foreground truncate">{plan.slug}</div>
            </div>
          </div>

          {/* Pricing details */}
          {pricingDetails && (
            <div className="flex items-start gap-3">
              <Calendar className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">计费周期</div>
                <div className="flex flex-wrap gap-1">
                  {pricingDetails.map((detail, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground"
                    >
                      {detail.cycle}: {detail.price}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Visibility */}
          <div className="flex items-center gap-3">
            {plan.isPublic ? (
              <Globe className="size-4 text-muted-foreground shrink-0" />
            ) : (
              <Lock className="size-4 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">可见性</div>
              <AdminBadge
                variant={plan.isPublic ? 'success' : 'outline'}
                className="text-[10px] px-1.5 py-0"
              >
                {plan.isPublic ? '公开' : '私有'}
              </AdminBadge>
            </div>
          </div>

          {/* Trial days */}
          {plan.trialDays != null && plan.trialDays > 0 && (
            <div className="flex items-center gap-3">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">试用期</div>
                <div className="text-xs text-foreground">{plan.trialDays} 天</div>
              </div>
            </div>
          )}

          {/* Description */}
          {plan.description && (
            <div className="flex items-start gap-3">
              <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">描述</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{plan.description}</div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="border-t border-border/30 px-4 py-3">
          <div className="flex gap-1.5 flex-wrap">
            <MobileActionButton
              icon={<Edit className="size-3.5" />}
              label="编辑"
              onClick={() => onEdit(plan)}
              variant="primary"
            />
            {onDuplicate && (
              <MobileActionButton
                icon={<Copy className="size-3.5" />}
                label="复制"
                onClick={() => onDuplicate(plan)}
              />
            )}
            {onViewSubscriptions && (
              <MobileActionButton
                icon={<Users className="size-3.5" />}
                label="订阅"
                onClick={() => onViewSubscriptions(plan)}
              />
            )}
            <MobileActionButton
              icon={<Power className="size-3.5" />}
              label={plan.status === 'active' ? '停用' : '激活'}
              onClick={() => onToggleStatus(plan)}
            />
            {onDelete && (
              <MobileActionButton
                icon={<Trash2 className="size-3.5" />}
                label="删除"
                onClick={() => onDelete(plan)}
                variant="destructive"
              />
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

MobilePlanCard.displayName = 'MobilePlanCard';
