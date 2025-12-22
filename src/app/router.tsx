/**
 * React Router 7 Route Configuration
 *
 * Route Architecture:
 * - User Routes: /dashboard/* (regular user access)
 * - Admin Routes: /admin/* (administrator access)
 * - Public Routes: /login, /register, etc. (no authentication required)
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
import { UserNodesPage } from '@/pages/UserNodesPage';
import { NewAdminDashboardPage } from '@/pages/NewAdminDashboardPage';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { AdminRoute } from '@/shared/components/AdminRoute';

export const router = createBrowserRouter([
  // Root path redirects to login selector (temporarily for previewing different designs)
  {
    path: '/',
    element: <Navigate to="/login-selector" replace />,
  },

  // Login page selector
  {
    path: '/login-selector',
    element: <LoginSelector />,
  },

  // ==================== User Routes ====================

  // Dashboard home (user side)
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },

  // Profile settings (user side)
  {
    path: '/dashboard/profile',
    element: (
      <ProtectedRoute>
        <ProfileSettingsPage />
      </ProtectedRoute>
    ),
  },

  // User forward rules management
  {
    path: '/dashboard/forward-rules',
    element: (
      <ProtectedRoute>
        <UserForwardRulesPage />
      </ProtectedRoute>
    ),
  },

  // User forward agents list
  {
    path: '/dashboard/forward-agents',
    element: (
      <ProtectedRoute>
        <UserForwardAgentsPage />
      </ProtectedRoute>
    ),
  },

  // User nodes management
  {
    path: '/dashboard/nodes',
    element: (
      <ProtectedRoute>
        <UserNodesPage />
      </ProtectedRoute>
    ),
  },

  // Pricing page (public access)
  {
    path: '/pricing',
    element: <PricingPage />,
  },

  // ==================== Admin Routes ====================

  // Admin dashboard
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <NewAdminDashboardPage />
      </AdminRoute>
    ),
  },

  // Subscription plans management (admin)
  {
    path: '/admin/plans',
    element: (
      <AdminRoute>
        <SubscriptionPlansManagementPage />
      </AdminRoute>
    ),
  },

  // Subscriptions management (admin)
  {
    path: '/admin/subscriptions',
    element: (
      <AdminRoute>
        <SubscriptionManagementPage />
      </AdminRoute>
    ),
  },

  // Users management (admin)
  {
    path: '/admin/users',
    element: (
      <AdminRoute>
        <UserManagementPage />
      </AdminRoute>
    ),
  },

  // Nodes management (admin)
  {
    path: '/admin/nodes',
    element: (
      <AdminRoute>
        <NodeManagementPage />
      </AdminRoute>
    ),
  },

  // Forward rules management (admin)
  {
    path: '/admin/forward-rules',
    element: (
      <AdminRoute>
        <ForwardRulesPage />
      </AdminRoute>
    ),
  },

  // Forward agents management (admin)
  {
    path: '/admin/forward-agents',
    element: (
      <AdminRoute>
        <ForwardAgentsPage />
      </AdminRoute>
    ),
  },

  // Resource groups management (admin)
  {
    path: '/admin/resource-groups',
    element: (
      <AdminRoute>
        <ResourceGroupManagementPage />
      </AdminRoute>
    ),
  },

  // ==================== Public Routes ====================

  // Login (legacy)
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Login (new design - Art Deco)
  {
    path: '/login-new',
    element: <LoginPageNew />,
  },

  // Login (minimal style)
  {
    path: '/login-minimal',
    element: <LoginPageMinimal />,
  },

  // Login (glass morphism - Tailwind)
  {
    path: '/login-glass',
    element: <LoginPageGlass />,
  },

  // Login (Apple minimal style)
  {
    path: '/login-apple',
    element: <LoginPageApple />,
  },

  // Register
  {
    path: '/register',
    element: <RegisterPage />,
  },

  // Forgot password
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },

  // Reset password
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },

  // Email verification
  {
    path: '/verify-email',
    element: <EmailVerificationPage />,
  },

  // Email verification pending
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
