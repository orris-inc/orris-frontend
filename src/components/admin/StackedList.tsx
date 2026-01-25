/**
 * Stacked List Component
 * Following Tailwind UI Application UI stacked lists pattern
 * @see https://tailwindcss.com/plus/ui-blocks/application-ui/lists/stacked-lists
 *
 * Features:
 * - Render function pattern for flexible content
 * - Avatar, badge, and actions slots
 * - Loading and empty states
 * - Click/navigation support
 *
 * Mobile-first: optimized touch targets and spacing
 */

import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ListSkeleton } from './Skeleton';

// Item render result type
export interface StackedListItemRender {
  /** Primary text/content */
  primary: ReactNode;
  /** Secondary text (optional) */
  secondary?: ReactNode;
  /** Tertiary info (optional, small text) */
  tertiary?: ReactNode;
  /** Avatar/icon slot (optional) */
  avatar?: ReactNode;
  /** Badge slot (optional, displayed after primary) */
  badge?: ReactNode;
  /** Actions slot (optional, right side) */
  actions?: ReactNode;
}

// Legacy item interface for backward compatibility
export interface StackedListItem {
  id: string | number;
  primary: ReactNode;
  secondary?: ReactNode;
  tertiary?: ReactNode;
  avatar?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  href?: string;
  onClick?: () => void;
}

// Props interface with render function support
export interface StackedListProps<T = StackedListItem> {
  /** Items array */
  items: T[];
  /** Render function for custom items (takes precedence over legacy items) */
  renderItem?: (item: T, index: number) => StackedListItemRender & {
    href?: string;
    onClick?: () => void;
  };
  /** Get unique key for item */
  getKey?: (item: T, index: number) => string | number;
  /** Show dividers between items */
  divided?: boolean;
  /** Enable hover effect */
  hoverable?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Number of skeleton items when loading */
  loadingCount?: number;
  /** Empty state content */
  emptyState?: ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * StackedList Component
 * Displays items in a vertical list with consistent layout
 */
export function StackedList<T = StackedListItem>({
  items,
  renderItem,
  getKey,
  divided = true,
  hoverable = true,
  loading = false,
  loadingCount = 5,
  emptyState,
  className,
}: StackedListProps<T>) {
  // Show skeleton when loading
  if (loading) {
    return (
      <ListSkeleton
        count={loadingCount}
        showAvatar={true}
        showActions={true}
        className={className}
      />
    );
  }

  // Show empty state when no items
  if (items.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <ul
      role="list"
      className={cn(divided && 'divide-y divide-border', className)}
    >
      {items.map((item, index) => {
        const key = getKey ? getKey(item, index) : (item as StackedListItem).id ?? index;

        // Use render function if provided, otherwise treat as legacy StackedListItem
        const renderResult = renderItem
          ? renderItem(item, index)
          : (item as unknown as StackedListItem);

        return (
          <StackedListRow
            key={key}
            {...renderResult}
            hoverable={hoverable}
          />
        );
      })}
    </ul>
  );
}

// Internal row component props
interface StackedListRowProps extends StackedListItemRender {
  href?: string;
  onClick?: () => void;
  hoverable: boolean;
}

function StackedListRow({
  primary,
  secondary,
  tertiary,
  avatar,
  badge,
  actions,
  href,
  onClick,
  hoverable,
}: StackedListRowProps) {
  const content = (
    <div className="flex items-center justify-between gap-x-4 gap-y-2 py-4 sm:py-5 px-4 sm:px-0">
      {/* Left: Avatar + Content */}
      <div className="flex items-center gap-x-4 min-w-0">
        {avatar && <div className="shrink-0">{avatar}</div>}
        <div className="min-w-0 flex-auto">
          <div className="flex items-start gap-x-3">
            <p className="text-sm font-semibold text-foreground truncate">
              {primary}
            </p>
            {badge}
          </div>
          {secondary && (
            <div className="mt-1 flex items-center gap-x-2 text-xs text-muted-foreground">
              {secondary}
            </div>
          )}
          {tertiary && (
            <div className="mt-1 text-xs text-muted-foreground">
              {tertiary}
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      {actions && (
        <div className="flex shrink-0 items-center gap-x-4">
          {actions}
        </div>
      )}
    </div>
  );

  const isClickable = href || onClick;
  const baseClass = cn(
    hoverable && 'hover:bg-muted/50',
    isClickable && 'cursor-pointer',
    (hoverable || isClickable) && 'transition-colors'
  );

  if (href) {
    return (
      <li>
        <Link to={href} className={cn('block', baseClass)}>
          {content}
        </Link>
      </li>
    );
  }

  if (onClick) {
    return (
      <li
        onClick={onClick}
        className={baseClass}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {content}
      </li>
    );
  }

  return (
    <li className={baseClass}>
      {content}
    </li>
  );
}
