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
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm border-separate border-spacing-0', className)}>
        {children}
      </table>
    </div>
  );
};

export const AdminTableHeader = ({ children, className }: AdminTableProps) => {
  return (
    <thead className={cn(
      'bg-gradient-to-b from-slate-50 to-slate-50/80 dark:from-slate-800/50 dark:to-slate-800/30',
      'border-b-2 border-slate-200/60 dark:border-slate-700/60',
      className
    )}>
      {children}
    </thead>
  );
};

export const AdminTableBody = ({ children, className }: AdminTableProps) => {
  return (
    <tbody className={cn('divide-y divide-slate-100/60 dark:divide-slate-800/60', className)}>
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
        'hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-transparent',
        'dark:hover:from-slate-800/40 dark:hover:to-transparent',
        'hover:shadow-[0_1px_3px_-1px_rgba(0,0,0,0.05)]',
        onClick && 'cursor-pointer',
        selected && 'bg-gradient-to-r from-indigo-50/60 to-transparent dark:from-indigo-900/20 dark:to-transparent',
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
        'text-sm text-slate-600 dark:text-slate-300',
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
        'px-4 py-3.5 text-slate-700 dark:text-slate-200',
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
            <div className="size-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-inner">
              <svg className="size-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-200/20 to-transparent dark:from-slate-700/20 blur-xl -z-10" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{message}</p>
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
            <Loader2 className="size-9 animate-spin text-indigo-500" strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading...</p>
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
      'border-t border-slate-200/60 dark:border-slate-700/60',
      'bg-gradient-to-b from-slate-50/30 to-white dark:from-slate-800/20 dark:to-slate-900/20'
    )}>
      {/* Left: Page size selector */}
      <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
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
          <span className="text-slate-900 dark:text-white">{pageSize}</span>
        )}
        <span>per page</span>
      </div>

      {/* Right: Pagination controls */}
      <div className="flex items-center gap-5">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          <span className="text-slate-900 dark:text-white">{startIndex}-{endIndex}</span>
          <span className="mx-1.5 text-slate-400">/</span>
          <span>{total} total</span>
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1 || loading}
            className={cn(
              'flex items-center justify-center size-9 rounded-lg',
              'text-slate-600 dark:text-slate-400',
              'hover:bg-slate-100 dark:hover:bg-slate-700',
              'hover:shadow-sm active:scale-95',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none',
              'transition-all duration-200'
            )}
          >
            <ChevronLeft className="size-4.5" strokeWidth={2} />
          </button>

          {/* Page number display */}
          <div className="flex items-center gap-1 px-0.5">
            {generatePageNumbers(page, totalPages).map((pageNum, idx) => (
              pageNum === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400">...</span>
              ) : (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum as number)}
                  disabled={loading}
                  className={cn(
                    'flex items-center justify-center min-w-[36px] h-9 px-2.5 rounded-lg text-sm',
                    'transition-all duration-200',
                    pageNum === page
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/30 scale-105'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-sm active:scale-95'
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
              'flex items-center justify-center size-9 rounded-lg',
              'text-slate-600 dark:text-slate-400',
              'hover:bg-slate-100 dark:hover:bg-slate-700',
              'hover:shadow-sm active:scale-95',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none',
              'transition-all duration-200'
            )}
          >
            <ChevronRight className="size-4.5" strokeWidth={2} />
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
  default: 'bg-slate-100 text-slate-700 border border-slate-200/60 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600/60',
  success: 'bg-gradient-to-br from-emerald-50 to-emerald-100/60 text-emerald-700 border border-emerald-200/60 dark:from-emerald-900/40 dark:to-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/60',
  warning: 'bg-gradient-to-br from-amber-50 to-amber-100/60 text-amber-700 border border-amber-200/60 dark:from-amber-900/40 dark:to-amber-900/20 dark:text-amber-400 dark:border-amber-800/60',
  danger: 'bg-gradient-to-br from-red-50 to-red-100/60 text-red-700 border border-red-200/60 dark:from-red-900/40 dark:to-red-900/20 dark:text-red-400 dark:border-red-800/60',
  info: 'bg-gradient-to-br from-blue-50 to-blue-100/60 text-blue-700 border border-blue-200/60 dark:from-blue-900/40 dark:to-blue-900/20 dark:text-blue-400 dark:border-blue-800/60',
  outline: 'border border-slate-300/60 dark:border-slate-600/60 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40',
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
