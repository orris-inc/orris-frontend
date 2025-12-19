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
import { LoginPageNew } from '@/pages/LoginPageNew';
import { LoginPageMinimal } from '@/pages/LoginPageMinimal';
import { LoginPageGlass } from '@/pages/LoginPageGlass';
import { LoginPageApple } from '@/pages/LoginPageApple';
import { LoginSelector } from '@/pages/LoginSelector';
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
import { ForwardRulesPage } from '@/pages/ForwardRulesPage';
import { ForwardAgentsPage } from '@/pages/ForwardAgentsPage';
import { ResourceGroupManagementPage } from '@/pages/ResourceGroupManagementPage';
import { ProfileSettingsPage } from '@/pages/ProfileSettingsPage';
import { UserForwardRulesPage } from '@/pages/UserForwardRulesPage';
import { UserForwardAgentsPage } from '@/pages/UserForwardAgentsPage';
import { NewAdminDashboardPage } from '@/pages/NewAdminDashboardPage';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { AdminRoute } from '@/shared/components/AdminRoute';

export const router = createBrowserRouter([
  // 根路径重定向到登录选择器（临时用于预览不同设计）
  {
    path: '/',
    element: <Navigate to="/login-selector" replace />,
  },

  // 登录页面选择器
  {
    path: '/login-selector',
    element: <LoginSelector />,
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

  // 用户端转发规则管理
  {
    path: '/dashboard/forward-rules',
    element: (
      <ProtectedRoute>
        <UserForwardRulesPage />
      </ProtectedRoute>
    ),
  },

  // 用户端转发节点列表
  {
    path: '/dashboard/forward-agents',
    element: (
      <ProtectedRoute>
        <UserForwardAgentsPage />
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
        <NewAdminDashboardPage />
      </AdminRoute>
    ),
  },

  // 订阅计划管理（管理端）
  {
    path: '/admin/plans',
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

  // 转发规则管理（管理端）
  {
    path: '/admin/forward-rules',
    element: (
      <AdminRoute>
        <ForwardRulesPage />
      </AdminRoute>
    ),
  },

  // 转发节点管理（管理端）
  {
    path: '/admin/forward-agents',
    element: (
      <AdminRoute>
        <ForwardAgentsPage />
      </AdminRoute>
    ),
  },

  // 资源组管理（管理端）
  {
    path: '/admin/resource-groups',
    element: (
      <AdminRoute>
        <ResourceGroupManagementPage />
      </AdminRoute>
    ),
  },

  // ==================== 公共路由 ====================

  // 登录（旧版）
  {
    path: '/login',
    element: <LoginPage />,
  },

  // 登录（新设计 - Art Deco）
  {
    path: '/login-new',
    element: <LoginPageNew />,
  },

  // 登录（极简风格）
  {
    path: '/login-minimal',
    element: <LoginPageMinimal />,
  },

  // 登录（流动光影 - Tailwind）
  {
    path: '/login-glass',
    element: <LoginPageGlass />,
  },

  // 登录（Apple 简约风格）
  {
    path: '/login-apple',
    element: <LoginPageApple />,
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
