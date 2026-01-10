/**
 * MobilePlanManagement - iOS 26 Liquid Glass styled plan management for mobile
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
  Plus,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  XCircle,
  Globe,
  Lock,
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
import { MobilePlanCard } from './MobilePlanCard';
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
// Filter Options
// ============================================================================

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '激活' },
  { value: 'inactive', label: '停用' },
  { value: 'public', label: '公开' },
  { value: 'private', label: '私有' },
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
      <CreditCard className="size-8 text-muted-foreground" />
    </div>
    <p className="text-base font-medium text-foreground mb-1">
      {hasFilter ? '未找到匹配计划' : '暂无订阅计划'}
    </p>
    <p className="text-sm text-muted-foreground text-center mb-4">
      {hasFilter ? '尝试调整搜索条件或清除筛选' : '点击右上角按钮创建第一个计划'}
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Calculate stats from plans
  const stats = useMemo(() => {
    const active = plans.filter((p) => p.status === 'active').length;
    const inactive = plans.filter((p) => p.status === 'inactive').length;
    const publicPlans = plans.filter((p) => p.isPublic).length;
    const privatePlans = plans.filter((p) => !p.isPublic).length;
    return { total, active, inactive, publicPlans, privatePlans };
  }, [plans, total]);

  // Filter plans by search and status
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      // Status/visibility filter
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

  // Get current filter label
  const currentFilterLabel = STATUS_FILTERS.find((f) => f.value === statusFilter)?.label || '全部状态';

  // Stats configuration for MobileStatsScroller
  const statsConfig = [
    {
      title: '总计划',
      value: stats.total,
      icon: <CreditCard className="size-3.5" />,
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
      title: '停用',
      value: stats.inactive,
      icon: <XCircle className="size-3.5" />,
      iconBg: 'bg-muted/50',
      iconColor: 'text-muted-foreground',
      loading,
    },
    {
      title: '公开',
      value: stats.publicPlans,
      icon: <Globe className="size-3.5" />,
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
      loading,
    },
    {
      title: '私有',
      value: stats.privatePlans,
      icon: <Lock className="size-3.5" />,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      loading,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Stats Grid */}
      <MobileStatsScroller stats={statsConfig} className="px-0" />

      {/* Action Bar - Search + Filter + Refresh + Create */}
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
            placeholder="搜索计划..."
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

        {/* Add Button */}
        <button
          onClick={onCreate}
          className={cn(
            'size-11 min-h-[44px] min-w-[44px] rounded-xl shrink-0',
            'flex items-center justify-center',
            'bg-primary text-primary-foreground',
            'motion-safe:active:scale-[0.97]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
          )}
        >
          <Plus className="size-5" />
        </button>
      </div>

      {/* Active Filter Badge */}
      {hasFilter && (
        <div className="flex items-center justify-between">
          <AdminBadge variant="info" className="text-xs">
            显示 {filteredPlans.length} 条结果
          </AdminBadge>
          <button
            onClick={clearFilters}
            className="text-xs text-primary hover:underline"
          >
            清除筛选
          </button>
        </div>
      )}

      {/* Plan List */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredPlans.length === 0 ? (
        <EmptyState hasFilter={hasFilter} onClearFilter={clearFilters} />
      ) : (
        <div className="space-y-2.5">
          {filteredPlans.map((plan) => (
            <MobilePlanCard
              key={plan.id}
              plan={plan}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onToggleStatus={onToggleStatus}
              onViewSubscriptions={onViewSubscriptions}
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
    </div>
  );
};

MobilePlanManagement.displayName = 'MobilePlanManagement';
