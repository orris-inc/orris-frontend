/**
 * useUsers Hook
 * 基于 TanStack Query 实现
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '@/shared/lib/query-client';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  type User,
  type CreateUserRequest,
  type UpdateUserRequest,
  type ListUsersParams,
} from '@/api/user';
import type {
  UserFilters,
} from '../types/users.types';

interface UseUsersOptions {
  page?: number;
  pageSize?: number;
  filters?: UserFilters;
  enabled?: boolean;
}

export const useUsers = (options: UseUsersOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // 构建查询参数
  const params: ListUsersParams = {
    page,
    pageSize,
    status: filters.status as ListUsersParams['status'],
    role: filters.role as ListUsersParams['role'],
  };

  // 查询用户列表
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => listUsers(params),
    enabled,
  });

  // 创建用户
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      showSuccess('用户创建成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 更新用户
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateUserRequest }) =>
      updateUser(id, data),
    onSuccess: () => {
      showSuccess('用户信息更新成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 删除用户
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      showSuccess('用户删除成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    // 数据
    users: data?.items ?? [],
    pagination: {
      page: data?.page ?? page,
      pageSize: data?.pageSize ?? pageSize,
      total: data?.total ?? 0,
      totalPages: data?.totalPages ?? 0,
    },

    // 状态
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,

    // 操作
    refetch,
    createUser: (data: CreateUserRequest) => createMutation.mutateAsync(data),
    updateUser: (id: number | string, data: UpdateUserRequest) =>
      updateMutation.mutateAsync({ id, data }),
    deleteUser: (id: number | string) => deleteMutation.mutateAsync(id),

    // Mutation 状态
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// 获取单个用户详情
export const useUser = (id: number | string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.users.detail(id!),
    queryFn: () => getUserById(id!),
    enabled: !!id,
  });

  return {
    user: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

// 用户列表状态管理 hook（用于页面级状态）
export const useUsersPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<UserFilters>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const usersQuery = useUsers({ page, pageSize, filters });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Partial<UserFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return {
    ...usersQuery,
    page,
    pageSize,
    filters,
    selectedUser,
    setSelectedUser,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
  };
};
