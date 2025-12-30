/**
 * Subscription Plan Mobile List Component
 * Mobile-friendly card list with Accordion for expanded details
 */

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
import { AdminBadge } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Skeleton } from '@/components/common/Skeleton';
import { BillingCycleBadge } from './BillingCycleBadge';
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

// Status configuration
const STATUS_CONFIG: Record<PlanStatus, { label: string; variant: 'success' | 'default' }> = {
  active: { label: '激活', variant: 'success' },
  inactive: { label: '未激活', variant: 'default' },
};

// Get plan price range (supports multiple pricing)
const getPriceRange = (plan: SubscriptionPlan): {
  display: string;
  details: Array<{ cycle: BillingCycle; label: string; price: string }> | null;
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

// Loading skeleton for mobile cards
const MobileCardSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3">
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
  // Render dropdown menu
  const renderDropdownMenu = (plan: SubscriptionPlan) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4 text-slate-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (loading) {
    return <MobileCardSkeleton />;
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        暂无订阅计划
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-1.5">
      {plans.map((plan) => {
        const status = plan.status as PlanStatus | undefined;
        const statusConfig = status ? STATUS_CONFIG[status] : { label: '未知', variant: 'default' as const };
        const planType = plan.planType as PlanType | undefined;
        const priceRange = getPriceRange(plan);

        return (
          <AccordionItem
            key={plan.id}
            value={plan.id}
            className="border rounded-lg bg-white dark:bg-slate-800 overflow-hidden"
          >
            {/* Card Header - Always visible */}
            <div className="px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Plan name and status */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                      {plan.name}
                    </span>
                    <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      {statusConfig.label}
                    </AdminBadge>
                  </div>

                  {/* Price and type */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-slate-700 dark:text-slate-300">{priceRange.display}</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <AdminBadge variant={planType === 'forward' ? 'warning' : 'info'} className="text-[10px] px-1.5 py-0">
                      {planType ? PLAN_TYPE_LABELS[planType] : '节点订阅'}
                    </AdminBadge>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onEdit(plan)}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Edit className="size-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>编辑</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onToggleStatus(plan)}
                        className={`p-1.5 rounded transition-colors ${
                          plan.status === 'active'
                            ? 'hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                      >
                        <Power className={`size-3.5 ${
                          plan.status === 'active'
                            ? 'text-slate-400 hover:text-red-500'
                            : 'text-slate-400 hover:text-green-500'
                        }`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{plan.status === 'active' ? '停用' : '激活'}</TooltipContent>
                  </Tooltip>
                  {renderDropdownMenu(plan)}
                </div>
              </div>
            </div>

            {/* Accordion Trigger */}
            <AccordionTrigger className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-700 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-xs text-slate-400 dark:text-slate-500">详情</span>
            </AccordionTrigger>

            {/* Accordion Content - Expanded details */}
            <AccordionContent>
              <div className="px-3 pb-2 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-2">
                {/* Slug */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">标识</span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{plan.slug}</span>
                </div>

                {/* Billing cycle */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">周期</span>
                  {priceRange.details && priceRange.details.length > 1 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-slate-600 dark:text-slate-400 cursor-help">
                          {priceRange.details.length} 种周期
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs space-y-1">
                          {priceRange.details.map((detail, idx) => (
                            <p key={idx}>{detail.label}: {detail.price}</p>
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
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">公开</span>
                  <AdminBadge variant={plan.isPublic ? 'success' : 'outline'} className="text-[10px] px-1.5 py-0">
                    {plan.isPublic ? '是' : '否'}
                  </AdminBadge>
                </div>

                {/* Trial days */}
                {plan.trialDays && plan.trialDays > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">试用</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300">{plan.trialDays} 天</span>
                  </div>
                )}

                {/* Sort order */}
                {plan.sortOrder !== undefined && plan.sortOrder !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">排序</span>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{plan.sortOrder}</span>
                  </div>
                )}

                {/* Description */}
                {plan.description && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 pt-0.5 flex-shrink-0">描述</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 flex-1 line-clamp-2">{plan.description}</span>
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
