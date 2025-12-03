/**
 * AdminLayout 管理端布局组件
 *
 * 提供管理端专用的布局结构，包括：
 * - 顶部导航栏：显示 Logo 和用户菜单
 * - 左侧边栏：显示管理端导航菜单（可折叠，折叠后显示图标）
 * - 主内容区域：渲染子组件
 * - 响应式设计：移动端自动收起侧边栏
 */

import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Settings,
  LogOut,
  ArrowLeftRight,
  X,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/common/Tooltip';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { ProfileDialog } from '@/features/profile/components/ProfileDialog';
import { EnhancedBreadcrumbs } from '@/components/navigation/EnhancedBreadcrumbs';
import { getNavItems } from '@/config/navigation';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { filterNavigationByPermission } = usePermissions();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const navItems = getNavItems();
  const adminOnlyNavItems = navItems.filter(item => item.path.startsWith('/admin'));
  const adminNavItems = filterNavigationByPermission(adminOnlyNavItems);

  const handleLogout = async () => {
    await logout();
  };

  // 移动端侧边栏内容
  const MobileSidebarContent = () => (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <span className="text-base font-semibold text-foreground">管理控制台</span>
      </div>

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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                {item.label}
              </RouterLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t p-4">
        <RouterLink
          to="/dashboard"
          onClick={() => setMobileDrawerOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArrowLeftRight className="h-5 w-5" />
          切换到用户视图
        </RouterLink>
      </div>
    </div>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background">
        {/* 移动端侧边栏 */}
        <Dialog.Root open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 md:hidden" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 h-full w-72 bg-background shadow-xl md:hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
              <Dialog.Close className="absolute right-3 top-3 rounded-md p-1.5 hover:bg-accent">
                <X className="h-4 w-4" />
              </Dialog.Close>
              <Dialog.Title className="sr-only">导航菜单</Dialog.Title>
              <MobileSidebarContent />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

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
            <span className={cn(
              "text-sm font-semibold text-foreground whitespace-nowrap transition-opacity duration-200",
              collapsed ? "opacity-0 w-0" : "opacity-100"
            )}>
              管理控制台
            </span>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="relative flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors before:absolute before:inset-[-8px] before:content-['']"
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
            <nav className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                const linkContent = (
                  <RouterLink
                    key={item.id}
                    to={item.path}
                    className={cn(
                      "flex items-center rounded-lg transition-colors",
                      collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                    <span className={cn(
                      "text-sm font-medium whitespace-nowrap transition-opacity duration-200",
                      collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                    )}>
                      {item.label}
                    </span>
                  </RouterLink>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return linkContent;
              })}
            </nav>
          </div>

          {/* 侧边栏底部 */}
          <div className={cn("border-t py-4", collapsed ? "px-2" : "px-3")}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <RouterLink
                    to="/dashboard"
                    className="flex items-center justify-center rounded-lg p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <ArrowLeftRight className="h-5 w-5" />
                  </RouterLink>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  切换到用户视图
                </TooltipContent>
              </Tooltip>
            ) : (
              <RouterLink
                to="/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <ArrowLeftRight className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">切换到用户视图</span>
              </RouterLink>
            )}
          </div>
        </aside>

        {/* 主内容区域 */}
        <div
          className={cn(
            "flex min-h-screen flex-col transition-all duration-200",
            collapsed ? "md:pl-16" : "md:pl-56"
          )}
        >
          {/* 顶部导航栏 */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            {/* 移动端菜单按钮 */}
            <button
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
              onClick={() => setMobileDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* 面包屑 */}
            <div className="flex-1 min-w-0">
              <EnhancedBreadcrumbs />
            </div>

            {/* 用户菜单 */}
            <DropdownMenuPrimitive.Root>
              <DropdownMenuPrimitive.Trigger asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent">
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
                  className="z-50 min-w-[12rem] rounded-md border bg-popover p-1 shadow-md"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuPrimitive.Label className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.displayName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </DropdownMenuPrimitive.Label>
                  <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border" />
                  <DropdownMenuPrimitive.Item
                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                    onSelect={() => setProfileDialogOpen(true)}
                  >
                    <UserIcon className="h-4 w-4" />
                    个人资料
                  </DropdownMenuPrimitive.Item>
                  <DropdownMenuPrimitive.Item
                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent opacity-50"
                    disabled
                  >
                    <Settings className="h-4 w-4" />
                    账户设置
                  </DropdownMenuPrimitive.Item>
                  <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border" />
                  <DropdownMenuPrimitive.Item
                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer text-destructive hover:bg-destructive/10"
                    onSelect={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </DropdownMenuPrimitive.Item>
                </DropdownMenuPrimitive.Content>
              </DropdownMenuPrimitive.Portal>
            </DropdownMenuPrimitive.Root>
          </header>

          {/* 页面内容 */}
          <main className="flex-1 p-4 sm:p-6">
            {children}
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
