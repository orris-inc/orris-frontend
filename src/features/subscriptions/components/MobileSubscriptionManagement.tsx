/**
 * MobileSubscriptionManagement - iOS 26 Liquid Glass styled subscription management for mobile
 *
 * Designed to work inside AdminLayout:
 * - Compact inline header with title and actions
 * - 3-column stats grid for quick overview
 * - Search input with dropdown filter
 * - Pull-to-refresh pattern (simulated via refresh button)
 * - Infinite scroll friendly card list
 * - Empty and loading states with proper feedback
 * - All touch targets minimum 44px
 */

import { useState, useMemo, useCallback } from 'react';
import {
  RefreshCw,
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { MobileStatsScroller } from '@/components/mobile/admin';
import { AdminBadge } from '@/components/admin';
import { Skeleton } from '@/components/common/Skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { cn } from '@/lib/utils';
import { MobileSubscriptionCard } from './MobileSubscriptionCard';
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

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '激活' },
  { value: 'expired', label: '过期' },
  { value: 'cancelled', label: '取消' },
  { value: 'pending', label: '待处理' },
];

// ============================================================================
// Loading Skeleton
// ============================================================================

const CardSkeleton = () => (
  <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-4 space-y-3">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-5 w-5 rounded-full" />
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-2.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  hasFilter: boolean;
  onClearFilter: () => void;
}

const EmptyState = ({ hasFilter, onClearFilter }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
      <Receipt className="size-8 text-muted-foreground" />
    </div>
    <p className="text-base font-medium text-foreground mb-1">
      {hasFilter ? '未找到匹配订阅' : '暂无订阅'}
    </p>
    <p className="text-sm text-muted-foreground text-center mb-4">
      {hasFilter ? '尝试调整搜索条件或清除筛选' : '当前没有任何订阅记录'}
    </p>
    {hasFilter && (
      <button
        onClick={onClearFilter}
        className={cn(
          'px-4 py-2 min-h-[44px]',
          'rounded-full',
          'text-sm font-medium',
          'bg-primary text-primary-foreground',
          'motion-safe:active:scale-[0.97]'
        )}
      >
        清除筛选
      </button>
    )}
  </div>
);

// ============================================================================
// Pagination
// ============================================================================

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ page, total, pageSize, onPageChange }: PaginationProps) => {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 py-4 px-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          'size-10 rounded-full',
          'flex items-center justify-center',
          'bg-foreground/5',
          'transition-colors',
          page <= 1 ? 'opacity-40' : 'hover:bg-foreground/10 motion-safe:active:scale-[0.97]'
        )}
      >
        <ChevronLeft className="size-5" />
      </button>

      <span className="text-sm text-muted-foreground tabular-nums">
        {page} / {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          'size-10 rounded-full',
          'flex items-center justify-center',
          'bg-foreground/5',
          'transition-colors',
          page >= totalPages ? 'opacity-40' : 'hover:bg-foreground/10 motion-safe:active:scale-[0.97]'
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

  // Calculate stats from subscriptions
  const stats = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === 'active').length;
    const cancelled = subscriptions.filter((s) => s.status === 'cancelled').length;
    const expired = subscriptions.filter((s) => s.status === 'expired').length;
    const pending = subscriptions.filter((s) => s.status === 'pending').length;
    return { total, active, cancelled, expired, pending };
  }, [subscriptions, total]);

  // Filter subscriptions by search and status
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

  // Get current filter label
  const currentFilterLabel = STATUS_FILTERS.find((f) => f.value === statusFilter)?.label || '全部状态';

  // Stats configuration for MobileStatsScroller
  const statsConfig = [
    {
      title: '总订阅',
      value: stats.total,
      icon: <Receipt className="size-3.5" />,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      loading,
    },
    {
      title: '激活',
      value: stats.active,
      icon: <CheckCircle2 className="size-3.5" />,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      loading,
    },
    {
      title: '过期',
      value: stats.expired,
      icon: <AlertCircle className="size-3.5" />,
      iconBg: 'bg-muted/50',
      iconColor: 'text-muted-foreground',
      loading,
    },
    {
      title: '取消',
      value: stats.cancelled,
      icon: <XCircle className="size-3.5" />,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      loading,
    },
    {
      title: '待处理',
      value: stats.pending,
      icon: <Clock className="size-3.5" />,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      loading,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Stats Grid */}
      <MobileStatsScroller stats={statsConfig} className="px-0" />

      {/* Action Bar - Search + Filter + Refresh */}
      <div className="flex items-center gap-2">
        {/* Search Bar */}
        <div
          className={cn(
            'flex-1 flex items-center gap-2',
            'h-11 min-h-[44px] px-3',
            'bg-foreground/5 rounded-xl',
            'border border-border/50',
            'focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30',
            'transition-colors'
          )}
        >
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索订阅..."
            className={cn(
              'flex-1 min-w-0',
              'bg-transparent',
              'text-sm text-foreground placeholder:text-muted-foreground',
              'focus:outline-none'
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="size-8 min-h-[44px] rounded-full flex items-center justify-center hover:bg-foreground/10"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Status Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'h-10 px-3 rounded-xl shrink-0',
                'flex items-center gap-1.5',
                'bg-foreground/5 hover:bg-foreground/10',
                'border border-border/50',
                'text-sm font-medium',
                'transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                statusFilter !== 'all' ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Filter className="size-4" />
              <span className="hidden xs:inline">{currentFilterLabel}</span>
              <ChevronDown className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            {STATUS_FILTERS.map((filter) => (
              <DropdownMenuItem
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  'cursor-pointer',
                  statusFilter === filter.value && 'bg-primary/10 text-primary'
                )}
              >
                {filter.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className={cn(
            'size-11 min-h-[44px] min-w-[44px] rounded-xl shrink-0',
            'flex items-center justify-center',
            'bg-foreground/5 hover:bg-foreground/10',
            'border border-border/50',
            'transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
          )}
        >
          <RefreshCw
            className={cn('size-4 text-muted-foreground', refreshing && 'animate-spin')}
          />
        </button>
      </div>

      {/* Active Filter Badge */}
      {hasFilter && (
        <div className="flex items-center justify-between">
          <AdminBadge variant="info" className="text-xs">
            显示 {filteredSubscriptions.length} 条结果
          </AdminBadge>
          <button
            onClick={clearFilters}
            className="text-xs text-primary hover:underline"
          >
            清除筛选
          </button>
        </div>
      )}

      {/* Subscription List */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredSubscriptions.length === 0 ? (
        <EmptyState hasFilter={hasFilter} onClearFilter={clearFilters} />
      ) : (
        <div className="space-y-2.5">
          {filteredSubscriptions.map((subscription) => (
            <MobileSubscriptionCard
              key={subscription.id}
              subscription={subscription}
              user={usersMap[subscription.userId]}
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
        <Pagination page={page} total={total} pageSize={pageSize} onPageChange={onPageChange} />
      )}
    </div>
  );
};

MobileSubscriptionManagement.displayName = 'MobileSubscriptionManagement';
