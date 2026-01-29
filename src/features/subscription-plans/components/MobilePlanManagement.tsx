/**
 * MobilePlanManagement - Tailwind Application UI style mobile management
 *
 * Design principles:
 * - Unified toolbar with search + filters
 * - Server-side filtering with MobilePlanFiltersSheet
 * - Stacked list with divide-y instead of separate cards
 * - Clean header with result count
 * - Minimal visual decoration
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Package } from 'lucide-react';
import {
  MobilePagination,
  MobileListToolbar,
  MobileListContainer,
} from '@/components/mobile';
import { useMobileDetailSheet } from '@/hooks';
import { MobilePlanCard } from './MobilePlanCard';
import { PlanDetailSheet } from './PlanDetailSheet';
import {
  MobilePlanFiltersSheet,
  MobileFilterButton,
} from './MobilePlanFiltersSheet';
import type { SubscriptionPlan } from '@/api/subscription/types';
import type { SubscriptionPlanFilters } from '../types';

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
  filters: SubscriptionPlanFilters;
  hasFilters: boolean;
  onFiltersChange: (filters: Partial<SubscriptionPlanFilters>) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (plan: SubscriptionPlan) => void;
  onDuplicate: (plan: SubscriptionPlan) => void;
  onToggleStatus: (plan: SubscriptionPlan) => void;
  onViewSubscriptions: (plan: SubscriptionPlan) => void;
  onDelete: (plan: SubscriptionPlan) => void;
  onPageChange: (page: number) => void;
}

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
  filters,
  hasFilters,
  onFiltersChange,
  onClearFilters,
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

  // Filter sheet state
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Local search for quick client-side filtering
  const [searchQuery, setSearchQuery] = useState('');

  // Detail sheet hook
  const {
    selectedItem: selectedPlan,
    isOpen: detailSheetOpen,
    openSheet: handleCardPress,
    setOpen: setDetailSheetOpen,
  } = useMobileDetailSheet<SubscriptionPlan>();

  // Client-side search filtering (quick find within current page)
  const filteredPlans = useMemo(() => {
    if (!searchQuery.trim()) return plans;
    const query = searchQuery.toLowerCase();
    return plans.filter(
      (plan) =>
        plan.name.toLowerCase().includes(query) ||
        plan.slug.toLowerCase().includes(query) ||
        plan.description?.toLowerCase().includes(query)
    );
  }, [plans, searchQuery]);

  // Check if we have local search filter active
  const hasLocalFilter = searchQuery.trim().length > 0;

  // Clear local search
  const clearLocalSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="space-y-3">
      {/* Unified Toolbar: Search + Filter Button + Actions */}
      <MobileListToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('common.placeholders.search')}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onCreate={onCreate}
        createLabel={t('admin.plans.createPlan')}
        extraActions={
          <MobileFilterButton
            hasFilters={hasFilters}
            onClick={() => setFilterSheetOpen(true)}
          />
        }
      />

      {/* Plan List */}
      <MobileListContainer
        items={filteredPlans}
        loading={loading}
        hasFilter={hasLocalFilter || hasFilters}
        emptyIcon={Package}
        emptyTitle={t('admin.plans.table.noPlans')}
        emptyDescription={t('admin.plans.createPlan')}
        emptyAction={{ label: t('admin.plans.createPlan'), onClick: onCreate, icon: Plus }}
        filterEmptyTitle={t('common.messages.noResults')}
        filterEmptyDescription={t('subscription.tryAdjustSearch')}
        onClearFilters={() => {
          clearLocalSearch();
          onClearFilters();
        }}
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

      {/* Filter Sheet */}
      <MobilePlanFiltersSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        filters={filters}
        onFiltersChange={onFiltersChange}
        hasFilters={hasFilters}
        onClearFilters={onClearFilters}
      />
    </div>
  );
};

MobilePlanManagement.displayName = 'MobilePlanManagement';
