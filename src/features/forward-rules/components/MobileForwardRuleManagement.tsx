/**
 * MobileForwardRuleManagement - iOS-style forward rule management for mobile
 *
 * Redesigned with:
 * - Compact stats scroller for quick overview
 * - iOS-style search bar
 * - Segmented filter for quick status/type filtering
 * - Swipe-action cards with tap-to-detail
 * - Drag sort support
 * - Card list with pagination
 * - Empty and loading states with proper feedback
 * - All touch targets minimum 44px
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  RefreshCw,
  ArrowLeftRight,
  CheckCircle2,
  Activity,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { MobileSegmentedFilter, type SegmentOption } from '@/components/mobile';
import { AdminBadge } from '@/components/admin';
import { DraggableMobileList } from '@/components/admin/DraggableMobileList';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';
import { MobileForwardRuleCard } from './MobileForwardRuleCard';
import type { ForwardRule, ForwardAgent, RuleOverallStatusResponse } from '@/api/forward';

// ============================================================================
// Types
// ============================================================================

export interface MobileForwardRuleManagementProps {
  rules: ForwardRule[];
  agentsMap?: Record<string, ForwardAgent>;
  polledStatusMap?: Record<string, RuleOverallStatusResponse>;
  pollingRuleIds?: string[];
  loading?: boolean;
  refreshing?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (rule: ForwardRule) => void;
  onCopy: (rule: ForwardRule) => void;
  onToggleStatus: (rule: ForwardRule) => void;
  onDelete: (rule: ForwardRule) => void;
  onPageChange: (page: number) => void;
  /** Callback when viewing rule details */
  onViewDetail: (rule: ForwardRule) => void;
  // Drag sort props
  onDragEnd?: (activeId: string, overId: string, oldIndex: number, newIndex: number) => void;
  isReordering?: boolean;
}

// Filter type combining status and rule type
type SegmentFilter = 'all' | 'enabled' | 'disabled' | 'direct' | 'entry' | 'chain' | 'direct_chain';

// ============================================================================
// Filter Options
// ============================================================================

const SEGMENT_FILTER_OPTIONS: SegmentOption<SegmentFilter>[] = [
  { value: 'all', label: '全部' },
  { value: 'enabled', label: '启用' },
  { value: 'disabled', label: '禁用', hideWhenZero: true },
  { value: 'direct', label: '直连' },
  { value: 'entry', label: '入口' },
  { value: 'chain', label: '链式', hideWhenZero: true },
  { value: 'direct_chain', label: '直连链', hideWhenZero: true },
];

// ============================================================================
// Stats Summary (compact inline style)
// ============================================================================

const StatsSummary = ({
  total,
  enabled,
  running,
  loading,
}: {
  total: number;
  enabled: number;
  running: number;
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
        <ArrowLeftRight className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">总数</span>
        <span className="font-semibold text-foreground tabular-nums">{total}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="size-3.5 text-success" />
        <span className="text-muted-foreground">启用</span>
        <span className="font-semibold text-success tabular-nums">{enabled}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Activity className="size-3.5 text-info" />
        <span className="text-muted-foreground">运行</span>
        <span className="font-semibold text-info tabular-nums">{running}</span>
      </div>
    </div>
  );
};

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
  onCreate: () => void;
}

const EmptyState = ({ hasFilter, onClearFilter, onCreate }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="size-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
      {hasFilter ? (
        <Search className="size-10 text-muted-foreground/50" />
      ) : (
        <ArrowLeftRight className="size-10 text-muted-foreground/50" />
      )}
    </div>
    <p className="text-base font-medium text-foreground mb-1 text-center">
      {hasFilter ? '未找到匹配规则' : '暂无转发规则'}
    </p>
    <p className="text-sm text-muted-foreground text-center mb-5">
      {hasFilter ? '尝试调整搜索条件或清除筛选' : '点击下方按钮创建第一个规则'}
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
          创建规则
        </>
      )}
    </button>
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
// Search Bar Component
// ============================================================================

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

