/**
 * MobileNodeManagement - Redesigned iOS-style node management for mobile
 *
 * Key improvements:
 * - Compact 3-stat summary row
 * - Clean iOS-style search bar
 * - Segmented filter for quick status filtering
 * - Swipe-action cards with tap-to-detail
 * - Floating action button for creating nodes
 * - Better empty states
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  RefreshCw,
  Server,
  CheckCircle2,
  Activity,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { MobileSegmentedFilter, type SegmentOption } from '@/components/mobile';
import { DraggableMobileList } from '@/components/admin/DraggableMobileList';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';
import { MobileNodeCard } from './MobileNodeCard';
import { NodeDetailSheet } from './NodeDetailSheet';
import type { Node, NodeStatus } from '@/api/node';
import type { ResourceGroup } from '@/api/resource/types';

// ============================================================================
// Types
// ============================================================================

export interface MobileNodeManagementProps {
  nodes: Node[];
  resourceGroupsMap?: Record<string, ResourceGroup>;
  loading?: boolean;
  refreshing?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (node: Node) => void;
  onDelete: (node: Node) => void;
  onActivate: (node: Node) => void;
  onDeactivate: (node: Node) => void;
  onPageChange: (page: number) => void;
  // Drag sort
  enableDragSort?: boolean;
  onDragSortChange?: (enabled: boolean) => void;
  onDragEnd?: (activeId: string, overId: string, oldIndex: number, newIndex: number) => void;
}

type StatusFilter = 'all' | 'online' | 'offline' | NodeStatus;

// ============================================================================
// Filter Options - Using labelKey for i18n
// ============================================================================

interface StatusFilterOption extends SegmentOption<StatusFilter> {
  labelKey: string;
}

const STATUS_FILTER_OPTIONS: StatusFilterOption[] = [
  { value: 'all', label: '', labelKey: 'filter.all' },
  { value: 'online', label: '', labelKey: 'common.status.online' },
  { value: 'offline', label: '', labelKey: 'common.status.offline', hideWhenZero: true },
  { value: 'active', label: '', labelKey: 'common.status.active' },
  { value: 'inactive', label: '', labelKey: 'common.status.inactive', hideWhenZero: true },
  { value: 'maintenance', label: '', labelKey: 'common.status.maintenance', hideWhenZero: true },
];

// ============================================================================
// Sub Components
// ============================================================================

/**
 * Compact stats summary - 3 key metrics in one row
 */
const StatsSummary = ({
  total,
  online,
  active,
  loading,
  t,
}: {
  total: number;
  online: number;
  active: number;
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
        <Server className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">{t('admin.stats.totalNodes')}</span>
        <span className="font-semibold text-foreground tabular-nums">{total}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Activity className="size-3.5 text-success" />
        <span className="text-muted-foreground">{t('common.status.online')}</span>
        <span className="font-semibold text-success tabular-nums">{online}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="size-3.5 text-info" />
        <span className="text-muted-foreground">{t('common.status.active')}</span>
        <span className="font-semibold text-info tabular-nums">{active}</span>
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
        <Server className="size-10 text-muted-foreground/50" />
      )}
    </div>
    <p className="text-base font-medium text-foreground mb-1 text-center">
      {hasFilter ? t('common.messages.noResults') : t('admin.nodes.noData')}
    </p>
    <p className="text-sm text-muted-foreground text-center mb-5">
      {hasFilter
        ? t('subscription.tryAdjustSearch')
        : t('admin.nodes.addNode')}
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
          {t('admin.nodes.addNode')}
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

