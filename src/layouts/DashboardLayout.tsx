/**
 * Dashboard Layout Component
 *
 * User-facing layout following Tailwind Application UI patterns.
 * Features:
 * - Sticky header with logo, navigation, and user actions
 * - Responsive design: collapsed menu on mobile, full nav on desktop
 * - Announcement bell with popover
 * - Clean spacing and consistent styling
 */

import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ViewTransitionLink } from '@/components/common/ViewTransitionLink';
import {
  Menu,
  Globe,
  Bell,
  Megaphone,
  Wrench,
  Sparkles,
  Gift,
  Info,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';
import { TooltipProvider } from '@/components/common/Tooltip';
import * as PopoverPrimitive from '@radix-ui/react-popover';

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
import {
  listPublicAnnouncements,
  markAnnouncementAsRead,
  getAnnouncementUnreadCount,
} from '@/api/notification';
import { queryKeys } from '@/shared/lib/query-client';
import { formatRelativeTime } from '@/shared/utils/date-utils';
import type { Announcement, AnnouncementType } from '@/api/notification/types';
import { usePublicBranding } from '@/features/settings';

// ============================================================================
// Announcement Bell Component
// ============================================================================

interface AnnouncementBellProps {
  className?: string;
}

function AnnouncementBell({ className }: AnnouncementBellProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Lightweight query for unread count only (always enabled)
  const { data: unreadData } = useQuery({
    queryKey: queryKeys.announcements.unreadCount(),
    queryFn: getAnnouncementUnreadCount,
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });

  const unreadCount = unreadData?.count ?? 0;

  // Full list query - only fetch when popover is open
  const { data: announcementsData, isLoading } = useQuery({
    queryKey: queryKeys.announcements.public({ page: 1, pageSize: 10 }),
    queryFn: () => listPublicAnnouncements({ page: 1, pageSize: 10 }),
    enabled: open, // Lazy load when popover opens
  });

  const announcements = announcementsData?.items ?? [];
  const selectedAnnouncement = selectedId
    ? announcements.find((a) => a.id === selectedId)
    : null;

  // Mark single announcement as read mutation
  const markReadMutation = useMutation({
    mutationFn: markAnnouncementAsRead,
    onSuccess: () => {
      // Invalidate both unread count and public list
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.unreadCount() });
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.public() });
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) setSelectedId(null);
  };

  // Handle clicking on an announcement item
  const handleAnnouncementClick = (announcement: Announcement) => {
    setSelectedId(announcement.id);
    // Mark as read if unread
    if (!announcement.isRead && isAuthenticated) {
      markReadMutation.mutate(announcement.id);
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'relative flex items-center justify-center',
            'size-9 rounded-lg',
            'text-muted-foreground',
            'transition-colors duration-150',
            'hover:bg-accent hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className
          )}
          aria-label={t('user.dashboard.announcements.title')}
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5',
                'min-w-[18px] h-[18px] px-1',
                'flex items-center justify-center',
                'text-[10px] font-semibold text-white',
                'bg-destructive rounded-full',
                'ring-2 ring-background'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={cn(
            'z-50 w-80 sm:w-96 overflow-hidden',
            'rounded-xl border border-border bg-popover shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2'
          )}
          align="end"
          sideOffset={8}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {t('user.dashboard.announcements.title')}
              </span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-semibold text-primary-foreground bg-primary rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <PopoverPrimitive.Close asChild>
              <button
                type="button"
                className={cn(
                  'flex items-center justify-center',
                  'size-7 rounded-md',
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-accent transition-colors'
                )}
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </PopoverPrimitive.Close>
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto overscroll-contain">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
              </div>
            )}

            {!isLoading && announcements.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Bell className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {t('user.dashboard.announcements.empty')}
                </p>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {t('user.dashboard.announcements.emptyHint', {
                    defaultValue: "You're all caught up!",
                  })}
                </p>
              </div>
            )}

            {!isLoading && selectedAnnouncement && (
              <NotificationDetail
                announcement={selectedAnnouncement}
                onBack={() => setSelectedId(null)}
              />
            )}

            {!isLoading && announcements.length > 0 && !selectedAnnouncement && (
              <div className="divide-y divide-border">
                {announcements.map((item) => (
                  <NotificationItem
                    key={item.id}
                    announcement={item}
                    onClick={() => handleAnnouncementClick(item)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!isLoading && announcements.length > 0 && !selectedAnnouncement && (
            <div className="border-t border-border px-4 py-2.5">
              <button
                type="button"
                className={cn(
                  'w-full flex items-center justify-center gap-1.5',
                  'text-sm font-medium text-primary',
                  'hover:text-primary/80 transition-colors'
                )}
                onClick={() => setOpen(false)}
              >
                {t('common.actions.viewAll', { defaultValue: 'View all' })}
                <ExternalLink className="size-3.5" />
              </button>
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

// ============================================================================
// Notification Item
// ============================================================================

interface NotificationItemProps {
  announcement: Announcement;
  onClick: () => void;
}

function NotificationItem({ announcement, onClick }: NotificationItemProps) {
  const { bgColor, textColor } = getAnnouncementColors(announcement.type);
  const isUnread = !announcement.isRead;
  const IconComponent = ANNOUNCEMENT_ICONS[announcement.type] ?? Megaphone;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-full flex items-start gap-3 p-4 text-left',
        'transition-colors duration-150',
        'hover:bg-accent/50',
        'focus:outline-none focus:bg-accent/50',
        isUnread && 'bg-accent/30'
      )}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full" />
      )}

      <div
        className={cn(
          'shrink-0 size-10 rounded-full flex items-center justify-center',
          bgColor
        )}
      >
        <IconComponent className={cn('size-5', textColor)} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm text-foreground line-clamp-1',
            isUnread ? 'font-semibold' : 'font-medium'
          )}
        >
          {announcement.title}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
          {announcement.content}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full',
              'text-[10px] font-medium uppercase tracking-wide',
              bgColor,
              textColor
            )}
          >
            {announcement.type}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(announcement.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// Notification Detail
// ============================================================================

interface NotificationDetailProps {
  announcement: Announcement;
  onBack: () => void;
}

function NotificationDetail({ announcement, onBack }: NotificationDetailProps) {
  const { t } = useTranslation();
  const { bgColor, textColor } = getAnnouncementColors(announcement.type);
  const IconComponent = ANNOUNCEMENT_ICONS[announcement.type] ?? Megaphone;

  return (
    <div className="p-4">
      <button
        type="button"
        onClick={onBack}
        className={cn(
          'inline-flex items-center gap-1 mb-4',
          'text-sm font-medium text-primary',
          'hover:text-primary/80 transition-colors'
        )}
      >
        ← {t('common.actions.back')}
      </button>

      <div className="flex items-start gap-3 mb-4">
        <div
          className={cn(
            'shrink-0 size-12 rounded-full flex items-center justify-center',
            bgColor
          )}
        >
          <IconComponent className={cn('size-6', textColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground">
            {announcement.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full',
                'text-[10px] font-medium uppercase tracking-wide',
                bgColor,
                textColor
              )}
            >
              {announcement.type}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(announcement.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="text-sm text-foreground/90 leading-relaxed">
        {announcement.contentHtml ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: announcement.contentHtml }}
          />
        ) : (
          <p className="whitespace-pre-wrap">{announcement.content}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

// Static icon map to avoid creating components during render
const ANNOUNCEMENT_ICONS: Record<AnnouncementType, typeof Info> = {
  system: Info,
  maintenance: Wrench,
  feature: Sparkles,
  promotion: Gift,
};

function getAnnouncementColors(type: AnnouncementType): {
  bgColor: string;
  textColor: string;
} {
  const colors: Record<AnnouncementType, { bgColor: string; textColor: string }> = {
    system: {
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    maintenance: {
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
    feature: {
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    promotion: {
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
  };
  return colors[type] || { bgColor: 'bg-muted', textColor: 'text-muted-foreground' };
}

// ============================================================================
// Lazy Components
// ============================================================================

const MobileDrawer = lazy(() =>
  import('@/components/navigation/MobileDrawer').then((m) => ({
    default: m.MobileDrawer,
  }))
);

// ============================================================================
// Dashboard Layout
// ============================================================================

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
  const { appName, logoUrl, isLoading: isBrandingLoading } = usePublicBranding();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navItems = getNavItems();
  const userOnlyNavItems = navItems.filter((item) => !item.path.startsWith('/admin'));
  const visibleNavigationItems = filterNavigationByPermission(userOnlyNavItems);

  const shouldShowBreadcrumbs = false;

  const handleLogout = async () => {
    await logout();
  };

  const handleGoToAdmin = () => {
    navigate('/admin');
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-viewport bg-background">
        {/* Header */}
        <header
          className={cn(
            'sticky top-0 z-40',
            'border-b border-border bg-background/95 backdrop-blur-sm',
            'supports-[backdrop-filter]:bg-background/80',
            'pt-[env(safe-area-inset-top)]'
          )}
        >
          <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <ViewTransitionLink
              to="/"
              className="flex items-center gap-2.5 shrink-0"
            >
              {isBrandingLoading ? (
                <>
                  <div className="size-8 rounded-lg bg-muted animate-pulse" />
                  <div className="h-5 w-16 bg-muted animate-pulse rounded hidden sm:block" />
                </>
              ) : (
                <>
                  {logoUrl ? (
                    <img src={logoUrl} alt={appName || 'Logo'} className="h-8 w-auto" />
                  ) : (
                    <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                      <Globe className="size-5 text-primary-foreground" />
                    </div>
                  )}
                  <span className="text-lg font-semibold text-foreground hidden sm:block">
                    {appName || 'Orris'}
                  </span>
                </>
              )}
            </ViewTransitionLink>

            {/* Desktop Navigation */}
            <DesktopNav
              navigationItems={visibleNavigationItems}
              className="hidden md:flex ml-8"
            />

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right Actions - Desktop */}
            <div className="hidden md:flex items-center gap-1">
              <LanguageSwitcher />
              <ThemeToggle />
              <AnnouncementBell />

              {/* Divider */}
              <div className="mx-3 h-6 w-px bg-border" />

              {/* User Info + Menu */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-medium text-foreground leading-none">
                    {user?.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {user?.email}
                  </p>
                </div>
                <UserMenu
                  user={user}
                  showAdminSwitch={userRole === 'admin'}
                  onProfileClick={() => navigate('/dashboard/profile')}
                  onAdminClick={handleGoToAdmin}
                  onLogout={handleLogout}
                />
              </div>
            </div>

            {/* Right Actions - Mobile */}
            <div className="flex items-center gap-1 md:hidden">
              <AnnouncementBell />
              <button
                type="button"
                className={cn(
                  'flex items-center justify-center',
                  'size-9 rounded-lg',
                  'text-foreground',
                  'hover:bg-accent',
                  'transition-colors'
                )}
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileDrawerOpen && (
          <Suspense fallback={null}>
            <MobileDrawer
              open={mobileDrawerOpen}
              onClose={() => setMobileDrawerOpen(false)}
              navigationItems={visibleNavigationItems}
              user={user}
              showAdminSwitch={userRole === 'admin'}
              serverVersion={serverVersion ?? undefined}
              clientVersion={clientVersion}
              onAdminClick={handleGoToAdmin}
              onLogout={handleLogout}
            />
          </Suspense>
        )}

        {/* Main Content */}
        <main
          className="flex-1 pb-safe py-6"
          data-view-transition="content"
        >
          <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {shouldShowBreadcrumbs && <EnhancedBreadcrumbs />}

            {/* Page Header */}
            {(pageTitle || pageDescription || pageActions) && (
              <div className="mb-6 pb-4 border-b border-border">
                <div
                  className={cn(
                    inlineActionsOnMobile
                      ? 'flex items-center justify-between gap-4'
                      : 'sm:flex sm:items-end sm:justify-between'
                  )}
                >
                  <div className="min-w-0">
                    {pageTitle && (
                      <h1 className="text-2xl font-semibold text-foreground">
                        {pageTitle}
                      </h1>
                    )}
                    {pageDescription && (
                      <div className="mt-1 text-sm text-muted-foreground max-w-2xl">
                        {pageDescription}
                      </div>
                    )}
                  </div>
                  {pageActions && (
                    <div
                      className={cn(
                        'flex items-center gap-2 shrink-0',
                        !inlineActionsOnMobile && 'mt-4 sm:mt-0'
                      )}
                    >
                      {pageActions}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Page Content */}
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};
