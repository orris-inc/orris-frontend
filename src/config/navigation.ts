/**
 * Navigation Configuration Center
 *
 * This file is the single source of truth for the entire application's navigation system.
 * Contains all navigation-related configurations including navbar, breadcrumb, route tabs, etc.
 */

import {
  LayoutDashboard,
  CreditCard,
  BadgeCheck,
  Users,
  DollarSign,
  User,
  Server,
  ArrowLeftRight,
  Cpu,
  Boxes,
  Bell,
} from 'lucide-react';

import type { NavigationItem } from '../types/navigation.types';

/**
 * Main Navigation Configuration
 *
 * Route Architecture:
 * - User Routes: /dashboard (user home), /pricing (pricing plans), /dashboard/profile (profile)
 * - Admin Routes: /admin (admin console), /admin/plans (subscription plan management), /admin/users (user management)
 *
 * Permission Levels:
 * - user: Regular users can access
 * - admin: Admin only access
 * - moderator: Moderator/reviewer access
 *
 * Display Control:
 * - showInNav: Whether to show in navigation bar
 * - showInBreadcrumb: Whether to show in breadcrumb
 * - parentId: Parent page ID (used for building breadcrumb hierarchy)
 */
export const navigationConfig: readonly NavigationItem[] = [
  // ==================== User Routes ====================
  {
    id: 'dashboard',
    label: '首页',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['user', 'admin'],
    showInNav: true,
    showInBreadcrumb: false, // Not shown in breadcrumb, replaced by "Home"
    order: 1,
  },
  {
    id: 'user-forward-rules',
    label: '端口转发',
    path: '/dashboard/forward-rules',
    icon: ArrowLeftRight,
    roles: ['user', 'admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'dashboard',
    order: 2,
  },
  {
    id: 'user-forward-agents',
    label: '转发节点',
    path: '/dashboard/forward-agents',
    icon: Cpu,
    roles: ['user', 'admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'dashboard',
    order: 3,
  },
  {
    id: 'user-nodes',
    label: '我的节点',
    path: '/dashboard/nodes',
    icon: Server,
    roles: ['user', 'admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'dashboard',
    order: 4,
  },
  {
    id: 'notifications',
    label: '通知设置',
    path: '/dashboard/notifications',
    icon: Bell,
    roles: ['user', 'admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'dashboard',
    order: 5,
  },
  {
    id: 'pricing',
    label: '定价方案',
    path: '/pricing',
    icon: DollarSign,
    roles: ['user', 'admin'],
    showInNav: true,
    showInBreadcrumb: true,
    order: 6,
  },
  {
    id: 'profile',
    label: '个人资料',
    path: '/dashboard/profile',
    icon: User,
    roles: ['user', 'admin'],
    showInNav: false, // Not shown in main nav (accessed via user menu)
    showInBreadcrumb: true,
    parentId: 'dashboard',
    order: 7,
  },

  // ==================== Admin Routes ====================
  {
    id: 'admin-dashboard',
    label: '管理控制台',
    path: '/admin',
    icon: LayoutDashboard,
    roles: ['admin'], // Admin only
    showInNav: true,
    showInBreadcrumb: false, // Not shown in breadcrumb, replaced by "Home"
    order: 10,
  },
  {
    id: 'plans',
    label: '订阅计划管理',
    path: '/admin/plans',
    icon: CreditCard,
    roles: ['admin'], // Admin only
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 11,
  },
  {
    id: 'subscriptions',
    label: '订阅管理',
    path: '/admin/subscriptions',
    icon: BadgeCheck,
    roles: ['admin'], // Admin only
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 12,
  },
  {
    id: 'users',
    label: '用户管理',
    path: '/admin/users',
    icon: Users,
    roles: ['admin'], // Admin only
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 13,
  },
  {
    id: 'nodes',
    label: '节点管理',
    path: '/admin/nodes',
    icon: Server,
    roles: ['admin'], // Admin only
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 14,
  },
  {
    id: 'forward-rules',
    label: '转发规则',
    path: '/admin/forward-rules',
    icon: ArrowLeftRight,
    roles: ['admin'], // Admin only
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 16,
  },
  {
    id: 'forward-agents',
    label: '转发节点',
    path: '/admin/forward-agents',
    icon: Cpu,
    roles: ['admin'], // Admin only
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 17,
  },
  {
    id: 'resource-groups',
    label: '资源组管理',
    path: '/admin/resource-groups',
    icon: Boxes,
    roles: ['admin'], // Admin only
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 18,
  },
] as const;

/**
 * Get navigation item by path
 */
export const getNavigationItemByPath = (path: string): NavigationItem | undefined => {
  return navigationConfig.find((item) => item.path === path);
};

/**
 * Get navigation item by ID
 */
export const getNavigationItemById = (id: string): NavigationItem | undefined => {
  return navigationConfig.find((item) => item.id === id);
};

/**
 * Get navigation item by path segment
 * Used for automatic breadcrumb generation
 *
 * @param segment - URL path segment (e.g., 'dashboard', 'plans')
 * @returns Navigation item or undefined
 */
export const getNavigationItemBySegment = (segment: string): NavigationItem | undefined => {
  return navigationConfig.find((item) => {
    const pathParts = item.path.split('/').filter(Boolean);
    return pathParts.includes(segment);
  });
};

/**
 * Get items to display in navigation bar
 */
export const getNavItems = (): NavigationItem[] => {
  return navigationConfig
    .filter((item) => item.showInNav !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

/**
 * Get items to display in breadcrumb
 */
export const getBreadcrumbItems = (): NavigationItem[] => {
  return navigationConfig.filter((item) => item.showInBreadcrumb !== false);
};

/**
 * Build breadcrumb path by navigation item ID
 * Automatically traces parent relationships
 *
 * @param itemId - Navigation item ID
 * @returns Breadcrumb path array (from root to current)
 */
export const buildBreadcrumbPath = (itemId: string): NavigationItem[] => {
  const result: NavigationItem[] = [];
  let currentId: string | undefined = itemId;

  // Prevent infinite loop
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const item = getNavigationItemById(currentId);

    if (item) {
      result.unshift(item); // Add to beginning of array
      currentId = item.parentId;
    } else {
      break;
    }
  }

  return result;
};
