/**
 * MobileSubscriptionManagement - Redesigned iOS-style subscription management for mobile
 *
 * Key improvements:
 * - Compact 3-stat summary row
 * - Clean iOS-style search bar
 * - Segmented filter for quick status filtering
 * - Swipe-action cards with tap-to-detail
 * - Floating action button for creating subscriptions (optional)
 * - Better empty states
 */

import { useState, useMemo, useCallback } from 'react';
import {
  RefreshCw,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MobileSegmentedFilter, type SegmentOption } from '@/components/mobile';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';
import { MobileSubscriptionCard } from './MobileSubscriptionCard';
import { SubscriptionDetailSheet } from './SubscriptionDetailSheet';
import type { Subscription, SubscriptionStatus } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user';

// ============================================================================
// Types
// ============================================================================

export interface MobileSubscriptionManagementProps {
  subscriptions: Subscription[];
  usersMap: Record<string, UserResponse>;
  loading?: boolean;
  refreshing?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onRefresh: () => void;
  onViewDetail: (subscription: Subscription) => void;
  onActivate: (subscription: Subscription) => void;
  onCancel: (subscription: Subscription) => void;
  onRenew: (subscription: Subscription) => void;
  onDelete: (subscription: Subscription) => void;
  onPageChange: (page: number) => void;
}

type StatusFilter = 'all' | SubscriptionStatus;

// ============================================================================
// Filter Options
// ============================================================================

const STATUS_FILTER_OPTIONS: SegmentOption<StatusFilter>[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '激活' },
  { value: 'expired', label: '过期', hideWhenZero: true },
  { value: 'cancelled', label: '取消', hideWhenZero: true },
  { value: 'pending', label: '待处理', hideWhenZero: true },
  { value: 'renewed', label: '续费', hideWhenZero: true },
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
  expired,
  loading,
}: {
  total: number;
  active: number;
  expired: number;
  loading: boolean;
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
        <Receipt className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">总数</span>
        <span className="font-semibold text-foreground tabular-nums">{total}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="size-3.5 text-success" />
        <span className="text-muted-foreground">激活</span>
        <span className="font-semibold text-success tabular-nums">{active}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <AlertCircle className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">过期</span>
        <span className="font-semibold text-foreground tabular-nums">{expired}</span>
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
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
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
        placeholder="搜索用户、计划..."
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
}: {
  hasFilter: boolean;
  onClearFilter: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-6">
    <div className="size-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
      {hasFilter ? (
        <Search className="size-10 text-muted-foreground/50" />
      ) : (
        <Receipt className="size-10 text-muted-foreground/50" />
      )}
    </div>
    <p className="text-base font-medium text-foreground mb-1 text-center">
      {hasFilter ? '未找到匹配订阅' : '暂无订阅'}
    </p>
    <p className="text-sm text-muted-foreground text-center mb-5">
      {hasFilter ? '尝试调整搜索条件或清除筛选' : '当前没有任何订阅记录'}
    </p>
    {hasFilter && (
      <button
        type="button"
        onClick={onClearFilter}
        className={cn(
          'flex items-center gap-2',
          'px-5 py-2.5 min-h-[44px]',
          'rounded-full',
          'text-sm font-medium',
          'bg-muted text-foreground',
          'active:scale-[0.97] transition-transform'
        )}
      >
        <X className="size-4" />
        清除筛选
      </button>
    )}
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
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-3 w-1" />
          <Skeleton className="h-3 w-20" />
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

// ============================================================================
// Main Component
// ============================================================================

export const MobileSubscriptionManagement = ({
  subscriptions,
  usersMap,
  loading = false,
  refreshing = false,
  page,
  pageSize,
  total,
  onRefresh,
  onViewDetail,
  onActivate,
  onCancel,
  onRenew,
  onDelete,
  onPageChange,
}: MobileSubscriptionManagementProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === 'active').length;
    const cancelled = subscriptions.filter((s) => s.status === 'cancelled').length;
    const expired = subscriptions.filter((s) => s.status === 'expired').length;
    const pending = subscriptions.filter((s) => s.status === 'pending').length;
    const renewed = subscriptions.filter((s) => s.status === 'renewed').length;
    return { total, active, cancelled, expired, pending, renewed };
  }, [subscriptions, total]);

  // Add counts to filter options
  const filterOptionsWithCounts = useMemo(() => {
    return STATUS_FILTER_OPTIONS.map((opt) => {
      let count: number;
      switch (opt.value) {
        case 'all':
          count = total;
          break;
        case 'active':
          count = stats.active;
          break;
        case 'expired':
          count = stats.expired;
          break;
        case 'cancelled':
          count = stats.cancelled;
          break;
        case 'pending':
          count = stats.pending;
          break;
        case 'renewed':
          count = stats.renewed;
          break;
        default:
          count = 0;
      }
      return { ...opt, count };
    });
  }, [stats, total]);

  // Filter subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((subscription) => {
      // Status filter
      if (statusFilter !== 'all' && subscription.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const user = usersMap[subscription.userId];
        const matchUserName = user?.name?.toLowerCase().includes(query);
        const matchUserEmail = user?.email?.toLowerCase().includes(query);
        const matchPlanName = subscription.plan?.name?.toLowerCase().includes(query);
        const matchId = subscription.id.toLowerCase().includes(query);
        if (!matchUserName && !matchUserEmail && !matchPlanName && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [subscriptions, searchQuery, statusFilter, usersMap]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, []);

  const hasFilter = searchQuery !== '' || statusFilter !== 'all';

  // Handle card press - open detail sheet
  const handleCardPress = useCallback((subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDetailSheetOpen(true);
  }, []);

  // Get selected user for detail sheet
  const selectedUser = selectedSubscription ? usersMap[selectedSubscription.userId] : undefined;

  return (
    <div className="pb-20">
      {/* Header Section */}
      <div className="space-y-3 mb-4">
        {/* Stats Summary */}
        <StatsSummary
          total={stats.total}
          active={stats.active}
          expired={stats.expired}
          loading={loading}
        />

        {/* Search Bar with Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
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
      {hasFilter && !loading && filteredSubscriptions.length > 0 && (
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-muted-foreground">
            找到 <span className="font-medium text-foreground">{filteredSubscriptions.length}</span> 条结果
          </span>
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-primary font-medium"
          >
            清除筛选
          </button>
        </div>
      )}

      {/* Subscription List */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredSubscriptions.length === 0 ? (
        <EmptyState
          hasFilter={hasFilter}
          onClearFilter={clearFilters}
        />
      ) : (
        <div className="space-y-2.5">
          {filteredSubscriptions.map((subscription) => (
            <MobileSubscriptionCard
              key={subscription.id}
              subscription={subscription}
              user={usersMap[subscription.userId]}
              onCardPress={handleCardPress}
              onViewDetail={onViewDetail}
              onActivate={onActivate}
              onCancel={onCancel}
              onRenew={onRenew}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredSubscriptions.length > 0 && (
        <Pagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}

      {/* Subscription Detail Sheet */}
      <SubscriptionDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        entity={selectedSubscription}
        user={selectedUser}
        onActivate={onActivate}
        onCancel={onCancel}
        onRenew={onRenew}
        onDelete={onDelete}
      />
    </div>
  );
};

MobileSubscriptionManagement.displayName = 'MobileSubscriptionManagement';
