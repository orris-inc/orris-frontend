/**
 * 增强型面包屑导航组件
 * 自动根据当前路由生成面包屑,支持响应式设计
 */

import { useMemo } from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { Breadcrumbs, Link, Typography, Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

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
 * // 在布局组件中使用
 * <Container>
 *   <EnhancedBreadcrumbs />
 *   {children}
 * </Container>
 * ```
 */
export const EnhancedBreadcrumbs = () => {
  const location = useLocation();
  const { userRole } = usePermissions();

  // 管理员始终显示完整路径(移动端也不简化)
  const shouldShowFullPath = userRole === 'admin';

  /**
   * 生成面包屑数据
   */
  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    // 检查是否在隐藏列表中
    if (HIDDEN_PATHS.includes(location.pathname)) {
      return [];
    }

    // 分割路径段
    const pathSegments = location.pathname
      .split('/')
      .filter((segment) => segment !== '');

    // 如果在根路径,不显示面包屑
    if (pathSegments.length === 0) {
      return [];
    }

    const items: BreadcrumbItem[] = [];

    // 添加首页
    items.push({
      label: '首页',
      path: '/dashboard',
      isActive: location.pathname === '/dashboard',
    });

    // 如果当前就是首页,直接返回
    if (location.pathname === '/dashboard') {
      return items;
    }

    // 逐级构建面包屑
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // 从配置中查找标签
      const navItem = getNavigationItemBySegment(segment);

      if (navItem && navItem.showInBreadcrumb !== false) {
        items.push({
          label: navItem.label,
          path: navItem.path,
          isActive: isLast,
        });
      } else if (isLast) {
        // 如果是最后一项但没有配置,使用格式化的段名
        items.push({
          label: formatSegmentLabel(segment),
          path: currentPath,
          isActive: true,
        });
      }
    });

    return items;
  }, [location.pathname]);

  // 如果没有面包屑,不渲染
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'nowrap',
          },
        }}
      >
        {breadcrumbs.map((item, index) => {
          const isHome = index === 0;
          const isLast = index === breadcrumbs.length - 1;
          // 管理端始终显示所有项,用户端移动端只显示首页和当前页
          const shouldShowOnMobile = shouldShowFullPath || isHome || isLast;

          return (
            <Box
              key={item.path}
              sx={{
                display: {
                  xs: shouldShowOnMobile ? 'flex' : 'none',
                  md: 'flex',
                },
                alignItems: 'center',
              }}
            >
              {item.isActive ? (
                // 当前页 - 不可点击
                <Typography
                  color="text.primary"
                  sx={{
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: { xs: '0.875rem', md: '0.95rem' },
                  }}
                >
                  {isHome && <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />}
                  {item.label}
                </Typography>
              ) : (
                // 父级页面 - 可点击
                <Link
                  component={RouterLink}
                  to={item.path}
                  underline="hover"
                  color="inherit"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: { xs: '0.875rem', md: '0.95rem' },
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  {isHome && <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />}
                  {item.label}
                </Link>
              )}
            </Box>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

/**
 * 格式化路径段为可读标签
 * 作为没有配置时的后备方案
 *
 * @param segment - 路径段 (例如: 'subscription-plans')
 * @returns 格式化的标签 (例如: 'Subscription Plans')
 */
function formatSegmentLabel(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
