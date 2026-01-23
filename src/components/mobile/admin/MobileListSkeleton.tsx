/**
 * MobileListSkeleton - Loading skeleton for mobile lists
 *
 * Tailwind Application UI style:
 * - Stacked items with divide-y
 * - Configurable skeleton layout
 * - Modern rounded corners
 */

import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';
import { mobileListContainerStyles } from '@/lib/ui-styles';

export interface MobileListSkeletonProps {
  /** Number of skeleton items to show (default: 5) */
  count?: number;
  /** Show badge skeleton on the right (default: true) */
  showBadge?: boolean;
  /** Number of metadata items in second row (default: 2) */
  metadataCount?: number;
  className?: string;
}

export const MobileListSkeleton = ({
  count = 5,
  showBadge = true,
  metadataCount = 2,
  className,
}: MobileListSkeletonProps) => {
  return (
    <div className={cn(mobileListContainerStyles, className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <div className="flex-1 min-w-0 space-y-2">
            {/* First row: title + small badge */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            {/* Second row: metadata items */}
            <div className="flex items-center gap-2">
              {Array.from({ length: metadataCount }, (_, j) => (
                <Skeleton
                  key={j}
                  className={cn(
                    'h-3.5',
                    j === 0 ? 'w-28' : j === 1 ? 'w-16' : 'w-12'
                  )}
                />
              ))}
            </div>
          </div>
          {/* Right side badge */}
          {showBadge && <Skeleton className="h-5 w-14 rounded-full" />}
        </div>
      ))}
    </div>
  );
};

MobileListSkeleton.displayName = 'MobileListSkeleton';
