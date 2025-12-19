/**
 * Axios 客户端配置
 * 使用 HttpOnly Cookie 进行认证
 */

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import applyCaseMiddleware from 'axios-case-converter';
import type { APIResponse } from '@/shared/types/api.types';
import { extractErrorMessage } from '@/shared/utils/error-messages';

// 运行时配置类型声明
declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_BASE_URL?: string;
    };
  }
}

// API 基础 URL（优先级：环境变量 > 运行时配置 > 默认值）
export const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  window.__APP_CONFIG__?.API_BASE_URL ||
  '/api';

// 创建 Axios 实例，应用 snake_case <-> camelCase 自动转换
// 配置 preservedKeys 保留特定字段的 key 不被转换（如 agent ID）
export const apiClient = applyCaseMiddleware(
  axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
    withCredentials: true, // 允许携带 Cookie
  }),
  {
    // 保留 chainPortConfig/chain_port_config 内部的 key 不被转换
    // 这些 key 是 agent ID（如 fa_xK9mP2vL3nQ），包含下划线但不应被转换
    preservedKeys: (key) => {
      // 保留以 fa_、fr_、node_、user_ 等前缀开头且长度较长的 ID key
      // 像 user_id、node_id 这样的字段名长度较短（<= 10），不会被保留
      // 而 agent ID（如 fa_xK9mP2vL3nQ）长度较长，会被保留
      return /^(fa|fr|node|user)_/.test(key) && key.length > 10;
    },
  }
);

// 存储刷新token的promise，避免并发刷新
let refreshTokenPromise: Promise<void> | null = null;

// 记录最后一次刷新时间，防止频繁刷新
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 5000; // 5秒内不重复刷新

/**
 * 请求拦截器
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 刷新 Access Token
 * Cookie 会自动携带，后端会自动更新 Cookie
 */
const refreshAccessToken = async (): Promise<void> => {
  // 如果已经有刷新请求在进行中，等待它完成
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  // 检查刷新冷却时间，防止频繁刷新
  const now = Date.now();
  if (now - lastRefreshTime < REFRESH_COOLDOWN) {
    return Promise.resolve();
  }

  lastRefreshTime = now;

  refreshTokenPromise = (async () => {
    try {
      // 调用刷新接口，Cookie 自动携带
      await axios.post<APIResponse>(
        `${baseURL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      // 后端会自动更新 Cookie，前端无需处理
    } catch (error) {
      // 刷新失败，只在非公开页面时跳转到登录页
      // 避免在登录页、注册页等公开页面造成重定向循环
      if (typeof window !== 'undefined') {
        const publicPaths = [
          '/login', '/login-new', '/login-minimal', '/login-glass',
          '/login-apple', '/login-selector', '/register',
          '/forgot-password', '/reset-password', '/verify-email',
          '/verification-pending', '/pricing'
        ];
        const currentPath = window.location.pathname;

        if (!publicPaths.includes(currentPath)) {
          window.location.href = '/login';
        }
      }
      throw error;
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
};

/**
 * 响应拦截器：处理 401 错误，自动刷新 Token
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 错误且未重试过
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 刷新 Token（Cookie 自动携带和更新）
        await refreshAccessToken();

        // 重试原请求（新的 Cookie 会自动携带）
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 刷新 Token 失败已在 refreshAccessToken 中处理
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * 错误处理辅助函数
 * 使用统一的错误消息转换工具
 */
export const handleApiError = (error: unknown): string => {
  // 使用统一的错误消息提取和转换工具
  return extractErrorMessage(error);
};
