/**
 * Authentication Initializer Hook
 * Check user login status (via Cookie) on app startup
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/auth-store';
import * as authApi from '@/api/auth';

// Use global variable instead of useRef to prevent reset on StrictMode remount
// This ensures initialization only happens once during the entire app lifecycle
let globalHasInitialized = false;

/**
 * Initialize authentication state
 * Call /auth/me to get current user info on app startup
 * Only called once
 */
export const useAuthInitializer = () => {
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Use global variable check to prevent duplicate initialization on StrictMode remount
    if (globalHasInitialized) {
      return;
    }

    // Use ref check (prevent multiple executions for the same component instance)
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
  }, []); // Empty dependency array, only execute once on mount
};
