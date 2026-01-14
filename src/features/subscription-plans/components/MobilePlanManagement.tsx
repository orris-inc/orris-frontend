/**
 * MobilePlanManagement - Redesigned iOS-style plan management for mobile
 *
 * Key improvements:
 * - Compact 3-stat summary row
 * - Clean iOS-style search bar
 * - Segmented filter for quick status filtering
 * - Swipe-action cards with tap-to-detail
 * - Floating action button for creating plans
 * - Better empty states
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  RefreshCw,
  Package,
  CheckCircle2,
  Globe,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MobileSegmentedFilter, type SegmentOption } from '@/components/mobile';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';
import { MobilePlanCard } from './MobilePlanCard';
import { PlanDetailSheet } from './PlanDetailSheet';
import type { SubscriptionPlan } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================

export interface MobilePlanManagementProps {
  plans: SubscriptionPlan[];
  loading?: boolean;
  refreshing?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (plan: SubscriptionPlan) => void;
  onDuplicate: (plan: SubscriptionPlan) => void;
  onToggleStatus: (plan: SubscriptionPlan) => void;
  onViewSubscriptions: (plan: SubscriptionPlan) => void;
  onDelete: (plan: SubscriptionPlan) => void;
  onPageChange: (page: number) => void;
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'public' | 'private';

// ============================================================================
// Filter Options - Using labelKey for i18n
// ============================================================================

interface StatusFilterOption extends SegmentOption<StatusFilter> {
  labelKey: string;
}

const STATUS_FILTER_OPTIONS: StatusFilterOption[] = [
  { value: 'all', label: '', labelKey: 'filter.all' },
  { value: 'active', label: '', labelKey: 'common.status.active' },
  { value: 'inactive', label: '', labelKey: 'common.status.inactive', hideWhenZero: true },
  { value: 'public', label: '', labelKey: 'admin.plans.public' },
  { value: 'private', label: '', labelKey: 'admin.plans.private', hideWhenZero: true },
];

// ============================================================================
// Sub Components
// ============================================================================

/**
 * Compact stats summary - 3 key metrics in one row
 */
const StatsSummary = ({
  total,
  active,
  publicCount,
  loading,
  t,
}: {
  total: number;
  active: number;
  publicCount: number;
  loading: boolean;
  t: (key: string) => string;
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between text-xs px-1">
      <div className="flex items-center gap-1.5">
        <Package className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">{t('admin.subscriptions.total')}</span>
        <span className="font-semibold text-foreground tabular-nums">{total}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="size-3.5 text-success" />
        <span className="text-muted-foreground">{t('common.status.active')}</span>
        <span className="font-semibold text-success tabular-nums">{active}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Globe className="size-3.5 text-info" />
        <span className="text-muted-foreground">{t('admin.plans.public')}</span>
        <span className="font-semibold text-info tabular-nums">{publicCount}</span>
      </div>
    </div>
  );
};

/**
 * iOS-style search bar
 */
const SearchBar = ({
  value,
  onChange,
  onClear,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder: string;
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2',
        'h-10 px-3',
        'bg-muted/50 rounded-xl',
        'focus-within:bg-muted/70',
        'transition-colors'
      )}
    >
      <Search className="size-4 text-muted-foreground shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'flex-1 min-w-0',
          'bg-transparent',
          'text-sm text-foreground placeholder:text-muted-foreground/60',
          'focus:outline-none'
        )}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="size-5 rounded-full bg-muted-foreground/20 flex items-center justify-center"
        >
          <X className="size-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};

/**
 * Empty state with illustration
 */
const EmptyState = ({
  hasFilter,
  onClearFilter,
  onCreate,
  t,
}: {
  hasFilter: boolean;
  onClearFilter: () => void;
  onCreate: () => void;
  t: (key: string) => string;
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-6">
    <div className="size-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
      {hasFilter ? (
        <Search className="size-10 text-muted-foreground/50" />
      ) : (
        <Package className="size-10 text-muted-foreground/50" />
      )}
    </div>
    <p className="text-base font-medium text-foreground mb-1 text-center">
      {hasFilter ? t('common.messages.noResults') : t('admin.plans.table.noPlans')}
    </p>
    <p className="text-sm text-muted-foreground text-center mb-5">
      {hasFilter
        ? t('subscription.tryAdjustSearch')
        : t('admin.plans.createPlan')}
    </p>
    <button
      type="button"
      onClick={hasFilter ? onClearFilter : onCreate}
      className={cn(
        'flex items-center gap-2',
        'px-5 py-2.5 min-h-[44px]',
        'rounded-full',
        'text-sm font-medium',
        hasFilter
          ? 'bg-muted text-foreground'
          : 'bg-primary text-primary-foreground',
        'active:scale-[0.97] transition-transform'
      )}
    >
      {hasFilter ? (
        <>
          <X className="size-4" />
          {t('messages.clearFilters')}
        </>
      ) : (
        <>
          <Plus className="size-4" />
          {t('admin.plans.createPlan')}
        </>
      )}
    </button>
  </div>
);

/**
 * Loading skeleton for cards
 */
const LoadingSkeleton = () => (
  <div className="space-y-2.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-3 w-1" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-1" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Simple pagination
 */
const Pagination = ({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) => {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-6 py-4">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          'size-10 rounded-full',
          'flex items-center justify-center',
          'bg-muted/50',
          'transition-all',
          page <= 1
            ? 'opacity-40'
            : 'active:scale-[0.95] active:bg-muted'
        )}
      >
        <ChevronLeft className="size-5" />
      </button>

      <span className="text-sm text-muted-foreground tabular-nums">
        <span className="font-medium text-foreground">{page}</span>
        {' / '}
        {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          'size-10 rounded-full',
          'flex items-center justify-center',
          'bg-muted/50',
          'transition-all',
          page >= totalPages
            ? 'opacity-40'
            : 'active:scale-[0.95] active:bg-muted'
        )}
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
};

