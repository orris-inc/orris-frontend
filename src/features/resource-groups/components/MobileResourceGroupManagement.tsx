/**
 * MobileResourceGroupManagement - Tailwind Application UI style mobile management
 *
 * Design principles:
 * - Unified toolbar with search + filters
 * - Stacked list with divide-y instead of separate cards
 * - Clean header with result count
 * - Unified empty state and loading skeleton
 * - Minimal visual decoration
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Layers } from 'lucide-react';
import {
  MobilePagination,
  MobileListToolbar,
  MobileListContainer,
  type FilterPillOption,
} from '@/components/mobile';
import { useMobileListFilter, useMobileDetailSheet } from '@/hooks';
import { MobileResourceGroupCard } from './MobileResourceGroupCard';
import { ResourceGroupDetailSheet } from './ResourceGroupDetailSheet';
import type { ResourceGroup, ResourceGroupStatus } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================

export interface MobileResourceGroupManagementProps {
  resourceGroups: ResourceGroup[];
  plansMap?: Record<string, SubscriptionPlan>;
  /** Member count map by group SID */
  memberCountMap?: Record<string, number>;
  loading?: boolean;
  refreshing?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (resourceGroup: ResourceGroup) => void;
  onDelete: (resourceGroup: ResourceGroup) => void;
  onToggleStatus: (resourceGroup: ResourceGroup) => void;
  onPageChange: (page: number) => void;
}

type StatusFilter = 'all' | ResourceGroupStatus;

// ============================================================================
// Main Component
// ============================================================================

export const MobileResourceGroupManagement = ({
  resourceGroups,
  plansMap = {},
  memberCountMap = {},
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
}: MobileResourceGroupManagementProps) => {
  const { t } = useTranslation();

  // Use shared filter hook
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredItems: filteredResourceGroups,
    clearFilters,
    hasFilter,
  } = useMobileListFilter<ResourceGroup, StatusFilter>({
    items: resourceGroups,
    defaultFilter: 'all',
    searchFields: ['name', 'description', 'sid'],
    filterFn: (item, filter) => item.status === filter,
  });

  // Use shared detail sheet hook
  const { selectedItem: selectedGroup, isOpen: detailSheetOpen, openSheet, setOpen: setDetailSheetOpen } =
    useMobileDetailSheet<ResourceGroup>();

  // Build filter options with counts
  const filterOptions = useMemo<FilterPillOption<StatusFilter>[]>(() => {
    const active = resourceGroups.filter((g) => g.status === 'active').length;
    const inactive = resourceGroups.filter((g) => g.status === 'inactive').length;

    return [
      { value: 'all', label: t('filter.all'), count: total },
      { value: 'active', label: t('common.status.enabled'), count: active },
      { value: 'inactive', label: t('common.status.disabled'), count: inactive },
    ];
  }, [resourceGroups, total, t]);

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
        createLabel={t('resourceGroups.createTitle')}
      />

      {/* Resource Group List */}
      <MobileListContainer
        items={filteredResourceGroups}
        loading={loading}
        hasFilter={hasFilter}
        emptyIcon={Layers}
        emptyTitle={t('resourceGroups.noData')}
        emptyDescription={t('resourceGroups.createDescription')}
        emptyAction={{
          label: t('resourceGroups.createResourceGroup'),
          onClick: onCreate,
          icon: Plus,
        }}
        filterEmptyTitle={t('common.messages.noResults')}
        filterEmptyDescription={t('subscription.tryAdjustSearch')}
        onClearFilters={clearFilters}
        skeletonCount={5}
        skeletonMetadataCount={2}
        getItemId={(group) => group.sid}
        renderItem={(group) => (
          <MobileResourceGroupCard
            key={group.sid}
            group={group}
            planName={group.planId ? plansMap[group.planId]?.name : undefined}
            planType={group.planId ? plansMap[group.planId]?.planType : undefined}
            memberCount={memberCountMap[group.sid] ?? 0}
            onCardPress={openSheet}
          />
        )}
        draggable={false}
      />

      {/* Pagination */}
      {!loading && filteredResourceGroups.length > 0 && (
        <MobilePagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}

      {/* Resource Group Detail Sheet */}
      <ResourceGroupDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        group={selectedGroup}
        plansMap={plansMap}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
      />
    </div>
  );
};

MobileResourceGroupManagement.displayName = 'MobileResourceGroupManagement';
