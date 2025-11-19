/**
 * AdminLayout 管理端布局组件
 *
 * 提供管理端专用的布局结构，包括：
 * - 顶部导航栏：显示 Logo 和用户菜单
 * - 左侧边栏：显示管理端导航菜单（可折叠）
 * - 主内容区域：渲染子组件
 * - 响应式设计：移动端自动收起侧边栏
 *
 * 使用场景：
 * - 订阅计划管理页面
 * - 用户管理页面
 * - 其他管理员专用页面
 *
 * @example
 * ```tsx
 * import { AdminLayout } from '@/layouts/AdminLayout';
 *
 * function SubscriptionPlansPage() {
 *   return (
 *     <AdminLayout>
 *       <SubscriptionPlansContent />
 *     </AdminLayout>
 *   );
 * }
 * ```
 */

import { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  useTheme,
  useMediaQuery,
  Container,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Link as RouterLink, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { ProfileDialog } from '@/features/profile/components/ProfileDialog';
import { EnhancedBreadcrumbs } from '@/components/navigation/EnhancedBreadcrumbs';
import { getNavItems } from '@/config/navigation';

/**
 * AdminLayout 组件属性
 */
interface AdminLayoutProps {
  /** 子组件（页面内容） */
  children: React.ReactNode;
}

/**
 * 侧边栏宽度（展开状态）
 */
const DRAWER_WIDTH = 240;

/**
 * AdminLayout 管理端布局组件
 *
 * 特性：
 * - 持久化侧边栏：桌面端默认展开，可手动折叠
 * - 临时侧边栏：移动端默认隐藏，点击菜单按钮显示
 * - 权限过滤：自动根据用户权限显示可访问的菜单项
 * - 响应式布局：自动适配不同屏幕尺寸
 * - 面包屑导航：显示当前页面路径
 * - 用户菜单：显示用户信息和退出登录
 *
 * 布局结构：
 * ```
 * ┌─────────────────────────────────────┐
 * │          AppBar (顶部导航)            │
 * ├─────────┬───────────────────────────┤
 * │         │                           │
 * │  Drawer │   Main Content            │
 * │ (侧边栏) │   (主内容区域)             │
 * │         │                           │
 * └─────────┴───────────────────────────┘
 * ```
 */
export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { filterNavigationByPermission } = usePermissions();

  // 状态管理
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false); // 移动端侧边栏状态
  const [desktopDrawerOpen, setDesktopDrawerOpen] = useState(true); // 桌面端侧边栏状态
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // 根据权限过滤导航项（只显示管理员可访问的菜单）
  const navItems = getNavItems();
  // 只显示管理端路由 (/admin/*)
  const adminOnlyNavItems = navItems.filter(item => item.path.startsWith('/admin'));
  const adminNavItems = filterNavigationByPermission(adminOnlyNavItems);

  /**
   * 处理移动端侧边栏切换
   */
  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  /**
   * 处理桌面端侧边栏切换
   */
  const handleDesktopDrawerToggle = () => {
    setDesktopDrawerOpen(!desktopDrawerOpen);
  };

  /**
   * 处理用户菜单打开
   */
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  /**
   * 处理用户菜单关闭
   */
  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  /**
   * 处理退出登录
   */
  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
  };

  /**
   * 处理打开个人资料对话框
   */
  const handleOpenProfile = () => {
    handleUserMenuClose();
    setProfileDialogOpen(true);
  };

  /**
   * 渲染侧边栏内容
   * 包含导航菜单列表
   */
  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
      }}
    >
      {/* 侧边栏头部 */}
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          minHeight: 64,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            letterSpacing: 0.5,
          }}
        >
          管理控制台
        </Typography>
        {/* 桌面端折叠按钮 */}
        {!isMobile && (
          <IconButton onClick={handleDesktopDrawerToggle} size="small">
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>

      {/* 导航菜单列表 */}
      <List
        sx={{
          flexGrow: 1,
          py: 2,
          px: 1,
          overflow: 'auto',
        }}
      >
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                onClick={() => {
                  // 移动端点击后关闭侧边栏
                  if (isMobile) {
                    setMobileDrawerOpen(false);
                  }
                }}
                disabled={item.disabled}
                selected={isActive}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderRadius: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontWeight: 600,
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
        })}
      </List>

      {/* 侧边栏底部 */}
      <Box
        sx={{
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        {/* 切换到用户视图按钮 */}
        <Box sx={{ p: 1 }}>
          <ListItemButton
            component={RouterLink}
            to="/dashboard"
            onClick={() => {
              // 移动端点击后关闭侧边栏
              if (isMobile) {
                setMobileDrawerOpen(false);
              }
            }}
            sx={{
              py: 1.5,
              px: 2,
              borderRadius: 1,
              transition: 'all 0.2s',
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'primary.light',
                '& .MuiListItemIcon-root': {
                  color: 'primary.main',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SwapHorizIcon />
            </ListItemIcon>
            <ListItemText
              primary="切换到用户视图"
              sx={{
                '& .MuiTypography-root': {
                  fontSize: '0.9rem',
                  fontWeight: 500,
                },
              }}
            />
          </ListItemButton>
        </Box>

        {/* 版本信息 */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Orris 管理系统
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            v1.0.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(desktopDrawerOpen &&
            !isMobile && {
              marginLeft: DRAWER_WIDTH,
              width: `calc(100% - ${DRAWER_WIDTH}px)`,
              transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }),
        }}
      >
        <Toolbar>
          {/* 菜单按钮 */}
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={isMobile ? handleMobileDrawerToggle : handleDesktopDrawerToggle}
            sx={{
              mr: 2,
              ...(desktopDrawerOpen && !isMobile && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo/品牌 */}
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 0,
              fontWeight: 700,
              letterSpacing: 0.5,
              mr: 2,
            }}
          >
            Orris
          </Typography>

          {/* 占位符 - 将用户菜单推到右侧 */}
          <Box sx={{ flexGrow: 1 }} />

          {/* 用户信息和菜单 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* 用户名和邮箱（移动端隐藏） */}
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {user?.email}
              </Typography>
            </Box>

            {/* 用户头像按钮 */}
            <IconButton
              onClick={handleUserMenuOpen}
              size="small"
              aria-controls={userMenuAnchorEl ? 'user-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={userMenuAnchorEl ? 'true' : undefined}
            >
              <Avatar
                src={user?.avatar}
                alt={user?.name}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'secondary.main',
                  fontSize: '1.2rem',
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>

          {/* 用户下拉菜单 */}
          <Menu
            id="user-menu"
            anchorEl={userMenuAnchorEl}
            open={Boolean(userMenuAnchorEl)}
            onClose={handleUserMenuClose}
            onClick={handleUserMenuClose}
            slotProps={{
              paper: {
                elevation: 3,
                sx: {
                  mt: 1.5,
                  minWidth: 220,
                  overflow: 'visible',
                  '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {/* 用户信息（移动端显示） */}
            <Box sx={{ px: 2, py: 1.5, display: { sm: 'none' } }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user?.email}
              </Typography>
            </Box>

            <Divider sx={{ display: { sm: 'none' } }} />

            {/* 个人资料 */}
            <MenuItem onClick={handleOpenProfile}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>个人资料</ListItemText>
            </MenuItem>

            {/* 账户设置 */}
            <MenuItem disabled>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>账户设置</ListItemText>
            </MenuItem>

            <Divider />

            {/* 退出登录 */}
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>
                <Typography color="error">退出登录</Typography>
              </ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* 左侧边栏 - 移动端（临时抽屉） */}
      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={handleMobileDrawerToggle}
        ModalProps={{
          keepMounted: true, // 优化移动端性能
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* 左侧边栏 - 桌面端（持久化抽屉） */}
      <Drawer
        variant="persistent"
        open={desktopDrawerOpen}
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* 主内容区域 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(desktopDrawerOpen &&
            !isMobile && {
              marginLeft: 0,
              transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }),
        }}
      >
        {/* 顶部占位（防止内容被 AppBar 遮挡） */}
        <Toolbar />

        {/* 页面内容容器 */}
        <Container
          maxWidth="xl"
          sx={{
            py: 3,
          }}
        >
          {/* 面包屑导航 */}
          <EnhancedBreadcrumbs />

          {/* 页面内容 */}
          {children}
        </Container>
      </Box>

      {/* 个人资料对话框 */}
      <ProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </Box>
  );
};

export type { AdminLayoutProps };
