/**
 * MobileSubscriptionManagement - Tailwind Application UI style mobile management
 *
 * Design principles:
 * - Unified toolbar with search + filters
 * - Stacked list with divide-y instead of separate cards
 * - Clean header with result count
 * - Minimal visual decoration
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard } from 'lucide-react';
import {
  MobilePagination,
  MobileListToolbar,
  MobileListContainer,
} from '@/components/mobile';
import { useMobileDetailSheet } from '@/hooks';
import { MobileSubscriptionCard } from './MobileSubscriptionCard';
import { SubscriptionDetailSheet } from './SubscriptionDetailSheet';
import {
  MobileSubscriptionFiltersSheet,
  MobileFilterButton,
} from './MobileSubscriptionFiltersSheet';
import type { Subscription } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user';
import type { SubscriptionFilters } from '../hooks/useSubscriptions';

// ============================================================================
// Types
// ============================================================================

export interface MobileSubscriptionManagementProps {
  subscriptions: Subscription[];
  usersMap: Record<string, UserResponse>;
  loading?: boolean;
  refreshing?: boolean;
  page: number;
  pageSize: number;
  total: number;
  /** All filters */
  filters: SubscriptionFilters;
  /** Callback when any filter changes */
  onFiltersChange: (filters: Partial<SubscriptionFilters>) => void;
  onRefresh: () => void;
  onViewDetail?: (subscription: Subscription) => void;
  onActivate: (subscription: Subscription) => void;
  onCancel: (subscription: Subscription) => void;
  onRenew: (subscription: Subscription) => void;
  onSuspend: (subscription: Subscription) => void;
  onUnsuspend: (subscription: Subscription) => void;
  onResetUsage: (subscription: Subscription) => void;
  onDelete: (subscription: Subscription) => void;
  onChangePlan?: (subscription: Subscription) => void;
  onPageChange: (page: number) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const MobileSubscriptionManagement = ({
  subscriptions,
  usersMap,
  loading = false,
  refreshing = false,
  page,
  pageSize,
  total,
  filters,
  onFiltersChange,
  onRefresh,
  onActivate,
  onCancel,
  onRenew,
  onSuspend,
  onUnsuspend,
  onResetUsage,
  onDelete,
  onChangePlan,
  onPageChange,
}: MobileSubscriptionManagementProps) => {
  const { t } = useTranslation();

  // Search state (client-side filtering)
  const [searchQuery, setSearchQuery] = useState('');

  // Filters sheet state
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

  // Detail sheet hook
  const {
    selectedItem: selectedSubscription,
    isOpen: detailSheetOpen,
    openSheet: handleCardPress,
    setOpen: setDetailSheetOpen,
  } = useMobileDetailSheet<Subscription>();

  // Check if any filter is active (excluding default status)
  const hasFilters = useMemo(() => {
    return !!(
      (filters.status && filters.status !== 'active') ||
      filters.planId ||
      filters.billingCycle ||
      filters.expiresBefore ||
      filters.sortBy
    );
  }, [filters]);

  // Filter subscriptions (search is client-side)
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((subscription) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const user = usersMap[subscription.userId];
        const matchUserName = user?.name?.toLowerCase().includes(query);
        const matchUserEmail = user?.email?.toLowerCase().includes(query);
        const matchPlanName = subscription.plan?.name?.toLowerCase().includes(query);
        const matchId = subscription.id.toLowerCase().includes(query);
        if (!matchUserName && !matchUserEmail && !matchPlanName && !matchId) {
          return false;
        }
      }
      return true;
    });
  }, [subscriptions, searchQuery, usersMap]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    onFiltersChange({
      status: 'active',
      planId: undefined,
      billingCycle: undefined,
      expiresBefore: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    });
  }, [onFiltersChange]);

  const hasFilter = searchQuery !== '' || hasFilters;

  // Get selected user for detail sheet
  const selectedUser = selectedSubscription ? usersMap[selectedSubscription.userId] : undefined;

  return (
    <div className="space-y-3">
      {/* Toolbar: Search + Filter Button + Refresh */}
      <MobileListToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('placeholders.searchSubscription')}
        onRefresh={onRefresh}
        refreshing={refreshing}
        extraActions={
          <MobileFilterButton
            hasFilters={hasFilters}
            onClick={() => setFiltersSheetOpen(true)}
          />
        }
      />

      {/* Subscription List */}
      <MobileListContainer
        items={filteredSubscriptions}
        loading={loading}
        hasFilter={hasFilter}
        emptyIcon={CreditCard}
        emptyTitle={t('subscription.noSubscriptions')}
        emptyDescription={t('subscription.noSubscriptionRecords')}
        filterEmptyTitle={t('subscription.noMatchingSubscription')}
        filterEmptyDescription={t('subscription.tryAdjustSearch')}
        onClearFilters={clearFilters}
        skeletonCount={5}
        skeletonMetadataCount={2}
        getItemId={(subscription) => subscription.id}
        renderItem={(subscription) => (
          <MobileSubscriptionCard
            subscription={subscription}
            user={usersMap[subscription.userId]}
            onCardPress={handleCardPress}
          />
        )}
      />

      {/* Pagination */}
      {!loading && filteredSubscriptions.length > 0 && (
        <MobilePagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}

      {/* Subscription Detail Sheet */}
      <SubscriptionDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        entity={selectedSubscription}
        user={selectedUser}
        onActivate={onActivate}
        onCancel={onCancel}
        onRenew={onRenew}
        onSuspend={onSuspend}
        onUnsuspend={onUnsuspend}
        onResetUsage={onResetUsage}
        onDelete={onDelete}
        onChangePlan={onChangePlan}
      />

      {/* Filters Sheet */}
      <MobileSubscriptionFiltersSheet
        open={filtersSheetOpen}
        onOpenChange={setFiltersSheetOpen}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />
    </div>
  );
};

MobileSubscriptionManagement.displayName = 'MobileSubscriptionManagement';
