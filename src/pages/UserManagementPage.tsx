/**
 * 用户管理页面（管理端）
 */

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { UserListTable } from '@/features/users/components/UserListTable';
import { UserFilters } from '@/features/users/components/UserFilters';
import { EditUserDialog } from '@/features/users/components/EditUserDialog';
import { CreateUserDialog } from '@/features/users/components/CreateUserDialog';
import { AssignSubscriptionDialog } from '@/features/subscriptions/components/AssignSubscriptionDialog';
import { useUsers } from '@/features/users/hooks/useUsers';
import { AdminLayout } from '@/layouts/AdminLayout';
import { createSubscription } from '@/features/subscriptions/api/subscriptions-api';
import { useNotificationStore } from '@/shared/stores/notification-store';
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
      <Container maxWidth="xl">
        <Box py={4}>
          {/* 页面标题 */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                用户管理
              </Typography>
              <Typography variant="body2" color="text.secondary">
                管理系统中的所有用户账户
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              新增用户
            </Button>
          </Box>

          {/* 筛选器 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <UserFilters filters={filters} onChange={setFilters} />
          </Paper>

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
        </Box>
      </Container>
    </AdminLayout>
  );
};
