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
import { useVersionInfo } from '@/hooks';
import { cn } from '@/lib/utils';

// Lazy load drawers (only needed on interaction)
const MobileDrawer = lazy(() =>
  import('@/components/navigation/MobileDrawer').then((m) => ({
    default: m.MobileDrawer,
  }))
);

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageDescription?: React.ReactNode;
  pageActions?: React.ReactNode;
  inlineActionsOnMobile?: boolean;
}

export const DashboardLayout = ({
  children,
  pageTitle,
  pageDescription,
  pageActions,
  inlineActionsOnMobile = false,
}: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { filterNavigationByPermission, userRole } = usePermissions();
  const { serverVersion, clientVersion } = useVersionInfo();

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
    <div className="flex min-h-viewport flex-col bg-background">
      {/* iOS-style Navigation Bar */}
      <header
        className={cn(
          'z-40 w-full border-b border-border/60 bg-background',
          // Standard sticky header across breakpoints
          'sticky top-0',
          // Safe-area padding for mobile
          'pt-[env(safe-area-inset-top)]'
        )}
      >
        <div
          className={cn(
            'mx-auto flex items-center',
            'h-16 w-full',
            'px-4 sm:px-6 lg:px-8',
            'max-w-7xl'
          )}
        >
          <div className="flex items-center gap-2">
            <ViewTransitionLink to="/" className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                <Globe className="size-5 text-primary-foreground" />
              </div>
              <span className="text-[17px] font-semibold md:text-lg">Orris</span>
            </ViewTransitionLink>
          </div>

          {/* Desktop navigation links */}
          {shouldShowNavigation && (
            <div className="hidden md:ml-8 md:block">
              <DesktopNav navigationItems={visibleNavigationItems} />
            </div>
          )}

          {/* Right section - actions */}
          <div className="ml-auto flex items-center gap-2 md:gap-4">
            {/* Mobile actions */}
            <div className="flex items-center gap-1 md:hidden">
              {shouldShowNavigation && (
                <button
                  className={cn(
                    'flex items-center justify-center',
                    'size-10',
                    'rounded-full',
                    'text-primary',
                    'hover:bg-foreground/5',
                    'active:bg-foreground/10',
                    'transition-colors motion-reduce:transition-none'
                  )}
                  onClick={() => setMobileDrawerOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="size-[22px]" strokeWidth={2} />
                </button>
              )}
            <UserMenu
              user={user}
              showAdminSwitch={userRole === 'admin'}
              onHomeClick={() => navigate('/')}
              onProfileClick={() => navigate('/dashboard/profile')}
              onNotificationsClick={() => navigate('/dashboard/notifications')}
              onAdminClick={handleGoToAdmin}
              onLogout={handleLogout}
            />
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex md:items-center md:gap-4">
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>

              <div className="h-6 w-px bg-border/60" />

              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>

              <UserMenu
                user={user}
                showAdminSwitch={userRole === 'admin'}
                onHomeClick={() => navigate('/')}
                onProfileClick={() => navigate('/dashboard/profile')}
                onNotificationsClick={() => navigate('/dashboard/notifications')}
                onAdminClick={handleGoToAdmin}
                onLogout={handleLogout}
              />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Lazy-loaded mobile drawer - renders when open */}
      {shouldShowNavigation && mobileDrawerOpen && (
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
          // Standard page spacing
          "py-6"
        )}
        data-view-transition="content"
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl w-full">
          {/* Enhanced breadcrumb navigation - only show for admin side (not in DashboardLayout unless configured) */}
          {shouldShowBreadcrumbs && <EnhancedBreadcrumbs />}

          {(pageTitle || pageDescription || pageActions) && (
            <div className="mb-5 border-b border-border/60 pb-3">
              <div
                className={cn(
                  inlineActionsOnMobile
                    ? 'flex items-center justify-between gap-3'
                    : 'sm:flex sm:items-end sm:justify-between'
                )}
              >
                <div className="space-y-1 min-w-0">
                  {pageTitle && (
                    <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                      {pageTitle}
                    </h1>
                  )}
                  {pageDescription && (
                    <div className="text-xs text-muted-foreground leading-snug space-y-1 max-w-2xl">
                      {pageDescription}
                    </div>
                  )}
                </div>
                {pageActions && (
                  <div
                    className={cn(
                      inlineActionsOnMobile
                        ? 'flex items-center justify-end gap-2'
                        : 'mt-3 flex flex-wrap items-center gap-2 sm:mt-0 sm:ml-4',
                      '[&>a]:min-w-[96px] [&>button]:min-w-[96px] [&>a]:justify-center [&>button]:justify-center'
                    )}
                  >
                    {pageActions}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Page content */}
          <div className="min-w-0">
            {children}
          </div>
        </div>
      </main>

    </div>
    </TooltipProvider>
  );
};
