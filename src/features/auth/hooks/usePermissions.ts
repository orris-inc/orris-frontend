/**
 * 权限控制Hook
 * 用于管理用户角色和权限验证
 */

import { useAuthStore } from '../stores/auth-store';
import type { UserRole, NavigationItem } from '../../../types/navigation.types';

/**
 * usePermissions Hook 返回类型
 */
export interface UsePermissionsReturn {
  /**
   * 检查用户是否拥有指定角色
   * @param requiredRoles 需要的角色数组，如 ['admin'] 或 ['user', 'admin']
   * @returns 用户拥有任一指定角色则返回true
   *
   * 使用示例：
   * const { hasPermission } = usePermissions();
   * if (hasPermission(['admin'])) {
   *   // 仅admin可见
   * }
   * if (hasPermission(['admin', 'moderator'])) {
   *   // admin或moderator可见
   * }
   */
  hasPermission: (requiredRoles: UserRole | UserRole[]) => boolean;

  /**
   * 根据用户权限过滤导航项
   * @param navigationItems 所有导航项
   * @returns 用户有权访问的导航项数组
   *
   * 使用示例：
   * const { filterNavigationByPermission } = usePermissions();
   * const visibleNavItems = filterNavigationByPermission([
   *   { id: '1', label: 'Dashboard', path: '/dashboard', roles: ['user'] },
   *   { id: '2', label: 'Admin Panel', path: '/admin', roles: ['admin'] },
   * ]);
   */
  filterNavigationByPermission: <T extends NavigationItem>(items: T[]) => T[];

  /**
   * 当前用户角色
   * 默认为 'user'（未登录或无角色信息时）
   */
  userRole: UserRole;
}

/**
 * 权限控制Hook
 * 提供用户角色检查和权限过滤功能
 *
 * @returns 包含权限检查方法和用户角色的对象
 *
 * 使用示例：
 * ```tsx
 * import { usePermissions } from '@/features/auth/hooks/usePermissions';
 *
 * export const AdminPanel = () => {
 *   const { hasPermission, userRole } = usePermissions();
 *
 *   if (!hasPermission('admin')) {
 *     return <div>您没有权限访问此页面</div>;
 *   }
 *
 *   return <div>欢迎管理员 {userRole}</div>;
 * };
 * ```
 */
export const usePermissions = (): UsePermissionsReturn => {
  // 获取认证store中的用户信息
  const user = useAuthStore((state) => state.user);

  /**
   * 获取用户的当前角色
   * 如果用户未登录或无role字段，默认返回'user'
   */
  const getCurrentUserRole = (): UserRole => {
    // 如果用户未登录，返回默认角色'user'
    if (!user) {
      return 'user';
    }

    // 如果用户对象中有role字段，使用该字段值
    if (user.role) {
      return user.role as UserRole;
    }

    // 默认返回'user'角色
    return 'user';
  };

  /**
   * 检查用户是否拥有指定角色
   * 支持单个角色字符串或角色数组
   */
  const hasPermission = (requiredRoles: UserRole | readonly UserRole[]): boolean => {
    const userRole = getCurrentUserRole();

    // 如果requiredRoles是字符串，转换为数组
    const rolesArray = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];

    // 检查用户角色是否在允许的角色列表中
    return rolesArray.includes(userRole);
  };

  /**
   * 根据用户权限过滤导航项
   * 只返回用户有权访问的导航项
   */
  const filterNavigationByPermission = <T extends NavigationItem>(
    items: T[]
  ): T[] => {
    return items.filter((item) => {
      // 如果导航项没有设置roles，则所有用户都可以访问
      if (!item.roles || item.roles.length === 0) {
        return true;
      }

      // 检查用户是否拥有访问此导航项所需的角色
      return hasPermission(item.roles);
    });
  };

  // 获取当前用户角色
  const userRole = getCurrentUserRole();

  return {
    hasPermission,
    filterNavigationByPermission,
    userRole,
  };
};
