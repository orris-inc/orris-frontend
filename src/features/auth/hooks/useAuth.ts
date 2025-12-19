/**
 * 认证相关 Hooks
 */

import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuthStore } from '../stores/auth-store';
import * as authApi from '@/api/auth';
import { extractErrorMessage } from '@/shared/utils/error-messages';
import type { LoginRequest, RegisterRequest } from '@/api/auth';
import { openOAuthPopup, type OAuthProvider } from '../utils/oauth-popup';

/**
 * 验证重定向URL是否安全（仅允许相对路径）
 */
const isSafeRedirectUrl = (url: string): boolean => {
  // 只允许相对路径，防止开放重定向漏洞
  // 检查是否以 / 开头，但不是 // 或包含协议
  if (!url.startsWith('/') || url.startsWith('//')) {
    return false;
  }
  
  // 防止 javascript:, data:, vbscript: 等协议
  const lowerUrl = url.toLowerCase();
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(protocol => lowerUrl.includes(protocol))) {
    return false;
  }
  
  return true;
};

/**
 * 使用认证功能的Hook
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login: storeLogin, logout: storeLogout } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 获取登录后的重定向地址
   * 优先级：1. URL参数 2. location.state 3. 根据用户角色重定向
   */
  const getRedirectUrl = useCallback((userRole?: 'admin' | 'user' | 'moderator'): string => {
    // 从URL参数读取
    const searchParams = new URLSearchParams(location.search);
    const redirectParam = searchParams.get('redirect');
    if (redirectParam && isSafeRedirectUrl(redirectParam)) {
      return redirectParam;
    }

    // 从location.state读取
    const state = location.state as { from?: string } | null;
    if (state?.from && isSafeRedirectUrl(state.from)) {
      return state.from;
    }

    // 根据用户角色重定向到不同页面
    if (userRole === 'admin') {
      return '/admin';
    }

    // 默认跳转到用户端 dashboard
    return '/dashboard';
  }, [location]);

  /**
   * 登录
   */
  const login = useCallback(
    async (data: LoginRequest) => {
      setIsLoading(true);
      setError(null);

      try {
        // 登录接口返回用户信息，Token 存储在 HttpOnly Cookie 中
        const response = await authApi.login(data);
        storeLogin(response.user);

        // 登录成功后根据用户角色跳转
        const redirectUrl = getRedirectUrl(response.user.role as 'admin' | 'user' | 'moderator');
        navigate(redirectUrl, { replace: true });
      } catch (err) {
        // 记录原始错误用于调试
        console.error('登录错误:', err);
        const errorMsg = extractErrorMessage(err);
        setError(errorMsg);
        // 重新抛出原始错误，以便调用者可以进行特殊处理（如判断是否是账号未激活）
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [storeLogin, navigate, getRedirectUrl]
  );

  /**
   * OAuth登录
   */
  const loginWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      setIsLoading(true);
      setError(null);

      try {
        // OAuth 返回用户信息，Token 存储在 HttpOnly Cookie 中
        const user = await openOAuthPopup(provider);
        storeLogin(user);

        // OAuth登录成功后根据用户角色跳转
        const redirectUrl = getRedirectUrl(user.role as 'admin' | 'user' | 'moderator');
        navigate(redirectUrl, { replace: true });
      } catch (err) {
        console.error('OAuth登录错误:', err);
        const errorMsg = extractErrorMessage(err);
        setError(errorMsg || 'OAuth登录失败，请重试');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [storeLogin, navigate, getRedirectUrl]
  );

  /**
   * 注册
   */
  const register = useCallback(
    async (data: RegisterRequest) => {
      setIsLoading(true);
      setError(null);

      try {
        await authApi.register(data);

        // 注册成功，跳转到验证待处理页面
        navigate('/verification-pending', {
          state: { email: data.email },
        });
      } catch (err) {
        console.error('注册错误:', err);
        const errorMsg = extractErrorMessage(err);
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  /**
   * 登出
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      storeLogout();
      setIsLoading(false);
    }
  }, [storeLogout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginWithOAuth,
    register,
    logout,
  };
};
