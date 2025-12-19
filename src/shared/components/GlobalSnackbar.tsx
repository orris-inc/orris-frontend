/**
 * 全局Snackbar通知组件
 * 使用 sonner 库的 toast 和 Toaster 组件
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
      // 立即重置store状态，因为sonner自己管理显示
      hideNotification();
    }
  }, [open, message, severity, hideNotification]);

  return <Toaster />;
};
