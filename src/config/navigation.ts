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
  Activity,
  Settings,
  FileText,
} from 'lucide-react';

import type { NavigationItem, NavigationGroup } from '../types/navigation.types';

/**
 * Admin Navigation Group Configuration
 *
 * Groups for organizing admin navigation items in the sidebar.
 */
export const adminNavigationGroups: readonly NavigationGroup[] = [
  { id: 'overview', labelKey: 'nav.groups.overview', order: 1 },
  { id: 'business', labelKey: 'nav.groups.business', order: 2 },
  { id: 'infrastructure', labelKey: 'nav.groups.infrastructure', order: 3 },
  { id: 'system', labelKey: 'nav.groups.system', order: 4 },
] as const;

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
    labelKey: 'nav.dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['user', 'admin'],
    showInNav: true,
    showInBreadcrumb: false, // Not shown in breadcrumb, replaced by "Dashboard"
    order: 1,
  },
  {
    id: 'user-subscription-detail',
    labelKey: 'nav.subscriptionDetail',
    path: '/dashboard/subscriptions/:id',
    icon: FileText,
    roles: ['user', 'admin'],
    showInNav: false, // Dynamic route, not shown in nav
    showInBreadcrumb: true,
    parentId: 'dashboard',
    order: 2,
  },
  {
    id: 'user-nodes',
    labelKey: 'nav.userNodes',
    path: '/dashboard/nodes',
    icon: Server,
    roles: ['user', 'admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'dashboard',
    order: 3,
  },
  {
    id: 'notifications',
    labelKey: 'nav.notifications',
    path: '/dashboard/notifications',
    icon: Bell,
    roles: ['user', 'admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'dashboard',
    order: 4,
  },
  {
    id: 'pricing',
    labelKey: 'nav.pricing',
    path: '/dashboard/pricing',
    icon: DollarSign,
    roles: ['user', 'admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'dashboard',
    order: 5,
  },
  {
    id: 'profile',
    labelKey: 'nav.profile',
    path: '/dashboard/profile',
    icon: User,
    roles: ['user', 'admin'],
    showInNav: false, // Not shown in main nav (accessed via user menu)
    showInBreadcrumb: true,
    parentId: 'dashboard',
    order: 6,
  },

  // ==================== Admin Routes ====================
  // Group: overview
  {
    id: 'admin-dashboard',
    labelKey: 'nav.adminDashboard',
    path: '/admin',
    icon: LayoutDashboard,
    roles: ['admin'],
    showInNav: true,
    showInBreadcrumb: false,
    order: 10,
    groupId: 'overview',
  },
  {
    id: 'monitor',
    labelKey: 'nav.liveMonitor',
    path: '/admin/monitor',
    icon: Activity,
    roles: ['admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 10.5,
    groupId: 'overview',
  },
  // Group: business
  {
    id: 'plans',
    labelKey: 'nav.planManagement',
    path: '/admin/plans',
    icon: CreditCard,
    roles: ['admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 11,
    groupId: 'business',
  },
  {
    id: 'subscriptions',
    labelKey: 'nav.subscriptionManagement',
    path: '/admin/subscriptions',
    icon: BadgeCheck,
    roles: ['admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 12,
    groupId: 'business',
  },
  {
    id: 'users',
    labelKey: 'nav.userManagement',
    path: '/admin/users',
    icon: Users,
    roles: ['admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 13,
    groupId: 'business',
  },
  // Group: infrastructure
  {
    id: 'nodes',
    labelKey: 'nav.nodeAgent',
    path: '/admin/nodes',
    icon: Server,
    roles: ['admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 14,
    groupId: 'infrastructure',
  },
  {
    id: 'forward-agents',
    labelKey: 'nav.forwardAgent',
    path: '/admin/forward-agents',
    icon: Cpu,
    roles: ['admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 15,
    groupId: 'infrastructure',
  },
  {
    id: 'forward-rules',
    labelKey: 'nav.forwardRules',
    path: '/admin/forward-rules',
    icon: ArrowLeftRight,
    roles: ['admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 16,
    groupId: 'infrastructure',
  },
  {
    id: 'resource-groups',
    labelKey: 'nav.resourceGroups',
    path: '/admin/resource-groups',
    icon: Boxes,
    roles: ['admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 18,
    groupId: 'infrastructure',
  },
  // Group: system
  {
    id: 'admin-settings',
    labelKey: 'nav.systemSettings',
    path: '/admin/settings',
    icon: Settings,
    roles: ['admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 98,
    groupId: 'system',
  },
  {
    id: 'admin-announcements',
    labelKey: 'nav.announcements',
    path: '/admin/announcements',
    icon: Bell,
    roles: ['admin'],
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 99,
    groupId: 'system',
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

/**
 * Get admin navigation groups
 */
export const getAdminNavigationGroups = (): NavigationGroup[] => {
  return [...adminNavigationGroups].sort((a, b) => a.order - b.order);
};

/**
 * Get admin navigation items grouped by their groupId
 *
 * @param items - Navigation items to group
 * @returns Map of group to its navigation items
 */
export const getAdminNavItemsByGroup = (
  items: NavigationItem[]
): Map<NavigationGroup, NavigationItem[]> => {
  const groups = getAdminNavigationGroups();
  const groupedItems = new Map<NavigationGroup, NavigationItem[]>();

  for (const group of groups) {
    const groupItems = items
      .filter((item) => item.groupId === group.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (groupItems.length > 0) {
      groupedItems.set(group, groupItems);
    }
  }

  return groupedItems;
};
