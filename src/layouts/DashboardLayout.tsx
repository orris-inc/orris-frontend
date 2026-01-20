/**
 * Dashboard Layout Component
 * Contains top navigation bar, Tabs navigation, and main content area
 */

import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { ViewTransitionLink } from '@/components/common/ViewTransitionLink';
import { Menu, Globe } from 'lucide-react';
import { TooltipProvider } from '@/components/common/Tooltip';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DesktopNav } from '@/components/navigation/DesktopNav';
import { UserMenu } from '@/components/navigation/UserMenu';
import { EnhancedBreadcrumbs } from '@/components/navigation/EnhancedBreadcrumbs';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { getNavItems } from '@/config/navigation';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { useBreakpoint, useVersionInfo } from '@/hooks';
import { cn } from '@/lib/utils';

// Lazy load dialogs and drawers (only needed on interaction)
const ProfileDialog = lazy(() =>
  import('@/features/profile/components/ProfileDialog').then((m) => ({
    default: m.ProfileDialog,
  }))
);
const MobileDrawer = lazy(() =>
  import('@/components/navigation/MobileDrawer').then((m) => ({
    default: m.MobileDrawer,
  }))
);

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { filterNavigationByPermission, userRole } = usePermissions();
  const { isMobile } = useBreakpoint();
  const { serverVersion, clientVersion } = useVersionInfo();

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
    <div className="flex min-h-viewport flex-col bg-background overflow-x-hidden">
      {/* iOS-style Navigation Bar */}
      <header
        className={cn(
          'z-40 w-full border-b',
          // Mobile: fixed positioning for reliable header pinning (CSS-based, no JS hydration delay)
          // Desktop: sticky is fine since no overflow issues
          'fixed top-0 left-0 right-0 md:sticky md:left-auto md:right-auto',
          // iOS glass background for mobile, standard background for desktop
          'glass-elevated border-border/50 pt-[env(safe-area-inset-top)]',
          'md:pt-0 md:border-border md:bg-background/95 md:backdrop-blur md:supports-[backdrop-filter]:bg-background/60'
        )}
      >
        <div
          className={cn(
            'mx-auto flex items-center',
            // iOS standard height (44px) for mobile, 56px for desktop
            isMobile ? 'h-11 px-2' : 'max-w-6xl h-14 px-4 sm:px-6'
          )}
        >
          {/* Mobile: iOS-style layout with centered logo */}
          {isMobile ? (
            <>
              {/* Left section - menu button */}
              <div className="w-11 flex-shrink-0">
                {shouldShowNavigation && (
                  <button
                    className={cn(
                      'flex items-center justify-center',
                      'size-11',
                      'rounded-full',
                      'text-primary',
                      'active:bg-foreground/5',
                      'transition-colors motion-reduce:transition-none'
                    )}
                    onClick={() => setMobileDrawerOpen(true)}
                    aria-label="Open menu"
                  >
                    <Menu className="size-[22px]" strokeWidth={2} />
                  </button>
                )}
              </div>

              {/* Center section - brand logo */}
              <div className="flex-1 flex justify-center">
                <ViewTransitionLink to="/" className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                    <Globe className="size-5 text-primary-foreground" />
                  </div>
                  <span className="text-[17px] font-semibold">Orris</span>
                </ViewTransitionLink>
              </div>

              {/* Right section - user menu */}
              <div className="w-11 flex-shrink-0 flex justify-end">
                <UserMenu
                  user={user}
                  showAdminSwitch={userRole === 'admin'}
                  onProfileClick={() => setProfileDialogOpen(true)}
                  onNotificationsClick={() => navigate('/dashboard/notifications')}
                  onAdminClick={handleGoToAdmin}
                  onLogout={handleLogout}
                />
              </div>
            </>
          ) : (
            /* Desktop: standard layout */
            <>
              {/* Logo/Brand */}
              <ViewTransitionLink to="/" className="mr-4 flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                  <Globe className="size-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold">Orris</span>
              </ViewTransitionLink>

              {/* Desktop navigation links */}
              {shouldShowNavigation && (
                <DesktopNav navigationItems={visibleNavigationItems} />
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Theme toggle, language switcher and user menu */}
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <ThemeToggle />

                <div className="text-right">
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
            </>
          )}
        </div>
      </header>

      {/* Lazy-loaded mobile drawer - only render on mobile */}
      {shouldShowNavigation && isMobile && (
        <Suspense fallback={null}>
          <MobileDrawer
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            navigationItems={visibleNavigationItems}
            brandName="Orris"
            user={user}
            showAdminSwitch={userRole === 'admin'}
            serverVersion={serverVersion ?? undefined}
            clientVersion={clientVersion}
            onAdminClick={handleGoToAdmin}
            onLogout={handleLogout}
          />
        </Suspense>
      )}

      {/* Main content area */}
      <main
        className={cn(
          "flex-1 overflow-x-hidden pb-safe",
          // Mobile: add top padding to account for fixed header (44px + safe-area)
          // CSS-based responsive padding, no JS dependency
          "py-4 pt-[calc(2.75rem+env(safe-area-inset-top)+1rem)] md:pt-4 sm:py-6"
        )}
        data-view-transition="content"
      >
        <div className="mx-auto px-4 sm:px-6 max-w-6xl w-full">
          {/* Enhanced breadcrumb navigation - only show for admin side (not in DashboardLayout unless configured) */}
          {shouldShowBreadcrumbs && <EnhancedBreadcrumbs />}

          {/* Page content */}
          <div className="min-w-0">
            {children}
          </div>
        </div>
      </main>

      {/* Lazy-loaded profile dialog - only render when opened */}
      {profileDialogOpen && (
        <Suspense fallback={null}>
          <ProfileDialog
            open={profileDialogOpen}
            onClose={() => setProfileDialogOpen(false)}
          />
        </Suspense>
      )}
    </div>
    </TooltipProvider>
  );
};
