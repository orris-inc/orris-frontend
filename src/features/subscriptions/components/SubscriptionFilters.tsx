/**
 * Subscription Filters Component
 * Unified filtering toolbar following Tailwind Application UI patterns
 *
 * Features:
 * - Status filter (Select - 8 options)
 * - Plan selection
 * - Billing cycle filter
 * - Expiration date filter (upcoming expiry)
 * - Sort options
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

// Status options (8 statuses)
const STATUS_OPTIONS: { value: SubscriptionStatus; label: string }[] = [
  { value: 'active', label: 'common.status.active' },
  { value: 'trialing', label: 'subscriptionStatus.trialing' },
  { value: 'pending_payment', label: 'subscriptionStatus.pendingPayment' },
  { value: 'past_due', label: 'subscriptionStatus.pastDue' },
  { value: 'suspended', label: 'common.status.suspended' },
  { value: 'cancelled', label: 'common.status.cancelled' },
  { value: 'expired', label: 'common.status.expired' },
  { value: 'inactive', label: 'common.status.inactive' },
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

  // Check if any filter is active (excluding default status)
  const hasFilters = useMemo(() => {
    return !!(
      (filters.status && filters.status !== 'active') ||
      filters.planId ||
      filters.billingCycle ||
      filters.expiresBefore ||
      filters.sortBy
    );
  }, [filters]);

  // Handle status change
  const handleStatusChange = (value: string) => {
    onFiltersChange({
      status: value === 'all' ? undefined : (value as SubscriptionStatus),
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

  // Clear all filters (reset to default)
  const clearFilters = () => {
    onFiltersChange({
      status: 'active',
      planId: undefined,
      billingCycle: undefined,
      expiresBefore: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    });
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Status filter */}
      <Select
        value={filters.status ?? 'all'}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[130px] h-9">
          <SelectValue placeholder={t('common.status.label')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter.all')}</SelectItem>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(option.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Plan filter */}
      <Select
        value={filters.planId ?? 'all'}
        onValueChange={handlePlanChange}
      >
        <SelectTrigger className="w-[160px] h-9">
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
        <SelectTrigger className="w-[140px] h-9">
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
        <SelectTrigger className="w-[150px] h-9">
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
          <SelectTrigger className="w-[140px] h-9">
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
            className="size-9 shrink-0"
            onClick={toggleSortOrder}
            title={t(
              filters.sortOrder === 'asc'
                ? 'filter.sortAscending'
                : 'filter.sortDescending'
            )}
          >
            <ArrowUpDown
              className={cn(
                'size-4',
                filters.sortOrder === 'asc' && 'rotate-180'
              )}
            />
          </Button>
        )}
      </div>

      {/* Clear filters button */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground h-9"
        >
          <X className="size-4 mr-1" />
          {t('filter.clearAdvanced')}
        </Button>
      )}
    </div>
  );
};

SubscriptionFilters.displayName = 'SubscriptionFilters';
