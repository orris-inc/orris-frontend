/**
 * Subscription Filters Component (Redesigned)
 *
 * Layout:
 *   Row 1: [Status segmented tabs] — primary filter, visually prominent
 *   Row 2: [Plan ▼] [Billing Cycle ▼] [Expiry ▼] [Sort ▼ ↕] [× Clear]
 *
 * Status tabs follow the segmented control pattern from PlanFilters.
 * Secondary filters are compact selects in a subordinate row.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import type { BillingCycle, SubscriptionStatus } from '@/api/subscription/types';
import type { SubscriptionFilters as FilterValues } from '../hooks/useSubscriptions';

// ============================================================================
// Types
// ============================================================================

export interface SubscriptionFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: Partial<FilterValues>) => void;
  className?: string;
}

// Status tab items (primary filter)
const STATUS_TABS: { value: SubscriptionStatus | 'all'; labelKey: string }[] = [
  { value: 'all', labelKey: 'filter.all' },
  { value: 'active', labelKey: 'common.status.enabled' },
  { value: 'trialing', labelKey: 'subscriptionStatus.trialing' },
  { value: 'suspended', labelKey: 'common.status.suspended' },
  { value: 'cancelled', labelKey: 'subscriptionStatus.cancelled' },
  { value: 'expired', labelKey: 'common.status.expired' },
  { value: 'past_due', labelKey: 'subscriptionStatus.pastDue' },
  { value: 'pending_payment', labelKey: 'subscriptionStatus.pendingPayment' },
  { value: 'inactive', labelKey: 'common.status.disabled' },
];

// Billing cycle options
const BILLING_CYCLES: BillingCycle[] = [
  'weekly',
  'monthly',
  'quarterly',
  'semi_annual',
  'yearly',
  'lifetime',
];

// Expiry presets (days from now)
const EXPIRY_PRESETS = [
  { value: '7', label: 'filter.expireIn7Days' },
  { value: '14', label: 'filter.expireIn14Days' },
  { value: '30', label: 'filter.expireIn30Days' },
  { value: '90', label: 'filter.expireIn90Days' },
];

// Sort options
const SORT_OPTIONS = [
  { value: 'created_at', label: 'filter.sortByCreatedAt' },
  { value: 'end_date', label: 'filter.sortByEndDate' },
  { value: 'start_date', label: 'filter.sortByStartDate' },
];

// ============================================================================
// Main Component
// ============================================================================

export const SubscriptionFilters = ({
  filters,
  onFiltersChange,
  className,
}: SubscriptionFiltersProps) => {
  const { t } = useTranslation();

  // Fetch plans for selection
  const { plans, isLoading: plansLoading } = useSubscriptionPlans({
    pageSize: 100,
  });

  // Check if any advanced filter is active (excluding status — handled by tabs)
  const hasAdvancedFilters = useMemo(() => {
    return !!(filters.planId || filters.billingCycle || filters.expiresBefore || filters.sortBy);
  }, [filters.planId, filters.billingCycle, filters.expiresBefore, filters.sortBy]);

  // Current status tab value
  const currentStatus = filters.status ?? 'all';

  // Handle status tab change
  const handleStatusChange = (value: SubscriptionStatus | 'all') => {
    onFiltersChange({
      status: value === 'all' ? undefined : value,
    });
  };

  // Handle plan change
  const handlePlanChange = (value: string) => {
    onFiltersChange({ planId: value === 'all' ? undefined : value });
  };

  // Handle billing cycle change
  const handleBillingCycleChange = (value: string) => {
    onFiltersChange({
      billingCycle: value === 'all' ? undefined : (value as BillingCycle),
    });
  };

  // Handle expiry preset change
  const handleExpiryChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({ expiresBefore: undefined });
    } else {
      const days = parseInt(value, 10);
      const date = new Date();
      date.setDate(date.getDate() + days);
      onFiltersChange({ expiresBefore: date.toISOString() });
    }
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    if (value === 'none') {
      onFiltersChange({ sortBy: undefined, sortOrder: undefined });
    } else {
      onFiltersChange({ sortBy: value as FilterValues['sortBy'], sortOrder: filters.sortOrder ?? 'desc' });
    }
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    if (filters.sortBy) {
      onFiltersChange({
        sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
      });
    }
  };

  // Get current expiry preset value
  const currentExpiryPreset = useMemo(() => {
    if (!filters.expiresBefore) return 'all';
    const now = new Date();
    const expiry = new Date(filters.expiresBefore);
    const diffDays = Math.round(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const preset = EXPIRY_PRESETS.find(
      (p) => Math.abs(parseInt(p.value, 10) - diffDays) <= 1
    );
    return preset?.value ?? 'all';
  }, [filters.expiresBefore]);

  // Clear all advanced filters (keep status tab)
  const clearAdvancedFilters = () => {
    onFiltersChange({
      planId: undefined,
      billingCycle: undefined,
      expiresBefore: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Row 1: Status segmented tabs */}
      <div className="flex items-center overflow-x-auto scrollbar-none">
        <div className="flex items-center rounded-xl bg-muted/50 ring-1 ring-border p-0.5">
          {STATUS_TABS.map((tab) => {
            const isActive = currentStatus === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleStatusChange(tab.value)}
                className={cn(
                  'px-3 h-8 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Secondary filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Plan filter */}
        <Select
          value={filters.planId ?? 'all'}
          onValueChange={handlePlanChange}
        >
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder={t('filter.selectPlan')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filter.allPlans')}</SelectItem>
            {!plansLoading &&
              plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Billing cycle filter */}
        <Select
          value={filters.billingCycle ?? 'all'}
          onValueChange={handleBillingCycleChange}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder={t('filter.billingCycle')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filter.allCycles')}</SelectItem>
            {BILLING_CYCLES.map((cycle) => (
              <SelectItem key={cycle} value={cycle}>
                {t(`billingCycle.${cycle === 'semi_annual' ? 'semiAnnual' : cycle}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Expiry filter */}
        <Select value={currentExpiryPreset} onValueChange={handleExpiryChange}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder={t('filter.expiringSoon')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filter.allExpiry')}</SelectItem>
            {EXPIRY_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {t(preset.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <div className="flex items-center gap-1">
          <Select value={filters.sortBy ?? 'none'} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder={t('filter.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('filter.defaultSort')}</SelectItem>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.sortBy && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={toggleSortOrder}
              title={t(
                filters.sortOrder === 'asc'
                  ? 'filter.sortAscending'
                  : 'filter.sortDescending'
              )}
            >
              <ArrowUpDown
                className={cn(
                  'size-3.5',
                  filters.sortOrder === 'asc' && 'rotate-180'
                )}
              />
            </Button>
          )}
        </div>

        {/* Clear advanced filters button */}
        {hasAdvancedFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAdvancedFilters}
            className="text-muted-foreground h-8 text-xs"
          >
            <X className="size-3.5 mr-1" />
            {t('filter.clearAdvanced')}
          </Button>
        )}
      </div>
    </div>
  );
};

SubscriptionFilters.displayName = 'SubscriptionFilters';
