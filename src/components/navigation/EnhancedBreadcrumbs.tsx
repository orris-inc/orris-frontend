/**
 * 增强型面包屑导航组件
 * 自动根据当前路由生成面包屑,支持响应式设计
 */

import { useMemo } from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getNavigationItemBySegment } from '../../config/navigation';
import { usePermissions } from '../../features/auth/hooks/usePermissions';
import type { BreadcrumbItem } from '../../types/navigation.types';

/**
 * 不显示面包屑的路径列表
 * 通常是登录/注册等公开页面
 */
const HIDDEN_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verification-pending',
];

/**
 * 增强型面包屑导航组件
 *
 * 特点:
 * - 自动根据URL路径生成面包屑
 * - 使用集中配置的导航标签
 * - 响应式设计:移动端简化显示(仅用户端)
 * - 管理端始终显示完整路径(包括移动端)
 * - 首页使用图标显示
 * - 当前页高亮显示
 * - 自动隐藏公开页面的面包屑
 *
 * @example
 * ```tsx
 * // Use in layout component
 * <Container>
 *   <EnhancedBreadcrumbs />
 *   {children}
 * </Container>
 * ```
 */
export const EnhancedBreadcrumbs = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { userRole } = usePermissions();

  // Admin always shows full path (no simplification on mobile)
  const shouldShowFullPath = userRole === 'admin';

  /**
   * 生成面包屑数据
   */
  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    // Check if in hidden paths list
    if (HIDDEN_PATHS.includes(location.pathname)) {
      return [];
    }

    // Split path segments
    const pathSegments = location.pathname
      .split('/')
      .filter((segment) => segment !== '');

    // Don't show breadcrumbs at root path
    if (pathSegments.length === 0) {
      return [];
    }

    const items: BreadcrumbItem[] = [];

    // Check if in admin path
    const isAdminPath = location.pathname.startsWith('/admin');
    const homePath = isAdminPath ? '/admin' : '/dashboard';
    const homeLabel = isAdminPath ? t('nav.adminDashboard') : t('nav.dashboard');

    // Add home page
    items.push({
      label: homeLabel,
      path: homePath,
      isActive: location.pathname === homePath,
    });

    // If currently at home page, return directly
    if (location.pathname === homePath) {
      return items;
    }

    // Build breadcrumbs level by level
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Find label from config
      const navItem = getNavigationItemBySegment(segment);

      if (navItem && navItem.showInBreadcrumb !== false) {
        items.push({
          label: t(navItem.labelKey),
          path: navItem.path,
          isActive: isLast,
        });
      } else if (isLast) {
        // If last item has no config, use formatted segment name
        items.push({
          label: formatSegmentLabel(segment),
          path: currentPath,
          isActive: true,
        });
      }
    });

    return items;
  }, [location.pathname, t]);

  // Don't render if no breadcrumbs
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="breadcrumb">
      <ol className="flex items-center gap-1.5 text-[13px]">
        {breadcrumbs.map((item, index) => {
          const isHome = index === 0;
          const isLast = index === breadcrumbs.length - 1;
          const shouldShowOnMobile = shouldShowFullPath || isHome || isLast;

          if (!shouldShowOnMobile) return null;

          return (
            <li key={item.path} className="inline-flex items-center gap-1.5">
              {index > 0 && (
                <span className="text-muted-foreground/30 select-none">/</span>
              )}

              {item.isActive ? (
                <span
                  className="font-medium text-foreground"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <RouterLink
                  to={item.path}
                  className="text-muted-foreground/60 transition-colors hover:text-foreground"
                >
                  {item.label}
                </RouterLink>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * 格式化路径段为可读标签
 * 作为没有配置时的后备方案
 *
 * @param segment - 路径段 (例如: 'plans')
 * @returns 格式化的标签 (例如: 'Subscription Plans')
 */
function formatSegmentLabel(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
