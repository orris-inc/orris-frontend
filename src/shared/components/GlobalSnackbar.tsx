/**
 * 全局Snackbar通知组件
 * 使用MUI的Snackbar和Alert组件
 */

import { Snackbar, Alert } from '@mui/material';
import { useNotificationStore } from '../stores/notification-store';

export const GlobalSnackbar = () => {
  const { message, severity, open, autoHideDuration, hideNotification } = useNotificationStore();

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    // 防止点击外部区域关闭
    if (reason === 'clickaway') {
      return;
    }
    hideNotification();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={handleClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};
