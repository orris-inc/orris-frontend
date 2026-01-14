/**
 * User Management Page (Admin)
 * High-density data management interface
 */

import { useState, useMemo } from 'react';
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
import { AdminButton, AdminCard } from '@/components/admin';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { UserListTable } from '@/features/users/components/UserListTable';
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

export const UserManagementPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('admin.users.title'));

  const { isMobile } = useBreakpoint();

  const {
    users,
    pagination,
    page,
    pageSize,
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
  } = useUsersPage();

  const { showSuccess, showError } = useNotificationStore();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignSubscriptionDialogOpen, setAssignSubscriptionDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Calculate user statistics
  const stats = useMemo(() => {
    const total = pagination.total;
    const active = users.filter((u) => u.status === 'active').length;
    const pending = users.filter((u) => u.status === 'pending').length;
    const inactive = users.filter((u) => u.status === 'inactive').length;
    const suspended = users.filter((u) => u.status === 'suspended').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    return { total, active, pending, inactive, suspended, admins };
  }, [users, pagination.total]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  const handleEdit = (user: UserResponse) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = (user: UserResponse) => {
    if (isMobile) {
      setSelectedUser(user);
      setDeleteDialogOpen(true);
    } else {
      if (window.confirm(t('admin.users.confirmDelete', { name: user.name, email: user.email }))) {
        deleteUser(user.id);
      }
    }
  };

  const handleDeleteConfirm = async (user: UserResponse) => {
    await deleteUser(user.id);
  };

  const handleCreateSubmit = async (data: CreateUserRequest) => {
    try {
      await createUser(data);
      setCreateDialogOpen(false);
    } catch {
      // Error already handled in hook
    }
  };

  const handleUpdateSubmit = async (id: string, data: UpdateUserRequest) => {
    try {
      await updateUser(id, data);
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch {
      // Error already handled in hook
    }
  };

  const handleAssignSubscription = (user: UserResponse) => {
    setSelectedUser(user);
    setAssignSubscriptionDialogOpen(true);
  };

  const handleResetPassword = (user: UserResponse) => {
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  };

  const handleResetPasswordSubmit = async (id: string, password: string) => {
    try {
      await resetPassword(id, { password });
      setResetPasswordDialogOpen(false);
      setSelectedUser(null);
    } catch {
      // Error already handled in hook
    }
  };

  const handleAssignSubscriptionSubmit = async (data: AdminCreateSubscriptionRequest) => {
    try {
      await adminCreateSubscription(data);
      showSuccess(t('admin.users.assignSuccess', { name: selectedUser?.name }));
      setAssignSubscriptionDialogOpen(false);
      setSelectedUser(null);
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || t('admin.users.assignFailed');
      showError(message);
      throw error;
    }
  };

  // Mobile layout - uses AdminLayout but with mobile-optimized content
  if (isMobile) {
    return (
      <AdminLayout>
        <div className="py-3">
          <MobileUserManagement
          users={users}
          loading={isLoading}
          refreshing={isFetching}
          page={page}
          pageSize={pageSize}
          total={pagination.total}
          onRefresh={handleRefresh}
          onCreate={() => setCreateDialogOpen(true)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAssignSubscription={handleAssignSubscription}
          onResetPassword={handleResetPassword}
          onPageChange={handlePageChange}
          />
        </div>

        {/* Mobile Dialogs/Sheets */}
        <CreateUserSheet
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreateSubmit}
        />

        <EditUserSheet
          open={editDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditDialogOpen(false);
              setSelectedUser(null);
            }
          }}
          entity={selectedUser}
          onSubmit={handleUpdateSubmit}
        />

        <AssignSubscriptionSheet
          open={assignSubscriptionDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setAssignSubscriptionDialogOpen(false);
              setSelectedUser(null);
            }
          }}
          user={selectedUser}
          onSubmit={handleAssignSubscriptionSubmit}
        />

        <ResetPasswordSheet
          open={resetPasswordDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setResetPasswordDialogOpen(false);
              setSelectedUser(null);
            }
          }}
          user={selectedUser}
          isLoading={isResettingPassword}
          onSubmit={handleResetPasswordSubmit}
        />

        <DeleteUserSheet
          open={deleteDialogOpen}
          entity={selectedUser}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteDialogOpen(false);
              setSelectedUser(null);
            }
          }}
          onConfirm={handleDeleteConfirm}
        />
      </AdminLayout>
    );
  }

  // Desktop layout
  return (
    <AdminLayout>
      <div className="py-3 space-y-3">
        {/* High-Density Status Bar - All metrics inline */}
        <header className="bg-card rounded-lg border border-border px-3 py-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Left: Title + Primary Stats */}
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-semibold text-foreground">{t('admin.users.title')}</h1>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="size-3" />
                  <span className="font-medium text-foreground">{stats.total}</span>
                  <span className="hidden sm:inline">{t('admin.users.usersLabel')}</span>
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-success" />
                  <span className="font-medium text-success">{stats.active}</span>
                </span>
              </div>
            </div>

            {/* Center: Secondary Stats */}
            <div className="hidden md:flex items-center gap-3 text-xs">
              {stats.pending > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3 text-warning" />
                  <span className="text-muted-foreground">{t('admin.users.statusPending')}</span>
                  <span className="font-semibold tabular-nums text-warning">{stats.pending}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <XCircle className="size-3 text-muted-foreground" />
                <span className="text-muted-foreground">{t('admin.users.statusInactive')}</span>
                <span className="font-semibold tabular-nums text-foreground">{stats.inactive}</span>
              </span>
              {stats.suspended > 0 && (
                <span className="flex items-center gap-1.5">
                  <UserX className="size-3 text-destructive" />
                  <span className="text-muted-foreground">{t('admin.users.statusSuspended')}</span>
                  <span className="font-semibold tabular-nums text-destructive">{stats.suspended}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Shield className="size-3 text-info" />
                <span className="text-muted-foreground">{t('admin.users.roleAdmin')}</span>
                <span className="font-semibold tabular-nums text-info">{stats.admins}</span>
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    className="h-7 w-7 p-0"
                    icon={
                      <RefreshCw
                        key={refreshKey}
                        className="size-3.5 animate-spin-once"
                        strokeWidth={1.5}
                      />
                    }
                  >
                    <span className="sr-only">{t('common.actions.refresh')}</span>
                  </AdminButton>
                </TooltipTrigger>
                <TooltipContent>{t('admin.users.refreshList')}</TooltipContent>
              </Tooltip>

              <AdminButton
                variant="primary"
                size="sm"
                className="h-7 px-2.5 text-xs"
                icon={<Plus className="size-3.5" strokeWidth={2} />}
                onClick={() => setCreateDialogOpen(true)}
              >
                <span className="hidden sm:inline">{t('admin.users.createUser')}</span>
                <span className="sm:hidden">{t('common.actions.create')}</span>
              </AdminButton>
            </div>
          </div>
        </header>

        {/* User List - Desktop Table */}
        <AdminCard noPadding>
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
        </AdminCard>
      </div>

      {/* Desktop Dialogs */}
      <CreateUserDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <EditUserDialog
        open={editDialogOpen}
        user={selectedUser}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleUpdateSubmit}
      />

      <AssignSubscriptionDialog
        open={assignSubscriptionDialogOpen}
        user={selectedUser}
        onClose={() => {
          setAssignSubscriptionDialogOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleAssignSubscriptionSubmit}
      />

      <ResetPasswordDialog
        open={resetPasswordDialogOpen}
        user={selectedUser}
        isLoading={isResettingPassword}
        onClose={() => {
          setResetPasswordDialogOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleResetPasswordSubmit}
      />
    </AdminLayout>
  );
};
