/**
 * MobileListContainer - Generic container for mobile lists
 *
 * Tailwind Application UI style:
 * - Loading skeleton with consistent styling
 * - Empty state (normal and filtered)
 * - List rendering with divide-y style
 * - Modern rounded corners and borders
 * - Optional drag support
 */

import { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Filter } from 'lucide-react';
import { DraggableMobileList } from '@/components/admin/DraggableMobileList';
import { MobileEmptyState } from './MobileEmptyState';
import { MobileListSkeleton } from './MobileListSkeleton';
import { mobileListContainerStyles } from '@/lib/ui-styles';

export interface MobileListContainerProps<T> {
  /** Items to render */
  items: T[];
  /** Whether data is loading */
  loading?: boolean;
  /** Whether any filter is active */
  hasFilter?: boolean;

  // Empty state props
  /** Icon for empty state */
  emptyIcon: LucideIcon;
  /** Title for empty state */
  emptyTitle: string;
  /** Description for empty state */
  emptyDescription?: string;
  /** Action for empty state */
  emptyAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: 'primary' | 'secondary';
  };
  /** Title for filtered empty state (default: uses filter icon) */
  filterEmptyTitle?: string;
  /** Description for filtered empty state */
  filterEmptyDescription?: string;
  /** Clear filters handler for filtered empty state */
  onClearFilters?: () => void;

  // Skeleton props
  /** Number of skeleton items to show */
  skeletonCount?: number;
  /** Number of metadata lines in skeleton */
  skeletonMetadataCount?: number;
  /** Whether to show badge in skeleton */
  skeletonShowBadge?: boolean;

  // List rendering
  /** Get unique id for item */
  getItemId: (item: T) => string;
  /** Render item */
  renderItem: (item: T, index: number) => ReactNode;

  // Drag support
  /** Whether drag is enabled */
  draggable?: boolean;
  /** Drag end handler */
  onDragEnd?: (activeId: string, overId: string, oldIndex: number, newIndex: number) => void;

  /** Additional class names for container */
  className?: string;
}

export function MobileListContainer<T>({
  items,
  loading = false,
  hasFilter = false,
  // Empty state
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  filterEmptyTitle,
  filterEmptyDescription,
  onClearFilters,
  // Skeleton
  skeletonCount = 5,
  skeletonMetadataCount = 3,
  skeletonShowBadge = true,
  // List
  getItemId,
  renderItem,
  // Drag
  draggable = false,
  onDragEnd,
  className,
}: MobileListContainerProps<T>) {
  // Loading state
  if (loading) {
    return (
      <MobileListSkeleton
        count={skeletonCount}
        metadataCount={skeletonMetadataCount}
        showBadge={skeletonShowBadge}
      />
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <MobileEmptyState
        icon={hasFilter ? Filter : emptyIcon}
        title={hasFilter ? (filterEmptyTitle || emptyTitle) : emptyTitle}
        description={hasFilter ? filterEmptyDescription : emptyDescription}
        action={
          hasFilter && onClearFilters
            ? {
                label: emptyAction?.label || '',
                onClick: onClearFilters,
                variant: 'secondary',
              }
            : emptyAction
        }
      />
    );
  }

  // List with optional drag support
  return (
    <DraggableMobileList
      items={items}
      getItemId={getItemId}
      renderItem={renderItem}
      onDragEnd={onDragEnd}
      enabled={draggable && !hasFilter && !!onDragEnd}
      className={className || mobileListContainerStyles}
    />
  );
}

MobileListContainer.displayName = 'MobileListContainer';
