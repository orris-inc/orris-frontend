/**
 * 用户管理页面（管理端）
 * 精致商务风格 - 统一设计系统
 */

import { useState } from 'react';
import { Users, Plus, FilterX } from 'lucide-react';
import { UserListTable } from '@/features/users/components/UserListTable';
import { EditUserDialog } from '@/features/users/components/EditUserDialog';
import { CreateUserDialog } from '@/features/users/components/CreateUserDialog';
import { AssignSubscriptionDialog } from '@/features/subscriptions/components/AssignSubscriptionDialog';
import { useUsers } from '@/features/users/hooks/useUsers';
import { AdminLayout } from '@/layouts/AdminLayout';
import { createSubscription } from '@/features/subscriptions/api/subscriptions-api';
import { useNotificationStore } from '@/shared/stores/notification-store';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
  AdminFilterCard,
  FilterRow,
} from '@/components/admin';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/common/Select';
import { Label } from '@/components/common/Label';
import { inputStyles } from '@/lib/ui-styles';
import type { UserListItem, UpdateUserRequest, CreateUserRequest, UserStatus, UserRole } from '@/features/users/types/users.types';
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

  // Filter handlers
  const handleStatusChange = (value: string) => {
    setFilters({ status: value !== 'all' ? (value as UserStatus) : undefined });
  };

  const handleRoleChange = (value: string) => {
    setFilters({ role: value !== 'all' ? (value as UserRole) : undefined });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handleResetFilters = () => {
    setFilters({ status: undefined, role: undefined, search: '' });
  };

  return (
    <AdminLayout>
      <AdminPageLayout
        title="用户管理"
        description="管理系统中的所有用户账户"
        icon={Users}
        info="在这里管理系统用户。您可以新增、编辑、禁用用户，或为用户分配订阅计划。"
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
        {/* 筛选器 */}
        <AdminFilterCard>
          <FilterRow columns={4}>
            {/* 状态筛选 */}
            <div className="space-y-2">
              <Label>状态</Label>
              <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="active">激活</SelectItem>
                  <SelectItem value="inactive">未激活</SelectItem>
                  <SelectItem value="pending">待处理</SelectItem>
                  <SelectItem value="suspended">暂停</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 角色筛选 */}
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={filters.role || 'all'} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 搜索 */}
            <div className="space-y-2">
              <Label>搜索</Label>
              <input
                type="text"
                placeholder="搜索用户名或邮箱"
                value={filters.search || ''}
                onChange={handleSearchChange}
                className={inputStyles}
              />
            </div>

            {/* 重置按钮 */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <AdminButton
                variant="outline"
                onClick={handleResetFilters}
                icon={<FilterX className="size-4" strokeWidth={1.5} />}
              >
                重置筛选
              </AdminButton>
            </div>
          </FilterRow>
        </AdminFilterCard>

        {/* 用户列表表格 */}
        <AdminCard noPadding>
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
