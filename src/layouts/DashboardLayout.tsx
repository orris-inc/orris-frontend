/**
 * Dashboard 布局组件
 * 包含顶部导航栏、Tabs导航和主内容区域
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
  Container,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProfileDialog } from '@/features/profile/components/ProfileDialog';
import { MobileDrawer } from '@/components/navigation/MobileDrawer';
import { DesktopNav } from '@/components/navigation/DesktopNav';
import { EnhancedBreadcrumbs } from '@/components/navigation/EnhancedBreadcrumbs';
import { getNavItems } from '@/config/navigation';
import { usePermissions } from '@/features/auth/hooks/usePermissions';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { filterNavigationByPermission, userRole } = usePermissions();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // 根据权限过滤导航项
  // 先获取标记为显示在导航栏的项,再根据权限过滤
  const navItems = getNavItems();
  // 只显示用户端路由 (非 /admin/* 路径)
  const userOnlyNavItems = navItems.filter(item => !item.path.startsWith('/admin'));
  const visibleNavigationItems = filterNavigationByPermission(userOnlyNavItems);

  // DashboardLayout 用于用户端页面，始终显示导航栏
  const shouldShowNavigation = true;
  const shouldShowBreadcrumbs = false;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
  };

  const handleOpenProfile = () => {
    handleMenuClose();
    setProfileDialogOpen(true);
  };

  const handleGoToAdmin = () => {
    handleMenuClose();
    navigate('/admin');
  };

  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <AppBar position="fixed" elevation={1}>
        <Toolbar>
          {/* 移动端菜单按钮 - 仅用户端显示 */}
          {shouldShowNavigation && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMobileDrawerToggle}
              sx={{ mr: 2, display: { xs: 'flex', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo/品牌 */}
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 0,
              fontWeight: 700,
              letterSpacing: 0.5,
              mr: { xs: 2, md: 0 },
            }}
          >
            Orris
          </Typography>

          {/* 桌面端导航链接 - 仅用户端显示 */}
          {shouldShowNavigation && (
            <DesktopNav navigationItems={visibleNavigationItems} />
          )}

          {/* 占位符 - 将用户菜单推到右侧 */}
          <Box sx={{ flexGrow: 1 }} />

          {/* 用户信息和菜单 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {user?.email}
              </Typography>
            </Box>

            <IconButton
              onClick={handleMenuOpen}
              size="small"
              aria-controls={anchorEl ? 'user-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={anchorEl ? 'true' : undefined}
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
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
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

            <MenuItem onClick={handleOpenProfile}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>个人资料</ListItemText>
            </MenuItem>

            <MenuItem disabled>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>账户设置</ListItemText>
            </MenuItem>

            {/* 管理端入口（仅管理员显示） */}
            {userRole === 'admin' && (
              <>
                <Divider />
                <MenuItem onClick={handleGoToAdmin}>
                  <ListItemIcon>
                    <AdminPanelSettingsIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText>
                    <Typography color="primary">切换到管理端</Typography>
                  </ListItemText>
                </MenuItem>
              </>
            )}

            <Divider />

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

      {/* 移动端抽屉菜单 - 仅用户端显示 */}
      {shouldShowNavigation && (
        <MobileDrawer
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          navigationItems={visibleNavigationItems}
          brandName="Orris"
        />
      )}

      {/* 主内容区域 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          pt: { xs: shouldShowNavigation ? 7 : 2, sm: shouldShowNavigation ? 8 : 2 },
          pb: 4,
        }}
      >
        <Container maxWidth="lg">
          {/* 增强型面包屑导航 - 仅管理端显示 */}
          {shouldShowBreadcrumbs && <EnhancedBreadcrumbs />}

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
