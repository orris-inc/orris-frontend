/**
 * 用户管理页面（管理端）
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { UserListTable } from '@/features/users/components/UserListTable';
import { UserFilters } from '@/features/users/components/UserFilters';
import { EditUserDialog } from '@/features/users/components/EditUserDialog';
import { CreateUserDialog } from '@/features/users/components/CreateUserDialog';
import { AssignSubscriptionDialog } from '@/features/subscriptions/components/AssignSubscriptionDialog';
import { useUsers } from '@/features/users/hooks/useUsers';
import { AdminLayout } from '@/layouts/AdminLayout';
import { createSubscription } from '@/features/subscriptions/api/subscriptions-api';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { UserListItem, UpdateUserRequest, CreateUserRequest } from '@/features/users/types/users.types';
import type { CreateSubscriptionRequest } from '@/features/subscriptions/types/subscriptions.types';

export const UserManagementPage = () => {
  const {
    users,
    pagination,
    filters,
    loading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    setFilters,
  } = useUsers();

  const { showSuccess, showError } = useNotificationStore();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignSubscriptionDialogOpen, setAssignSubscriptionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);

  const handlePageChange = (page: number) => {
    fetchUsers(page, pagination.page_size);
  };

  const handlePageSizeChange = (pageSize: number) => {
    fetchUsers(1, pageSize);
  };

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
    const result = await createUser(data);
    if (result) {
      setCreateDialogOpen(false);
    }
  };

  const handleUpdateSubmit = async (id: number | string, data: UpdateUserRequest) => {
    const result = await updateUser(id, data);
    if (result) {
      setEditDialogOpen(false);
      setSelectedUser(null);
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
      <div className="container mx-auto max-w-7xl py-6">
        {/* 页面标题 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">用户管理</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              管理系统中的所有用户账户
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            新增用户
          </Button>
        </div>

        {/* 筛选器 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <UserFilters filters={filters} onChange={setFilters} />
          </CardContent>
        </Card>

        {/* 用户列表表格 */}
        <UserListTable
          users={users}
          loading={loading}
          page={pagination.page}
          pageSize={pagination.page_size}
          total={pagination.total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAssignSubscription={handleAssignSubscription}
        />

        {/* 新增用户对话框 */}
        <CreateUserDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreateSubmit}
        />

        {/* 编辑用户对话框 */}
        <EditUserDialog
          open={editDialogOpen}
          user={selectedUser}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedUser(null);
          }}
          onSubmit={handleUpdateSubmit}
        />

        {/* 分配订阅对话框 */}
        <AssignSubscriptionDialog
          open={assignSubscriptionDialogOpen}
          user={selectedUser}
          onClose={() => {
            setAssignSubscriptionDialogOpen(false);
            setSelectedUser(null);
          }}
          onSubmit={handleAssignSubscriptionSubmit}
        />
      </div>
    </AdminLayout>
  );
};
