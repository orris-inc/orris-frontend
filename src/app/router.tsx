/**
 * React Router 7 路由配置
 *
 * 路由架构：
 * - 用户端路由：/dashboard/* （普通用户访问）
 * - 管理端路由：/admin/* （管理员访问）
 * - 公共路由：/login, /register 等（无需认证）
 */

import { createBrowserRouter, Navigate } from 'react-router';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { EmailVerificationPage } from '@/pages/EmailVerificationPage';
import { VerificationPendingPage } from '@/pages/VerificationPendingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PricingPage } from '@/pages/PricingPage';
import { SubscriptionPlansManagementPage } from '@/pages/SubscriptionPlansManagementPage';
import { SubscriptionManagementPage } from '@/pages/SubscriptionManagementPage';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { NodeManagementPage } from '@/pages/NodeManagementPage';
import { NodeGroupManagementPage } from '@/pages/NodeGroupManagementPage';
import { ProfileSettingsPage } from '@/pages/ProfileSettingsPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { AdminRoute } from '@/shared/components/AdminRoute';

export const router = createBrowserRouter([
  // 根路径重定向到登录页
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },

  // ==================== 用户端路由 ====================

  // Dashboard 主页（用户端）
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },

  // 个人资料设置（用户端）
  {
    path: '/dashboard/profile',
    element: (
      <ProtectedRoute>
        <ProfileSettingsPage />
      </ProtectedRoute>
    ),
  },

  // 定价页面（公开访问）
  {
    path: '/pricing',
    element: <PricingPage />,
  },

  // ==================== 管理端路由 ====================

  // 管理端首页
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminDashboardPage />
      </AdminRoute>
    ),
  },

  // 订阅计划管理（管理端）
  {
    path: '/admin/subscription-plans',
    element: (
      <AdminRoute>
        <SubscriptionPlansManagementPage />
      </AdminRoute>
    ),
  },

  // 订阅管理（管理端）
  {
    path: '/admin/subscriptions',
    element: (
      <AdminRoute>
        <SubscriptionManagementPage />
      </AdminRoute>
    ),
  },

  // 用户管理（管理端）
  {
    path: '/admin/users',
    element: (
      <AdminRoute>
        <UserManagementPage />
      </AdminRoute>
    ),
  },

  // 节点管理（管理端）
  {
    path: '/admin/nodes',
    element: (
      <AdminRoute>
        <NodeManagementPage />
      </AdminRoute>
    ),
  },

  // 节点组管理（管理端）
  {
    path: '/admin/node-groups',
    element: (
      <AdminRoute>
        <NodeGroupManagementPage />
      </AdminRoute>
    ),
  },

  // ==================== 公共路由 ====================

  // 登录
  {
    path: '/login',
    element: <LoginPage />,
  },

  // 注册
  {
    path: '/register',
    element: <RegisterPage />,
  },

  // 忘记密码
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },

  // 重置密码
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },

  // 邮箱验证
  {
    path: '/verify-email',
    element: <EmailVerificationPage />,
  },

  // 邮箱验证待处理
  {
    path: '/verification-pending',
    element: <VerificationPendingPage />,
  },

  // 404
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
