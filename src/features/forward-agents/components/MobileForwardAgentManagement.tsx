/**
 * MobileForwardAgentManagement - Redesigned iOS-style forward agent management for mobile
 *
 * Key improvements:
 * - Compact 3-stat summary row (total, online, enabled)
 * - Clean iOS-style search bar
 * - Segmented filter for quick status filtering
 * - Swipe-action cards with tap-to-detail
 * - Floating action button for creating agents
 * - Integrated ForwardAgentDetailSheet
 * - Drag sort mode support
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  RefreshCw,
  Router,
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
import { MobileForwardAgentCard } from './MobileForwardAgentCard';
import { ForwardAgentDetailSheet } from './ForwardAgentDetailSheet';
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
  onToggleStatus: (agent: ForwardAgent) => void;
  onPageChange: (page: number) => void;
  // Drag sort props
  enableDragSort?: boolean;
  onDragSortChange?: (enabled: boolean) => void;
  onDragEnd?: (activeId: string, overId: string, oldIndex: number, newIndex: number) => void;
  // Detail sheet extra actions
  onRegenerateToken?: (agent: ForwardAgent) => void;
  onGetInstallScript?: (agent: ForwardAgent) => void;
}

type StatusFilter = 'all' | 'online' | 'offline' | 'enabled' | 'disabled';

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
  online,
  enabled,
  loading,
  t,
}: {
  total: number;
  online: number;
  enabled: number;
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
        <Router className="size-3.5 text-muted-foreground" />
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
        <span className="text-muted-foreground">{t('common.status.enabled')}</span>
        <span className="font-semibold text-info tabular-nums">{enabled}</span>
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
        <Router className="size-10 text-muted-foreground/50" />
      )}
    </div>
    <p className="text-base font-medium text-foreground mb-1 text-center">
      {hasFilter ? t('common.messages.noResults') : t('admin.forwardAgents.table.empty')}
    </p>
    <p className="text-sm text-muted-foreground text-center mb-5">
      {hasFilter
        ? t('subscription.tryAdjustSearch')
        : t('admin.forwardAgents.form.create')}
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
          {t('admin.forwardAgents.actions.create')}
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
          <Skeleton className="h-4 w-28 font-mono" />
          <Skeleton className="h-3 w-1" />
          <Skeleton className="h-3 w-10" />
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
  onToggleStatus,
  onPageChange,
  enableDragSort = false,
  onDragSortChange,
  onDragEnd,
  onRegenerateToken,
  onGetInstallScript,
}: MobileForwardAgentManagementProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedAgent, setSelectedAgent] = useState<ForwardAgent | null>(null);
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
    const online = forwardAgents.filter((a) => a.isOnline).length;
    const offline = forwardAgents.filter((a) => !a.isOnline).length;
    const enabled = forwardAgents.filter((a) => a.status === 'enabled').length;
    const disabled = forwardAgents.filter((a) => a.status === 'disabled').length;
    return { total, online, offline, enabled, disabled };
  }, [forwardAgents, total]);

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
        case 'enabled':
          count = stats.enabled;
          break;
        case 'disabled':
          count = stats.disabled;
          break;
        default:
          count = 0;
      }
      return { ...opt, count };
    });
  }, [translatedFilterOptions, stats, total]);

  // Filter agents
  const filteredAgents = useMemo(() => {
    return forwardAgents.filter((agent) => {
      // Status filter
      if (statusFilter === 'online' && !agent.isOnline) return false;
      if (statusFilter === 'offline' && agent.isOnline) return false;
      if (statusFilter === 'enabled' && agent.status !== 'enabled') return false;
      if (statusFilter === 'disabled' && agent.status !== 'disabled') return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = agent.name?.toLowerCase().includes(query);
        const matchAddress = agent.publicAddress?.toLowerCase().includes(query);
        const matchRemark = agent.remark?.toLowerCase().includes(query);
        const matchId = agent.id?.toLowerCase().includes(query);
        if (!matchName && !matchAddress && !matchRemark && !matchId) {
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

  // Handle card press - open detail sheet
  const handleCardPress = useCallback((agent: ForwardAgent) => {
    setSelectedAgent(agent);
    setDetailSheetOpen(true);
  }, []);

  // Get agent ID for drag sort
  const getAgentId = useCallback((agent: ForwardAgent) => String(agent.id), []);

  // Render single agent card
  const renderAgentCard = useCallback(
    (agent: ForwardAgent) => (
      <MobileForwardAgentCard
        key={agent.id}
        agent={agent}
        onCardPress={handleCardPress}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
      />
    ),
    [handleCardPress, onEdit, onDelete, onToggleStatus]
  );

  // Check if drag sort should be enabled (only when no filters active)
  const isDragEnabled = enableDragSort && !hasFilter && onDragEnd;

  // Handle enable/disable from detail sheet
  const handleEnable = useCallback(
    (agent: ForwardAgent) => {
      if (agent.status !== 'enabled') {
        onToggleStatus(agent);
      }
    },
    [onToggleStatus]
  );

  const handleDisable = useCallback(
    (agent: ForwardAgent) => {
      if (agent.status === 'enabled') {
        onToggleStatus(agent);
      }
    },
    [onToggleStatus]
  );

  return (
    <div className="pb-20">
      {/* Header Section */}
      <div className="space-y-3 mb-4">
        {/* Stats Summary */}
        <StatsSummary
          total={stats.total}
          online={stats.online}
          enabled={stats.enabled}
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
      {hasFilter && !loading && filteredAgents.length > 0 && (
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-muted-foreground">
            {t('admin.subscriptions.found')} <span className="font-medium text-foreground">{filteredAgents.length}</span> {t('admin.subscriptions.results')}
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

      {/* Agent List */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredAgents.length === 0 ? (
        <EmptyState
          hasFilter={hasFilter}
          onClearFilter={clearFilters}
          onCreate={onCreate}
          t={t}
        />
      ) : isDragEnabled ? (
        <DraggableMobileList
          items={filteredAgents}
          getItemId={getAgentId}
          renderItem={renderAgentCard}
          onDragEnd={onDragEnd}
          enabled={true}
          longPressDelay={250}
          className="space-y-2.5"
        />
      ) : (
        <div className="space-y-2.5">
          {filteredAgents.map((agent) => renderAgentCard(agent))}
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

      {/* Floating Action Button */}
      <FloatingActionButton onClick={onCreate} />

      {/* Agent Detail Sheet */}
      <ForwardAgentDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        agent={selectedAgent}
        onEdit={onEdit}
        onDelete={onDelete}
        onEnable={handleEnable}
        onDisable={handleDisable}
        onRegenerateToken={onRegenerateToken}
        onGetInstallScript={onGetInstallScript}
      />
    </div>
  );
};

MobileForwardAgentManagement.displayName = 'MobileForwardAgentManagement';
