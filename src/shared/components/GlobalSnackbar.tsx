/**
 * Global Snackbar notification component
 * Uses toast and Toaster components from the sonner library
 */

import { useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { useNotificationStore } from '../stores/notification-store';

export const GlobalSnackbar = () => {
  const { message, severity, open, hideNotification } = useNotificationStore();

  useEffect(() => {
    if (open && message) {
      switch (severity) {
        case 'success':
          toast.success(message);
          break;
        case 'error':
          toast.error(message);
          break;
        case 'warning':
          toast.warning(message);
          break;
        case 'info':
          toast.info(message);
          break;
        default:
          toast(message);
      }
      // Immediately reset store state, as sonner manages display itself
      hideNotification();
    }
  }, [open, message, severity, hideNotification]);

  return <Toaster />;
};
