/**
 * 移动端抽屉菜单组件
 * 在移动设备上显示导航菜单,从左侧滑出
 */

import { useMemo } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Toolbar,
  Typography,
  Divider,
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

import type { NavigationItem } from '../../types/navigation.types';

/**
 * MobileDrawer 组件属性
 */
interface MobileDrawerProps {
  /** 抽屉是否打开 */
  open: boolean;
  /** 抽屉关闭回调 */
  onClose: () => void;
  /** 导航项列表 */
  navigationItems: NavigationItem[];
  /** 品牌名称(显示在顶部) */
  brandName?: string;
}

/**
 * 移动端抽屉菜单组件
 *
 * 特点:
 * - 只在移动端显示(xs和sm断点)
 * - 临时抽屉,从左侧滑出
 * - 点击导航项后自动关闭
 * - 顶部带品牌区域
 * - 高亮当前激活的页面
 * - 完整的TypeScript类型定义
 *
 * @example
 * ```tsx
 * import { MobileDrawer } from '@/components/navigation/MobileDrawer';
 * import { navigationConfig } from '@/config/navigation';
 * import { usePermissions } from '@/features/auth/hooks/usePermissions';
 *
 * const { filterNavigationByPermission } = usePermissions();
 * const visibleItems = filterNavigationByPermission(navigationConfig);
 *
 * <MobileDrawer
 *   open={drawerOpen}
 *   onClose={() => setDrawerOpen(false)}
 *   navigationItems={visibleItems}
 *   brandName="Orris"
 * />
 * ```
 */
export const MobileDrawer = ({
  open,
  onClose,
  navigationItems,
  brandName = 'Orris',
}: MobileDrawerProps) => {
  const location = useLocation();

  /**
   * 渲染导航项
   * 根据是否为分隔符渲染不同的内容
   */
  const renderNavigationItems = useMemo(() => {
    /**
     * 处理导航项点击
     * 点击后自动关闭抽屉
     */
    const handleNavigationItemClick = () => {
      onClose();
    };

    return navigationItems.map((item) => {
      // 渲染分隔符
      if (item.divider) {
        return <Divider key={item.id} sx={{ my: 1 }} />;
      }

      // 渲染导航项
      const Icon = item.icon;
      const isActive = location.pathname === item.path;

      return (
        <ListItem key={item.id} disablePadding>
          <ListItemButton
            component={RouterLink}
            to={item.path}
            onClick={handleNavigationItemClick}
            disabled={item.disabled}
            selected={isActive}
            sx={{
              py: 1.5,
              '&:hover': {
                bgcolor: 'action.hover',
              },
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            {Icon && (
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: item.disabled ? 'action.disabled' : 'inherit',
                }}
              >
                <Icon />
              </ListItemIcon>
            )}
            <ListItemText
              primary={item.label}
              sx={{
                '& .MuiTypography-root': {
                  fontSize: '0.95rem',
                  fontWeight: isActive ? 600 : 500,
                },
              }}
            />
          </ListItemButton>
        </ListItem>
      );
    });
  }, [navigationItems, location.pathname, onClose]);

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="temporary"
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
        },
      }}
    >
      {/* 顶部品牌区域 - 与AppBar高度对齐 */}
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          minHeight: 64,
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 700,
            letterSpacing: 0.5,
            fontSize: '1.4rem',
          }}
        >
          {brandName}
        </Typography>
      </Toolbar>

      {/* 导航列表 */}
      <Box
        role="presentation"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
        }}
      >
        <List
          sx={{
            py: 1,
            px: 0,
          }}
        >
          {renderNavigationItems}
        </List>
      </Box>
    </Drawer>
  );
};

export type { MobileDrawerProps };
