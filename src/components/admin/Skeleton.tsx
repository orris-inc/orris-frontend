/**
 * Skeleton Loading Components
 * Unified loading states for admin pages
 *
 * Includes:
 * - TableSkeleton: For data tables
 * - StatsSkeleton: For stats cards grid
 * - ListSkeleton: For stacked lists
 * - CardSkeleton: Generic card loading
 */

import { cn } from '@/lib/utils';

// Base skeleton pulse animation
const pulseClass = 'animate-pulse bg-muted rounded';

/**
 * Base Skeleton Component
 * Simple rectangular skeleton with animation
 */
export interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return <div className={cn(pulseClass, className)} />;
};

/**
 * Table Skeleton
 * Loading state for DataTable component
 */
export interface TableSkeletonProps {
  /** Number of rows to display */
  rows?: number;
  /** Number of columns to display */
  cols?: number;
  /** Show header row */
  showHeader?: boolean;
  /** Additional class names */
  className?: string;
}

export const TableSkeleton = ({
  rows = 5,
  cols = 4,
  showHeader = true,
  className,
}: TableSkeletonProps) => {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border', className)}>
      {/* Header */}
      {showHeader && (
        <div className="bg-muted px-4 py-3 border-b border-border">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, i) => (
              <div
                key={`header-${i}`}
                className={cn(pulseClass, 'h-4 flex-1')}
                style={{ maxWidth: i === 0 ? '120px' : undefined }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Body rows */}
      <div className="divide-y divide-border bg-card">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex items-center gap-4 px-4 py-4">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className={cn(
                  pulseClass,
                  'h-4 flex-1',
                  colIndex === 0 && 'max-w-[150px]',
                  colIndex === cols - 1 && 'max-w-[100px]'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Stats Skeleton
 * Loading state for stats cards grid
 */
export interface StatsSkeletonProps {
  /** Number of stat cards */
  count?: number;
  /** Grid columns on different breakpoints */
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  /** Additional class names */
  className?: string;
}

export const StatsSkeleton = ({
  count = 4,
  cols = { default: 2, sm: 2, md: 3, lg: 4 },
  className,
}: StatsSkeletonProps) => {
  const gridCols = cn(
    cols.default === 1 ? 'grid-cols-1' : cols.default === 2 ? 'grid-cols-2' : cols.default === 3 ? 'grid-cols-3' : 'grid-cols-4',
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`
  );

  return (
    <div className={cn('grid gap-4', gridCols, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`stat-${i}`}
          className="overflow-hidden rounded-lg bg-card p-4 shadow-sm ring-1 ring-border sm:p-6"
        >
          <div className={cn(pulseClass, 'h-4 w-24 mb-2')} />
          <div className={cn(pulseClass, 'h-8 w-16')} />
        </div>
      ))}
    </div>
  );
};

/**
 * List Skeleton
 * Loading state for stacked lists
 */
export interface ListSkeletonProps {
  /** Number of list items */
  count?: number;
  /** Show avatar circle */
  showAvatar?: boolean;
  /** Show action buttons placeholder */
  showActions?: boolean;
  /** Additional class names */
  className?: string;
}

export const ListSkeleton = ({
  count = 5,
  showAvatar = true,
  showActions = true,
  className,
}: ListSkeletonProps) => {
  return (
    <ul className={cn('divide-y divide-border', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <li key={`list-${i}`} className="flex items-center gap-x-4 py-5 px-4">
          {/* Avatar placeholder */}
          {showAvatar && (
            <div className={cn(pulseClass, 'size-10 rounded-full shrink-0')} />
          )}

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-2">
            <div className={cn(pulseClass, 'h-4 w-32')} />
            <div className={cn(pulseClass, 'h-3 w-48')} />
          </div>

          {/* Actions placeholder */}
          {showActions && (
            <div className="flex shrink-0 gap-2">
              <div className={cn(pulseClass, 'size-8 rounded-md')} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

/**
 * Card Skeleton
 * Generic card loading state
 */
export interface CardSkeletonProps {
  /** Show header section */
  showHeader?: boolean;
  /** Show image placeholder */
  showImage?: boolean;
  /** Number of content lines */
  lines?: number;
  /** Additional class names */
  className?: string;
}

export const CardSkeleton = ({
  showHeader = true,
  showImage = false,
  lines = 3,
  className,
}: CardSkeletonProps) => {
  return (
    <div className={cn('overflow-hidden rounded-lg bg-card ring-1 ring-border', className)}>
      {/* Image placeholder */}
      {showImage && (
        <div className={cn(pulseClass, 'h-48 w-full rounded-none')} />
      )}

      <div className="p-4 sm:p-6">
        {/* Header */}
        {showHeader && (
          <div className="mb-4 space-y-2">
            <div className={cn(pulseClass, 'h-5 w-3/4')} />
            <div className={cn(pulseClass, 'h-4 w-1/2')} />
          </div>
        )}

        {/* Content lines */}
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={`line-${i}`}
              className={cn(
                pulseClass,
                'h-4',
                i === lines - 1 ? 'w-2/3' : 'w-full'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Page Header Skeleton
 * Loading state for PageHeader component
 */
export interface PageHeaderSkeletonProps {
  showBreadcrumbs?: boolean;
  showMetadata?: boolean;
  showActions?: boolean;
  className?: string;
}

export const PageHeaderSkeleton = ({
  showBreadcrumbs = false,
  showMetadata = true,
  showActions = true,
  className,
}: PageHeaderSkeletonProps) => {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <div className="flex items-center gap-2">
          <div className={cn(pulseClass, 'h-4 w-16')} />
          <div className={cn(pulseClass, 'h-4 w-4')} />
          <div className={cn(pulseClass, 'h-4 w-24')} />
        </div>
      )}

      {/* Title row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className={cn(pulseClass, 'h-8 w-48')} />
          <div className={cn(pulseClass, 'h-4 w-64')} />
        </div>

        {showActions && (
          <div className="flex gap-2">
            <div className={cn(pulseClass, 'h-10 w-24 rounded-md')} />
            <div className={cn(pulseClass, 'h-10 w-32 rounded-md')} />
          </div>
        )}
      </div>

      {/* Metadata */}
      {showMetadata && (
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`meta-${i}`} className="flex items-center gap-2">
              <div className={cn(pulseClass, 'size-4 rounded')} />
              <div className={cn(pulseClass, 'h-4 w-20')} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
