/**
 * 主应用组件
 * React 19 + MUI v7 + React Router v7
 */

import { RouterProvider } from 'react-router';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import { router } from './router';
import { GlobalSnackbar } from '@/shared/components/GlobalSnackbar';
import { useAuthInitializer } from '@/features/auth/hooks/useAuthInitializer';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { Box, CircularProgress } from '@mui/material';

export const App = () => {
  // 初始化认证状态
  useAuthInitializer();

  // 获取加载状态
  const { isLoading } = useAuthStore();

  // 显示加载指示器，直到认证状态初始化完成
  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
      <GlobalSnackbar />
    </ThemeProvider>
  );
};
