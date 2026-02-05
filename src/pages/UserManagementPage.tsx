/**
 * User Management Page (Admin)
 * Tailwind Application UI style
 * Mobile-first responsive design
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  UserX,
} from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader, type PageHeaderMeta, type PageHeaderBadge } from '@/components/admin';
import { Button } from '@/components/common/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { UserListTable } from '@/features/users/components/UserListTable';
import { UserFilters } from '@/features/users/components/UserFilters';
import { MobileUserManagement } from '@/features/users/components/MobileUserManagement';
import { EditUserDialog } from '@/features/users/components/EditUserDialog';
import { CreateUserDialog } from '@/features/users/components/CreateUserDialog';
import { CreateUserSheet } from '@/features/users/components/CreateUserSheet';
import { EditUserSheet } from '@/features/users/components/EditUserSheet';
import { ResetPasswordDialog } from '@/features/users/components/ResetPasswordDialog';
import { ResetPasswordSheet } from '@/features/users/components/ResetPasswordSheet';
import { DeleteUserSheet } from '@/features/users/components/DeleteUserSheet';
import { AssignSubscriptionDialog } from '@/features/subscriptions/components/AssignSubscriptionDialog';
import { AssignSubscriptionSheet } from '@/features/subscriptions/components/AssignSubscriptionSheet';
import { useUsersPage } from '@/features/users/hooks/useUsers';
import { adminCreateSubscription } from '@/api/subscription';
import type { UserResponse, UpdateUserRequest, CreateUserRequest } from '@/api/user';
import type { AdminCreateSubscriptionRequest } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================

type DialogType = 'create' | 'edit' | 'delete' | 'assignSubscription' | 'resetPassword' | null;

// ============================================================================
// Main Component
// ============================================================================

export function UserManagementPage() {
  const { t } = useTranslation();
  usePageTitle(t('admin.users.title'));

  const { isMobile } = useBreakpoint();
  const { showSuccess, showError } = useNotificationStore();

  // User data and operations
  const {
    users,
    pagination,
    page,
    pageSize,
    filters,
    hasFilters,
    isLoading,
    isFetching,
    refetch,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    isResettingPassword,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
    clearFilters,
  } = useUsersPage();

  // Dialog state management
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Calculate statistics from current page data
  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === 'active').length;
    const pending = users.filter((u) => u.status === 'pending').length;
    const inactive = users.filter((u) => u.status === 'inactive').length;
    const suspended = users.filter((u) => u.status === 'suspended').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    return { total: pagination.total, active, pending, inactive, suspended, admins };
  }, [users, pagination.total]);

  // Page header badge
  const headerBadge = useMemo(
    (): PageHeaderBadge => ({
      label: `${stats.total} ${t('admin.users.usersLabel')}`,
      variant: 'default',
    }),
    [stats.total, t]
  );

  // Page header metadata
  const headerMetadata = useMemo((): PageHeaderMeta[] => {
    const items: PageHeaderMeta[] = [
      { icon: CheckCircle2, text: `${stats.active} ${t('common.status.enabled')}` },
    ];

    if (stats.pending > 0) {
      items.push({ icon: Clock, text: `${stats.pending} ${t('common.status.pending')}` });
    }

    items.push({ icon: XCircle, text: `${stats.inactive} ${t('common.status.disabled')}` });

    if (stats.suspended > 0) {
      items.push({ icon: UserX, text: `${stats.suspended} ${t('common.status.suspended')}` });
    }

    items.push({ icon: Shield, text: `${stats.admins} ${t('common.role.admin')}` });

    return items;
  }, [stats, t]);

  // Dialog handlers
  const openDialog = useCallback((type: DialogType, user?: UserResponse) => {
    setSelectedUser(user ?? null);
    setActiveDialog(type);
  }, []);

  const closeDialog = useCallback(() => {
    setActiveDialog(null);
    setSelectedUser(null);
  }, []);

  // Action handlers
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    refetch();
  }, [refetch]);

  const handleEdit = useCallback(
    (user: UserResponse) => openDialog('edit', user),
    [openDialog]
  );

  const handleDelete = useCallback(
    (user: UserResponse) => {
      if (isMobile) {
        openDialog('delete', user);
      } else if (window.confirm(t('admin.users.confirmDelete', { name: user.name, email: user.email }))) {
        deleteUser(user.id);
      }
    },
    [isMobile, openDialog, deleteUser, t]
  );

  const handleAssignSubscription = useCallback(
    (user: UserResponse) => openDialog('assignSubscription', user),
    [openDialog]
  );

  const handleResetPassword = useCallback(
    (user: UserResponse) => openDialog('resetPassword', user),
    [openDialog]
  );

  // Form submission handlers
  const handleCreateSubmit = useCallback(
    async (data: CreateUserRequest) => {
      await createUser(data);
      closeDialog();
    },
    [createUser, closeDialog]
  );

  const handleUpdateSubmit = useCallback(
    async (id: string, data: UpdateUserRequest) => {
      await updateUser(id, data);
      closeDialog();
    },
    [updateUser, closeDialog]
  );

  const handleDeleteConfirm = useCallback(
    async (user: UserResponse) => {
      await deleteUser(user.id);
      closeDialog();
    },
    [deleteUser, closeDialog]
  );

  const handleResetPasswordSubmit = useCallback(
    async (id: string, password: string) => {
      await resetPassword(id, { password });
      closeDialog();
    },
    [resetPassword, closeDialog]
  );

  const handleAssignSubscriptionSubmit = useCallback(
    async (data: AdminCreateSubscriptionRequest) => {
      try {
        await adminCreateSubscription(data);
        showSuccess(t('admin.users.assignSuccess', { name: selectedUser?.name }));
        closeDialog();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
              t('admin.users.assignFailed');
        showError(message);
        throw error;
      }
    },
    [selectedUser, showSuccess, showError, closeDialog, t]
  );

  // Mobile layout
  if (isMobile) {
    return (
      <AdminLayout>
        <div className="py-3 pb-safe">
          <MobileUserManagement
            users={users}
            loading={isLoading}
            refreshing={isFetching}
            page={page}
            pageSize={pageSize}
            total={pagination.total}
            onRefresh={handleRefresh}
            onCreate={() => openDialog('create')}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAssignSubscription={handleAssignSubscription}
            onResetPassword={handleResetPassword}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Mobile Sheets */}
        <CreateUserSheet
          open={activeDialog === 'create'}
          onOpenChange={(open) => !open && closeDialog()}
          onSubmit={handleCreateSubmit}
        />

        <EditUserSheet
          open={activeDialog === 'edit'}
          onOpenChange={(open) => !open && closeDialog()}
          entity={selectedUser}
          onSubmit={handleUpdateSubmit}
        />

        <AssignSubscriptionSheet
          open={activeDialog === 'assignSubscription'}
          onOpenChange={(open) => !open && closeDialog()}
          user={selectedUser}
          onSubmit={handleAssignSubscriptionSubmit}
        />

        <ResetPasswordSheet
          open={activeDialog === 'resetPassword'}
          onOpenChange={(open) => !open && closeDialog()}
          user={selectedUser}
          isLoading={isResettingPassword}
          onSubmit={handleResetPasswordSubmit}
        />

        <DeleteUserSheet
          open={activeDialog === 'delete'}
          entity={selectedUser}
          onOpenChange={(open) => !open && closeDialog()}
          onConfirm={handleDeleteConfirm}
        />
      </AdminLayout>
    );
  }

  // Desktop layout
  return (
    <AdminLayout>
      <div className="space-y-6 py-4 pb-safe lg:py-6">
        {/* Page Header */}
        <PageHeader
          title={t('admin.users.title')}
          icon={Users}
          badge={headerBadge}
          metadata={headerMetadata}
          action={
            <div className="flex items-center gap-2">
              <Button onClick={() => openDialog('create')}>
                <Plus className="mr-2 size-4" />
                {t('admin.users.createUser')}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleRefresh}>
                    <RefreshCw key={refreshKey} className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('common.actions.refresh')}</TooltipContent>
              </Tooltip>
            </div>
          }
        />

        {/* Filters */}
        <UserFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
        />

        {/* User Table */}
        <UserListTable
          users={users}
          loading={isLoading || isFetching}
          page={page}
          pageSize={pageSize}
          total={pagination.total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAssignSubscription={handleAssignSubscription}
          onResetPassword={handleResetPassword}
        />
      </div>

      {/* Desktop Dialogs */}
      <CreateUserDialog
        open={activeDialog === 'create'}
        onClose={closeDialog}
        onSubmit={handleCreateSubmit}
      />

      <EditUserDialog
        open={activeDialog === 'edit'}
        user={selectedUser}
        onClose={closeDialog}
        onSubmit={handleUpdateSubmit}
      />

      <AssignSubscriptionDialog
        open={activeDialog === 'assignSubscription'}
        user={selectedUser}
        onClose={closeDialog}
        onSubmit={handleAssignSubscriptionSubmit}
      />

      <ResetPasswordDialog
        open={activeDialog === 'resetPassword'}
        user={selectedUser}
        isLoading={isResettingPassword}
        onClose={closeDialog}
        onSubmit={handleResetPasswordSubmit}
      />
    </AdminLayout>
  );
}
