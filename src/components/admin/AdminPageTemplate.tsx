/**
 * AdminPageTemplate Component
 *
 * Unified page skeleton for admin pages with standard states handling.
 * Features:
 * - Consistent header (title, description, icon, badge, actions)
 * - Standard state handling: loading, error, empty, normal
 * - Toolbar slot for filters
 * - Mobile-first responsive design
 */

import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader, type PageHeaderBadge, type PageHeaderMeta } from './PageHeader';
import { PageSkeleton, type PageSkeletonProps, type ContentSkeletonProps } from './Skeleton';
import { ErrorState, type ErrorStateProps } from './ErrorState';
import { EmptyState, type EmptyStateProps } from './EmptyState';

// ============================================================================
// Types
// ============================================================================

export interface AdminPageTemplateProps {
  // Header props
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Page icon */
  icon?: LucideIcon;
  /** Badge next to title */
  badge?: PageHeaderBadge;
  /** Action buttons slot */
  action?: ReactNode;
  /** Metadata items */
  metadata?: PageHeaderMeta[];

  // State handling
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: Error | string | null;
  /** Empty state - when data is loaded but empty */
  empty?: boolean;

  // Loading customization
  /** Skeleton props for loading state */
  skeletonProps?: Partial<PageSkeletonProps>;
  /** Content skeleton variant */
  contentVariant?: ContentSkeletonProps['variant'];

  // Error customization
  /** Error retry callback */
  onRetry?: () => void;
  /** Error props override */
  errorProps?: Partial<ErrorStateProps>;

  // Empty state customization
  /** Empty state props */
  emptyProps?: EmptyStateProps;

  // Slots
  /** Toolbar slot (filters, search) */
  toolbar?: ReactNode;
  /** Main content */
  children: ReactNode;

  /** Additional class names */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const AdminPageTemplate = ({
  // Header props
  title,
  description,
  icon,
  badge,
  action,
  metadata,

  // State handling
  loading = false,
  error = null,
  empty = false,

  // Loading customization
  skeletonProps,
  contentVariant = 'table',

  // Error customization
  onRetry,
  errorProps,

  // Empty state customization
  emptyProps,

  // Slots
  toolbar,
  children,

  className,
}: AdminPageTemplateProps) => {
  // ========================================
  // Error State
  // ========================================
  if (error) {
    return (
      <div className={cn('space-y-6', className)}>
        <PageHeader
          title={title}
          description={description}
          icon={icon}
          badge={badge}
          action={action}
          metadata={metadata}
        />
        <ErrorState
          error={error}
          onRetry={onRetry}
          {...errorProps}
        />
      </div>
    );
  }

  // ========================================
  // Loading State
  // ========================================
  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <PageSkeleton
          showHeader
          showToolbar={!!toolbar}
          contentVariant={contentVariant}
          {...skeletonProps}
        />
      </div>
    );
  }

  // ========================================
  // Empty State
  // ========================================
  if (empty && emptyProps) {
    return (
      <div className={cn('space-y-6', className)}>
        <PageHeader
          title={title}
          description={description}
          icon={icon}
          badge={badge}
          action={action}
          metadata={metadata}
        />
        {toolbar && <div className="space-y-4">{toolbar}</div>}
        <EmptyState {...emptyProps} />
      </div>
    );
  }

  // ========================================
  // Normal State
  // ========================================
  return (
    <div className={cn('space-y-6', className)}>
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        badge={badge}
        action={action}
        metadata={metadata}
      />
      {toolbar && <div className="space-y-4">{toolbar}</div>}
      {children}
    </div>
  );
};
