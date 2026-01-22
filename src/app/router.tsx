/**
 * React Router 7 Route Configuration
 *
 * Route Architecture:
 * - User Routes: /dashboard/* (regular user access)
 * - Admin Routes: /admin/* (administrator access)
 * - Public Routes: /login, /register, etc. (no authentication required)
 *
 * Performance: All pages are lazy-loaded for optimal code splitting
 */

import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { AdminRoute } from '@/shared/components/AdminRoute';
import { SuspenseWrapper } from '@/shared/utils/lazy-import';

// ==================== Lazy Loaded Pages ====================

// Public Pages
const LandingPage = lazy(() =>
  import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('@/pages/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  }))
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/ResetPasswordPage').then((m) => ({
    default: m.ResetPasswordPage,
  }))
);
const EmailVerificationPage = lazy(() =>
  import('@/pages/EmailVerificationPage').then((m) => ({
    default: m.EmailVerificationPage,
  }))
);
const VerificationPendingPage = lazy(() =>
  import('@/pages/VerificationPendingPage').then((m) => ({
    default: m.VerificationPendingPage,
  }))
);
const PublicPricingPage = lazy(() =>
  import('@/pages/PublicPricingPage').then((m) => ({
    default: m.PublicPricingPage,
  }))
);

// User Dashboard Pages
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const ProfileSettingsPage = lazy(() =>
  import('@/pages/ProfileSettingsPage').then((m) => ({
    default: m.ProfileSettingsPage,
  }))
);
const NotificationsPage = lazy(() =>
  import('@/pages/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  }))
);
const UserSubscriptionDetailPage = lazy(() =>
  import('@/pages/UserSubscriptionDetailPage').then((m) => ({
    default: m.UserSubscriptionDetailPage,
  }))
);
const UserNodesPage = lazy(() =>
  import('@/pages/UserNodesPage').then((m) => ({ default: m.UserNodesPage }))
);
const PricingPage = lazy(() =>
  import('@/pages/PricingPage').then((m) => ({ default: m.PricingPage }))
);

// Admin Pages
const NewAdminDashboardPage = lazy(() =>
  import('@/pages/NewAdminDashboardPage').then((m) => ({
    default: m.NewAdminDashboardPage,
  }))
);
const MonitorPage = lazy(() =>
  import('@/pages/MonitorPage').then((m) => ({ default: m.MonitorPage }))
);
const SubscriptionPlansManagementPage = lazy(() =>
  import('@/pages/SubscriptionPlansManagementPage').then((m) => ({
    default: m.SubscriptionPlansManagementPage,
  }))
);
const SubscriptionManagementPage = lazy(() =>
  import('@/pages/SubscriptionManagementPage').then((m) => ({
    default: m.SubscriptionManagementPage,
  }))
);
const UserManagementPage = lazy(() =>
  import('@/pages/UserManagementPage').then((m) => ({
    default: m.UserManagementPage,
  }))
);
const NodeManagementPage = lazy(() =>
  import('@/pages/NodeManagementPage').then((m) => ({
    default: m.NodeManagementPage,
  }))
);
const ForwardRulesPage = lazy(() =>
  import('@/pages/ForwardRulesPage').then((m) => ({
    default: m.ForwardRulesPage,
  }))
);
const ForwardAgentsPage = lazy(() =>
  import('@/pages/ForwardAgentsPage').then((m) => ({
    default: m.ForwardAgentsPage,
  }))
);
const ResourceGroupManagementPage = lazy(() =>
  import('@/pages/ResourceGroupManagementPage').then((m) => ({
    default: m.ResourceGroupManagementPage,
  }))
);
const AdminSettingsPage = lazy(() =>
  import('@/pages/AdminSettingsPage').then((m) => ({
    default: m.AdminSettingsPage,
  }))
);
const AdminNotificationsPage = lazy(() =>
  import('@/pages/AdminNotificationsPage').then((m) => ({
    default: m.AdminNotificationsPage,
  }))
);
const AdminProfilePage = lazy(() =>
  import('@/pages/AdminProfilePage').then((m) => ({
    default: m.AdminProfilePage,
  }))
);

export const router = createBrowserRouter([
  // Root path - Landing page
  {
    path: '/',
    element: (
      <SuspenseWrapper>
        <LandingPage />
      </SuspenseWrapper>
    ),
  },

  // ==================== User Routes ====================

  // Dashboard home (user side)
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <SuspenseWrapper>
          <DashboardPage />
        </SuspenseWrapper>
      </ProtectedRoute>
    ),
  },

  // Profile settings (user side)
  {
    path: '/dashboard/profile',
    element: (
      <ProtectedRoute>
        <SuspenseWrapper>
          <ProfileSettingsPage />
        </SuspenseWrapper>
      </ProtectedRoute>
    ),
  },

  // Notifications settings (user side)
  {
    path: '/dashboard/notifications',
    element: (
      <ProtectedRoute>
        <SuspenseWrapper>
          <NotificationsPage />
        </SuspenseWrapper>
      </ProtectedRoute>
    ),
  },

  // User subscription detail page
  {
    path: '/dashboard/subscriptions/:id',
    element: (
      <ProtectedRoute>
        <SuspenseWrapper>
          <UserSubscriptionDetailPage />
        </SuspenseWrapper>
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
        <SuspenseWrapper>
          <UserNodesPage />
        </SuspenseWrapper>
      </ProtectedRoute>
    ),
  },

  // Pricing page (public access - for visitors from landing page)
  {
    path: '/pricing',
    element: (
      <SuspenseWrapper>
        <PublicPricingPage />
      </SuspenseWrapper>
    ),
  },

  // User pricing page (authenticated)
  {
    path: '/dashboard/pricing',
    element: (
      <ProtectedRoute>
        <SuspenseWrapper>
          <PricingPage />
        </SuspenseWrapper>
      </ProtectedRoute>
    ),
  },

  // ==================== Admin Routes ====================

  // Admin dashboard
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <SuspenseWrapper>
          <NewAdminDashboardPage />
        </SuspenseWrapper>
      </AdminRoute>
    ),
  },

  // Real-time monitoring (admin)
  {
    path: '/admin/monitor',
    element: (
      <AdminRoute>
        <SuspenseWrapper>
          <MonitorPage />
        </SuspenseWrapper>
      </AdminRoute>
    ),
  },

  // Subscription plans management (admin)
  {
    path: '/admin/plans',
    element: (
      <AdminRoute>
        <SuspenseWrapper>
          <SubscriptionPlansManagementPage />
        </SuspenseWrapper>
      </AdminRoute>
    ),
  },

  // Subscriptions management (admin)
  {
    path: '/admin/subscriptions',
    element: (
      <AdminRoute>
        <SuspenseWrapper>
          <SubscriptionManagementPage />
        </SuspenseWrapper>
      </AdminRoute>
    ),
  },

  // Users management (admin)
  {
    path: '/admin/users',
    element: (
      <AdminRoute>
        <SuspenseWrapper>
          <UserManagementPage />
        </SuspenseWrapper>
      </AdminRoute>
    ),
  },

  // Nodes management (admin)
  {
    path: '/admin/nodes',
    element: (
      <AdminRoute>
        <SuspenseWrapper>
          <NodeManagementPage />
        </SuspenseWrapper>
      </AdminRoute>
    ),
  },

  // Forward rules management (admin)
  {
    path: '/admin/forward-rules',
    element: (
      <AdminRoute>
        <SuspenseWrapper>
          <ForwardRulesPage />
        </SuspenseWrapper>
      </AdminRoute>
    ),
  },

  // Forward agents management (admin)
  {
    path: '/admin/forward-agents',
    element: (
      <AdminRoute>
        <SuspenseWrapper>
          <ForwardAgentsPage />
        </SuspenseWrapper>
      </AdminRoute>
    ),
  },

  // Resource groups management (admin)
  {
    path: '/admin/resource-groups',
    element: (
      <AdminRoute>
        <SuspenseWrapper>
          <ResourceGroupManagementPage />
        </SuspenseWrapper>
      </AdminRoute>
    ),
  },

  // System settings (admin)
  {
    path: '/admin/settings',
    element: (
      <AdminRoute>
        <SuspenseWrapper>
          <AdminSettingsPage />
        </SuspenseWrapper>
      </AdminRoute>
    ),
  },

  // Notification settings (admin)
  {
    path: '/admin/notifications',
    element: (
      <AdminRoute>
        <SuspenseWrapper>
          <AdminNotificationsPage />
        </SuspenseWrapper>
      </AdminRoute>
    ),
  },

  // Profile settings (admin)
  {
    path: '/admin/profile',
    element: (
      <AdminRoute>
        <SuspenseWrapper>
          <AdminProfilePage />
        </SuspenseWrapper>
      </AdminRoute>
    ),
  },

  // ==================== Public Routes ====================

  // Login
  {
    path: '/login',
    element: (
      <SuspenseWrapper>
        <LoginPage />
      </SuspenseWrapper>
    ),
  },

  // Register
  {
    path: '/register',
    element: (
      <SuspenseWrapper>
        <RegisterPage />
      </SuspenseWrapper>
    ),
  },

  // Forgot password
  {
    path: '/forgot-password',
    element: (
      <SuspenseWrapper>
        <ForgotPasswordPage />
      </SuspenseWrapper>
    ),
  },

  // Reset password
  {
    path: '/reset-password',
    element: (
      <SuspenseWrapper>
        <ResetPasswordPage />
      </SuspenseWrapper>
    ),
  },

  // Email verification
  {
    path: '/verify-email',
    element: (
      <SuspenseWrapper>
        <EmailVerificationPage />
      </SuspenseWrapper>
    ),
  },

  // Email verification pending
  {
    path: '/verification-pending',
    element: (
      <SuspenseWrapper>
        <VerificationPendingPage />
      </SuspenseWrapper>
    ),
  },

  // 404 - redirect to landing page
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
