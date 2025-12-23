/**
 * Authentication related Hooks
 */

import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuthStore } from '../stores/auth-store';
import * as authApi from '@/api/auth';
import {
  extractAuthError,
  type AuthError,
  type AuthErrorType,
} from '@/shared/utils/error-messages';
import type { LoginRequest, RegisterRequest } from '@/api/auth';
import { openOAuthPopup, type OAuthProvider } from '../utils/oauth-popup';

/**
 * Validate if redirect URL is safe (only allow relative paths)
 */
const isSafeRedirectUrl = (url: string): boolean => {
  // Only allow relative paths to prevent open redirect vulnerabilities
  // Check if it starts with /, but not // or contains a protocol
  if (!url.startsWith('/') || url.startsWith('//')) {
    return false;
  }

  // Prevent javascript:, data:, vbscript:, etc. protocols
  const lowerUrl = url.toLowerCase();
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(protocol => lowerUrl.includes(protocol))) {
    return false;
  }

  return true;
};

/**
 * Hook for using authentication features
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login: storeLogin, logout: storeLogout } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<AuthError | null>(null);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setError(null);
    setAuthError(null);
  }, []);

  /**
   * Get redirect URL after login
   * Priority: 1. URL parameter 2. location.state 3. Redirect based on user role
   */
  const getRedirectUrl = useCallback((userRole?: 'admin' | 'user' | 'moderator'): string => {
    // Read from URL parameter
    const searchParams = new URLSearchParams(location.search);
    const redirectParam = searchParams.get('redirect');
    if (redirectParam && isSafeRedirectUrl(redirectParam)) {
      return redirectParam;
    }

    // Read from location.state
    const state = location.state as { from?: string } | null;
    if (state?.from && isSafeRedirectUrl(state.from)) {
      return state.from;
    }

    // Redirect to different pages based on user role
    if (userRole === 'admin') {
      return '/admin';
    }

    // Default redirect to user dashboard
    return '/dashboard';
  }, [location]);

  /**
   * Login
   */
  const login = useCallback(
    async (data: LoginRequest) => {
      setIsLoading(true);
      clearErrors();

      try {
        // Login API returns user info, Token is stored in HttpOnly Cookie
        const response = await authApi.login(data);
        storeLogin(response.user);

        // Redirect based on user role after successful login
        const redirectUrl = getRedirectUrl(response.user.role as 'admin' | 'user' | 'moderator');
        navigate(redirectUrl, { replace: true });
      } catch (err) {
        const structured = extractAuthError(err);
        setError(structured.message);
        setAuthError(structured);
        // Re-throw the original error so the caller can handle it specially
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [storeLogin, navigate, getRedirectUrl, clearErrors]
  );

  /**
   * OAuth Login
   */
  const loginWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      setIsLoading(true);
      clearErrors();

      try {
        // OAuth returns user info, Token is stored in HttpOnly Cookie
        const user = await openOAuthPopup(provider);
        storeLogin(user);

        // Redirect based on user role after successful OAuth login
        const redirectUrl = getRedirectUrl(user.role as 'admin' | 'user' | 'moderator');
        // Use window.location for reliable redirect after OAuth popup
        // React Router navigate may not work reliably in popup callback context
        window.location.href = redirectUrl;
      } catch (err) {
        const structured = extractAuthError(err);
        setError(structured.message || 'OAuth登录失败，请重试');
        setAuthError(structured);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [storeLogin, getRedirectUrl, clearErrors]
  );

  /**
   * Register
   */
  const register = useCallback(
    async (data: RegisterRequest) => {
      setIsLoading(true);
      clearErrors();

      try {
        await authApi.register(data);

        // After successful registration, redirect to verification pending page
        navigate('/verification-pending', {
          state: { email: data.email },
        });
      } catch (err) {
        const structured = extractAuthError(err);
        setError(structured.message);
        setAuthError(structured);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, clearErrors]
  );

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.logout();
    } catch {
      // Logout error ignored, proceed with local state cleanup
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
    authError,
    clearErrors,
    login,
    loginWithOAuth,
    register,
    logout,
  };
};

// Re-export types for convenience
export type { AuthError, AuthErrorType };
