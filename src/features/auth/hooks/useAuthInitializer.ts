/**
 * 认证初始化 Hook
 * 应用启动时检查用户登录状态（通过 Cookie）
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/auth-store';
import * as authApi from '@/api/auth';

// 使用全局变量而非 useRef，防止 StrictMode 重新挂载时重置
// 这确保整个应用生命周期内只初始化一次
let globalHasInitialized = false;

/**
 * 初始化认证状态
 * 在应用启动时调用 /auth/me 获取当前用户信息
 * 只会调用一次
 */
export const useAuthInitializer = () => {
  const hasInitialized = useRef(false);

  useEffect(() => {
    // 使用全局变量检查，防止 StrictMode 重新挂载导致重复初始化
    if (globalHasInitialized) {
      return;
    }

    // 使用 ref 检查（防止同一组件实例多次执行）
    if (hasInitialized.current) {
      return;
    }

    globalHasInitialized = true;
    hasInitialized.current = true;

    const initializeAuth = async () => {
      try {
        const user = await authApi.getCurrentUser();
        useAuthStore.getState().login(user);
      } catch {
        useAuthStore.getState().clearAuth();
      } finally {
        useAuthStore.getState().setLoading(false);
      }
    };

    initializeAuth();
  }, []); // 空依赖项，只在挂载时执行一次
};
