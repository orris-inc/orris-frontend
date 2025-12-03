/**
 * 导航配置中心
 *
 * 这个文件是整个应用导航系统的单一数据源。
 * 包含导航栏、面包屑、路由标签等所有导航相关配置。
 */

import {
  LayoutDashboard,
  CreditCard,
  BadgeCheck,
  Users,
  DollarSign,
  User,
  Server,
  Network,
  ArrowLeftRight,
  Cpu,
  Link2,
} from 'lucide-react';

import type { NavigationItem } from '../types/navigation.types';

/**
 * 主导航配置
 *
 * 路由架构:
 * - 用户端路由: /dashboard (用户首页), /pricing (定价方案), /dashboard/profile (个人资料)
 * - 管理端路由: /admin (管理控制台), /admin/subscription-plans (订阅计划管理), /admin/users (用户管理)
 *
 * 权限说明:
 * - user: 普通用户可访问
 * - admin: 仅管理员可访问
 * - moderator: 版主/审核员可访问
 *
 * 显示控制:
 * - showInNav: 是否在导航栏显示
 * - showInBreadcrumb: 是否在面包屑显示
 * - parentId: 父级页面ID(用于构建面包屑层级)
 */
export const navigationConfig: readonly NavigationItem[] = [
  // ==================== 用户端路由 ====================
  {
    id: 'dashboard',
    label: '首页',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['user', 'admin'],
    showInNav: true,
    showInBreadcrumb: true,
    order: 1,
  },
  {
    id: 'pricing',
    label: '定价方案',
    path: '/pricing',
    icon: DollarSign,
    roles: ['user', 'admin'],
    showInNav: true,
    showInBreadcrumb: true,
    order: 2,
  },
  {
    id: 'profile',
    label: '个人资料',
    path: '/dashboard/profile',
    icon: User,
    roles: ['user', 'admin'],
    showInNav: false, // 不在主导航显示(通过用户菜单访问)
    showInBreadcrumb: true,
    parentId: 'dashboard',
    order: 3,
  },

  // ==================== 管理端路由 ====================
  {
    id: 'admin-dashboard',
    label: '管理控制台',
    path: '/admin',
    icon: LayoutDashboard,
    roles: ['admin'], // 仅管理员可访问
    showInNav: true,
    showInBreadcrumb: true,
    order: 10,
  },
  {
    id: 'subscription-plans',
    label: '订阅计划管理',
    path: '/admin/subscription-plans',
    icon: CreditCard,
    roles: ['admin'], // 仅管理员可访问
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
    roles: ['admin'], // 仅管理员可访问
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
    roles: ['admin'], // 仅管理员可访问
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
    roles: ['admin'], // 仅管理员可访问
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 14,
  },
  {
    id: 'node-groups',
    label: '节点组管理',
    path: '/admin/node-groups',
    icon: Network,
    roles: ['admin'], // 仅管理员可访问
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 15,
  },
  {
    id: 'forward-rules',
    label: '转发规则',
    path: '/admin/forward-rules',
    icon: ArrowLeftRight,
    roles: ['admin'], // 仅管理员可访问
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
    roles: ['admin'], // 仅管理员可访问
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 17,
  },
  {
    id: 'forward-chains',
    label: '转发链',
    path: '/admin/forward-chains',
    icon: Link2,
    roles: ['admin'], // 仅管理员可访问
    showInNav: true,
    showInBreadcrumb: true,
    parentId: 'admin-dashboard',
    order: 18,
  },
] as const;

/**
 * 根据路径获取导航项
 */
export const getNavigationItemByPath = (path: string): NavigationItem | undefined => {
  return navigationConfig.find((item) => item.path === path);
};

/**
 * 根据ID获取导航项
 */
export const getNavigationItemById = (id: string): NavigationItem | undefined => {
  return navigationConfig.find((item) => item.id === id);
};

/**
 * 根据路径段查找导航项
 * 用于面包屑自动生成
 *
 * @param segment - URL 路径段(例如: 'dashboard', 'subscription-plans')
 * @returns 导航项或 undefined
 */
export const getNavigationItemBySegment = (segment: string): NavigationItem | undefined => {
  return navigationConfig.find((item) => {
    const pathParts = item.path.split('/').filter(Boolean);
    return pathParts.includes(segment);
  });
};

/**
 * 获取显示在导航栏中的项
 */
export const getNavItems = (): NavigationItem[] => {
  return navigationConfig
    .filter((item) => item.showInNav !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

/**
 * 获取显示在面包屑中的项
 */
export const getBreadcrumbItems = (): NavigationItem[] => {
  return navigationConfig.filter((item) => item.showInBreadcrumb !== false);
};

/**
 * 根据导航项ID构建面包屑路径
 * 自动追溯父级关系
 *
 * @param itemId - 导航项ID
 * @returns 面包屑路径数组(从根到当前)
 */
export const buildBreadcrumbPath = (itemId: string): NavigationItem[] => {
  const result: NavigationItem[] = [];
  let currentId: string | undefined = itemId;

  // 防止无限循环
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const item = getNavigationItemById(currentId);

    if (item) {
      result.unshift(item); // 添加到数组开头
      currentId = item.parentId;
    } else {
      break;
    }
  }

  return result;
};
