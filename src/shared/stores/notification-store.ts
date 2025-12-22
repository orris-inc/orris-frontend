/**
 * Zustand notification state management
 * Global Snackbar notification system
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

interface NotificationState {
  // State
  message: string;
  severity: NotificationSeverity;
  open: boolean;
  autoHideDuration: number; // Auto-close time (milliseconds)

  // Methods
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  hideNotification: () => void;
}

const DEFAULT_AUTO_HIDE_DURATION = 6000; // Default 6 seconds

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set) => ({
      // Initial state
      message: '',
      severity: 'info',
      open: false,
      autoHideDuration: DEFAULT_AUTO_HIDE_DURATION,

      // Show success notification
      showSuccess: (message: string, duration = DEFAULT_AUTO_HIDE_DURATION) => {
        set({
          message,
          severity: 'success',
          open: true,
          autoHideDuration: duration,
        });
      },

      // Show error notification
      showError: (message: string, duration = DEFAULT_AUTO_HIDE_DURATION) => {
        set({
          message,
          severity: 'error',
          open: true,
          autoHideDuration: duration,
        });
      },

      // Show warning notification
      showWarning: (message: string, duration = DEFAULT_AUTO_HIDE_DURATION) => {
        set({
          message,
          severity: 'warning',
          open: true,
          autoHideDuration: duration,
        });
      },

      // Show info notification
      showInfo: (message: string, duration = DEFAULT_AUTO_HIDE_DURATION) => {
        set({
          message,
          severity: 'info',
          open: true,
          autoHideDuration: duration,
        });
      },

      // Hide notification
      hideNotification: () => {
        set({ open: false });
      },
    }),
    { name: 'NotificationStore' }
  )
);
