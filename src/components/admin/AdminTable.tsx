/**
 * Admin Unified Table Component
 * Elegant business style - refined interactions and visual hierarchy
 * Optimizations: finer visual details, smooth animations, refined colors
 */

import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';

// ============ Base Table Components ============

interface AdminTableProps {
  children: ReactNode;
  className?: string;
}

export const AdminTable = ({ children, className }: AdminTableProps) => {
  return (
    <div className="overflow-x-auto bg-card rounded-xl">
      <table className={cn('w-full text-sm border-separate border-spacing-0', className)}>
        {children}
      </table>
    </div>
  );
};

export const AdminTableHeader = ({ children, className }: AdminTableProps) => {
  return (
    <thead className={cn(
      'bg-muted/50',
      'border-b-2 border-border/60',
      className
    )}>
      {children}
    </thead>
  );
};

export const AdminTableBody = ({ children, className }: AdminTableProps) => {
  return (
    <tbody className={cn('divide-y divide-border/60', className)}>
      {children}
    </tbody>
  );
};

interface AdminTableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export const AdminTableRow = ({ children, className, onClick, selected }: AdminTableRowProps) => {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'group transition-all duration-200',
        'hover:bg-accent/50',
        onClick && 'cursor-pointer',
        selected && 'bg-primary/5',
        className
      )}
    >
      {children}
    </tr>
  );
};

interface AdminTableCellProps {
  children?: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
}

export const AdminTableHead = ({ children, className, align = 'left', width }: AdminTableCellProps) => {
  return (
    <th
      style={{ width }}
      className={cn(
        'px-4 py-3.5 font-medium',
        'text-sm text-muted-foreground',
        'whitespace-nowrap',
        'first:rounded-tl-lg last:rounded-tr-lg',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
    >
      {children}
    </th>
  );
};

export const AdminTableCell = ({ children, className, align = 'left' }: AdminTableCellProps) => {
  return (
    <td
      className={cn(
        'px-4 py-3.5 text-foreground',
        'align-middle',
        'transition-colors duration-200',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
    >
      {children}
    </td>
  );
};

// ============ Table State Components ============

interface TableEmptyProps {
  message?: string;
  colSpan?: number;
}

export const AdminTableEmpty = ({ message = 'No data', colSpan = 1 }: TableEmptyProps) => {
  return (
    <tr>
      <td colSpan={colSpan} className="py-20 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="size-14 rounded-2xl bg-muted flex items-center justify-center shadow-inner">
              <svg className="size-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
      </td>
    </tr>
  );
};

interface TableLoadingProps {
  colSpan?: number;
}

export const AdminTableLoading = ({ colSpan = 1 }: TableLoadingProps) => {
  return (
    <tr>
      <td colSpan={colSpan} className="py-20 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="size-9 animate-spin text-primary" strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </td>
    </tr>
  );
};

// ============ Pagination Component ============

interface AdminTablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  loading?: boolean;
}

export const AdminTablePagination = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  loading,
}: AdminTablePaginationProps) => {
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  if (total === 0) return null;

  return (
    <div className={cn(
      'flex items-center justify-between px-5 py-4',
      'border-t border-border/60',
      'bg-muted/30'
    )}>
      {/* Left: Page size selector */}
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <span>Show</span>
        {onPageSizeChange ? (
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
          >
            <SelectTrigger className="h-9 w-[72px] text-xs shadow-sm hover:shadow transition-shadow">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-foreground">{pageSize}</span>
        )}
        <span>per page</span>
      </div>

      {/* Right: Pagination controls */}
      <div className="flex items-center gap-5">
        <span className="text-sm text-muted-foreground">
          <span className="text-foreground">{startIndex}-{endIndex}</span>
          <span className="mx-1.5 text-muted-foreground/60">/</span>
          <span>{total} total</span>
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1 || loading}
            className={cn(
              'flex items-center justify-center size-11 sm:size-9 rounded-lg touch-target',
              'text-muted-foreground',
              'hover:bg-accent',
              'hover:shadow-sm active:scale-95',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none',
              'transition-all duration-200'
            )}
          >
            <ChevronLeft className="size-5 sm:size-4.5" strokeWidth={2} />
          </button>

          {/* Page number display */}
          <div className="flex items-center gap-1 px-0.5">
            {generatePageNumbers(page, totalPages).map((pageNum, idx) => (
              pageNum === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-1.5 text-muted-foreground">...</span>
              ) : (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum as number)}
                  disabled={loading}
                  className={cn(
                    'flex items-center justify-center min-w-[44px] sm:min-w-[36px] h-11 sm:h-9 px-3 sm:px-2.5 rounded-lg text-sm touch-target',
                    'transition-all duration-200',
                    pageNum === page
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105'
                      : 'text-muted-foreground hover:bg-accent hover:shadow-sm active:scale-95'
                  )}
                >
                  {pageNum}
                </button>
              )
            ))}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className={cn(
              'flex items-center justify-center size-11 sm:size-9 rounded-lg touch-target',
              'text-muted-foreground',
              'hover:bg-accent',
              'hover:shadow-sm active:scale-95',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none',
              'transition-all duration-200'
            )}
          >
            <ChevronRight className="size-5 sm:size-4.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Generate page number array
function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  if (current <= 3) {
    pages.push(1, 2, 3, 4, '...', total);
  } else if (current >= total - 2) {
    pages.push(1, '...', total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }

  return pages;
}

// ============ Elegant Badge Component ============

interface AdminBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  onClick?: () => void;
}

const badgeVariants = {
  default: 'bg-muted text-muted-foreground border border-border/60',
  success: 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60',
  warning: 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60',
  danger: 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200/60 dark:border-red-800/60',
  info: 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60',
  outline: 'border border-border/60 text-muted-foreground hover:bg-accent',
};

export const AdminBadge = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
  onClick,
}: AdminBadgeProps) => {
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        'shadow-sm',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        badgeVariants[variant],
        onClick && 'cursor-pointer hover:scale-105 hover:shadow-md active:scale-100 transition-all duration-200',
        className
      )}
    >
      {children}
    </span>
  );
};
