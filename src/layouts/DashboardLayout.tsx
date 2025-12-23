/**
 * Dashboard Layout Component
 * Contains top navigation bar, Tabs navigation, and main content area
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Menu, User as UserIcon, Bell, LogOut, Shield } from 'lucide-react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { TooltipProvider } from '@/components/common/Tooltip';

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

  // Filter navigation items by permission
  // First get items marked for display in navigation bar, then filter by permission
  const navItems = getNavItems();
  // Only show user routes (non /admin/* paths)
  const userOnlyNavItems = navItems.filter(item => !item.path.startsWith('/admin'));
  const visibleNavigationItems = filterNavigationByPermission(userOnlyNavItems);

  // DashboardLayout is for user pages, always show navigation bar
  const shouldShowNavigation = true;
  const shouldShowBreadcrumbs = false;

  const handleLogout = async () => {
    await logout();
  };

  const handleGoToAdmin = () => {
    navigate('/admin');
  };

  return (
    <TooltipProvider delayDuration={0}>
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl flex h-16 items-center px-4 sm:px-8">
          {/* Mobile menu button - only show for user side */}
          {shouldShowNavigation && (
            <button
              className="mr-2 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground h-9 w-9 transition-colors md:hidden"
              onClick={() => setMobileDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </button>
          )}

          {/* Logo/Brand */}
          <div className="mr-4 hidden md:flex">
            <span className="text-lg font-bold tracking-tight">Orris</span>
          </div>
          <div className="flex md:hidden flex-1">
            <span className="text-lg font-bold tracking-tight">Orris</span>
          </div>

          {/* Desktop navigation links - only show for user side */}
          {shouldShowNavigation && (
            <DesktopNav navigationItems={visibleNavigationItems} />
          )}

          {/* Placeholder - push user menu to the right */}
          <div className="flex-1 md:flex-none" />

          {/* User info and menu */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium leading-none">{user?.displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>

            <DropdownMenuPrimitive.Root>
              <DropdownMenuPrimitive.Trigger asChild>
                <button className="relative inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
                  <AvatarPrimitive.Root className="h-8 w-8">
                    <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {user?.initials || user?.displayName?.charAt(0).toUpperCase()}
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
                    onSelect={() => navigate('/dashboard/notifications')}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    <span>通知设置</span>
                  </DropdownMenuPrimitive.Item>

                  {/* Admin entry (admin only) */}
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

      {/* Mobile drawer menu - only show for user side */}
      {shouldShowNavigation && (
        <MobileDrawer
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          navigationItems={visibleNavigationItems}
          brandName="Orris"
        />
      )}

      {/* Main content area */}
      <main className="flex-1 py-6">
        <div className="container mx-auto px-4 sm:px-8 max-w-6xl">
          {/* Enhanced breadcrumb navigation - only show for admin side (not in DashboardLayout unless configured) */}
          {shouldShowBreadcrumbs && <EnhancedBreadcrumbs />}

          {/* Page content */}
          {children}
        </div>
      </main>

      {/* Profile dialog */}
      <ProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </div>
    </TooltipProvider>
  );
};