export const MobileNodeManagement = ({
  nodes,
  resourceGroupsMap = {},
  loading = false,
  refreshing = false,
  page,
  pageSize,
  total,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onPageChange,
  enableDragSort = false,
  onDragSortChange,
  onDragEnd,
}: MobileNodeManagementProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
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
    const online = nodes.filter((n) => n.isOnline).length;
    const offline = nodes.filter((n) => !n.isOnline).length;
    const active = nodes.filter((n) => n.status === 'active').length;
    const inactive = nodes.filter((n) => n.status === 'inactive').length;
    const maintenance = nodes.filter((n) => n.status === 'maintenance').length;
    return { total, online, offline, active, inactive, maintenance };
  }, [nodes, total]);

  // Add counts to filter options
  const filterOptionsWithCounts = useMemo(() => {
    return translatedFilterOptions.map((opt) => {
      let count: number;
      switch (opt.value) {
        case 'all':
          count = total;
          break;
        case 'online':
          count = stats.online;
          break;
        case 'offline':
          count = stats.offline;
          break;
        case 'active':
          count = stats.active;
          break;
        case 'inactive':
          count = stats.inactive;
          break;
        case 'maintenance':
          count = stats.maintenance;
          break;
        default:
          count = 0;
      }
      return { ...opt, count };
    });
  }, [translatedFilterOptions, stats, total]);

  // Filter nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      // Status filter
      if (statusFilter === 'online' && !node.isOnline) return false;
      if (statusFilter === 'offline' && node.isOnline) return false;
      if (statusFilter === 'active' && node.status !== 'active') return false;
      if (statusFilter === 'inactive' && node.status !== 'inactive') return false;
      if (statusFilter === 'maintenance' && node.status !== 'maintenance') return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = node.name.toLowerCase().includes(query);
        const matchAddress = node.serverAddress.toLowerCase().includes(query);
        const matchRegion = node.region?.toLowerCase().includes(query);
        const matchId = node.id.toLowerCase().includes(query);
        const matchTags = node.tags?.some((tag) => tag.toLowerCase().includes(query));
        if (!matchName && !matchAddress && !matchRegion && !matchId && !matchTags) {
          return false;
        }
      }

      return true;
    });
  }, [nodes, searchQuery, statusFilter]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, []);

  const hasFilter = searchQuery !== '' || statusFilter !== 'all';

  // Handle card press - open detail sheet
  const handleCardPress = useCallback((node: Node) => {
    setSelectedNode(node);
    setDetailSheetOpen(true);
  }, []);

  // Get node ID for drag sort
  const getNodeId = useCallback((node: Node) => node.id, []);

  // Render single node card
  const renderNodeCard = useCallback(
    (node: Node) => (
      <MobileNodeCard
        key={node.id}
        node={node}
        resourceGroupsMap={resourceGroupsMap}
        onCardPress={handleCardPress}
        onEdit={onEdit}
        onDelete={onDelete}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />
    ),
    [resourceGroupsMap, handleCardPress, onEdit, onDelete, onActivate, onDeactivate]
  );

  // Check if drag sort should be enabled (only when no filters active)
  const isDragEnabled = enableDragSort && !hasFilter && onDragEnd;

  return (
    <div className="pb-20">
      {/* Header Section - optimized spacing */}
      <div className="space-y-2 mb-3">
        {/* Stats Summary */}
        <StatsSummary
          total={stats.total}
          online={stats.online}
          active={stats.active}
          loading={loading}
          t={t}
        />

        {/* Search Bar with Actions */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              placeholder={t('common.placeholders.search')}
            />
          </div>
          {/* Drag Sort Toggle */}
          {onDragSortChange && (
            <button
              type="button"
              onClick={() => onDragSortChange(!enableDragSort)}
              className={cn(
                'size-10 rounded-xl shrink-0',
                'flex items-center justify-center',
                'transition-colors',
                enableDragSort
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted/50 text-muted-foreground'
              )}
            >
              <GripVertical className="size-4" />
            </button>
          )}
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
      {hasFilter && !loading && filteredNodes.length > 0 && (
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-muted-foreground">
            {t('admin.subscriptions.found')} <span className="font-medium text-foreground">{filteredNodes.length}</span> {t('admin.subscriptions.results')}
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

      {/* Node List */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredNodes.length === 0 ? (
        <EmptyState
          hasFilter={hasFilter}
          onClearFilter={clearFilters}
          onCreate={onCreate}
          t={t}
        />
      ) : isDragEnabled ? (
        <DraggableMobileList
          items={filteredNodes}
          getItemId={getNodeId}
          renderItem={renderNodeCard}
          onDragEnd={onDragEnd}
          enabled={true}
          longPressDelay={250}
          className="space-y-2"
        />
      ) : (
        <div className="space-y-2">
          {filteredNodes.map((node) => renderNodeCard(node))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredNodes.length > 0 && (
        <Pagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}

      {/* Floating Action Button */}
      <FloatingActionButton onClick={onCreate} />

      {/* Node Detail Sheet */}
      <NodeDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        node={selectedNode}
        resourceGroupsMap={resourceGroupsMap}
        onEdit={onEdit}
        onDelete={onDelete}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />
    </div>
  );
};

MobileNodeManagement.displayName = 'MobileNodeManagement';
