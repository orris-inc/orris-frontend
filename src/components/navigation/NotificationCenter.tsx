/**
 * NotificationCenter Component
 *
 * Bell icon with notification dropdown for admin header.
 * Features:
 * - Bell icon with unread count badge
 * - Popover dropdown with notification list
 * - Mark as read / Mark all as read
 * - Filter tabs (All / Unread / System)
 * - Type-based icons with colors
 * - Delete notification action
 * - Empty state handling
 * - Responsive touch targets
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Trash2,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/common/Popover';
import { formatRelativeTime } from '@/shared/utils/date-utils';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'system';

export type NotificationCategory = 'all' | 'unread' | 'system';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  type: NotificationType;
  category?: 'system' | 'general';
  link?: string;
  actionUrl?: string;
  actionLabel?: string;
  dismissible?: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
  className?: string;
}

// ============================================================================
// Type Icon Mapping
// ============================================================================

interface NotificationIconConfig {
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}

const getNotificationIcon = (type: NotificationType): NotificationIconConfig => {
  const config: Record<NotificationType, NotificationIconConfig> = {
    info: {
      icon: Info,
      bgColor: 'bg-info/10',
      iconColor: 'text-info',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-destructive/10',
      iconColor: 'text-destructive',
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-success/10',
      iconColor: 'text-success',
    },
    system: {
      icon: Settings,
      bgColor: 'bg-muted',
      iconColor: 'text-muted-foreground',
    },
  };
  return config[type];
};

// ============================================================================
// Filter Tabs Component
// ============================================================================

interface FilterTabsProps {
  activeFilter: NotificationCategory;
  onFilterChange: (filter: NotificationCategory) => void;
  unreadCount: number;
  systemCount: number;
}

const FilterTabs = ({
  activeFilter,
  onFilterChange,
  unreadCount,
  systemCount,
}: FilterTabsProps) => {
  const { t } = useTranslation();

  const tabs: { id: NotificationCategory; labelKey: string; count?: number }[] = [
    { id: 'all', labelKey: 'notificationCenter.filters.all' },
    { id: 'unread', labelKey: 'notificationCenter.filters.unread', count: unreadCount },
    { id: 'system', labelKey: 'notificationCenter.filters.system', count: systemCount },
  ];

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onFilterChange(tab.id)}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-medium',
            'transition-colors motion-reduce:transition-none',
            activeFilter === tab.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
        >
          {t(tab.labelKey)}
          {tab.count !== undefined && tab.count > 0 && (
            <span
              className={cn(
                'ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                activeFilter === tab.id
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {tab.count > 99 ? '99+' : tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// Notification Item
// ============================================================================

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const iconConfig = getNotificationIcon(notification.type);
  const IconComponent = iconConfig.icon;

  const handleActionClick = () => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const hasActions =
    (!notification.read && onMarkAsRead) ||
    ((notification.dismissible ?? true) && onDelete);

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 px-4 py-3',
        'hover:bg-accent/50 transition-colors',
        'motion-reduce:transition-none',
        // Focus-within for keyboard navigation
        'focus-within:bg-accent/50',
        !notification.read && 'bg-accent/30'
      )}
    >
      {/* Type icon */}
      <div
        className={cn(
          'shrink-0 size-8 rounded-full flex items-center justify-center',
          iconConfig.bgColor
        )}
      >
        <IconComponent className={cn('size-4', iconConfig.iconColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <SmartTruncate
            text={notification.title}
            className={cn(
              'text-sm font-medium',
              notification.read ? 'text-muted-foreground' : 'text-foreground'
            )}
          />
          {!notification.read && (
            <span
              className="shrink-0 size-2 rounded-full bg-primary mt-1.5"
              aria-label={t('notificationCenter.unread')}
            />
          )}
        </div>
        <div className="mt-0.5">
          <SmartTruncate
            text={notification.message}
            className="text-sm text-muted-foreground"
            maxLines={2}
          />
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <p className="text-xs text-muted-foreground/70">
            {formatRelativeTime(notification.createdAt.toISOString())}
          </p>
          {notification.actionUrl && notification.actionLabel && (
            <button
              type="button"
              onClick={handleActionClick}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              {notification.actionLabel}
            </button>
          )}
        </div>
      </div>

      {/* Actions - always visible on mobile, hover/focus on desktop */}
      {hasActions && (
        <div
          className={cn(
            'shrink-0 flex items-center gap-1',
            // Mobile: always visible, Desktop: show on hover/focus
            'opacity-100 md:opacity-0',
            'md:group-hover:opacity-100 md:group-focus-within:opacity-100',
            'transition-opacity motion-reduce:transition-none'
          )}
        >
          {/* Mark as read button */}
          {!notification.read && onMarkAsRead && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className={cn(
                'p-1.5 rounded-md',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-accent active:bg-accent/80',
                'transition-colors motion-reduce:transition-none',
                'touch-target',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'flex items-center justify-center'
              )}
              aria-label={t('notificationCenter.markAsRead')}
            >
              <Check className="size-3.5" />
            </button>
          )}

          {/* Delete button */}
          {(notification.dismissible ?? true) && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className={cn(
                'p-1.5 rounded-md',
                'text-muted-foreground hover:text-destructive',
                'hover:bg-destructive/10 active:bg-destructive/20',
                'transition-colors motion-reduce:transition-none',
                'touch-target',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'flex items-center justify-center'
              )}
              aria-label={t('notificationCenter.delete')}
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// NotificationCenter Component
// ============================================================================

export const NotificationCenter = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  className,
}: NotificationCenterProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationCategory>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const systemCount = notifications.filter(
    (n) => n.category === 'system' || n.type === 'system'
  ).length;

  // Filter notifications based on active filter
  const filteredNotifications = notifications.filter((n) => {
    switch (activeFilter) {
      case 'unread':
        return !n.read;
      case 'system':
        return n.category === 'system' || n.type === 'system';
      default:
        return true;
    }
  });

  // Handle view all click
  const handleViewAll = () => {
    setOpen(false);
    navigate('/admin/announcements');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'relative flex items-center justify-center',
            'size-9 rounded-md',
            'text-muted-foreground hover:text-foreground',
            'hover:bg-accent active:bg-accent/80',
            'transition-colors motion-reduce:transition-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className
          )}
          aria-label={
            unreadCount > 0
              ? t('notificationCenter.unreadCount', { count: unreadCount })
              : t('notificationCenter.noUnread')
          }
        >
          <Bell className="size-5" />
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5',
                'min-w-[18px] h-[18px] px-1',
                'flex items-center justify-center',
                'text-[10px] font-medium text-white',
                'bg-destructive rounded-full',
                'ring-2 ring-background'
              )}
              aria-hidden="true"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn(
          'w-80 sm:w-96 p-0',
          'max-h-[400px] overflow-hidden',
          'flex flex-col'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            {t('notificationCenter.title')}
          </h3>
          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md',
                'text-xs text-muted-foreground hover:text-foreground',
                'hover:bg-accent transition-colors',
                'motion-reduce:transition-none'
              )}
            >
              <CheckCheck className="size-3.5" />
              {t('notificationCenter.markAllAsRead')}
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <FilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          unreadCount={unreadCount}
          systemCount={systemCount}
        />

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-border">
          {filteredNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto size-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {activeFilter === 'all'
                  ? t('notificationCenter.empty')
                  : t('notificationCenter.emptyFiltered')}
              </p>
            </div>
          ) : (
            filteredNotifications.slice(0, 5).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border">
            <button
              type="button"
              onClick={handleViewAll}
              className={cn(
                'w-full flex items-center justify-center gap-2',
                'px-4 py-2.5',
                'text-sm text-primary hover:text-primary/80',
                'hover:bg-accent/50 transition-colors',
                'motion-reduce:transition-none',
                'min-h-[44px]' // Touch target
              )}
            >
              {t('notificationCenter.viewAll')}
              <ExternalLink className="size-3.5" />
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export type { NotificationCenterProps };
