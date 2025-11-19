/**
 * 路由守卫组件
 * 保护需要认证的路由
 */

import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // 加载中
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // 未认证，跳转到登录页并保存当前路径
  // 登录成功后会自动返回到这个路径
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // 已认证，显示内容
  return <>{children}</>;
};
