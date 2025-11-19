/**
 * Zustand 通知状态管理
 * 全局Snackbar通知系统
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

interface NotificationState {
  // 状态
  message: string;
  severity: NotificationSeverity;
  open: boolean;
  autoHideDuration: number; // 自动关闭时间（毫秒）

  // 方法
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  hideNotification: () => void;
}

const DEFAULT_AUTO_HIDE_DURATION = 6000; // 默认6秒

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set) => ({
      // 初始状态
      message: '',
      severity: 'info',
      open: false,
      autoHideDuration: DEFAULT_AUTO_HIDE_DURATION,

      // 显示成功通知
      showSuccess: (message: string, duration = DEFAULT_AUTO_HIDE_DURATION) => {
        set({
          message,
          severity: 'success',
          open: true,
          autoHideDuration: duration,
        });
      },

      // 显示错误通知
      showError: (message: string, duration = DEFAULT_AUTO_HIDE_DURATION) => {
        set({
          message,
          severity: 'error',
          open: true,
          autoHideDuration: duration,
        });
      },

      // 显示警告通知
      showWarning: (message: string, duration = DEFAULT_AUTO_HIDE_DURATION) => {
        set({
          message,
          severity: 'warning',
          open: true,
          autoHideDuration: duration,
        });
      },

      // 显示信息通知
      showInfo: (message: string, duration = DEFAULT_AUTO_HIDE_DURATION) => {
        set({
          message,
          severity: 'info',
          open: true,
          autoHideDuration: duration,
        });
      },

      // 隐藏通知
      hideNotification: () => {
        set({ open: false });
      },
    }),
    { name: 'NotificationStore' }
  )
);
