/**
 * MobileForwardAgentManagement - iOS 26 Liquid Glass styled forward agent management for mobile
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
  Cpu,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowUpCircle,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  GripVertical,
} from 'lucide-react';
import { MobileStatsScroller } from '@/components/mobile/admin';
import { AdminBadge } from '@/components/admin';
import { DraggableMobileList } from '@/components/admin/DraggableMobileList';
import { Skeleton } from '@/components/common/Skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { cn } from '@/lib/utils';
import { MobileForwardAgentCard } from './MobileForwardAgentCard';
import type { ForwardAgent } from '@/api/forward';

// ============================================================================
// Types
// ============================================================================

export interface MobileForwardAgentManagementProps {
  forwardAgents: ForwardAgent[];
  loading?: boolean;
  refreshing?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (agent: ForwardAgent) => void;
  onDelete: (agent: ForwardAgent) => void;
  onEnable: (agent: ForwardAgent) => void;
  onDisable: (agent: ForwardAgent) => void;
  onGetInstallScript: (agent: ForwardAgent) => void;
  onCopy: (agent: ForwardAgent) => void;
  onRegenerateToken: (agent: ForwardAgent) => void;
  onCheckUpdate?: (agent: ForwardAgent) => void;
  onPageChange: (page: number) => void;
  checkingAgentId?: string | number | null;
  // Drag sort props
  onDragEnd?: (activeId: string, overId: string, oldIndex: number, newIndex: number) => void;
  isReordering?: boolean;
}

type StatusFilter = 'all' | 'enabled' | 'disabled' | 'online' | 'offline';

// ============================================================================
// Filter Options
// ============================================================================

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'enabled', label: '启用' },
  { value: 'disabled', label: '禁用' },
  { value: 'online', label: '在线' },
  { value: 'offline', label: '离线' },
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
      <Cpu className="size-8 text-muted-foreground" />
    </div>
    <p className="text-base font-medium text-foreground mb-1">
      {hasFilter ? '未找到匹配节点' : '暂无转发Agent'}
    </p>
    <p className="text-sm text-muted-foreground text-center mb-4">
      {hasFilter ? '尝试调整搜索条件或清除筛选' : '点击右上角按钮创建第一个节点'}
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
          page <= 1
            ? 'opacity-40'
            : 'hover:bg-foreground/10 motion-safe:active:scale-[0.97]'
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
          page >= totalPages
            ? 'opacity-40'
            : 'hover:bg-foreground/10 motion-safe:active:scale-[0.97]'
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

export const MobileForwardAgentManagement = ({
  forwardAgents,
  loading = false,
  refreshing = false,
  page,
  pageSize,
  total,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
  onEnable,
  onDisable,
  onGetInstallScript,
  onCopy,
  onRegenerateToken,
  onCheckUpdate,
  onPageChange,
  checkingAgentId,
  onDragEnd,
  isReordering = false,
}: MobileForwardAgentManagementProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dragSortEnabled, setDragSortEnabled] = useState(false);

  // Get agent ID for drag-and-drop
  const getAgentId = useCallback((agent: ForwardAgent) => String(agent.id), []);

  // Calculate stats from forwardAgents
  const stats = useMemo(() => {
    const enabled = forwardAgents.filter((a) => a.status === 'enabled').length;
    const disabled = forwardAgents.filter((a) => a.status === 'disabled').length;
    const online = forwardAgents.filter((a) => a.isOnline).length;
    const updatable = forwardAgents.filter(
      (a) => a.hasUpdate && a.status === 'enabled' && a.isOnline
    ).length;
    return { total, enabled, disabled, online, updatable };
  }, [forwardAgents, total]);

  // Filter agents by search and status
  const filteredAgents = useMemo(() => {
    return forwardAgents.filter((agent) => {
      // Status filter
      if (statusFilter === 'enabled' && agent.status !== 'enabled') return false;
      if (statusFilter === 'disabled' && agent.status !== 'disabled') return false;
      if (statusFilter === 'online' && !agent.isOnline) return false;
      if (statusFilter === 'offline' && agent.isOnline) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = agent.name?.toLowerCase().includes(query);
        const matchAddress = agent.publicAddress?.toLowerCase().includes(query);
        const matchRemark = agent.remark?.toLowerCase().includes(query);
        if (!matchName && !matchAddress && !matchRemark) {
          return false;
        }
      }

      return true;
    });
  }, [forwardAgents, searchQuery, statusFilter]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, []);

  const hasFilter = searchQuery !== '' || statusFilter !== 'all';

  // Stats configuration for MobileStatsScroller
  const statsConfig = [
    {
      title: '总节点',
      value: stats.total,
      icon: <Cpu className="size-3.5" />,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      loading,
    },
    {
      title: '启用',
      value: stats.enabled,
      icon: <CheckCircle2 className="size-3.5" />,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      loading,
    },
    {
      title: '禁用',
      value: stats.disabled,
      icon: <XCircle className="size-3.5" />,
      iconBg: 'bg-muted/50',
      iconColor: 'text-muted-foreground',
      loading,
    },
    {
      title: '在线',
      value: stats.online,
      icon: <Activity className="size-3.5" />,
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
      loading,
    },
    {
      title: '可更新',
      value: stats.updatable,
      icon: <ArrowUpCircle className="size-3.5" />,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      loading,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Stats Grid */}
      <MobileStatsScroller stats={statsConfig} className="px-0" />

      {/* Action Bar - Search + Filter + Sort + Refresh + Add */}
      <div className="flex items-center gap-1.5">
        {/* Search Bar */}
        <div
          className={cn(
            'flex-1 flex items-center gap-2',
            'h-10 min-h-[44px] px-2.5',
            'bg-foreground/5 rounded-xl',
            'border border-border/50',
            'focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30',
            'transition-colors',
            dragSortEnabled && 'opacity-50 pointer-events-none'
          )}
        >
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={dragSortEnabled ? '排序中...' : '搜索...'}
            disabled={dragSortEnabled}
            className={cn(
              'flex-1 min-w-0',
              'bg-transparent',
              'text-sm text-foreground placeholder:text-muted-foreground',
              'focus:outline-none',
              'disabled:cursor-not-allowed'
            )}
          />
          {searchQuery && !dragSortEnabled && (
            <button
              onClick={() => setSearchQuery('')}
              className="size-7 rounded-full flex items-center justify-center hover:bg-foreground/10"
            >
              <X className="size-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Status Filter Dropdown - hidden in drag sort mode */}
        {!dragSortEnabled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'size-10 min-h-[44px] min-w-[44px] rounded-xl shrink-0',
                  'flex items-center justify-center relative',
                  'bg-foreground/5 hover:bg-foreground/10',
                  'border border-border/50',
                  'transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                  statusFilter !== 'all' ? 'text-primary border-primary/50' : 'text-muted-foreground'
                )}
              >
                <Filter className="size-4" />
                {statusFilter !== 'all' && (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary" />
                )}
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
        )}

        {/* Drag Sort Toggle Button */}
        {onDragEnd && (
          <button
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
              'size-10 min-h-[44px] min-w-[44px] rounded-xl shrink-0',
              'flex items-center justify-center',
              'border border-border/50',
              'transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
              dragSortEnabled
                ? 'bg-primary/10 border-primary/50 text-primary'
                : 'bg-foreground/5 hover:bg-foreground/10 text-muted-foreground'
            )}
          >
            <GripVertical className="size-4" />
          </button>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={refreshing || isReordering}
          className={cn(
            'size-10 min-h-[44px] min-w-[44px] rounded-xl shrink-0',
            'flex items-center justify-center',
            'bg-foreground/5 hover:bg-foreground/10',
            'border border-border/50',
            'transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
          )}
        >
          <RefreshCw
            className={cn('size-4 text-muted-foreground', (refreshing || isReordering) && 'animate-spin')}
          />
        </button>

        {/* Add Button */}
        <button
          onClick={onCreate}
          className={cn(
            'size-10 min-h-[44px] min-w-[44px] rounded-xl shrink-0',
            'flex items-center justify-center',
            'bg-primary text-primary-foreground',
            'motion-safe:active:scale-[0.97]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
          )}
        >
          <Plus className="size-5" />
        </button>
      </div>

      {/* Drag Sort Mode Hint */}
      {dragSortEnabled && (
        <div className="flex items-center justify-between px-1">
          <AdminBadge variant="info" className="text-xs">
            长按卡片拖拽排序
          </AdminBadge>
          <button
            onClick={() => setDragSortEnabled(false)}
            className="text-xs text-primary hover:underline"
          >
            退出排序
          </button>
        </div>
      )}

      {/* Active Filter Badge */}
      {hasFilter && !dragSortEnabled && (
        <div className="flex items-center justify-between">
          <AdminBadge variant="info" className="text-xs">
            显示 {filteredAgents.length} 条结果
          </AdminBadge>
          <button
            onClick={clearFilters}
            className="text-xs text-primary hover:underline"
          >
            清除筛选
          </button>
        </div>
      )}

      {/* Agent List */}
      {loading || isReordering ? (
        <LoadingSkeleton />
      ) : (dragSortEnabled ? forwardAgents : filteredAgents).length === 0 ? (
        <EmptyState hasFilter={hasFilter && !dragSortEnabled} onClearFilter={clearFilters} />
      ) : dragSortEnabled && onDragEnd ? (
        // Drag sort mode: use DraggableMobileList with original agents order
        <DraggableMobileList
          items={forwardAgents}
          getItemId={getAgentId}
          renderItem={(agent) => (
            <MobileForwardAgentCard
              agent={agent}
              onEdit={onEdit}
              onDelete={onDelete}
              onEnable={onEnable}
              onDisable={onDisable}
              onGetInstallScript={onGetInstallScript}
              onCopy={onCopy}
              onRegenerateToken={onRegenerateToken}
              onCheckUpdate={onCheckUpdate}
              checkingAgentId={checkingAgentId}
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
          {filteredAgents.map((agent) => (
            <MobileForwardAgentCard
              key={agent.id}
              agent={agent}
              onEdit={onEdit}
              onDelete={onDelete}
              onEnable={onEnable}
              onDisable={onDisable}
              onGetInstallScript={onGetInstallScript}
              onCopy={onCopy}
              onRegenerateToken={onRegenerateToken}
              onCheckUpdate={onCheckUpdate}
              checkingAgentId={checkingAgentId}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredAgents.length > 0 && (
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

MobileForwardAgentManagement.displayName = 'MobileForwardAgentManagement';
