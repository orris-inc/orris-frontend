/**
 * AdminLayout 管理端布局组件
 *
 * 提供管理端专用的布局结构，包括：
 * - 顶部导航栏：显示 Logo 和用户菜单
 * - 左侧边栏：显示管理端导航菜单（可折叠，折叠后显示图标）
 * - 主内容区域：渲染子组件
 * - 响应式设计：移动端自动收起侧边栏
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewTransitionLink } from '@/components/common/ViewTransitionLink';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
} from 'lucide-react';
import { TooltipProvider } from '@/components/common/Tooltip';
import { AdminSidebarNav, AdminSidebarFooter } from '@/components/navigation/AdminSidebarNav';
import { MobileDrawer } from '@/components/navigation/MobileDrawer';
import { UserMenu } from '@/components/navigation/UserMenu';
import { useBreakpoint } from '@/hooks';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { ProfileDialog } from '@/features/profile/components/ProfileDialog';
import { EnhancedBreadcrumbs } from '@/components/navigation/EnhancedBreadcrumbs';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { getNavItems } from '@/config/navigation';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { filterNavigationByPermission } = usePermissions();
  const { isMobile } = useBreakpoint();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved === 'true';
  });
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const navItems = getNavItems();
  const adminOnlyNavItems = navItems.filter(item => item.path.startsWith('/admin'));
  const adminNavItems = filterNavigationByPermission(adminOnlyNavItems);

  const handleLogout = async () => {
    await logout();
  };

  // Switch to user view link component
  const SwitchToUserViewLink = ({ collapsed = false }: { collapsed?: boolean }) => (
    <ViewTransitionLink
      to="/dashboard"
      onBeforeNavigate={() => setMobileDrawerOpen(false)}
      className={cn(
        'group flex items-center rounded-xl text-primary',
        'transition-colors duration-200 ease-out',
        'active:bg-primary/10',
        'motion-reduce:transition-none',
        collapsed ? 'justify-center p-2.5 min-h-[44px]' : 'gap-3 px-3 py-3 min-h-[48px]'
      )}
    >
      {collapsed ? (
        <ArrowLeftRight className="h-5 w-5 flex-shrink-0" />
      ) : (
        <>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <ArrowLeftRight className="h-5 w-5 text-primary" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium whitespace-nowrap">切换到用户视图</span>
        </>
      )}
    </ViewTransitionLink>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen min-h-dvh bg-background overflow-x-hidden">
        {/* 移动端侧边栏 - iOS 26 Liquid Glass Design */}
        <MobileDrawer
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          navigationItems={adminNavItems}
          title="管理控制台"
          user={user ? {
            displayName: user.displayName,
            email: user.email,
            initials: user.displayName?.charAt(0).toUpperCase(),
          } : null}
          showAdminSwitch
          isAdminView
          onAdminClick={() => navigate('/dashboard')}
          onLogout={handleLogout}
        />

        {/* 桌面端侧边栏 */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden flex-col border-r bg-background transition-all duration-200 md:flex overflow-hidden",
            collapsed ? "w-16" : "w-56"
          )}
        >
          {/* 侧边栏头部 */}
          <div className={cn(
            "flex h-14 items-center border-b",
            collapsed ? "justify-center px-2" : "justify-between px-4"
          )}>
            {!collapsed && (
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                管理控制台
              </span>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center justify-center rounded-md hover:bg-accent transition-colors touch-target"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* 导航菜单 */}
          <div className="flex-1 overflow-y-auto py-4">
            <AdminSidebarNav items={adminNavItems} collapsed={collapsed} />
          </div>

          {/* 侧边栏底部 */}
          <AdminSidebarFooter collapsed={collapsed} tooltipLabel="切换到用户视图">
            <SwitchToUserViewLink collapsed={collapsed} />
          </AdminSidebarFooter>
        </aside>

        {/* 主内容区域 */}
        <div
          className={cn(
            "flex min-h-screen flex-col transition-all duration-200",
            collapsed ? "md:pl-16" : "md:pl-56"
          )}
        >
          {/* 顶部导航栏 - Mobile optimized */}
          <header className={cn(
            "sticky top-0 z-30 flex items-center gap-4 border-b bg-background",
            isMobile ? "h-12 px-4" : "h-14 px-4 sm:px-6"
          )}>
            {/* 移动端菜单按钮 */}
            <button
              className="md:hidden flex items-center justify-center rounded-lg hover:bg-accent touch-target p-2.5 min-w-[44px] min-h-[44px]"
              onClick={() => setMobileDrawerOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Breadcrumbs or simple title for mobile */}
            <div className="flex-1 min-w-0">
              {isMobile ? (
                <h1 className="text-base font-semibold text-foreground truncate">
                  管理控制台
                </h1>
              ) : (
                <EnhancedBreadcrumbs />
              )}
            </div>

            {/* Theme toggle and user menu */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Hide theme toggle on mobile - available in drawer */}
              {!isMobile && <ThemeToggle />}

              <UserMenu
                user={user}
                showUserSwitch
                onProfileClick={() => setProfileDialogOpen(true)}
                onUserClick={() => navigate('/dashboard')}
                onLogout={handleLogout}
              />
            </div>
          </header>

          {/* 页面内容 - Mobile optimized padding */}
          <main
            className={cn(
              "flex-1 overflow-x-hidden",
              isMobile ? "p-3" : "p-4 sm:p-6"
            )}
            data-view-transition="content"
          >
            <div className="min-w-0 max-w-full">
              {children}
            </div>
          </main>
        </div>

        <ProfileDialog
          open={profileDialogOpen}
          onClose={() => setProfileDialogOpen(false)}
        />
      </div>
    </TooltipProvider>
  );
};

export type { AdminLayoutProps };
