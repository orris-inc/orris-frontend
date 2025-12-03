/**
 * Dashboard 布局组件
 * 包含顶部导航栏、Tabs导航和主内容区域
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Menu, User as UserIcon, Settings, LogOut, Shield } from 'lucide-react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

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

  const handleLogout = async () => {
    await logout();
  };

  const handleGoToAdmin = () => {
    navigate('/admin');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl flex h-16 items-center px-4 sm:px-8">
          {/* 移动端菜单按钮 - 仅用户端显示 */}
          {shouldShowNavigation && (
            <button
              className="mr-2 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground h-9 w-9 transition-colors md:hidden"
              onClick={() => setMobileDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">打开菜单</span>
            </button>
          )}

          {/* Logo/品牌 */}
          <div className="mr-4 hidden md:flex">
            <span className="text-lg font-bold tracking-tight">Orris</span>
          </div>
          <div className="flex md:hidden flex-1">
            <span className="text-lg font-bold tracking-tight">Orris</span>
          </div>

          {/* 桌面端导航链接 - 仅用户端显示 */}
          {shouldShowNavigation && (
            <DesktopNav navigationItems={visibleNavigationItems} />
          )}

          {/* 占位符 - 将用户菜单推到右侧 */}
          <div className="flex-1 md:flex-none" />

          {/* 用户信息和菜单 */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium leading-none">{user?.displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>

            <DropdownMenuPrimitive.Root>
              <DropdownMenuPrimitive.Trigger asChild>
                <button className="relative inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
                  <AvatarPrimitive.Root className="h-8 w-8">
                    <AvatarPrimitive.Image src={user?.avatar} alt={user?.displayName} className="h-full w-full rounded-full object-cover" />
                    <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {user?.displayName?.charAt(0).toUpperCase()}
                    </AvatarPrimitive.Fallback>
                  </AvatarPrimitive.Root>
                </button>
              </DropdownMenuPrimitive.Trigger>
              <DropdownMenuPrimitive.Portal>
                <DropdownMenuPrimitive.Content
                  className="z-50 min-w-[14rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuPrimitive.Label className="px-2 py-1.5 text-sm font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuPrimitive.Label>
                  <DropdownMenuPrimitive.Separator className="mx-1 my-1 h-px bg-muted" />
                  <DropdownMenuPrimitive.Item
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    onSelect={() => setProfileDialogOpen(true)}
                  >
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>个人资料</span>
                  </DropdownMenuPrimitive.Item>
                  <DropdownMenuPrimitive.Item
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    disabled
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>账户设置</span>
                  </DropdownMenuPrimitive.Item>

                  {/* 管理端入口（仅管理员显示） */}
                  {userRole === 'admin' && (
                    <>
                      <DropdownMenuPrimitive.Separator className="mx-1 my-1 h-px bg-muted" />
                      <DropdownMenuPrimitive.Item
                        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        onSelect={handleGoToAdmin}
                      >
                        <Shield className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-primary">切换到管理端</span>
                      </DropdownMenuPrimitive.Item>
                    </>
                  )}

                  <DropdownMenuPrimitive.Separator className="mx-1 my-1 h-px bg-muted" />
                  <DropdownMenuPrimitive.Item
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-red-600 focus:text-red-600"
                    onSelect={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuPrimitive.Item>
                </DropdownMenuPrimitive.Content>
              </DropdownMenuPrimitive.Portal>
            </DropdownMenuPrimitive.Root>
          </div>
        </div>
      </header>

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
      <main className="flex-1 py-6">
        <div className="container mx-auto px-4 sm:px-8 max-w-6xl">
          {/* 增强型面包屑导航 - 仅管理端显示 (DashboardLayout中通常不显示，除非配置开启) */}
          {shouldShowBreadcrumbs && <EnhancedBreadcrumbs />}

          {/* 页面内容 */}
          {children}
        </div>
      </main>

      {/* 个人资料对话框 */}
      <ProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </div>
  );
};
