/**
 * 管理员路由守卫组件
 * 保护需要管理员权限的路由
 * 检查用户是否已登录且拥有admin角色
 */

import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { Box, CircularProgress, Container, Typography, Button } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

/**
 * AdminRoute 组件的属性接口
 */
interface AdminRouteProps {
  /**
   * 需要保护的子组件
   * 仅当用户已登录且为admin角色时才会渲染
   */
  children: React.ReactNode;

  /**
   * 可选：权限不足时的重定向路径
   * @default '/dashboard' - 默认重定向到仪表板
   */
  unauthorizedRedirect?: string;

  /**
   * 可选：是否显示无权限提示页面（而非重定向）
   * @default false - 默认重定向到unauthorizedRedirect
   */
  showUnauthorizedMessage?: boolean;
}

/**
 * 无权限访问提示组件
 * 当用户已登录但不是admin角色时显示
 */
const UnauthorizedMessage = () => {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          gap: 3,
        }}
      >
        <LockIcon
          sx={{
            fontSize: 80,
            color: 'error.main',
            opacity: 0.8,
          }}
        />
        <Typography variant="h4" component="h1" gutterBottom>
          访问受限
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          抱歉，您没有权限访问此页面。此页面仅限管理员访问。
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button variant="outlined" onClick={handleGoBack}>
            返回上一页
          </Button>
          <Button variant="contained" onClick={handleGoToDashboard}>
            前往仪表板
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

/**
 * AdminRoute 管理员路由守卫组件
 *
 * 此组件用于保护需要管理员权限的路由，执行以下检查：
 * 1. 检查用户是否已登录（通过 useAuthStore 的 isAuthenticated）
 * 2. 检查用户角色是否为 'admin'（通过 usePermissions hook）
 * 3. 加载状态显示 CircularProgress
 * 4. 未登录则重定向到 /login，并保存当前路径用于登录后返回
 * 5. 已登录但非admin角色，则根据配置显示无权限提示或重定向
 *
 * @param props - AdminRoute组件属性
 * @returns 根据认证和权限状态返回不同的React元素
 *
 * @example
 * 基础用法（重定向模式）：
 * ```tsx
 * <Route
 *   path="/admin/*"
 *   element={
 *     <AdminRoute>
 *       <AdminPanel />
 *     </AdminRoute>
 *   }
 * />
 * ```
 *
 * @example
 * 显示无权限提示：
 * ```tsx
 * <Route
 *   path="/admin/*"
 *   element={
 *     <AdminRoute showUnauthorizedMessage={true}>
 *       <AdminPanel />
 *     </AdminRoute>
 *   }
 * />
 * ```
 *
 * @example
 * 自定义重定向路径：
 * ```tsx
 * <Route
 *   path="/admin/*"
 *   element={
 *     <AdminRoute unauthorizedRedirect="/profile">
 *       <AdminPanel />
 *     </AdminRoute>
 *   }
 * />
 * ```
 */
export const AdminRoute = ({
  children,
  unauthorizedRedirect = '/dashboard',
  showUnauthorizedMessage = false,
}: AdminRouteProps) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { hasPermission } = usePermissions();
  const location = useLocation();

  // 加载中状态
  // 等待认证状态初始化完成
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

  // 未认证检查
  // 跳转到登录页并保存当前路径，登录成功后可以返回
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // 权限检查
  // 检查用户是否拥有admin角色
  if (!hasPermission('admin')) {
    // 根据配置选择显示无权限提示或重定向
    if (showUnauthorizedMessage) {
      return <UnauthorizedMessage />;
    }

    // 重定向到指定路径
    return <Navigate to={unauthorizedRedirect} replace />;
  }

  // 已认证且为admin角色，渲染受保护的内容
  return <>{children}</>;
};
