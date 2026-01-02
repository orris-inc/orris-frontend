/**
 * User Management Page (Admin)
 * Uses unified refined business style components
 */

import { useState, useMemo } from 'react';
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
import { Separator } from '@/components/common/Separator';
import { AdminLayout } from '@/layouts/AdminLayout';
import {
  AdminButton,
  AdminCard,
  PageStatsCard,
  type PageStatsCardProps,
} from '@/components/admin';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { UserListTable } from '@/features/users/components/UserListTable';
import { EditUserDialog } from '@/features/users/components/EditUserDialog';
import { CreateUserDialog } from '@/features/users/components/CreateUserDialog';
import { ResetPasswordDialog } from '@/features/users/components/ResetPasswordDialog';
import { AssignSubscriptionDialog } from '@/features/subscriptions/components/AssignSubscriptionDialog';
import { useUsersPage } from '@/features/users/hooks/useUsers';
import { adminCreateSubscription } from '@/api/subscription';
import type { UserResponse, UpdateUserRequest, CreateUserRequest } from '@/api/user';
import type { AdminCreateSubscriptionRequest } from '@/api/subscription/types';

export const UserManagementPage = () => {
  usePageTitle('用户管理');

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
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Calculate user statistics
  const userStats = useMemo(() => {
    const total = pagination.total;
    const active = users.filter((u) => u.status === 'active').length;
    const pending = users.filter((u) => u.status === 'pending').length;
    const inactive = users.filter((u) => u.status === 'inactive').length;
    const suspended = users.filter((u) => u.status === 'suspended').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    return { total, active, pending, inactive, suspended, admins };
  }, [users, pagination.total]);

  const statsCards: PageStatsCardProps[] = [
    {
      title: '用户总数',
      value: userStats.total,
      icon: <Users className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: '活跃用户',
      value: userStats.active,
      icon: <CheckCircle2 className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-success-muted',
      iconColor: 'text-success',
      showPulse: userStats.active > 0,
    },
    {
      title: '待验证',
      value: userStats.pending,
      icon: <Clock className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-warning-muted',
      iconColor: 'text-warning',
    },
    {
      title: '已停用',
      value: userStats.inactive + userStats.suspended,
      icon: <XCircle className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
    },
    ...(userStats.suspended > 0
      ? [
          {
            title: '已封禁',
            value: userStats.suspended,
            icon: <UserX className="size-4" strokeWidth={1.5} />,
            iconBg: 'bg-destructive/10',
            iconColor: 'text-destructive',
          },
        ]
      : []),
    {
      title: '管理员',
      value: userStats.admins,
      icon: <Shield className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-info-muted',
      iconColor: 'text-info',
    },
  ];

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  const handleEdit = (user: UserResponse) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = async (user: UserResponse) => {
    if (window.confirm(`确认删除用户 "${user.name}" (${user.email}) 吗？此操作不可恢复。`)) {
      await deleteUser(user.id);
    }
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
      showSuccess(`成功为用户 ${selectedUser?.name} 分配订阅`);
      setAssignSubscriptionDialogOpen(false);
      setSelectedUser(null);
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '分配订阅失败';
      showError(message);
      throw error;
    }
  };

  return (
    <AdminLayout>
      <div className="py-6 sm:py-8">
        {/* Page Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5 sm:mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="size-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  实时数据
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                用户管理
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                管理系统中的所有用户账户
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
            {statsCards.map((stat, index) => (
              <PageStatsCard key={index} {...stat} loading={isFetching} />
            ))}
          </div>
        </header>

        <Separator className="mb-5 sm:mb-6" />

        {/* Toolbar */}
        <div className="flex items-center justify-end gap-2 mb-4 sm:mb-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <AdminButton
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                icon={
                  <RefreshCw
                    key={refreshKey}
                    className="size-4 animate-spin-once"
                    strokeWidth={1.5}
                  />
                }
              >
                <span className="sr-only">刷新</span>
              </AdminButton>
            </TooltipTrigger>
            <TooltipContent>刷新列表</TooltipContent>
          </Tooltip>

          <AdminButton
            variant="primary"
            size="sm"
            icon={<Plus className="size-4" strokeWidth={2} />}
            onClick={() => setCreateDialogOpen(true)}
          >
            <span className="hidden sm:inline">新增用户</span>
            <span className="sm:hidden">新增</span>
          </AdminButton>
        </div>

        {/* User List */}
        {isMobile ? (
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
        ) : (
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
        )}
      </div>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={editDialogOpen}
        user={selectedUser}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleUpdateSubmit}
      />

      {/* Assign Subscription Dialog */}
      <AssignSubscriptionDialog
        open={assignSubscriptionDialogOpen}
        user={selectedUser}
        onClose={() => {
          setAssignSubscriptionDialogOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleAssignSubscriptionSubmit}
      />

      {/* Reset Password Dialog */}
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
