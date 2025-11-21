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
 */

import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Menu,
  ChevronLeft,
  User as UserIcon,
  Settings,
  LogOut,
  ArrowLeftRight,
  PanelLeft,
  X,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { TooltipProvider } from '@/components/common/Tooltip';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { ProfileDialog } from '@/features/profile/components/ProfileDialog';
import { EnhancedBreadcrumbs } from '@/components/navigation/EnhancedBreadcrumbs';
import { getNavItems } from '@/config/navigation';
import { cn } from '@/lib/utils';

/**
 * AdminLayout 组件属性
 */
interface AdminLayoutProps {
  /** 子组件（页面内容） */
  children: React.ReactNode;
}

/**
 * AdminLayout 管理端布局组件
 */
export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { filterNavigationByPermission } = usePermissions();

  // 状态管理
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopDrawerOpen, setDesktopDrawerOpen] = useState(true);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // 根据权限过滤导航项（只显示管理员可访问的菜单）
  const navItems = getNavItems();
  // 只显示管理端路由 (/admin/*)
  const adminOnlyNavItems = navItems.filter(item => item.path.startsWith('/admin'));
  const adminNavItems = filterNavigationByPermission(adminOnlyNavItems);

  /**
   * 处理退出登录
   */
  const handleLogout = async () => {
    await logout();
  };

  /**
   * 侧边栏内容组件
   */
  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-background">
      {/* 侧边栏头部 */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <span className="text-base sm:text-lg font-bold tracking-tight text-primary">
          管理控制台
        </span>
        {/* 桌面端折叠按钮 */}
        <button
          className="hidden md:flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          onClick={() => setDesktopDrawerOpen(false)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* 导航菜单列表 */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <RouterLink
                key={item.id}
                to={item.path}
                onClick={() => setMobileDrawerOpen(false)}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                )}
                {item.label}
              </RouterLink>
            );
          })}
        </nav>
      </div>

      {/* 侧边栏底部 */}
      <div className="border-t p-4">
        <RouterLink
          to="/dashboard"
          onClick={() => setMobileDrawerOpen(false)}
          className="flex items-center rounded-md px-3 py-2 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeftRight className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
          切换到用户视图
        </RouterLink>

        <div className="mt-4 px-3">
          <p className="text-[10px] sm:text-xs text-muted-foreground">Orris 管理系统</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">v1.0.0</p>
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-muted/10">
      {/* 移动端侧边栏 (Dialog) */}
      <Dialog.Root open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 h-full w-64 gap-4 border-r bg-background p-0 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
            <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
            <Dialog.Title className="sr-only">导航菜单</Dialog.Title>
            <SidebarContent />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 桌面端侧边栏 (Fixed) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden flex-col border-r bg-background transition-all duration-300 md:flex",
          desktopDrawerOpen ? "w-64" : "w-0 -translate-x-full opacity-0"
        )}
      >
        <SidebarContent />
      </aside>

      {/* 主内容区域 */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          desktopDrawerOpen ? "md:pl-64" : "md:pl-0"
        )}
      >
        {/* 顶部导航栏 */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          {/* 移动端菜单按钮 */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground h-9 w-9 transition-colors"
            onClick={() => setMobileDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">打开菜单</span>
          </button>

          {/* 桌面端展开按钮 (当侧边栏关闭时显示) */}
          {!desktopDrawerOpen && (
            <button
              className="hidden md:inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground h-9 w-9 transition-colors"
              onClick={() => setDesktopDrawerOpen(true)}
            >
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">展开侧边栏</span>
            </button>
          )}

          <div className="flex flex-1 items-center gap-x-4 lg:gap-x-6">
            {/* Logo (仅移动端或侧边栏关闭时显示) */}
            {(!desktopDrawerOpen || window.innerWidth < 768) && (
              <div className="flex items-center">
                <span className="text-sm sm:text-base font-semibold tracking-tight">Orris</span>
              </div>
            )}

            {/* 面包屑导航 */}
            <div className="flex flex-1 items-center min-w-0">
              <EnhancedBreadcrumbs />
            </div>

            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* 用户菜单 */}
              <DropdownMenuPrimitive.Root>
                <DropdownMenuPrimitive.Trigger asChild>
                  <button className="relative inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
                    <AvatarPrimitive.Root className="h-8 w-8">
                      <AvatarPrimitive.Image src={user?.avatar} alt={user?.name} className="h-full w-full rounded-full object-cover" />
                      <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
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
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
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

        {/* 页面内容 */}
        <main className="flex-1 py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* 个人资料对话框 */}
      <ProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </div>
    </TooltipProvider>
  );
};

export type { AdminLayoutProps };
