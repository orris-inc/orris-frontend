/**
 * MobileUserManagement - Tailwind Application UI style mobile management
 *
 * Design principles:
 * - Unified toolbar with search + filters
 * - Stacked list with divide-y instead of separate cards
 * - Clean header with result count
 * - Minimal visual decoration
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, UserPlus } from 'lucide-react';
import {
  MobilePagination,
  MobileListToolbar,
  MobileListContainer,
  type FilterPillOption,
} from '@/components/mobile';
import { useMobileListFilter, useMobileDetailSheet } from '@/hooks';
import { MobileUserCard } from './MobileUserCard';
import { UserDetailSheet } from './UserDetailSheet';
import type { UserResponse } from '@/api/user';

// ============================================================================
// Types
// ============================================================================

export interface MobileUserManagementProps {
  users: UserResponse[];
  loading?: boolean;
  refreshing?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (user: UserResponse) => void;
  onDelete: (user: UserResponse) => void;
  onAssignSubscription: (user: UserResponse) => void;
  onResetPassword: (user: UserResponse) => void;
  onPageChange: (page: number) => void;
}

type StatusFilter = 'all' | 'active' | 'pending' | 'inactive' | 'suspended';

// ============================================================================
// Filter function
// ============================================================================

const userFilterFn = (user: UserResponse, filter: StatusFilter): boolean => {
  return user.status === filter;
};

// ============================================================================
// Main Component
// ============================================================================

export const MobileUserManagement = ({
  users,
  loading = false,
  refreshing = false,
  page,
  pageSize,
  total,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
  onAssignSubscription,
  onResetPassword,
  onPageChange,
}: MobileUserManagementProps) => {
  const { t } = useTranslation();

  // Filter hook
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredItems: filteredUsers,
    clearFilters,
    hasFilter,
  } = useMobileListFilter<UserResponse, StatusFilter>({
    items: users,
    defaultFilter: 'all',
    searchFields: ['name', 'email'],
    filterFn: userFilterFn,
  });

  // Detail sheet hook
  const {
    selectedItem: selectedUser,
    isOpen: detailSheetOpen,
    openSheet: handleCardPress,
    setOpen: setDetailSheetOpen,
  } = useMobileDetailSheet<UserResponse>();

  // Build filter options with counts
  const filterOptions = useMemo<FilterPillOption<StatusFilter>[]>(() => {
    const active = users.filter((u) => u.status === 'active').length;
    const pending = users.filter((u) => u.status === 'pending').length;
    const inactive = users.filter((u) => u.status === 'inactive').length;
    const suspended = users.filter((u) => u.status === 'suspended').length;

    return [
      { value: 'all', label: t('filter.all'), count: total },
      { value: 'active', label: t('common.status.enabled'), count: active },
      { value: 'pending', label: t('common.status.pending'), count: pending },
      { value: 'inactive', label: t('common.status.disabled'), count: inactive },
      { value: 'suspended', label: t('common.status.suspended'), count: suspended },
    ];
  }, [users, total, t]);

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
        createLabel={t('admin.users.createUser')}
      />

      {/* User List */}
      <MobileListContainer
        items={filteredUsers}
        loading={loading}
        hasFilter={hasFilter}
        emptyIcon={UserPlus}
        emptyTitle={t('admin.users.noData')}
        emptyDescription={t('admin.users.createUser')}
        emptyAction={{ label: t('admin.users.createUser'), onClick: onCreate, icon: Plus }}
        filterEmptyTitle={t('common.messages.noResults')}
        filterEmptyDescription={t('subscription.tryAdjustSearch')}
        onClearFilters={clearFilters}
        skeletonCount={5}
        skeletonMetadataCount={2}
        getItemId={(user) => String(user.id)}
        renderItem={(user) => (
          <MobileUserCard
            user={user}
            onCardPress={handleCardPress}
          />
        )}
      />

      {/* Pagination */}
      {!loading && filteredUsers.length > 0 && (
        <MobilePagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}

      {/* User Detail Sheet */}
      <UserDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        user={selectedUser}
        onEdit={onEdit}
        onAssignSubscription={onAssignSubscription}
        onResetPassword={onResetPassword}
        onDelete={onDelete}
      />
    </div>
  );
};

MobileUserManagement.displayName = 'MobileUserManagement';
