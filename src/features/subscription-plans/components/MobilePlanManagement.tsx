/**
 * MobilePlanManagement - Tailwind Application UI style mobile management
 *
 * Design principles:
 * - Unified toolbar with search + filters
 * - Stacked list with divide-y instead of separate cards
 * - Clean header with result count
 * - Minimal visual decoration
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Package } from 'lucide-react';
import {
  MobilePagination,
  MobileListToolbar,
  MobileListContainer,
  type FilterPillOption,
} from '@/components/mobile';
import { useMobileListFilter, useMobileDetailSheet } from '@/hooks';
import { MobilePlanCard } from './MobilePlanCard';
import { PlanDetailSheet } from './PlanDetailSheet';
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
// Filter function
// ============================================================================

const planFilterFn = (plan: SubscriptionPlan, filter: StatusFilter): boolean => {
  switch (filter) {
    case 'active':
      return plan.status === 'active';
    case 'inactive':
      return plan.status === 'inactive';
    case 'public':
      return plan.isPublic;
    case 'private':
      return !plan.isPublic;
    default:
      return true;
  }
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
  const { t } = useTranslation();

  // Filter hook
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredItems: filteredPlans,
    clearFilters,
    hasFilter,
  } = useMobileListFilter<SubscriptionPlan, StatusFilter>({
    items: plans,
    defaultFilter: 'all',
    searchFields: ['name', 'slug', 'description'],
    filterFn: planFilterFn,
  });

  // Detail sheet hook
  const {
    selectedItem: selectedPlan,
    isOpen: detailSheetOpen,
    openSheet: handleCardPress,
    setOpen: setDetailSheetOpen,
  } = useMobileDetailSheet<SubscriptionPlan>();

  // Build filter options with counts
  const filterOptions = useMemo<FilterPillOption<StatusFilter>[]>(() => {
    const active = plans.filter((p) => p.status === 'active').length;
    const inactive = plans.filter((p) => p.status === 'inactive').length;
    const publicPlans = plans.filter((p) => p.isPublic).length;
    const privatePlans = plans.filter((p) => !p.isPublic).length;

    return [
      { value: 'all', label: t('filter.all'), count: total },
      { value: 'active', label: t('common.status.active'), count: active },
      { value: 'inactive', label: t('common.status.inactive'), count: inactive },
      { value: 'public', label: t('admin.plans.public'), count: publicPlans },
      { value: 'private', label: t('admin.plans.private'), count: privatePlans },
    ];
  }, [plans, total, t]);

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
        createLabel={t('admin.plans.createPlan')}
      />

      {/* Plan List */}
      <MobileListContainer
        items={filteredPlans}
        loading={loading}
        hasFilter={hasFilter}
        emptyIcon={Package}
        emptyTitle={t('admin.plans.table.noPlans')}
        emptyDescription={t('admin.plans.createPlan')}
        emptyAction={{ label: t('admin.plans.createPlan'), onClick: onCreate, icon: Plus }}
        filterEmptyTitle={t('common.messages.noResults')}
        filterEmptyDescription={t('subscription.tryAdjustSearch')}
        onClearFilters={clearFilters}
        skeletonCount={5}
        skeletonMetadataCount={2}
        skeletonShowBadge={true}
        getItemId={(plan) => String(plan.id)}
        renderItem={(plan) => (
          <MobilePlanCard
            plan={plan}
            onCardPress={handleCardPress}
          />
        )}
      />

      {/* Pagination */}
      {!loading && filteredPlans.length > 0 && (
        <MobilePagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}

      {/* Plan Detail Sheet */}
      <PlanDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        plan={selectedPlan}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onToggleStatus={onToggleStatus}
        onViewSubscriptions={onViewSubscriptions}
        onDelete={onDelete}
      />
    </div>
  );
};

MobilePlanManagement.displayName = 'MobilePlanManagement';
