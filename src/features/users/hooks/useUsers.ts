/**
 * useUsers Hook
 * Built with TanStack Query
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
  adminResetPassword,
  type UserResponse,
  type CreateUserRequest,
  type UpdateUserRequest,
  type ListUsersParams,
  type AdminResetPasswordRequest,
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

  // Build query params
  const params: ListUsersParams = {
    page,
    pageSize,
    status: filters.status as ListUsersParams['status'],
    role: filters.role as ListUsersParams['role'],
  };

  // Query user list
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

  // Create user
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

  // Update user
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      updateUser(id, data),
    onSuccess: () => {
      showSuccess('用户信息更新成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Delete user
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

  // Reset user password
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminResetPasswordRequest }) =>
      adminResetPassword(id, data),
    onSuccess: () => {
      showSuccess('密码重置成功');
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    // Data
    users: data?.items ?? [],
    pagination: {
      page: data?.page ?? page,
      pageSize: data?.pageSize ?? pageSize,
      total: data?.total ?? 0,
      totalPages: data?.totalPages ?? 0,
    },

    // State
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,

    // Actions
    refetch,
    createUser: (data: CreateUserRequest) => createMutation.mutateAsync(data),
    updateUser: (id: string, data: UpdateUserRequest) =>
      updateMutation.mutateAsync({ id, data }),
    deleteUser: (id: string) => deleteMutation.mutateAsync(id),
    resetPassword: (id: string, data: AdminResetPasswordRequest) =>
      resetPasswordMutation.mutateAsync({ id, data }),

    // Mutation state
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
  };
};

// Get single user details
export const useUser = (id: string | null) => {
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

// User list state management hook (for page-level state)
export const useUsersPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<UserFilters>({});
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

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
