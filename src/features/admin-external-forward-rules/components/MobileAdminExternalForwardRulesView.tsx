/**
 * MobileAdminExternalForwardRulesView - iOS-style mobile management for admin external forward rules
 *
 * Key features:
 * - Compact 3-stat summary row (total/enabled/disabled)
 * - iOS-style search bar
 * - Segmented filter for quick status filtering
 * - Floating action button for creating rules
 * - Simple prev/next pagination
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  RefreshCw,
  Globe,
  CheckCircle2,
  XCircle,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MobileSegmentedFilter, type SegmentOption } from '@/components/mobile';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';
import { AdminExternalForwardRuleMobileList } from './AdminExternalForwardRuleMobileList';
import type { AdminExternalForwardRule, AdminExternalForwardStatus } from '@/api/admin/types';

// ============================================================================
// Types
// ============================================================================

export interface MobileAdminExternalForwardRulesViewProps {
  rules: AdminExternalForwardRule[];
  loading?: boolean;
  refreshing?: boolean;
  page: number;
  pageSize: number;
  total: number;
  enabledCount: number;
  disabledCount: number;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (rule: AdminExternalForwardRule) => void;
  onDelete: (rule: AdminExternalForwardRule) => void;
  onToggleStatus: (rule: AdminExternalForwardRule) => void;
  onPageChange: (page: number) => void;
  onStatusFilterChange: (status: AdminExternalForwardStatus | undefined) => void;
  statusFilter?: AdminExternalForwardStatus;
}

type StatusFilter = 'all' | AdminExternalForwardStatus;

// ============================================================================
// Filter Options - Using labelKey for i18n
// ============================================================================

interface StatusFilterOption extends SegmentOption<StatusFilter> {
  labelKey: string;
}

const STATUS_FILTER_OPTIONS: StatusFilterOption[] = [
  { value: 'all', label: '', labelKey: 'filter.all' },
  { value: 'enabled', label: '', labelKey: 'common.status.enabled' },
  { value: 'disabled', label: '', labelKey: 'common.status.disabled', hideWhenZero: true },
];

// ============================================================================
// Sub Components
// ============================================================================

/**
 * Compact stats summary - 3 key metrics in one row
 */
const StatsSummary = ({
  total,
  enabled,
  disabled,
  loading,
  t,
}: {
  total: number;
  enabled: number;
  disabled: number;
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
        <Globe className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">{t('admin.stats.total')}</span>
        <span className="font-semibold text-foreground tabular-nums">{total}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="size-3.5 text-success" />
        <span className="text-muted-foreground">{t('common.status.enabled')}</span>
        <span className="font-semibold text-success tabular-nums">{enabled}</span>
      </div>
      {disabled > 0 && (
        <div className="flex items-center gap-1.5">
          <XCircle className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{t('common.status.disabled')}</span>
          <span className="font-semibold text-muted-foreground tabular-nums">{disabled}</span>
        </div>
      )}
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
        <Globe className="size-10 text-muted-foreground/50" />
      )}
    </div>
    <p className="text-base font-medium text-foreground mb-1 text-center">
      {hasFilter ? t('common.messages.noResults') : t('admin.externalForwardRules.noData')}
    </p>
    <p className="text-sm text-muted-foreground text-center mb-5">
      {hasFilter
        ? t('subscription.tryAdjustSearch')
        : t('admin.externalForwardRules.createHint')}
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
          {t('common.actions.create')}
        </>
      )}
    </button>
  </div>
);

/**
 * Loading skeleton for cards
 */
const LoadingSkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="bg-card/60 backdrop-blur-sm rounded-xl border border-border/50 px-3 py-2.5"
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-4 w-10 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-28 font-mono" />
          <Skeleton className="h-3 w-8" />
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
      'fixed right-4',
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

export const MobileAdminExternalForwardRulesView = ({
  rules,
  loading = false,
  refreshing = false,
  page,
  pageSize,
  total,
  enabledCount,
  disabledCount,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
  onToggleStatus,
  onPageChange,
  onStatusFilterChange,
  statusFilter,
}: MobileAdminExternalForwardRulesViewProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // Build filter options with translated labels
  const translatedFilterOptions = useMemo(() => {
    return STATUS_FILTER_OPTIONS.map((opt) => ({
      ...opt,
      label: t(opt.labelKey),
    }));
  }, [t]);

  // Add counts to filter options
  const filterOptionsWithCounts = useMemo(() => {
    return translatedFilterOptions.map((opt) => {
      let count: number;
      switch (opt.value) {
        case 'all':
          count = total;
          break;
        case 'enabled':
          count = enabledCount;
          break;
        case 'disabled':
          count = disabledCount;
          break;
        default:
          count = 0;
      }
      return { ...opt, count };
    });
  }, [translatedFilterOptions, total, enabledCount, disabledCount]);

  // Filter rules by search query (client-side)
  const filteredRules = useMemo(() => {
    if (!searchQuery) return rules;

    const query = searchQuery.toLowerCase();
    return rules.filter((rule) => {
      const matchName = rule.name.toLowerCase().includes(query);
      const matchAddress = rule.serverAddress.toLowerCase().includes(query);
      const matchSource = rule.externalSource?.toLowerCase().includes(query);
      const matchId = rule.id.toLowerCase().includes(query);
      return matchName || matchAddress || matchSource || matchId;
    });
  }, [rules, searchQuery]);

  // Handle status filter change
  const handleStatusChange = useCallback((value: StatusFilter) => {
    onStatusFilterChange(value === 'all' ? undefined : value);
  }, [onStatusFilterChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    onStatusFilterChange(undefined);
  }, [onStatusFilterChange]);

  const hasFilter = searchQuery !== '' || statusFilter !== undefined;

  return (
    <div className="pb-20">
      {/* Header Section */}
      <div className="space-y-2 mb-3">
        {/* Stats Summary */}
        <StatsSummary
          total={total}
          enabled={enabledCount}
          disabled={disabledCount}
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
          value={statusFilter || 'all'}
          onChange={handleStatusChange}
        />
      </div>

      {/* Results count when filtered */}
      {hasFilter && !loading && filteredRules.length > 0 && (
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-muted-foreground">
            {t('admin.subscriptions.found')} <span className="font-medium text-foreground">{filteredRules.length}</span> {t('admin.subscriptions.results')}
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

      {/* Rule List */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredRules.length === 0 ? (
        <EmptyState
          hasFilter={hasFilter}
          onClearFilter={clearFilters}
          onCreate={onCreate}
          t={t}
        />
      ) : (
        <AdminExternalForwardRuleMobileList
          rules={filteredRules}
          isLoading={false}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
          hidePagination
        />
      )}

      {/* Pagination */}
      {!loading && filteredRules.length > 0 && (
        <Pagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}

      {/* Floating Action Button */}
      <FloatingActionButton onClick={onCreate} />
    </div>
  );
};

MobileAdminExternalForwardRulesView.displayName = 'MobileAdminExternalForwardRulesView';
