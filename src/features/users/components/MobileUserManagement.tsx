/**
 * MobileUserManagement - Redesigned iOS-style user management for mobile
 *
 * Key improvements:
 * - Compact 3-stat summary row
 * - Clean iOS-style search bar
 * - Segmented filter for quick status filtering
 * - Swipe-action cards for user list
 * - Floating action button for creating users
 * - Pull-to-refresh pattern
 * - Better empty states
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import { MobileSegmentedFilter, type SegmentOption } from '@/components/mobile';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';
import { MobileUserCard } from './MobileUserCard';
import { UserDetailSheet } from './UserDetailSheet';
import type { UserResponse } from '@/api/user';

// ============================================================================
// Types
// ============================================================================

export interface MobileUserManagementProps {
  users: UserResponse[];
  loading?: boolean;
  refreshing?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (user: UserResponse) => void;
  onDelete: (user: UserResponse) => void;
  onAssignSubscription: (user: UserResponse) => void;
  onResetPassword: (user: UserResponse) => void;
  onPageChange: (page: number) => void;
}

type StatusFilter = 'all' | 'active' | 'pending' | 'inactive' | 'suspended';

// ============================================================================
// Filter Options
// ============================================================================

const STATUS_FILTER_OPTIONS: SegmentOption<StatusFilter>[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '激活' },
  { value: 'pending', label: '待验证' },
  { value: 'inactive', label: '未激活', hideWhenZero: true },
  { value: 'suspended', label: '封禁', hideWhenZero: true },
];

// ============================================================================
// Sub Components
// ============================================================================

/**
 * Compact stats summary - 3 key metrics
 */
const StatsSummary = ({
  total,
  active,
  pending,
  loading,
}: {
  total: number;
  active: number;
  pending: number;
  loading: boolean;
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-20" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between text-xs px-1">
      <div className="flex items-center gap-1.5">
        <Users className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">总数</span>
        <span className="font-semibold text-foreground tabular-nums">{total}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="size-3.5 text-success" />
        <span className="text-muted-foreground">激活</span>
        <span className="font-semibold text-success tabular-nums">{active}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Clock className="size-3.5 text-warning" />
        <span className="text-muted-foreground">待验证</span>
        <span className="font-semibold text-warning tabular-nums">{pending}</span>
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
        placeholder="搜索姓名或邮箱..."
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
}: {
  hasFilter: boolean;
  onClearFilter: () => void;
  onCreate: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-6">
    <div className="size-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
      {hasFilter ? (
        <Search className="size-10 text-muted-foreground/50" />
      ) : (
        <UserPlus className="size-10 text-muted-foreground/50" />
      )}
    </div>
    <p className="text-base font-medium text-foreground mb-1 text-center">
      {hasFilter ? '未找到匹配用户' : '暂无用户'}
    </p>
    <p className="text-sm text-muted-foreground text-center mb-5">
      {hasFilter ? '尝试调整搜索条件或清除筛选' : '点击下方按钮创建第一个用户'}
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
          清除筛选
        </>
      ) : (
        <>
          <Plus className="size-4" />
          创建用户
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
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
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

export const MobileUserManagement = ({
  users,
  loading = false,
  refreshing = false,
  page,
  pageSize,
  total,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
  onAssignSubscription,
  onResetPassword,
  onPageChange,
}: MobileUserManagementProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === 'active').length;
    const pending = users.filter((u) => u.status === 'pending').length;
    const inactive = users.filter((u) => u.status === 'inactive').length;
    const suspended = users.filter((u) => u.status === 'suspended').length;
    return { total, active, pending, inactive, suspended };
  }, [users, total]);

  // Add counts to filter options
  const filterOptionsWithCounts = useMemo(() => {
    return STATUS_FILTER_OPTIONS.map((opt) => ({
      ...opt,
      count: opt.value === 'all' ? total : stats[opt.value as keyof typeof stats],
    }));
  }, [stats, total]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Status filter
      if (statusFilter !== 'all' && user.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = user.name?.toLowerCase().includes(query);
        const matchEmail = user.email.toLowerCase().includes(query);
        if (!matchName && !matchEmail) {
          return false;
        }
      }

      return true;
    });
  }, [users, searchQuery, statusFilter]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, []);

  const hasFilter = searchQuery !== '' || statusFilter !== 'all';

  // Handle card press - open detail sheet
  const handleCardPress = useCallback((user: UserResponse) => {
    setSelectedUser(user);
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
          pending={stats.pending}
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
      {hasFilter && !loading && filteredUsers.length > 0 && (
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-muted-foreground">
            找到 <span className="font-medium text-foreground">{filteredUsers.length}</span> 个结果
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

      {/* User List */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          hasFilter={hasFilter}
          onClearFilter={clearFilters}
          onCreate={onCreate}
        />
      ) : (
        <div className="space-y-2.5">
          {filteredUsers.map((user) => (
            <MobileUserCard
              key={user.id}
              user={user}
              onCardPress={handleCardPress}
              onEdit={onEdit}
              onDelete={onDelete}
              onAssignSubscription={onAssignSubscription}
              onResetPassword={onResetPassword}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredUsers.length > 0 && (
        <Pagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}

      {/* Floating Action Button */}
      <FloatingActionButton onClick={onCreate} />

      {/* User Detail Sheet */}
      <UserDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        user={selectedUser}
        onEdit={onEdit}
        onAssignSubscription={onAssignSubscription}
        onResetPassword={onResetPassword}
        onDelete={onDelete}
      />
    </div>
  );
};

MobileUserManagement.displayName = 'MobileUserManagement';
