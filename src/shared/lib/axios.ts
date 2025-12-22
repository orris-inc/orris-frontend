/**
 * Axios client configuration
 * Uses HttpOnly Cookie for authentication
 */

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import applyCaseMiddleware from 'axios-case-converter';
import type { APIResponse } from '@/shared/types/api.types';
import { extractErrorMessage } from '@/shared/utils/error-messages';

// Runtime configuration type declaration
declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_BASE_URL?: string;
    };
  }
}

// API base URL (priority: environment variable > runtime config > default value)
export const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  window.__APP_CONFIG__?.API_BASE_URL ||
  '/api';

// Create Axios instance with automatic snake_case <-> camelCase conversion
// Configure preservedKeys to keep specific field keys from being transformed (e.g., agent IDs)
export const apiClient = applyCaseMiddleware(
  axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
    withCredentials: true, // Allow carrying cookies
  }),
  {
    // Preserve keys inside chainPortConfig/chain_port_config from being transformed
    // These keys are agent IDs (e.g., fa_xK9mP2vL3nQ), containing underscores but should not be transformed
    preservedKeys: (key) => {
      // Preserve ID keys that start with fa_, fr_, node_, user_ prefixes and are longer
      // Field names like user_id, node_id are shorter (<= 10) and won't be preserved
      // While agent IDs (e.g., fa_xK9mP2vL3nQ) are longer and will be preserved
      return /^(fa|fr|node|user)_/.test(key) && key.length > 10;
    },
  }
);

// Store refresh token promise to avoid concurrent refreshes
let refreshTokenPromise: Promise<void> | null = null;

// Record last refresh time to prevent frequent refreshing
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 5000; // Do not repeat refresh within 5 seconds

/**
 * Request interceptor
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
 * Refresh Access Token
 * Cookie will be automatically carried, backend will automatically update Cookie
 */
const refreshAccessToken = async (): Promise<void> => {
  // If a refresh request is already in progress, wait for it to complete
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  // Check refresh cooldown time to prevent frequent refreshing
  const now = Date.now();
  if (now - lastRefreshTime < REFRESH_COOLDOWN) {
    return Promise.resolve();
  }

  lastRefreshTime = now;

  refreshTokenPromise = (async () => {
    try {
      // Call refresh endpoint, Cookie automatically carried
      await axios.post<APIResponse>(
        `${baseURL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      // Backend will automatically update Cookie, frontend doesn't need to handle it
    } catch (error) {
      // Refresh failed, only redirect to login page when not on public pages
      // Avoid redirect loops on public pages like login, register, etc.
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
 * Response interceptor: handle 401 errors, automatically refresh Token
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 error and not retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh Token (Cookie automatically carried and updated)
        await refreshAccessToken();

        // Retry original request (new Cookie will be automatically carried)
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh Token failure already handled in refreshAccessToken
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Error handling helper function
 * Uses unified error message conversion tool
 */
export const handleApiError = (error: unknown): string => {
  // Use unified error message extraction and conversion tool
  return extractErrorMessage(error);
};
