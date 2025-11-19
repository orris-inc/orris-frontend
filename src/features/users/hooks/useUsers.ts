/**
 * useUsers Hook
 * 管理端使用，包含完整的用户管理操作
 */

import { useEffect } from 'react';
import { useUsersStore } from '../stores/users-store';
import type { CreateUserRequest, UpdateUserRequest } from '../types/users.types';

export const useUsers = () => {
  const {
    users,
    selectedUser,
    filters,
    pagination,
    loading,
    error,
    fetchUsers,
    fetchUserById,
    createUser,
    updateUser,
    deleteUser,
    setFilters,
    setSelectedUser,
    clearError,
    reset,
  } = useUsersStore();

  // 组件挂载时获取数据
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 创建用户（带类型）
  const handleCreateUser = async (data: CreateUserRequest) => {
    return await createUser(data);
  };

  // 更新用户信息（带类型）
  const handleUpdateUser = async (id: number | string, data: UpdateUserRequest) => {
    return await updateUser(id, data);
  };

  // 删除用户
  const handleDeleteUser = async (id: number | string) => {
    return await deleteUser(id);
  };

  return {
    // 状态
    users,
    selectedUser,
    filters,
    pagination,
    loading,
    error,

    // 方法
    fetchUsers,
    fetchUserById,
    createUser: handleCreateUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,
    setFilters,
    setSelectedUser,
    clearError,
    reset,
  };
};
