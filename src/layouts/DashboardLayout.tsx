/**
 * Dashboard Layout Component
 * Contains top navigation bar, Tabs navigation, and main content area
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Menu } from 'lucide-react';
import { TooltipProvider } from '@/components/common/Tooltip';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProfileDialog } from '@/features/profile/components/ProfileDialog';
import { MobileDrawer } from '@/components/navigation/MobileDrawer';
import { DesktopNav } from '@/components/navigation/DesktopNav';
import { UserMenu } from '@/components/navigation/UserMenu';
import { EnhancedBreadcrumbs } from '@/components/navigation/EnhancedBreadcrumbs';
import { ThemeToggle } from '@/components/common/ThemeToggle';
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

          {/* Theme toggle and user menu */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium leading-none">{user?.displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>

            <UserMenu
              user={user}
              showAdminSwitch={userRole === 'admin'}
              onProfileClick={() => setProfileDialogOpen(true)}
              onNotificationsClick={() => navigate('/dashboard/notifications')}
              onAdminClick={handleGoToAdmin}
              onLogout={handleLogout}
            />
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
