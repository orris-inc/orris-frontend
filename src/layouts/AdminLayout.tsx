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
import { useTranslation } from 'react-i18next';
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
import { useBreakpoint, useCurrentPageTitle, useVersionInfo } from '@/hooks';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { ProfileDialog } from '@/features/profile/components/ProfileDialog';
import { EnhancedBreadcrumbs } from '@/components/navigation/EnhancedBreadcrumbs';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { getNavItems } from '@/config/navigation';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { filterNavigationByPermission } = usePermissions();
  const { isMobile } = useBreakpoint();
  const currentPageTitle = useCurrentPageTitle('管理控制台');
  const { serverVersion, clientVersion } = useVersionInfo();

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
      <div className="min-h-viewport bg-background overflow-x-hidden">
        {/* Mobile drawer - iOS 26 Liquid Glass Design */}
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
          serverVersion={serverVersion ?? undefined}
          clientVersion={clientVersion}
          onAdminClick={() => navigate('/dashboard')}
          onLogout={handleLogout}
        />

        {/* Desktop sidebar - Glass morphism design */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden md:flex',
            'bg-muted/30 dark:bg-muted/20',
            'border-r border-border/50',
            'transition-all duration-200 motion-reduce:transition-none',
            collapsed ? 'w-18' : 'w-60'
          )}
        >
          {/* Sidebar header */}
          <div
            className={cn(
              'flex h-14 shrink-0 items-center',
              'border-b border-border/50',
              collapsed ? 'justify-center px-2' : 'justify-between px-4'
            )}
          >
            {!collapsed && (
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                管理控制台
              </span>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                'flex size-8 items-center justify-center rounded-lg',
                'transition-colors motion-reduce:transition-none',
                'hover:bg-foreground/5'
              )}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Navigation menu */}
          <div className="flex-1 overflow-y-auto py-3">
            <AdminSidebarNav items={adminNavItems} collapsed={collapsed} />
          </div>

          {/* Sidebar footer */}
          <AdminSidebarFooter collapsed={collapsed} tooltipLabel="切换到用户视图">
            <SwitchToUserViewLink collapsed={collapsed} />
          </AdminSidebarFooter>

          {/* Version info */}
          {(serverVersion || clientVersion) && (
            <div
              className={cn(
                'shrink-0 border-t border-border/50',
                'py-2.5 text-[10px] text-muted-foreground/50',
                collapsed ? 'px-2 text-center' : 'px-4'
              )}
            >
              {collapsed ? (
                <div className="space-y-0.5 font-mono text-[9px]">
                  {serverVersion && <div>{serverVersion}</div>}
                  <div>{clientVersion}</div>
                </div>
              ) : (
                <div className="space-y-1">
                  {serverVersion && (
                    <div className="flex items-center justify-between">
                      <span>{t('app.serverVersion')}</span>
                      <span className="font-mono text-muted-foreground/70">{serverVersion}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>{t('app.clientVersion')}</span>
                    <span className="font-mono text-muted-foreground/70">{clientVersion}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Main content area */}
        <div
          className={cn(
            'flex min-h-viewport flex-col transition-all duration-200 motion-reduce:transition-none',
            collapsed ? 'md:pl-18' : 'md:pl-60'
          )}
        >
          {/* iOS-style Navigation Bar */}
          <header
            className={cn(
              'sticky top-0 z-30',
              // iOS glass background
              isMobile
                ? 'glass-elevated border-b border-border/40'
                : 'border-b bg-background',
              // Safe area support for notch/dynamic island
              isMobile && 'pt-[env(safe-area-inset-top)]'
            )}
          >
            <div
              className={cn(
                'flex items-center',
                // iOS standard nav bar height: 44px, desktop: 56px
                isMobile ? 'h-11 px-2' : 'h-14 px-4 sm:px-6 gap-4'
              )}
            >
              {/* Left section - fixed width for iOS symmetry */}
              <div className={cn(isMobile ? 'w-11 flex-shrink-0' : 'contents')}>
                {isMobile && (
                  <button
                    className={cn(
                      'flex items-center justify-center',
                      'size-11', // 44px touch target
                      'rounded-full',
                      'text-primary',
                      'active:bg-foreground/10',
                      'transition-colors motion-reduce:transition-none'
                    )}
                    onClick={() => setMobileDrawerOpen(true)}
                    aria-label="Open menu"
                  >
                    <Menu className="size-[22px]" strokeWidth={2} />
                  </button>
                )}
              </div>

              {/* Center section - iOS centered title */}
              <div
                className={cn(
                  'flex-1 min-w-0',
                  isMobile && 'flex justify-center'
                )}
              >
                {isMobile ? (
                  <h1
                    className={cn(
                      'text-[17px] font-semibold leading-tight',
                      'text-foreground truncate',
                      'max-w-[60vw]' // Prevent title from overlapping buttons
                    )}
                  >
                    {currentPageTitle}
                  </h1>
                ) : (
                  <EnhancedBreadcrumbs />
                )}
              </div>

              {/* Right section - fixed width for iOS symmetry */}
              <div
                className={cn(
                  isMobile
                    ? 'w-11 flex-shrink-0 flex justify-end'
                    : 'flex items-center gap-3'
                )}
              >
                {/* Desktop: show language switcher and theme toggle */}
                {!isMobile && (
                  <>
                    <LanguageSwitcher />
                    <ThemeToggle />
                  </>
                )}

                <UserMenu
                  user={user}
                  showUserSwitch
                  onProfileClick={() => setProfileDialogOpen(true)}
                  onUserClick={() => navigate('/dashboard')}
                  onLogout={handleLogout}
                />
              </div>
            </div>
          </header>

          {/* Page content - Mobile optimized padding */}
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
