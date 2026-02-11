/**
 * Passkey Authentication Hook
 * Handles passkey login flow using WebAuthn discoverable credentials
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth-store';
import {
  checkPasskeySupport,
  authenticateWithPasskey,
  parsePasskeyError,
  type PasskeyErrorType,
} from '@/api/passkey';

// ============================================================================
// Types
// ============================================================================

interface PasskeyState {
  /** Whether WebAuthn is supported in this browser */
  isSupported: boolean;
  /** Whether a platform authenticator is available */
  hasPlatformAuth: boolean;
  /** Loading state during authentication */
  isLoading: boolean;
  /** Error message if authentication failed */
  error: string | null;
  /** Specific WebAuthn error type for handling */
  errorType: PasskeyErrorType | null;
}

interface UsePasskeyReturn extends PasskeyState {
  /** Execute passkey login flow */
  loginWithPasskey: () => Promise<void>;
  /** Clear any errors */
  clearError: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Validate if redirect URL is safe (only allow relative paths)
 */
const isSafeRedirectUrl = (url: string): boolean => {
  let decoded: string;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    return false;
  }

  if (!decoded.startsWith('/') || decoded.startsWith('//')) {
    return false;
  }

  if (decoded.includes('://')) {
    return false;
  }

  const lowerUrl = decoded.toLowerCase();
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some((protocol) => lowerUrl.includes(protocol))) {
    return false;
  }
  return true;
};

export function usePasskey(): UsePasskeyReturn {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { login: storeLogin } = useAuthStore();

  const [state, setState] = useState<PasskeyState>({
    isSupported: false,
    hasPlatformAuth: false,
    isLoading: false,
    error: null,
    errorType: null,
  });

  // Check WebAuthn support on mount using SDK
  useEffect(() => {
    const initSupport = async () => {
      const capabilities = await checkPasskeySupport();

      // Debug logging for passkey support detection
      if (import.meta.env.DEV) {
        console.log('[Passkey] Support check:', {
          isSupported: capabilities.isSupported,
          hasPlatformAuthenticator: capabilities.hasPlatformAuthenticator,
          hasConditionalUI: capabilities.hasConditionalUI,
          isSecureContext: window.isSecureContext,
          hasPublicKeyCredential: typeof window.PublicKeyCredential !== 'undefined',
          hasCredentials: typeof navigator.credentials !== 'undefined',
        });
      }

      setState((prev) => ({
        ...prev,
        isSupported: capabilities.isSupported,
        hasPlatformAuth: capabilities.hasPlatformAuthenticator,
      }));
    };

    initSupport();
  }, []);

  /**
   * Get redirect URL after login
   */
  const getRedirectUrl = useCallback(
    (userRole?: 'admin' | 'user' | 'moderator'): string => {
      // Read from URL parameter
      const searchParams = new URLSearchParams(location.search);
      const redirectParam = searchParams.get('redirect');
      if (redirectParam && isSafeRedirectUrl(redirectParam)) {
        return redirectParam;
      }

      // Read from location.state
      const locationState = location.state as { from?: string } | null;
      if (locationState?.from && isSafeRedirectUrl(locationState.from)) {
        return locationState.from;
      }

      // Redirect based on user role
      if (userRole === 'admin') {
        return '/admin';
      }

      return '/dashboard';
    },
    [location]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      errorType: null,
    }));
  }, []);

  /**
   * Get translated error message based on passkey error type
   */
  const getErrorMessage = useCallback(
    (errorType: PasskeyErrorType): string => {
      switch (errorType) {
        case 'not_supported':
          return t('auth.passkey.errors.notSupported');
        case 'user_cancelled':
          return t('auth.passkey.errors.notAllowed');
        case 'security_error':
          return t('auth.passkey.errors.securityError');
        case 'timeout':
          return t('auth.passkey.errors.aborted');
        case 'invalid_state':
          return t('auth.passkey.errors.invalidState');
        case 'not_allowed':
          return t('auth.passkey.errors.notAllowed');
        default:
          return t('auth.passkey.errors.unknown');
      }
    },
    [t]
  );

  /**
   * Execute passkey login flow using SDK high-level API
   */
  const loginWithPasskey = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: t('auth.passkey.errors.notSupported'),
        errorType: 'not_supported',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      errorType: null,
    }));

    try {
      // Use SDK high-level API for complete authentication flow
      const result = await authenticateWithPasskey();

      // Update auth store and redirect
      storeLogin(result.user);
      const redirectUrl = getRedirectUrl(result.user.role as 'admin' | 'user' | 'moderator');
      navigate(redirectUrl, { replace: true });
    } catch (error) {
      // Handle passkey errors using SDK error parser
      const parsed = parsePasskeyError(error);
      setState((prev) => ({
        ...prev,
        error: getErrorMessage(parsed.type),
        errorType: parsed.type,
      }));
    } finally {
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [state.isSupported, t, storeLogin, getRedirectUrl, navigate, getErrorMessage]);

  return {
    ...state,
    loginWithPasskey,
    clearError,
  };
}
