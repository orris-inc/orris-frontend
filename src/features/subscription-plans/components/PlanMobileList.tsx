/**
 * Subscription Plan Mobile List Component
 * Mobile-friendly card list with Accordion for expanded details
 */

import { useTranslation } from 'react-i18next';
import {
  Edit,
  MoreHorizontal,
  Power,
  Users,
  Copy,
  Trash2,
} from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/common/Accordion';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import { AdminBadge } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Skeleton } from '@/components/common/Skeleton';
import { cardStyles } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';
import { BillingCycleBadge } from './BillingCycleBadge';
import { ACTIVE_STATUS_CONFIG } from '@/shared/constants/status-config';
import type { SubscriptionPlan, PlanStatus, BillingCycle, PlanType } from '@/api/subscription/types';

interface PlanMobileListProps {
  plans: SubscriptionPlan[];
  loading?: boolean;
  onEdit: (plan: SubscriptionPlan) => void;
  onDuplicate?: (plan: SubscriptionPlan) => void;
  onToggleStatus: (plan: SubscriptionPlan) => void;
  onViewSubscriptions?: (plan: SubscriptionPlan) => void;
  onDelete?: (plan: SubscriptionPlan) => void;
}



// Get plan price range (supports multiple pricing)
const getPriceRange = (
  plan: SubscriptionPlan
): {
  display: string;
  details: Array<{ cycle: BillingCycle; price: string }> | null;
  primaryCycle: BillingCycle;
} => {
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

  const prices = activePricings.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const currency = activePricings[0].currency;
  const currencySymbol = currency === 'CNY' ? '¥' : '$';

  return {
    display:
      minPrice === maxPrice
        ? `${currencySymbol}${(minPrice / 100).toFixed(2)}`
        : `${currencySymbol}${(minPrice / 100).toFixed(2)} - ${currencySymbol}${(maxPrice / 100).toFixed(2)}`,
    details: activePricings.map((p) => ({
      cycle: p.billingCycle,
      price: `${p.currency === 'CNY' ? '¥' : '$'}${(p.price / 100).toFixed(2)}`,
    })),
    primaryCycle: activePricings[0].billingCycle,
  };
};

// Loading skeleton for mobile cards
const MobileCardSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className={cn(cardStyles, 'p-4 space-y-3')}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
);

