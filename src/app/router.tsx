/**
 * React Router 7 Route Configuration
 *
 * Route Architecture:
 * - User Routes: /dashboard/* (regular user access)
 * - Admin Routes: /admin/* (administrator access)
 * - Public Routes: /login, /register, etc. (no authentication required)
 */

import { createBrowserRouter, Navigate } from 'react-router';
import { LandingPage } from '@/pages/LandingPage';
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
import { ForwardRulesPage } from '@/pages/ForwardRulesPage';
import { ForwardAgentsPage } from '@/pages/ForwardAgentsPage';
import { ResourceGroupManagementPage } from '@/pages/ResourceGroupManagementPage';
import { ProfileSettingsPage } from '@/pages/ProfileSettingsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { UserNodesPage } from '@/pages/UserNodesPage';
import { UserSubscriptionDetailPage } from '@/pages/UserSubscriptionDetailPage';
import { NewAdminDashboardPage } from '@/pages/NewAdminDashboardPage';
import { AdminSettingsPage } from '@/pages/AdminSettingsPage';
import { MonitorPage } from '@/pages/MonitorPage';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { AdminRoute } from '@/shared/components/AdminRoute';

export const router = createBrowserRouter([
  // Root path - Landing page
  {
    path: '/',
    element: <LandingPage />,
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

  // Notifications settings (user side)
  {
    path: '/dashboard/notifications',
    element: (
      <ProtectedRoute>
        <NotificationsPage />
      </ProtectedRoute>
    ),
  },

  // User subscription detail page
  {
    path: '/dashboard/subscriptions/:id',
    element: (
      <ProtectedRoute>
        <UserSubscriptionDetailPage />
      </ProtectedRoute>
    ),
  },

  // Redirect: forward-rules -> dashboard (deprecated route)
  {
    path: '/dashboard/forward-rules',
    element: <Navigate to="/dashboard" replace />,
  },

  // Redirect: forward-agents -> dashboard (deprecated route)
  {
    path: '/dashboard/forward-agents',
    element: <Navigate to="/dashboard" replace />,
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

  // Real-time monitoring (admin)
  {
    path: '/admin/monitor',
    element: (
      <AdminRoute>
        <MonitorPage />
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

  // System settings (admin)
  {
    path: '/admin/settings',
    element: (
      <AdminRoute>
        <AdminSettingsPage />
      </AdminRoute>
    ),
  },

  // ==================== Public Routes ====================

  // Login
  {
    path: '/login',
    element: <LoginPage />,
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

  // 404 - redirect to landing page
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
