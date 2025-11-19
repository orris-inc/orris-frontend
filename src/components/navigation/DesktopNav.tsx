/**
 * 桌面端导航组件
 * 在 AppBar 中显示主导航链接
 */

import { Button, Box } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

import type { NavigationItem } from '../../types/navigation.types';

/**
 * DesktopNav 组件属性
 */
interface DesktopNavProps {
  /** 导航项列表 */
  navigationItems: NavigationItem[];
}

/**
 * 桌面端导航组件
 *
 * 特点:
 * - 只在桌面端显示(md及以上断点)
 * - 水平排列的导航按钮
 * - 高亮当前激活的页面
 * - 鼠标悬停效果
 * - 支持图标和文字
 *
 * @example
 * ```tsx
 * import { DesktopNav } from '@/components/navigation/DesktopNav';
 * import { navigationConfig } from '@/config/navigation';
 * import { usePermissions } from '@/features/auth/hooks/usePermissions';
 *
 * const { filterNavigationByPermission } = usePermissions();
 * const visibleItems = filterNavigationByPermission(
 *   navigationConfig.filter(item => item.showInNav !== false)
 * );
 *
 * <AppBar>
 *   <Toolbar>
 *     <Typography>Logo</Typography>
 *     <DesktopNav navigationItems={visibleItems} />
 *     <UserMenu />
 *   </Toolbar>
 * </AppBar>
 * ```
 */
export const DesktopNav = ({ navigationItems }: DesktopNavProps) => {
  const location = useLocation();

  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        gap: 1,
        ml: 4,
        flexGrow: 1,
      }}
    >
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <Button
            key={item.id}
            component={RouterLink}
            to={item.path}
            color="inherit"
            disabled={item.disabled}
            startIcon={Icon ? <Icon /> : undefined}
            sx={{
              px: 2,
              py: 1,
              opacity: isActive ? 1 : 0.7,
              borderBottom: isActive ? 2 : 0,
              borderColor: 'common.white',
              borderRadius: 0,
              transition: 'all 0.2s',
              fontWeight: isActive ? 600 : 500,
              '&:hover': {
                opacity: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&.Mui-disabled': {
                opacity: 0.4,
                color: 'inherit',
              },
            }}
          >
            {item.label}
          </Button>
        );
      })}
    </Box>
  );
};

export type { DesktopNavProps };
