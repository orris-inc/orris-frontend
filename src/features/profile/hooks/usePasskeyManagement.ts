/**
 * Passkey Management Hook
 * Handles passkey listing, registration, and deletion for profile settings
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  checkPasskeySupport,
  registerPasskey as sdkRegisterPasskey,
  listUserPasskeys,
  deleteUserPasskey,
  parsePasskeyError,
  type PasskeyCredential,
  type PasskeyErrorType,
} from '@/api/passkey';

// ============================================================================
// Types
// ============================================================================

interface PasskeyManagementState {
  /** Whether WebAuthn is supported in this browser */
  isSupported: boolean;
  /** Whether a platform authenticator is available */
  hasPlatformAuth: boolean;
  /** List of user's registered passkeys */
  passkeys: PasskeyCredential[];
  /** Loading state for passkey list */
  isLoading: boolean;
  /** Loading state during passkey registration */
  isRegistering: boolean;
  /** Passkey ID being deleted */
  deletingId: string | null;
  /** Error message */
  error: string | null;
  /** Specific passkey error type for handling */
  errorType: PasskeyErrorType | null;
}

interface UsePasskeyManagementReturn extends PasskeyManagementState {
  /** Fetch list of passkeys */
  fetchPasskeys: () => Promise<void>;
  /** Register a new passkey */
  registerPasskey: (deviceName?: string) => Promise<boolean>;
  /** Delete a passkey */
  removePasskey: (id: string) => Promise<boolean>;
  /** Clear any errors */
  clearError: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePasskeyManagement(): UsePasskeyManagementReturn {
  const { t } = useTranslation();

  const [state, setState] = useState<PasskeyManagementState>({
    isSupported: false,
    hasPlatformAuth: false,
    passkeys: [],
    isLoading: false,
    isRegistering: false,
    deletingId: null,
    error: null,
    errorType: null,
  });

  // Check WebAuthn support on mount using SDK
  useEffect(() => {
    const initSupport = async () => {
      const capabilities = await checkPasskeySupport();

      // Debug logging for passkey support detection
      if (import.meta.env.DEV) {
        console.log('[PasskeyManagement] Support check:', {
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
          return t('profile.security.passkey.errors.notSupported');
        case 'user_cancelled':
          return t('profile.security.passkey.errors.notAllowed');
        case 'security_error':
          return t('profile.security.passkey.errors.securityError');
        case 'timeout':
          return t('profile.security.passkey.errors.aborted');
        case 'invalid_state':
          return t('profile.security.passkey.errors.alreadyRegistered');
        case 'not_allowed':
          return t('profile.security.passkey.errors.notAllowed');
        default:
          return t('profile.security.passkey.errors.unknown');
      }
    },
    [t]
  );

  /**
   * Fetch list of passkeys using SDK
   */
  const fetchPasskeys = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      errorType: null,
    }));

    try {
      const passkeys = await listUserPasskeys();
      setState((prev) => ({
        ...prev,
        passkeys: passkeys || [],
        isLoading: false,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: t('profile.security.passkey.errors.fetchFailed'),
      }));
    }
  }, [t]);

  /**
   * Register a new passkey using SDK high-level API
   * @param deviceName Optional friendly name for the passkey
   * @returns true if registration was successful
   */
  const registerPasskey = useCallback(
    async (deviceName?: string): Promise<boolean> => {
      if (!state.isSupported) {
        setState((prev) => ({
          ...prev,
          error: t('profile.security.passkey.errors.notSupported'),
          errorType: 'not_supported',
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        isRegistering: true,
        error: null,
        errorType: null,
      }));

      try {
        // Use SDK high-level API for complete registration flow
        const result = await sdkRegisterPasskey({ deviceName });

        // Add new passkey to list
        setState((prev) => ({
          ...prev,
          passkeys: [...prev.passkeys, result.passkey],
          isRegistering: false,
        }));

        return true;
      } catch (error) {
        // Handle passkey errors using SDK error parser
        const parsed = parsePasskeyError(error);
        setState((prev) => ({
          ...prev,
          isRegistering: false,
          error: getErrorMessage(parsed.type),
          errorType: parsed.type,
        }));
        return false;
      }
    },
    [state.isSupported, t, getErrorMessage]
  );

  /**
   * Delete a passkey using SDK
   * @param id Passkey ID to delete
   * @returns true if deletion was successful
   */
  const removePasskey = useCallback(
    async (id: string): Promise<boolean> => {
      setState((prev) => ({
        ...prev,
        deletingId: id,
        error: null,
        errorType: null,
      }));

      try {
        await deleteUserPasskey(id);

        // Remove passkey from list
        setState((prev) => ({
          ...prev,
          passkeys: prev.passkeys.filter((pk) => pk.id !== id),
          deletingId: null,
        }));

        return true;
      } catch {
        setState((prev) => ({
          ...prev,
          deletingId: null,
          error: t('profile.security.passkey.errors.deleteFailed'),
        }));
        return false;
      }
    },
    [t]
  );

  // Fetch passkeys on mount if WebAuthn is supported
  useEffect(() => {
    if (state.isSupported) {
      fetchPasskeys();
    }
  }, [state.isSupported, fetchPasskeys]);

  return {
    ...state,
    fetchPasskeys,
    registerPasskey,
    removePasskey,
    clearError,
  };
}
