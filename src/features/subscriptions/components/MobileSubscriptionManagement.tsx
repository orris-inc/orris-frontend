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
  type FilterPillOption,
} from '@/components/mobile';
import { useMobileDetailSheet } from '@/hooks';
import { MobileSubscriptionCard } from './MobileSubscriptionCard';
import { SubscriptionDetailSheet } from './SubscriptionDetailSheet';
import type { Subscription, SubscriptionStatus } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user';

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
  onRefresh: () => void;
  onViewDetail?: (subscription: Subscription) => void;
  onActivate: (subscription: Subscription) => void;
  onCancel: (subscription: Subscription) => void;
  onRenew: (subscription: Subscription) => void;
  onSuspend: (subscription: Subscription) => void;
  onUnsuspend: (subscription: Subscription) => void;
  onResetUsage: (subscription: Subscription) => void;
  onDelete: (subscription: Subscription) => void;
  onPageChange: (page: number) => void;
}

type StatusFilter = 'all' | SubscriptionStatus;

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
  onRefresh,
  onActivate,
  onCancel,
  onRenew,
  onSuspend,
  onUnsuspend,
  onResetUsage,
  onDelete,
  onPageChange,
}: MobileSubscriptionManagementProps) => {
  const { t } = useTranslation();

  // Manual filter state (since search needs usersMap access)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Detail sheet hook
  const {
    selectedItem: selectedSubscription,
    isOpen: detailSheetOpen,
    openSheet: handleCardPress,
    setOpen: setDetailSheetOpen,
  } = useMobileDetailSheet<Subscription>();

  // Build filter options with counts
  const filterOptions = useMemo<FilterPillOption<StatusFilter>[]>(() => {
    const active = subscriptions.filter((s) => s.status === 'active').length;
    const trialing = subscriptions.filter((s) => s.status === 'trialing').length;
    const pendingPayment = subscriptions.filter((s) => s.status === 'pending_payment').length;
    const pastDue = subscriptions.filter((s) => s.status === 'past_due').length;
    const suspended = subscriptions.filter((s) => s.status === 'suspended').length;
    const expired = subscriptions.filter((s) => s.status === 'expired').length;
    const cancelled = subscriptions.filter((s) => s.status === 'cancelled').length;

    return [
      { value: 'all', label: t('filter.all'), count: total },
      { value: 'active', label: t('subscriptionStatus.active'), count: active },
      { value: 'trialing', label: t('subscriptionStatus.trialing'), count: trialing },
      { value: 'pending_payment', label: t('subscriptionStatus.pendingPayment'), count: pendingPayment },
      { value: 'past_due', label: t('subscriptionStatus.pastDue'), count: pastDue },
      { value: 'suspended', label: t('subscriptionStatus.suspended'), count: suspended },
      { value: 'expired', label: t('subscriptionStatus.expired'), count: expired },
      { value: 'cancelled', label: t('subscriptionStatus.cancelled'), count: cancelled },
    ];
  }, [subscriptions, total, t]);

  // Filter subscriptions (manual because we need usersMap access for search)
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((subscription) => {
      // Status filter
      if (statusFilter !== 'all' && subscription.status !== statusFilter) {
        return false;
      }

      // Search filter
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
  }, [subscriptions, searchQuery, statusFilter, usersMap]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, []);

  const hasFilter = searchQuery !== '' || statusFilter !== 'all';

  // Get selected user for detail sheet
  const selectedUser = selectedSubscription ? usersMap[selectedSubscription.userId] : undefined;

  return (
    <div className="space-y-3">
      {/* Unified Toolbar: Search + Filters + Actions (no create button for subscriptions) */}
      <MobileListToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('placeholders.searchSubscription')}
        filterOptions={filterOptions}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        onRefresh={onRefresh}
        refreshing={refreshing}
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
      />
    </div>
  );
};

MobileSubscriptionManagement.displayName = 'MobileSubscriptionManagement';
