/**
 * Zustand 5 Authentication State Management
 * Uses HttpOnly Cookie for authentication, does not store any auth info locally
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { UserDisplayInfo } from '@/api/auth';

interface AuthState {
  // State
  user: UserDisplayInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Methods
  login: (user: UserDisplayInfo) => void;
  logout: () => void;
  setUser: (user: UserDisplayInfo) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true, // Initially true, waiting to check login status

      // Login
      login: (user: UserDisplayInfo) => {
        set({
          user,
          isAuthenticated: true,
        });
      },

      // Logout - just clear state, redirection is handled by useAuth hook
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      // Set user info
      setUser: (user: UserDisplayInfo) => {
        set({ user });
      },

      // Clear auth info
      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      // Set loading state
      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },
    }),
    { name: 'AuthStore' }
  )
);
