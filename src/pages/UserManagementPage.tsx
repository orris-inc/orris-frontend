/**
 * User Management Page (Admin)
 * Tailwind UI Application UI style interface
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
import { PageHeader } from '@/components/admin';
import { Button } from '@/components/common/Button';
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
import type { PageHeaderMeta } from '@/components/admin/PageHeader';

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

  // Build metadata items for PageHeader
  const headerMetadata = useMemo((): PageHeaderMeta[] => {
    const items: PageHeaderMeta[] = [
      { icon: Users, text: `${stats.total} ${t('admin.users.usersLabel')}` },
      { icon: CheckCircle2, text: `${stats.active} ${t('common.status.active')}` },
    ];

    if (stats.pending > 0) {
      items.push({ icon: Clock, text: `${stats.pending} ${t('common.status.pending')}` });
    }

    items.push({ icon: XCircle, text: `${stats.inactive} ${t('common.status.inactive')}` });

    if (stats.suspended > 0) {
      items.push({ icon: UserX, text: `${stats.suspended} ${t('common.status.suspended')}` });
    }

    items.push({ icon: Shield, text: `${stats.admins} ${t('common.role.admin')}` });

    return items;
  }, [stats, t]);

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

  // Desktop layout - Tailwind UI Application UI style
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header with metadata stats */}
        <PageHeader
          title={t('admin.users.title')}
          icon={Users}
          metadata={headerMetadata}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                aria-label={t('common.actions.refresh')}
              >
                <RefreshCw
                  key={refreshKey}
                  className="size-4 animate-spin-once"
                />
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="size-4 mr-2" />
                {t('admin.users.createUser')}
              </Button>
            </div>
          }
        />

        {/* User List Table */}
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
