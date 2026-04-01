/**
 * AdminLayout 管理端布局组件
 *
 * 提供管理端专用的布局结构，包括：
 * - 顶部导航栏：显示 Logo 和用户菜单
 * - 左侧边栏：显示管理端导航菜单（可折叠，折叠后显示图标）
 * - 主内容区域：渲染子组件
 * - 响应式设计：移动端自动收起侧边栏
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ViewTransitionLink } from '@/components/common/ViewTransitionLink';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Search,
} from 'lucide-react';
import { TooltipProvider } from '@/components/common/Tooltip';
import { AdminSidebarNav, AdminSidebarFooter } from '@/components/navigation/AdminSidebarNav';
import { MobileDrawer } from '@/components/navigation/MobileDrawer';
import { UserMenu } from '@/components/navigation/UserMenu';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { useCommandPaletteKeyboard } from '@/hooks/useCommandPaletteKeyboard';
import { NotificationCenter } from '@/components/navigation/NotificationCenter';
import { useCurrentPageTitle, useVersionInfo } from '@/hooks';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { EnhancedBreadcrumbs } from '@/components/navigation/EnhancedBreadcrumbs';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { getNavItems } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { mobileFixedHeaderStyles } from '@/lib/ui-styles';
import type { Notification } from '@/components/navigation/NotificationCenter';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { filterNavigationByPermission } = usePermissions();
  const currentPageTitle = useCurrentPageTitle(t('nav.admin'));
  const { serverVersion, clientVersion } = useVersionInfo();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const navItems = getNavItems();
  const adminOnlyNavItems = navItems.filter(item => item.path.startsWith('/admin'));
  const adminNavItems = filterNavigationByPermission(adminOnlyNavItems);

  const handleLogout = async () => {
    await logout();
  };

  // Command palette keyboard shortcut
  const handleOpenCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);
  useCommandPaletteKeyboard(handleOpenCommandPalette);

  // TODO: Replace with real notifications from API
  // This is placeholder data for UI demonstration
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Switch to user view link component
  const SwitchToUserViewLink = ({ collapsed = false }: { collapsed?: boolean }) => (
    <ViewTransitionLink
      to="/dashboard"
      onBeforeNavigate={() => setMobileDrawerOpen(false)}
      className={cn(
        'group flex items-center rounded-lg text-muted-foreground',
        'transition-colors duration-100',
        'hover:bg-muted/60 hover:text-foreground',
        'active:bg-muted',
        'motion-reduce:transition-none',
        collapsed ? 'justify-center p-2 min-h-[36px]' : 'gap-3 px-2 py-1.5 min-h-[36px]'
      )}
    >
      <ArrowLeftRight className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {!collapsed && (
        <span className="text-[13px] font-medium whitespace-nowrap">{t('nav.switchToUser')}</span>
      )}
    </ViewTransitionLink>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-viewport md:h-viewport md:overflow-hidden bg-background">
        {/* Mobile drawer - iOS 26 Liquid Glass Design */}
        <MobileDrawer
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          navigationItems={adminNavItems}
          title={t('nav.admin')}
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

        {/* Desktop sidebar - Clean background without glass effects */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden md:flex',
            'bg-background',
            'transition-all duration-200 motion-reduce:transition-none',
            collapsed ? 'w-16' : 'w-60'
          )}
        >
          {/* Navigation menu */}
          <div className="flex-1 overflow-y-auto pt-3 pb-1">
            <AdminSidebarNav items={adminNavItems} collapsed={collapsed} />
          </div>

          {/* Sidebar footer */}
          <AdminSidebarFooter collapsed={collapsed} tooltipLabel={t('nav.switchToUser')}>
            <SwitchToUserViewLink collapsed={collapsed} />
          </AdminSidebarFooter>

          {/* Collapse toggle - bottom position like reference */}
          <div className={cn('shrink-0 pb-1', collapsed ? 'px-1.5' : 'px-2')}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                'group flex items-center rounded-lg w-full',
                'min-h-[36px]',
                'text-muted-foreground/60',
                'transition-colors duration-100',
                'hover:bg-muted/60 hover:text-foreground',
                'motion-reduce:transition-none',
                collapsed ? 'justify-center p-2' : 'gap-3 px-2 py-1.5'
              )}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="size-[18px] shrink-0" strokeWidth={1.75} />
              ) : (
                <>
                  <ChevronLeft className="size-[18px] shrink-0" strokeWidth={1.75} />
                  <span className="text-[13px] font-medium whitespace-nowrap">{t('nav.collapseSidebar')}</span>
                </>
              )}
            </button>
          </div>

          {/* Version info */}
          {(serverVersion || clientVersion) && (
            <div
              className={cn(
                'shrink-0',
                'py-2.5 text-[10px] text-muted-foreground/60',
                collapsed ? 'px-2 text-center' : 'px-3'
              )}
            >
              {collapsed ? (
                <div className="space-y-0.5 font-mono text-[10px]">
                  {serverVersion && <div>{serverVersion}</div>}
                  <div>{clientVersion}</div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {serverVersion && (
                    <div className="flex items-center justify-between">
                      <span>{t('app.serverVersion')}</span>
                      <span className="font-mono text-muted-foreground/50">{serverVersion}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>{t('app.clientVersion')}</span>
                    <span className="font-mono text-muted-foreground/50">{clientVersion}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Main content area */}
        <div
          className={cn(
            'flex min-h-viewport md:h-viewport flex-col transition-all duration-200 motion-reduce:transition-none',
            collapsed ? 'md:pl-16' : 'md:pl-60'
          )}
        >
          {/* Navigation Bar - CSS-first responsive */}
          <header className={mobileFixedHeaderStyles.header}>
            <div className={mobileFixedHeaderStyles.headerInner}>
              {/* Left section - menu button (mobile only) */}
              <div className="w-11 flex-shrink-0 md:hidden">
                <button
                  className={cn(
                    'flex items-center justify-center',
                    'size-11',
                    'rounded-md',
                    'text-muted-foreground/60',
                    'hover:bg-muted/60 hover:text-foreground',
                    'active:bg-muted',
                    'transition-colors motion-reduce:transition-none'
                  )}
                  onClick={() => setMobileDrawerOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="size-5" strokeWidth={1.75} />
                </button>
              </div>

              {/* Center section - title (mobile) / breadcrumbs (desktop) */}
              <div className="flex-1 min-w-0 flex justify-center md:justify-start">
                {/* Mobile: centered page title */}
                <h1
                  className={cn(
                    'text-[17px] font-semibold leading-tight',
                    'text-foreground truncate',
                    'flex-1 min-w-0',
                    'md:hidden'
                  )}
                >
                  {currentPageTitle}
                </h1>
                {/* Desktop: breadcrumbs */}
                <div className="hidden md:block">
                  <EnhancedBreadcrumbs />
                </div>
              </div>

              {/* Right section */}
              <div
                className={cn(
                  'w-11 flex-shrink-0 flex justify-end',
                  'md:w-auto md:items-center md:gap-1'
                )}
              >
                {/* Desktop: Search button with ⌘K hint */}
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(true)}
                  className={cn(
                    'hidden md:flex items-center gap-2',
                    'h-8 px-2.5 rounded-md',
                    'text-[13px] text-muted-foreground/60',
                    'hover:text-muted-foreground',
                    'transition-colors motion-reduce:transition-none',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                  )}
                  aria-label={t('commandPalette.trigger')}
                >
                  <Search className="size-3.5" />
                  <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/40 bg-muted/50 rounded border border-border/50">
                    ⌘K
                  </kbd>
                </button>

                {/* Notification center */}
                <div className="hidden md:block">
                  <NotificationCenter
                    notifications={notifications}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                  />
                </div>

                {/* Desktop: Language switcher and theme toggle */}
                <div className="hidden md:flex md:items-center md:gap-0.5">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>

                <UserMenu
                  user={user}
                  showUserSwitch
                  onProfileClick={() => navigate('/admin/profile')}
                  onUserClick={() => navigate('/dashboard')}
                  onLogout={handleLogout}
                />
              </div>
            </div>
          </header>

          {/* Command Palette */}
          <CommandPalette
            open={commandPaletteOpen}
            onOpenChange={setCommandPaletteOpen}
            navigationItems={adminNavItems}
          />

          {/* Page content - CSS-first responsive padding */}
          <main
            className={mobileFixedHeaderStyles.mainSmall}
            data-view-transition="content"
          >
            <div className="min-w-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export type { AdminLayoutProps };
