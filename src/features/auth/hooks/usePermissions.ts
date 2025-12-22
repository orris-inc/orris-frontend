/**
 * Permission Control Hook
 * Used to manage user roles and permission verification
 */

import { useAuthStore } from '../stores/auth-store';
import type { UserRole, NavigationItem } from '../../../types/navigation.types';

/**
 * usePermissions Hook return type
 */
export interface UsePermissionsReturn {
  /**
   * Check if user has the specified role
   * @param requiredRoles Required role array, e.g. ['admin'] or ['user', 'admin']
   * @returns Returns true if user has any of the specified roles
   *
   * Usage example:
   * const { hasPermission } = usePermissions();
   * if (hasPermission(['admin'])) {
   *   // Only visible to admin
   * }
   * if (hasPermission(['admin', 'moderator'])) {
   *   // Visible to admin or moderator
   * }
   */
  hasPermission: (requiredRoles: UserRole | UserRole[]) => boolean;

  /**
   * Filter navigation items based on user permissions
   * @param navigationItems All navigation items
   * @returns Array of navigation items the user has access to
   *
   * Usage example:
   * const { filterNavigationByPermission } = usePermissions();
   * const visibleNavItems = filterNavigationByPermission([
   *   { id: '1', label: 'Dashboard', path: '/dashboard', roles: ['user'] },
   *   { id: '2', label: 'Admin Panel', path: '/admin', roles: ['admin'] },
   * ]);
   */
  filterNavigationByPermission: <T extends NavigationItem>(items: T[]) => T[];

  /**
   * Current user role
   * Defaults to 'user' (when not logged in or no role info)
   */
  userRole: UserRole;
}

/**
 * Permission Control Hook
 * Provides user role checking and permission filtering functionality
 *
 * @returns Object containing permission check methods and user role
 *
 * Usage example:
 * ```tsx
 * import { usePermissions } from '@/features/auth/hooks/usePermissions';
 *
 * export const AdminPanel = () => {
 *   const { hasPermission, userRole } = usePermissions();
 *
 *   if (!hasPermission('admin')) {
 *     return <div>You don't have permission to access this page</div>;
 *   }
 *
 *   return <div>Welcome admin {userRole}</div>;
 * };
 * ```
 */
export const usePermissions = (): UsePermissionsReturn => {
  // Get user info from auth store
  const user = useAuthStore((state) => state.user);

  /**
   * Get current user role
   * Returns 'user' by default if user is not logged in or has no role field
   */
  const getCurrentUserRole = (): UserRole => {
    // If user is not logged in, return default role 'user'
    if (!user) {
      return 'user';
    }

    // If user object has role field, use that value
    if (user.role) {
      return user.role as UserRole;
    }

    // Default return 'user' role
    return 'user';
  };

  /**
   * Check if user has the specified role
   * Supports single role string or role array
   */
  const hasPermission = (requiredRoles: UserRole | readonly UserRole[]): boolean => {
    const userRole = getCurrentUserRole();

    // If requiredRoles is a string, convert to array
    const rolesArray = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];

    // Check if user role is in the allowed role list
    return rolesArray.includes(userRole);
  };

  /**
   * Filter navigation items based on user permissions
   * Only return navigation items the user has access to
   */
  const filterNavigationByPermission = <T extends NavigationItem>(
    items: T[]
  ): T[] => {
    return items.filter((item) => {
      // If navigation item has no roles set, all users can access
      if (!item.roles || item.roles.length === 0) {
        return true;
      }

      // Check if user has the role required to access this navigation item
      return hasPermission(item.roles);
    });
  };

  // Get current user role
  const userRole = getCurrentUserRole();

  return {
    hasPermission,
    filterNavigationByPermission,
    userRole,
  };
};
