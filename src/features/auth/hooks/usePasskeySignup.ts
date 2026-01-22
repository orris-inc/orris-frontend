/**
 * Passkey Signup Hook
 * Handles passkey-based new user registration (passwordless signup)
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth-store';
import {
  checkPasskeySupport,
  signupWithPasskey,
  parsePasskeyError,
  type PasskeyErrorType,
} from '@/api/passkey';

// ============================================================================
// Types
// ============================================================================

interface PasskeySignupState {
  /** Whether WebAuthn is supported in this browser */
  isSupported: boolean;
  /** Whether a platform authenticator is available */
  hasPlatformAuth: boolean;
  /** Loading state during signup */
  isLoading: boolean;
  /** Error message if signup failed */
  error: string | null;
  /** Specific WebAuthn error type for handling */
  errorType: PasskeyErrorType | null;
}

interface UsePasskeySignupReturn extends PasskeySignupState {
  /** Execute passkey signup flow */
  signupWithPasskey: (email: string, name: string, deviceName?: string) => Promise<boolean>;
  /** Clear any errors */
  clearError: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePasskeySignup(): UsePasskeySignupReturn {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login: storeLogin } = useAuthStore();

  const [state, setState] = useState<PasskeySignupState>({
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
        console.log('[PasskeySignup] Support check:', {
          isSupported: capabilities.isSupported,
          hasPlatformAuthenticator: capabilities.hasPlatformAuthenticator,
          hasConditionalUI: capabilities.hasConditionalUI,
          isSecureContext: window.isSecureContext,
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
          return t('auth.passkey.errors.alreadyRegistered');
        case 'not_allowed':
          return t('auth.passkey.errors.notAllowed');
        default:
          return t('auth.passkey.errors.unknown');
      }
    },
    [t]
  );

  /**
   * Execute passkey signup flow using SDK high-level API
   * @param email User's email address
   * @param name User's display name
   * @param deviceName Optional friendly name for the passkey
   * @returns true if signup was successful
   */
  const handleSignupWithPasskey = useCallback(
    async (email: string, name: string, deviceName?: string): Promise<boolean> => {
      if (!state.isSupported) {
        setState((prev) => ({
          ...prev,
          error: t('auth.passkey.errors.notSupported'),
          errorType: 'not_supported',
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        errorType: null,
      }));

      try {
        // Use SDK high-level API for complete signup flow
        const result = await signupWithPasskey({
          email,
          name,
          deviceName,
          authenticatorAttachment: state.hasPlatformAuth ? 'platform' : undefined,
        });

        // Update auth store with new user
        storeLogin(result.user);

        // Redirect based on user role
        const redirectPath = result.user.role === 'admin' ? '/admin' : '/dashboard';
        navigate(redirectPath, { replace: true });

        return true;
      } catch (error) {
        // Debug logging for error diagnosis
        if (import.meta.env.DEV) {
          console.error('[PasskeySignup] Error:', error);
        }

        // Handle passkey errors using SDK error parser
        const parsed = parsePasskeyError(error);
        setState((prev) => ({
          ...prev,
          error: getErrorMessage(parsed.type),
          errorType: parsed.type,
        }));
        return false;
      } finally {
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    },
    [state.isSupported, state.hasPlatformAuth, t, storeLogin, navigate, getErrorMessage]
  );

  return {
    ...state,
    signupWithPasskey: handleSignupWithPasskey,
    clearError,
  };
}