export const PlanMobileList: React.FC<PlanMobileListProps> = ({
  plans,
  loading = false,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onViewSubscriptions,
  onDelete,
}) => {
  const { t } = useTranslation();
  // Render dropdown menu
  const renderDropdownMenu = (plan: SubscriptionPlan) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label={t('common.actions.more')}
          >
            <MoreHorizontal className="size-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent align="end" collisionPadding={16}>
            <DropdownMenuItem onSelect={() => onEdit(plan)}>
              <Edit className="mr-2 size-4" />
              {t('common.actions.edit')}
            </DropdownMenuItem>
            {onDuplicate && (
              <DropdownMenuItem onSelect={() => onDuplicate(plan)}>
                <Copy className="mr-2 size-4" />
                {t('admin.plans.actions.duplicate')}
              </DropdownMenuItem>
            )}
            {onViewSubscriptions && (
              <DropdownMenuItem onSelect={() => onViewSubscriptions(plan)}>
                <Users className="mr-2 size-4" />
                {t('admin.plans.actions.viewSubscriptions')}
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
    );
  };

  if (loading) {
    return <MobileCardSkeleton />;
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground dark:text-muted-foreground">
        {t('admin.plans.emptyState')}
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-1.5">
      {plans.map((plan) => {
        const status = plan.status as PlanStatus | undefined;
        const statusConfig = status ? ACTIVE_STATUS_CONFIG[status] : { labelKey: 'common.status.unknown', variant: 'default' as const };
        const planType = plan.planType as PlanType | undefined;
        const priceRange = getPriceRange(plan);

        return (
          <AccordionItem
            key={plan.id}
            value={plan.id}
            className={cn(cardStyles, 'overflow-hidden')}
          >
            {/* Card Header - Always visible */}
            <div className="px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Plan name and status */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <SmartTruncate
                      text={plan.name}
                      className="font-medium text-sm text-foreground"
                    />
                    <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      {t(statusConfig.labelKey)}
                    </AdminBadge>
                  </div>

                  {/* Price and type */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-muted-foreground">
                    <span className="font-mono text-foreground">{priceRange.display}</span>
                    <span className="text-muted-foreground">·</span>
                    <AdminBadge
                      variant={planType === 'forward' ? 'warning' : 'info'}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {t(`planType.${planType ?? 'node'}`)}
                    </AdminBadge>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onEdit(plan)}
                        className="p-1.5 rounded hover:bg-accent transition-colors"
                        aria-label={t('common.actions.edit')}
                      >
                        <Edit className="size-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t('common.actions.edit')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onToggleStatus(plan)}
                        className={`p-1.5 rounded transition-colors ${
                          plan.status === 'active'
                            ? 'hover:bg-destructive/10'
                            : 'hover:bg-success/10'
                        }`}
                        aria-label={plan.status === 'active' ? t('common.actions.disable') : t('common.actions.enable')}
                      >
                        <Power className={`size-3.5 ${
                          plan.status === 'active'
                            ? 'text-muted-foreground hover:text-destructive'
                            : 'text-muted-foreground hover:text-success'
                        }`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{plan.status === 'active' ? t('common.actions.disable') : t('common.actions.enable')}</TooltipContent>
                  </Tooltip>
                  {renderDropdownMenu(plan)}
                </div>
              </div>
            </div>

            {/* Accordion Trigger */}
            <AccordionTrigger className="px-3 py-1.5 border-t border-border hover:no-underline hover:bg-muted">
              <span className="text-xs text-muted-foreground dark:text-muted-foreground">{t('common.detail')}</span>
            </AccordionTrigger>

            {/* Accordion Content - Expanded details */}
            <AccordionContent>
              <div className="px-3 pb-2 space-y-2 border-t border-border pt-2">
                {/* Slug */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground dark:text-muted-foreground uppercase tracking-wide w-12 flex-shrink-0">{t('admin.plans.detail.slug')}</span>
                  <span className="text-xs font-mono text-muted-foreground text-muted-foreground">{plan.slug}</span>
                </div>

                {/* Billing cycle */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground dark:text-muted-foreground uppercase tracking-wide w-12 flex-shrink-0">{t('admin.plans.detail.cycle')}</span>
                  {priceRange.details && priceRange.details.length > 1 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground cursor-help">
                          {priceRange.details.length}{' '}
                          {t('admin.plans.cycleOptions')}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs space-y-1">
                          {priceRange.details.map((detail, idx) => (
                            <p key={idx}>
                              {t(`billingCycle.${detail.cycle}`)}: {detail.price}
                            </p>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <BillingCycleBadge billingCycle={priceRange.primaryCycle} />
                  )}
                </div>

                {/* Public status */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground dark:text-muted-foreground uppercase tracking-wide w-12 flex-shrink-0">{t('admin.plans.detail.public')}</span>
                  <AdminBadge variant={plan.isPublic ? 'success' : 'outline'} className="text-[10px] px-1.5 py-0">
                    {plan.isPublic ? t('common.yes') : t('common.no')}
                  </AdminBadge>
                </div>

                {/* Sort order */}
                {plan.sortOrder !== undefined && plan.sortOrder !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground dark:text-muted-foreground uppercase tracking-wide w-12 flex-shrink-0">{t('common.table.sort')}</span>
                    <span className="text-xs font-mono text-muted-foreground text-muted-foreground">{plan.sortOrder}</span>
                  </div>
                )}

                {/* Description */}
                {plan.description && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-muted-foreground dark:text-muted-foreground uppercase tracking-wide w-12 pt-0.5 flex-shrink-0">{t('common.fields.description')}</span>
                    <SmartTruncate
                      text={plan.description}
                      className="text-xs text-muted-foreground flex-1"
                      maxLines={2}
                    />
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
