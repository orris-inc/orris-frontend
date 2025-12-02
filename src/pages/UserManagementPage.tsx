/**
 * 用户管理页面（管理端）
 * 精致商务风格 - 统一设计系统
 */

import { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { UserListTable } from '@/features/users/components/UserListTable';
import { EditUserDialog } from '@/features/users/components/EditUserDialog';
import { CreateUserDialog } from '@/features/users/components/CreateUserDialog';
import { AssignSubscriptionDialog } from '@/features/subscriptions/components/AssignSubscriptionDialog';
import { useUsersPage } from '@/features/users/hooks/useUsers';
import { AdminLayout } from '@/layouts/AdminLayout';
import { createSubscription } from '@/features/subscriptions/api/subscriptions-api';
import { useNotificationStore } from '@/shared/stores/notification-store';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
} from '@/components/admin';
import type { UserListItem, UpdateUserRequest, CreateUserRequest } from '@/features/users/types/users.types';
import type { CreateSubscriptionRequest } from '@/features/subscriptions/types/subscriptions.types';

export const UserManagementPage = () => {
  const {
    users,
    pagination,
    page,
    pageSize,
    isLoading,
    createUser,
    updateUser,
    deleteUser,
    handlePageChange,
    handlePageSizeChange,
  } = useUsersPage();

  const { showSuccess, showError } = useNotificationStore();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignSubscriptionDialogOpen, setAssignSubscriptionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);

  const handleEdit = (user: UserListItem) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = async (user: UserListItem) => {
    if (window.confirm(`确认删除用户 "${user.name}" (${user.email}) 吗？此操作不可恢复。`)) {
      await deleteUser(user.id);
    }
  };

  const handleCreateSubmit = async (data: CreateUserRequest) => {
    try {
      await createUser(data);
      setCreateDialogOpen(false);
    } catch {
      // 错误已在 hook 中处理
    }
  };

  const handleUpdateSubmit = async (id: number | string, data: UpdateUserRequest) => {
    try {
      await updateUser(id, data);
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch {
      // 错误已在 hook 中处理
    }
  };

  const handleAssignSubscription = (user: UserListItem) => {
    setSelectedUser(user);
    setAssignSubscriptionDialogOpen(true);
  };

  const handleAssignSubscriptionSubmit = async (data: CreateSubscriptionRequest) => {
    try {
      await createSubscription(data);
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
      <AdminPageLayout
        title="用户管理"
        description="管理系统中的所有用户账户"
        icon={Users}
        action={
          <AdminButton
            variant="primary"
            icon={<Plus className="size-4" strokeWidth={1.5} />}
            onClick={() => setCreateDialogOpen(true)}
          >
            新增用户
          </AdminButton>
        }
      >
        {/* 用户列表表格 */}
        <AdminCard noPadding>
          <UserListTable
            users={users}
            loading={isLoading}
            page={page}
            pageSize={pageSize}
            total={pagination.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAssignSubscription={handleAssignSubscription}
          />
        </AdminCard>
      </AdminPageLayout>

      {/* 对话框 */}
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
    </AdminLayout>
  );
};
