/**
 * 用户管理 Zustand 状态管理
 * 不使用持久化，数据从API实时获取
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { UserListItem, UserFilters, CreateUserRequest, UpdateUserRequest } from '../types/users.types';
import type { ListResponse } from '@/shared/types/api.types';
import {
  getUsers as fetchUsersApi,
  getUserById as fetchUserByIdApi,
  createUser as createUserApi,
  updateUser as updateUserApi,
  deleteUser as deleteUserApi,
} from '../api/users-api';
import { handleApiError } from '@/shared/lib/axios';
import { useNotificationStore } from '@/shared/stores/notification-store';

// 辅助函数：根据类型显示通知
const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
  const notificationStore = useNotificationStore.getState();
  switch (type) {
    case 'success':
      notificationStore.showSuccess(message);
      break;
    case 'error':
      notificationStore.showError(message);
      break;
    case 'info':
      notificationStore.showInfo(message);
      break;
    case 'warning':
      notificationStore.showWarning(message);
      break;
  }
};

interface UsersState {
  // 状态
  users: UserListItem[];
  selectedUser: UserListItem | null;
  filters: UserFilters;
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  loading: boolean;
  error: string | null;

  // 方法
  fetchUsers: (page?: number, pageSize?: number) => Promise<void>;
  fetchUserById: (id: number | string) => Promise<void>;
  createUser: (data: CreateUserRequest) => Promise<UserListItem | null>;
  updateUser: (id: number | string, data: UpdateUserRequest) => Promise<UserListItem | null>;
  deleteUser: (id: number | string) => Promise<boolean>;
  setFilters: (filters: Partial<UserFilters>) => void;
  setSelectedUser: (user: UserListItem | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  users: [],
  selectedUser: null,
  filters: {} as UserFilters,
  pagination: {
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 0,
  },
  loading: false,
  error: null,
};

export const useUsersStore = create<UsersState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 获取用户列表
      fetchUsers: async (page = 1, pageSize = 20) => {
        set({ loading: true, error: null });

        try {
          const filters = get().filters;
          const response: ListResponse<UserListItem> = await fetchUsersApi({
            page,
            page_size: pageSize,
            ...filters,
          });

          set({
            users: response.items || [],
            pagination: {
              page: response.page,
              page_size: response.page_size,
              total: response.total,
              total_pages: response.total_pages,
            },
            loading: false,
          });
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
        }
      },

      // 获取指定用户详情
      fetchUserById: async (id: number | string) => {
        set({ loading: true, error: null });

        try {
          const user = await fetchUserByIdApi(id);
          set({ selectedUser: user as UserListItem, loading: false });
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
        }
      },

      // 创建用户
      createUser: async (data: CreateUserRequest) => {
        set({ loading: true, error: null });

        try {
          const newUser = await createUserApi(data);
          showNotification('用户创建成功', 'success');

          // 刷新列表
          await get().fetchUsers(get().pagination.page, get().pagination.page_size);

          set({ loading: false });
          return newUser;
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
          return null;
        }
      },

      // 更新用户信息
      updateUser: async (id: number | string, data: UpdateUserRequest) => {
        set({ loading: true, error: null });

        try {
          const updatedUser = await updateUserApi(id, data);
          showNotification('用户信息更新成功', 'success');

          // 刷新列表
          await get().fetchUsers(get().pagination.page, get().pagination.page_size);

          set({ loading: false });
          return updatedUser;
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
          return null;
        }
      },

      // 删除用户
      deleteUser: async (id: number | string) => {
        try {
          await deleteUserApi(id);
          showNotification('用户删除成功', 'success');

          // 刷新列表
          await get().fetchUsers(get().pagination.page, get().pagination.page_size);

          return true;
        } catch (error) {
          const errorMessage = handleApiError(error);
          showNotification(errorMessage, 'error');
          return false;
        }
      },

      // 设置筛选条件
      setFilters: (filters: Partial<UserFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
        // 应用筛选后重新获取第一页数据
        get().fetchUsers(1, get().pagination.page_size);
      },

      // 设置选中的用户
      setSelectedUser: (user: UserListItem | null) => {
        set({ selectedUser: user });
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },

      // 重置状态
      reset: () => {
        set(initialState);
      },
    }),
    { name: 'users-store' }
  )
);