/**
 * Floating action button
 */
const FloatingActionButton = ({
  onClick,
}: {
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'fixed right-4 bottom-6',
      'size-14 rounded-full',
      'bg-primary text-primary-foreground',
      'shadow-lg shadow-primary/25',
      'flex items-center justify-center',
      'active:scale-[0.95] transition-transform',
      'z-40'
    )}
    style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
  >
    <Plus className="size-6" />
  </button>
);

// ============================================================================
// Main Component
// ============================================================================

export const MobilePlanManagement = ({
  plans,
  loading = false,
  refreshing = false,
  page,
  pageSize,
  total,
  onRefresh,
  onCreate,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onViewSubscriptions,
  onDelete,
  onPageChange,
}: MobilePlanManagementProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Build filter options with translated labels
  const translatedFilterOptions = useMemo(() => {
    return STATUS_FILTER_OPTIONS.map((opt) => ({
      ...opt,
      label: t(opt.labelKey),
    }));
  }, [t]);

  // Calculate stats
  const stats = useMemo(() => {
    const active = plans.filter((p) => p.status === 'active').length;
    const inactive = plans.filter((p) => p.status === 'inactive').length;
    const publicPlans = plans.filter((p) => p.isPublic).length;
    const privatePlans = plans.filter((p) => !p.isPublic).length;
    return { total, active, inactive, publicPlans, privatePlans };
  }, [plans, total]);

  // Add counts to filter options
  const filterOptionsWithCounts = useMemo(() => {
    return translatedFilterOptions.map((opt) => {
      let count: number;
      switch (opt.value) {
        case 'all':
          count = total;
          break;
        case 'active':
          count = stats.active;
          break;
        case 'inactive':
          count = stats.inactive;
          break;
        case 'public':
          count = stats.publicPlans;
          break;
        case 'private':
          count = stats.privatePlans;
          break;
        default:
          count = 0;
      }
      return { ...opt, count };
    });
  }, [translatedFilterOptions, stats, total]);

  // Filter plans
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      // Status filter
      if (statusFilter === 'active' && plan.status !== 'active') return false;
      if (statusFilter === 'inactive' && plan.status !== 'inactive') return false;
      if (statusFilter === 'public' && !plan.isPublic) return false;
      if (statusFilter === 'private' && plan.isPublic) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = plan.name?.toLowerCase().includes(query);
        const matchSlug = plan.slug?.toLowerCase().includes(query);
        const matchDesc = plan.description?.toLowerCase().includes(query);
        if (!matchName && !matchSlug && !matchDesc) {
          return false;
        }
      }

      return true;
    });
  }, [plans, searchQuery, statusFilter]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, []);

  const hasFilter = searchQuery !== '' || statusFilter !== 'all';

  // Handle card press - open detail sheet
  const handleCardPress = useCallback((plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setDetailSheetOpen(true);
  }, []);

  return (
    <div className="pb-20">
      {/* Header Section */}
      <div className="space-y-3 mb-4">
        {/* Stats Summary */}
        <StatsSummary
          total={stats.total}
          active={stats.active}
          publicCount={stats.publicPlans}
          loading={loading}
          t={t}
        />

        {/* Search Bar with Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              placeholder={t('common.placeholders.search')}
            />
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={cn(
              'size-10 rounded-xl shrink-0',
              'flex items-center justify-center',
              'bg-muted/50',
              'active:bg-muted transition-colors'
            )}
          >
            <RefreshCw
              className={cn(
                'size-4 text-muted-foreground',
                refreshing && 'animate-spin'
              )}
            />
          </button>
        </div>

        {/* Segmented Filter */}
        <MobileSegmentedFilter
          options={filterOptionsWithCounts}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* Results count when filtered */}
      {hasFilter && !loading && filteredPlans.length > 0 && (
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-muted-foreground">
            {t('admin.subscriptions.found')} <span className="font-medium text-foreground">{filteredPlans.length}</span> {t('admin.subscriptions.results')}
          </span>
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-primary font-medium"
          >
            {t('messages.clearFilters')}
          </button>
        </div>
      )}

      {/* Plan List */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredPlans.length === 0 ? (
        <EmptyState
          hasFilter={hasFilter}
          onClearFilter={clearFilters}
          onCreate={onCreate}
          t={t}
        />
      ) : (
        <div className="space-y-2.5">
          {filteredPlans.map((plan) => (
            <MobilePlanCard
              key={plan.id}
              plan={plan}
              onCardPress={handleCardPress}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredPlans.length > 0 && (
        <Pagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}

      {/* Floating Action Button */}
      <FloatingActionButton onClick={onCreate} />

      {/* Plan Detail Sheet */}
      <PlanDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        plan={selectedPlan}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onToggleStatus={onToggleStatus}
        onViewSubscriptions={onViewSubscriptions}
        onDelete={onDelete}
      />
    </div>
  );
};

MobilePlanManagement.displayName = 'MobilePlanManagement';