const SearchBar = ({
  value,
  onChange,
  onClear,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  disabled?: boolean;
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2',
        'h-10 px-3',
        'bg-muted/50 rounded-xl',
        'focus-within:bg-muted/70',
        'transition-colors',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      <Search className="size-4 text-muted-foreground shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={disabled ? '排序中...' : '搜索规则名称...'}
        disabled={disabled}
        className={cn(
          'flex-1 min-w-0',
          'bg-transparent',
          'text-sm text-foreground placeholder:text-muted-foreground/60',
          'focus:outline-none',
          'disabled:cursor-not-allowed'
        )}
      />
      {value && !disabled && (
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

// ============================================================================
// Main Component
// ============================================================================

export const MobileForwardRuleManagement = ({
  rules,
  agentsMap = {},
  polledStatusMap = {},
  pollingRuleIds = [],
  loading = false,
  refreshing = false,
  page,
  pageSize,
  total,
  onRefresh,
  onCreate,
  onEdit,
  onCopy,
  onToggleStatus,
  onDelete,
  onPageChange,
  onViewDetail,
  onDragEnd,
  isReordering = false,
}: MobileForwardRuleManagementProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>('all');
  const [dragSortEnabled, setDragSortEnabled] = useState(false);

  // Get rule ID for drag-and-drop
  const getRuleId = useCallback((rule: ForwardRule) => rule.id, []);

  // Calculate stats from rules - includes rule type counts
  const stats = useMemo(() => {
    const enabled = rules.filter((r) => r.status === 'enabled').length;
    const disabled = rules.filter((r) => r.status === 'disabled').length;
    const syncing = rules.filter((r) => r.syncStatus === 'pending').length;
    const running = rules.filter((r) => r.runStatus === 'running').length;
    const direct = rules.filter((r) => r.ruleType === 'direct').length;
    const entry = rules.filter((r) => r.ruleType === 'entry').length;
    const chain = rules.filter((r) => r.ruleType === 'chain').length;
    const directChain = rules.filter((r) => r.ruleType === 'direct_chain').length;
    return { total, enabled, disabled, syncing, running, direct, entry, chain, directChain };
  }, [rules, total]);

  // Add counts to filter options for MobileSegmentedFilter
  const filterOptionsWithCounts = useMemo(() => {
    return SEGMENT_FILTER_OPTIONS.map((opt) => {
      let count: number;
      switch (opt.value) {
        case 'all':
          count = total;
          break;
        case 'enabled':
          count = stats.enabled;
          break;
        case 'disabled':
          count = stats.disabled;
          break;
        case 'direct':
          count = stats.direct;
          break;
        case 'entry':
          count = stats.entry;
          break;
        case 'chain':
          count = stats.chain;
          break;
        case 'direct_chain':
          count = stats.directChain;
          break;
        default:
          count = 0;
      }
      return { ...opt, count };
    });
  }, [stats, total]);

  // Filter rules by search and segment filter
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      // Segment filter (status or rule type)
      if (segmentFilter !== 'all') {
        // Check if it's a status filter
        if (segmentFilter === 'enabled' || segmentFilter === 'disabled') {
          if (rule.status !== segmentFilter) return false;
        } else {
          // It's a rule type filter
          if (rule.ruleType !== segmentFilter) return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = rule.name?.toLowerCase().includes(query);
        const matchRemark = rule.remark?.toLowerCase().includes(query);
        const matchId = rule.id.toLowerCase().includes(query);
        if (!matchName && !matchRemark && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [rules, searchQuery, segmentFilter]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSegmentFilter('all');
  }, []);

  const hasFilter = searchQuery !== '' || segmentFilter !== 'all';

  return (
    <div className="pb-20">
      {/* Header Section */}
      <div className="space-y-3 mb-4">
        {/* Stats Summary */}
        <StatsSummary
          total={stats.total}
          enabled={stats.enabled}
          running={stats.running}
          loading={loading}
        />

        {/* Search Bar with Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              disabled={dragSortEnabled}
            />
          </div>

          {/* Drag Sort Toggle Button */}
          {onDragEnd && (
            <button
              type="button"
              onClick={() => {
                const newState = !dragSortEnabled;
                setDragSortEnabled(newState);
                // Clear filters when entering drag sort mode
                if (newState && hasFilter) {
                  clearFilters();
                }
              }}
              disabled={isReordering}
              className={cn(
                'size-10 rounded-xl shrink-0',
                'flex items-center justify-center',
                'transition-colors',
                dragSortEnabled
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted/50 text-muted-foreground',
                'active:bg-muted'
              )}
            >
              <GripVertical className="size-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing || isReordering}
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
                (refreshing || isReordering) && 'animate-spin'
              )}
            />
          </button>
        </div>

        {/* Segmented Filter - hidden in drag sort mode */}
        {!dragSortEnabled && (
          <MobileSegmentedFilter
            options={filterOptionsWithCounts}
            value={segmentFilter}
            onChange={setSegmentFilter}
          />
        )}
      </div>

      {/* Results count when filtered */}
      {hasFilter && !loading && filteredRules.length > 0 && (
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-muted-foreground">
            找到 <span className="font-medium text-foreground">{filteredRules.length}</span> 个结果
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

      {/* Drag Sort Mode Hint */}
      {dragSortEnabled && (
        <div className="flex items-center justify-between mb-3 px-1">
          <AdminBadge variant="info" className="text-xs">
            长按卡片拖拽排序
          </AdminBadge>
          <button
            type="button"
            onClick={() => setDragSortEnabled(false)}
            className="text-xs text-primary font-medium"
          >
            退出排序
          </button>
        </div>
      )}

      {/* Rule List */}
      {loading || isReordering ? (
        <LoadingSkeleton />
      ) : (dragSortEnabled ? rules : filteredRules).length === 0 ? (
        <EmptyState
          hasFilter={hasFilter && !dragSortEnabled}
          onClearFilter={clearFilters}
          onCreate={onCreate}
        />
      ) : dragSortEnabled && onDragEnd ? (
        // Drag sort mode: use DraggableMobileList with original rules order
        <DraggableMobileList
          items={rules}
          getItemId={getRuleId}
          renderItem={(rule) => (
            <MobileForwardRuleCard
              rule={rule}
              agentsMap={agentsMap}
              polledStatus={polledStatusMap[rule.id]}
              isPolling={pollingRuleIds.includes(rule.id)}
              onCardPress={onViewDetail}
              onEdit={onEdit}
              onCopy={onCopy}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          )}
          onDragEnd={onDragEnd}
          enabled={true}
          longPressDelay={250}
          className="space-y-2.5"
        />
      ) : (
        // Normal mode: filtered list without drag
        <div className="space-y-2.5">
          {filteredRules.map((rule) => (
            <MobileForwardRuleCard
              key={rule.id}
              rule={rule}
              agentsMap={agentsMap}
              polledStatus={polledStatusMap[rule.id]}
              isPolling={pollingRuleIds.includes(rule.id)}
              onCardPress={onViewDetail}
              onEdit={onEdit}
              onCopy={onCopy}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredRules.length > 0 && !dragSortEnabled && (
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

MobileForwardRuleManagement.displayName = 'MobileForwardRuleManagement';
