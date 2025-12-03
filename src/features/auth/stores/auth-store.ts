/**
 * Zustand 5 认证状态管理
 * 使用 HttpOnly Cookie 进行认证，不在本地存储任何认证信息
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User } from '@/api/auth';

interface AuthState {
  // 状态
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // 方法
  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      // 初始状态
      user: null,
      isAuthenticated: false,
      isLoading: true, // 初始为 true，等待检查登录状态

      // 登录
      login: (user: User) => {
        set({
          user,
          isAuthenticated: true,
        });
      },

      // 登出
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });

        // 跳转到登录页
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      // 设置用户信息
      setUser: (user: User) => {
        set({ user });
      },

      // 清除认证信息
      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      // 设置加载状态
      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },
    }),
    { name: 'AuthStore' }
  )
);
