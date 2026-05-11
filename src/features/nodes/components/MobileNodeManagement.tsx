/**
 * MobileNodeManagement - Tailwind Application UI style mobile management
 *
 * Design principles:
 * - Unified toolbar with search + filters
 * - Stacked list with divide-y instead of separate cards
 * - Clean header with result count
 * - Minimal visual decoration
 * - Long-press to drag sort (when no filter active)
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpCircle, Plus, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MobilePagination,
  MobileListToolbar,
  MobileListContainer,
  type FilterPillOption,
} from '@/components/mobile';
import { useMobileListFilter, useMobileDetailSheet } from '@/hooks';
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
  // Batch update
  updatableCount?: number;
  onBatchUpdate?: () => void;
  isBatchUpdating?: boolean;
  // Drag sort
  onDragEnd?: (activeId: string, overId: string, oldIndex: number, newIndex: number) => void;
  // Detail sheet extra actions
  onGetInstallScript?: (node: Node) => void;
}

type StatusFilter = 'all' | 'online' | 'offline' | NodeStatus;

// ============================================================================
// Filter function
// ============================================================================

const nodeFilterFn = (node: Node, filter: StatusFilter): boolean => {
  switch (filter) {
    case 'online':
      return node.isOnline;
    case 'offline':
      return !node.isOnline;
    case 'active':
      return node.status === 'active';
    case 'inactive':
      return node.status === 'inactive';
    case 'maintenance':
      return node.status === 'maintenance';
    default:
      return true;
  }
};

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
  updatableCount = 0,
  onBatchUpdate,
  isBatchUpdating = false,
  onDragEnd,
  onGetInstallScript,
}: MobileNodeManagementProps) => {
  const { t } = useTranslation();

  // Filter hook
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredItems: filteredNodes,
    clearFilters,
    hasFilter,
  } = useMobileListFilter<Node, StatusFilter>({
    items: nodes,
    defaultFilter: 'all',
    searchFields: ['name', 'serverAddress', 'region', 'id', 'tags'],
    filterFn: nodeFilterFn,
  });

  // Detail sheet hook
  const {
    selectedItem: selectedNode,
    isOpen: detailSheetOpen,
    openSheet: handleCardPress,
    setOpen: setDetailSheetOpen,
  } = useMobileDetailSheet<Node>();

  // Build filter options with counts
  const filterOptions = useMemo<FilterPillOption<StatusFilter>[]>(() => {
    const online = nodes.filter((n) => n.isOnline).length;
    const offline = nodes.filter((n) => !n.isOnline).length;
    const active = nodes.filter((n) => n.status === 'active').length;
    const inactive = nodes.filter((n) => n.status === 'inactive').length;
    const maintenance = nodes.filter((n) => n.status === 'maintenance').length;

    return [
      { value: 'all', label: t('filter.all'), count: total },
      { value: 'online', label: t('common.status.online'), count: online },
      { value: 'offline', label: t('common.status.offline'), count: offline },
      { value: 'active', label: t('common.status.enabled'), count: active },
      { value: 'inactive', label: t('common.status.disabled'), count: inactive },
      { value: 'maintenance', label: t('common.status.maintenance'), count: maintenance },
    ];
  }, [nodes, total, t]);

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
        createLabel={t('admin.nodes.addNode')}
        extraActions={
          updatableCount > 0 && onBatchUpdate ? (
            <button
              type="button"
              onClick={onBatchUpdate}
              disabled={isBatchUpdating}
              className={cn(
                'size-10 rounded-lg shrink-0',
                'flex items-center justify-center',
                'border border-warning/50 bg-warning/10',
                'transition-colors motion-reduce:transition-none',
                'disabled:opacity-50',
                'pointer-coarse:size-11'
              )}
              title={t('admin.nodes.update')}
            >
              <ArrowUpCircle className="size-4 text-warning" />
            </button>
          ) : undefined
        }
      />

      {/* Node List - long press to drag sort (only when no filter active) */}
      <MobileListContainer
        items={filteredNodes}
        loading={loading}
        hasFilter={hasFilter}
        emptyIcon={Server}
        emptyTitle={t('admin.nodes.noData')}
        emptyDescription={t('admin.nodes.addNode')}
        emptyAction={{ label: t('admin.nodes.addNode'), onClick: onCreate, icon: Plus }}
        filterEmptyTitle={t('common.messages.noResults')}
        filterEmptyDescription={t('subscription.tryAdjustSearch')}
        onClearFilters={clearFilters}
        skeletonCount={5}
        skeletonMetadataCount={3}
        getItemId={(node) => String(node.id)}
        renderItem={(node) => (
          <MobileNodeCard
            node={node}
            onCardPress={handleCardPress}
          />
        )}
        draggable={!!onDragEnd}
        onDragEnd={onDragEnd}
      />

      {/* Pagination */}
      {!loading && filteredNodes.length > 0 && (
        <MobilePagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}

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
        onGetInstallScript={onGetInstallScript}
      />
    </div>
  );
};

MobileNodeManagement.displayName = 'MobileNodeManagement';
