/**
 * ActivityFeed Component
 *
 * Vertical timeline component for displaying activity history.
 * Features:
 * - Vertical timeline with connecting lines
 * - Activity type icons (8 types)
 * - User avatars with optional badge indicators
 * - Relative timestamps
 * - Optional action buttons
 * - Loading skeleton state
 * - Empty state handling
 */

import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  RefreshCw,
  UserPlus,
  Tag,
  Settings,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/shared/utils/date-utils';
import type { Activity, ActivityType, ActivityIconConfig } from '@/types/activity.types';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ActivityFeedProps {
  activities: Activity[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

// ============================================================================
// Icon Configuration
// ============================================================================

const activityIconConfig: Record<ActivityType, ActivityIconConfig> = {
  comment: {
    icon: MessageSquare,
    bgColor: 'bg-info',
    iconColor: 'text-white',
  },
  status: {
    icon: RefreshCw,
    bgColor: 'bg-warning',
    iconColor: 'text-white',
  },
  assignment: {
    icon: UserPlus,
    bgColor: 'bg-relay',
    iconColor: 'text-white',
  },
  tag: {
    icon: Tag,
    bgColor: 'bg-destructive',
    iconColor: 'text-white',
  },
  system: {
    icon: Settings,
    bgColor: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
  create: {
    icon: Plus,
    bgColor: 'bg-success',
    iconColor: 'text-white',
  },
  update: {
    icon: Pencil,
    bgColor: 'bg-info',
    iconColor: 'text-white',
  },
  delete: {
    icon: Trash2,
    bgColor: 'bg-destructive',
    iconColor: 'text-white',
  },
};

const getActivityIcon = (type: ActivityType): { Icon: LucideIcon; config: ActivityIconConfig } => {
  const config = activityIconConfig[type] || activityIconConfig.system;
  return { Icon: config.icon, config };
};

// ============================================================================
// User Avatar Component
// ============================================================================

interface UserAvatarProps {
  user?: Activity['user'];
  activityType: ActivityType;
  size?: 'sm' | 'md';
}

const UserAvatar = ({ user, activityType, size = 'md' }: UserAvatarProps) => {
  const { Icon, config } = getActivityIcon(activityType);
  const sizeClasses = size === 'sm' ? 'size-6' : 'size-8';
  const iconSizeClasses = size === 'sm' ? 'size-3' : 'size-4';

  // If no user, show activity icon
  if (!user) {
    return (
      <div
        className={cn(
          'shrink-0 rounded-full flex items-center justify-center',
          sizeClasses,
          config.bgColor
        )}
      >
        <Icon className={cn(iconSizeClasses, config.iconColor)} />
      </div>
    );
  }

  // Show user avatar with activity type indicator
  return (
    <div className="relative shrink-0">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className={cn('rounded-full object-cover', sizeClasses)}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-muted flex items-center justify-center',
            'text-xs font-medium text-muted-foreground',
            sizeClasses
          )}
        >
          {user.initials || user.name.charAt(0).toUpperCase()}
        </div>
      )}
      {/* Activity type indicator badge */}
      <div
        className={cn(
          'absolute -bottom-0.5 -right-0.5',
          'size-4 rounded-full flex items-center justify-center',
          'ring-2 ring-background',
          config.bgColor
        )}
      >
        <Icon className={cn('size-2.5', config.iconColor)} />
      </div>
    </div>
  );
};

// ============================================================================
// Activity Item Component
// ============================================================================

interface ActivityItemProps {
  activity: Activity;
  isLast: boolean;
}

const ActivityItem = ({ activity, isLast }: ActivityItemProps) => {
  return (
    <li className="relative flex gap-3">
      {/* Timeline connector line */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-4 top-10 -bottom-6',
            'w-px bg-border',
            '-translate-x-1/2'
          )}
          aria-hidden="true"
        />
      )}

      {/* Avatar / Icon */}
      <UserAvatar user={activity.user} activityType={activity.type} />

      {/* Content */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-foreground">
              {activity.user && (
                <span className="font-medium">{activity.user.name}</span>
              )}{' '}
              <span className="text-muted-foreground">{activity.title}</span>
            </p>
            {activity.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>

          {/* Timestamp */}
          <time
            className="shrink-0 text-xs text-muted-foreground whitespace-nowrap"
            dateTime={activity.createdAt}
          >
            {formatRelativeTime(activity.createdAt)}
          </time>
        </div>

        {/* Optional action */}
        {activity.action && (
          <div className="mt-2">
            {activity.action.href && /^(https?:\/\/|\/(?!\/))/.test(activity.action.href) ? (
              <a
                href={activity.action.href}
                className={cn(
                  'inline-flex items-center gap-1',
                  'text-xs font-medium text-primary hover:text-primary/80',
                  'transition-colors'
                )}
              >
                {activity.action.label}
              </a>
            ) : (
              <button
                type="button"
                onClick={activity.action.onClick}
                className={cn(
                  'inline-flex items-center gap-1',
                  'text-xs font-medium text-primary hover:text-primary/80',
                  'transition-colors'
                )}
              >
                {activity.action.label}
              </button>
            )}
          </div>
        )}

        {/* Optional metadata */}
        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(activity.metadata).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground"
              >
                <span className="font-medium">{key}:</span>
                <span className="ml-1">{value}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
};

// ============================================================================
// Loading Skeleton
// ============================================================================

const ActivityFeedSkeleton = () => {
  return (
    <ul className="space-y-0">
      {[1, 2, 3].map((i) => (
        <li key={i} className="relative flex gap-3 animate-pulse">
          {/* Timeline line */}
          {i < 3 && (
            <div
              className="absolute left-4 top-10 -bottom-6 w-px bg-border -translate-x-1/2"
              aria-hidden="true"
            />
          )}

          {/* Avatar skeleton */}
          <div className="shrink-0 size-8 rounded-full bg-muted" />

          {/* Content skeleton */}
          <div className="flex-1 pb-6">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
              <div className="h-3 bg-muted rounded w-16 shrink-0" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  message?: string;
}

const EmptyState = ({ message }: EmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="py-8 text-center">
      <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <RefreshCw className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        {message || t('activityFeed.empty')}
      </p>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ActivityFeed = ({
  activities,
  isLoading = false,
  emptyMessage,
  className,
}: ActivityFeedProps) => {
  if (isLoading) {
    return (
      <div className={cn('flow-root', className)}>
        <ActivityFeedSkeleton />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={cn('flow-root', className)}>
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={cn('flow-root', className)}>
      <ul className="space-y-0" role="list">
        {activities.map((activity, index) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            isLast={index === activities.length - 1}
          />
        ))}
      </ul>
    </div>
  );
};

export type { ActivityFeedProps };
