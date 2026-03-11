/**
 * Mobile Subscription Filters Sheet
 * Bottom sheet for advanced filtering on mobile
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, X, ArrowUpDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/common/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Label';
import { cn } from '@/lib/utils';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import type { BillingCycle, SubscriptionStatus } from '@/api/subscription/types';
import type { SubscriptionFilters } from '../hooks/useSubscriptions';

// ============================================================================
// Types
// ============================================================================

export interface MobileSubscriptionFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: SubscriptionFilters;
  onFiltersChange: (filters: Partial<SubscriptionFilters>) => void;
}

// Status options (8 statuses)
const STATUS_OPTIONS: { value: SubscriptionStatus; label: string }[] = [
  { value: 'active', label: 'common.status.enabled' },
  { value: 'trialing', label: 'subscriptionStatus.trialing' },
  { value: 'pending_payment', label: 'subscriptionStatus.pendingPayment' },
  { value: 'past_due', label: 'subscriptionStatus.pastDue' },
  { value: 'suspended', label: 'common.status.suspended' },
  { value: 'cancelled', label: 'common.status.cancelled' },
  { value: 'expired', label: 'common.status.expired' },
  { value: 'inactive', label: 'common.status.disabled' },
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

// Expiry presets
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
// Filter Button (Trigger)
// ============================================================================

export interface MobileFilterButtonProps {
  hasFilters: boolean;
  onClick?: () => void;
}

export const MobileFilterButton = ({ hasFilters, onClick }: MobileFilterButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'size-10 rounded-lg shrink-0',
        'flex items-center justify-center',
        'ring-1 ring-border bg-background',
        'hover:bg-muted active:bg-muted/80 active:scale-[0.98]',
        'transition-colors relative',
        'pointer-coarse:size-11'
      )}
    >
      <Filter className="size-4 text-muted-foreground" />
      {hasFilters && (
        <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-primary" />
      )}
    </button>
  );
};

// ============================================================================
// Main Sheet Component
// ============================================================================

export const MobileSubscriptionFiltersSheet = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: MobileSubscriptionFiltersSheetProps) => {
  const { t } = useTranslation();

  // Fetch plans
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
      onFiltersChange({ sortBy: value as SubscriptionFilters['sortBy'], sortOrder: filters.sortOrder ?? 'desc' });
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

  // Apply and close
  const handleApply = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[85vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center justify-between">
            <span>{t('common.actions.filter')}</span>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground -mr-2"
              >
                <X className="size-4 mr-1" />
                {t('filter.clearAdvanced')}
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="py-4 space-y-3">
          {/* Status filter */}
          <div className="space-y-2">
            <Label>{t('common.status.label')}</Label>
            <Select
              value={filters.status ?? 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full">
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
          </div>

          {/* Plan filter */}
          <div className="space-y-2">
            <Label>{t('filter.selectPlan')}</Label>
            <Select
              value={filters.planId ?? 'all'}
              onValueChange={handlePlanChange}
            >
              <SelectTrigger className="w-full">
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
          </div>

          {/* Billing cycle filter */}
          <div className="space-y-2">
            <Label>{t('filter.billingCycle')}</Label>
            <Select
              value={filters.billingCycle ?? 'all'}
              onValueChange={handleBillingCycleChange}
            >
              <SelectTrigger className="w-full">
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
          </div>

          {/* Expiry filter */}
          <div className="space-y-2">
            <Label>{t('filter.expiringSoon')}</Label>
            <Select value={currentExpiryPreset} onValueChange={handleExpiryChange}>
              <SelectTrigger className="w-full">
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
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <Label>{t('filter.sortBy')}</Label>
            <div className="flex items-center gap-2">
              <Select
                value={filters.sortBy ?? 'none'}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="flex-1">
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
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={toggleSortOrder}
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
          </div>
        </SheetBody>

        <SheetFooter>
          <Button className="w-full" onClick={handleApply}>
            {t('common.actions.apply')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

MobileSubscriptionFiltersSheet.displayName = 'MobileSubscriptionFiltersSheet';
