/**
 * MobilePagination - Simple pagination for mobile admin pages
 *
 * Features:
 * - Prev/Next circular buttons
 * - Current page / total pages display
 * - Auto-hide when only one page
 * - Touch-friendly button sizes
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MobilePaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const MobilePagination = ({
  page,
  total,
  pageSize,
  onPageChange,
  className,
}: MobilePaginationProps) => {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  return (
    <div className={cn('flex items-center justify-center gap-6 py-4', className)}>
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          'size-11 rounded-full',
          'flex items-center justify-center',
          'bg-muted/50',
          'transition-all motion-reduce:transition-none',
          page <= 1
            ? 'opacity-40'
            : 'active:scale-[0.98] active:bg-muted'
        )}
      >
        <ChevronLeft className="size-5" />
      </button>

      <span className="text-sm text-muted-foreground tabular-nums">
        <span className="font-medium text-foreground">{page}</span>
        {' / '}
        {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          'size-11 rounded-full',
          'flex items-center justify-center',
          'bg-muted/50',
          'transition-all motion-reduce:transition-none',
          page >= totalPages
            ? 'opacity-40'
            : 'active:scale-[0.98] active:bg-muted'
        )}
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
};

MobilePagination.displayName = 'MobilePagination';
