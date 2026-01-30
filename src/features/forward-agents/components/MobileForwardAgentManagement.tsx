/**
 * MobileForwardAgentManagement - Tailwind Application UI style mobile management
 *
 * Design principles:
 * - Unified toolbar with search + filters
 * - Stacked list with divide-y instead of separate cards
 * - Clean header with result count
 * - Minimal visual decoration
 * - Long-press to drag sort (when no filter active)
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Router, Download, Radio } from 'lucide-react';
import {
  MobilePagination,
  MobileListToolbar,
  MobileListContainer,
  type FilterPillOption,
} from '@/components/mobile';
import { useMobileListFilter, useMobileDetailSheet } from '@/hooks';
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
  // Drag sort
  onDragEnd?: (activeId: string, overId: string, oldIndex: number, newIndex: number) => void;
  // Detail sheet extra actions
  onRegenerateToken?: (agent: ForwardAgent) => void;
  onGetInstallScript?: (agent: ForwardAgent) => void;
  // Update actions
  onTriggerUpdate?: (agent: ForwardAgent) => void;
  onBatchUpdate?: () => void;
  isUpdating?: boolean;
  isBatchUpdating?: boolean;
  // Page-level actions
  onBroadcast?: () => void;
}

type StatusFilter = 'all' | 'online' | 'offline' | 'enabled' | 'disabled';

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
  onDragEnd,
  onRegenerateToken,
  onGetInstallScript,
  onTriggerUpdate,
  onBatchUpdate,
  isUpdating = false,
  isBatchUpdating = false,
  onBroadcast,
}: MobileForwardAgentManagementProps) => {
  const { t } = useTranslation();

  // Use shared hooks
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredItems: filteredAgents,
    clearFilters,
    hasFilter,
  } = useMobileListFilter<ForwardAgent, StatusFilter>({
    items: forwardAgents,
    defaultFilter: 'all',
    searchFields: ['name', 'publicAddress', 'remark', 'id'],
    filterFn: (agent, filter) => {
      switch (filter) {
        case 'online':
          return agent.isOnline === true;
        case 'offline':
          return agent.isOnline === false;
        case 'enabled':
          return agent.status === 'enabled';
        case 'disabled':
          return agent.status === 'disabled';
        default:
          return true;
      }
    },
  });

  const {
    selectedItem: selectedAgent,
    isOpen: detailSheetOpen,
    openSheet,
    setOpen: setDetailSheetOpen,
  } = useMobileDetailSheet<ForwardAgent>();

  // Count updatable agents (online + enabled + hasUpdate)
  const updatableCount = useMemo(() => {
    return forwardAgents.filter(
      (a) => a.hasUpdate && a.isOnline && a.status === 'enabled'
    ).length;
  }, [forwardAgents]);

  // Build filter options with counts
  const filterOptions = useMemo<FilterPillOption<StatusFilter>[]>(() => {
    const online = forwardAgents.filter((a) => a.isOnline).length;
    const offline = forwardAgents.filter((a) => !a.isOnline).length;
    const enabled = forwardAgents.filter((a) => a.status === 'enabled').length;
    const disabled = forwardAgents.filter((a) => a.status === 'disabled').length;

    return [
      { value: 'all', label: t('filter.all'), count: total },
      { value: 'online', label: t('common.status.online'), count: online },
      { value: 'offline', label: t('common.status.offline'), count: offline },
      { value: 'enabled', label: t('common.status.enabled'), count: enabled },
      { value: 'disabled', label: t('common.status.disabled'), count: disabled },
    ];
  }, [forwardAgents, total, t]);

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

  // Extra actions for action bar
  const extraActions = (
    <>
      {/* Batch Update Button - show when there are updatable agents */}
      {onBatchUpdate && updatableCount > 0 && (
        <button
          type="button"
          onClick={onBatchUpdate}
          disabled={isBatchUpdating}
          className={cn(
            'h-10 px-3 rounded-lg shrink-0',
            'flex items-center justify-center gap-1.5',
            'bg-warning/10 text-warning ring-1 ring-warning/30',
            'hover:bg-warning/20 active:scale-[0.98] transition-all',
            'disabled:opacity-50'
          )}
          title={t('admin.forwardAgents.actions.batchUpdate')}
        >
          <Download className={cn('size-4', isBatchUpdating && 'animate-pulse')} />
          <span className="text-sm font-medium">{updatableCount}</span>
        </button>
      )}
      {onBroadcast && (
        <button
          type="button"
          onClick={onBroadcast}
          className={cn(
            'size-10 rounded-lg shrink-0',
            'flex items-center justify-center',
            'ring-1 ring-input bg-background',
            'hover:bg-muted active:scale-[0.98] transition-all'
          )}
          title={t('admin.forwardAgents.actions.broadcast')}
        >
          <Radio className="size-4 text-muted-foreground" />
        </button>
      )}
    </>
  );

  return (
    <div className="space-y-3">
      {/* Unified Toolbar: Search + Filters + Actions */}
      <MobileListToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('common.placeholders.search')}
        filterOptions={filterOptions}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onCreate={onCreate}
        createLabel={t('common.actions.create')}
        extraActions={extraActions}
      />

      {/* Agent List - long press to drag sort (only when no filter active) */}
      <MobileListContainer
        items={filteredAgents}
        loading={loading}
        hasFilter={hasFilter}
        emptyIcon={Router}
        emptyTitle={t('admin.forwardAgents.table.empty')}
        emptyDescription={t('common.actions.create')}
        emptyAction={{
          label: t('common.actions.create'),
          onClick: onCreate,
          icon: Plus,
        }}
        filterEmptyTitle={t('common.messages.noResults')}
        filterEmptyDescription={t('subscription.tryAdjustSearch')}
        onClearFilters={clearFilters}
        skeletonCount={5}
        skeletonMetadataCount={2}
        skeletonShowBadge={false}
        getItemId={(agent) => String(agent.id)}
        renderItem={(agent) => (
          <MobileForwardAgentCard
            agent={agent}
            onCardPress={openSheet}
          />
        )}
        draggable={!!onDragEnd}
        onDragEnd={onDragEnd}
      />

      {/* Pagination */}
      {!loading && filteredAgents.length > 0 && (
        <MobilePagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}

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
        onTriggerUpdate={onTriggerUpdate}
        isUpdating={isUpdating}
      />
    </div>
  );
};

MobileForwardAgentManagement.displayName = 'MobileForwardAgentManagement';
