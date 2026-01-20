/**
 * Admin Data Table Component
 * Built on TanStack Table v8
 * Maintains consistent elegant business style with AdminTable
 * Supports responsive column hiding and virtualization for large datasets
 */

import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type OnChangeFn,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminTablePagination } from './AdminTable';
import { useBreakpoint, type BreakpointKey } from '@/hooks/useBreakpoint';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuPortal,
  ContextMenuTrigger,
} from '@/components/common/ContextMenu';

// ============ Type Definitions ============

/**
 * Responsive column configuration
 * hideBelow: Hide column below specified breakpoint (backward compatible)
 * priority: Column priority (1=must show, 2=important, 3=secondary, 4=optional)
 * minWidth: Column minimum width (pixels)
 * align: Text alignment (left, center, right)
 * numeric: Whether this column contains numeric data (auto right-align)
 */
export interface ResponsiveColumnMeta {
  /** Hide below this breakpoint (xs < sm < md < lg < xl < 2xl) - backward compatible */
  hideBelow?: BreakpointKey | 'xs';
  /** Column priority: 1=must show, 2=important(>=640px), 3=secondary(>=1024px), 4=optional(>=1280px) */
  priority?: 1 | 2 | 3 | 4;
  /** Column minimum width (pixels) */
  minWidth?: number;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether this column contains numeric data (auto right-align and use tabular-nums) */
  numeric?: boolean;
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  loading?: boolean;
  // Server-side pagination
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  // Sorting
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  // Row selection
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (row: TData) => string;
  // Row click
  onRowClick?: (row: TData) => void;
  // Empty state
  emptyMessage?: string;
  // Context menu
  contextMenuContent?: (row: TData) => React.ReactNode;
  enableContextMenu?: boolean;
  // Accessibility
  ariaLabel?: string;
  // Virtualization - auto-enabled when rows > threshold
  virtualizeThreshold?: number; // Default: 50
  estimatedRowHeight?: number; // Default: 52
  maxHeight?: number | string; // Default: 600
}

// ============ Breakpoint Priority ============
const BREAKPOINT_ORDER: (BreakpointKey | 'xs')[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

/**
 * Priority to minimum breakpoint mapping
 * priority 1: Always show
 * priority 2: >= sm (640px)
 * priority 3: >= lg (1024px)
 * priority 4: >= xl (1280px)
 */
const PRIORITY_TO_BREAKPOINT: Record<number, BreakpointKey | 'xs'> = {
  1: 'xs',  // Always show
  2: 'sm',  // >= 640px
  3: 'lg',  // >= 1024px
  4: 'xl',  // >= 1280px
};

/**
 * Determine if column should be shown at current breakpoint (compatible with hideBelow and priority)
 */
const shouldShowColumn = (
  meta: ResponsiveColumnMeta | undefined,
  currentBreakpoint: BreakpointKey | 'xs'
): boolean => {
  if (!meta) return true;

  // If priority is set, use priority logic
  if (meta.priority !== undefined) {
    const requiredBreakpoint = PRIORITY_TO_BREAKPOINT[meta.priority] || 'sm';
    const requiredIndex = BREAKPOINT_ORDER.indexOf(requiredBreakpoint);
    const currentIndex = BREAKPOINT_ORDER.indexOf(currentBreakpoint);
    const showByPriority = currentIndex >= requiredIndex;

    // If hideBelow is also set, use stricter condition
    if (meta.hideBelow) {
      const hideIndex = BREAKPOINT_ORDER.indexOf(meta.hideBelow);
      const showByHideBelow = currentIndex >= hideIndex;
      return showByPriority && showByHideBelow;
    }

    return showByPriority;
  }

  // Backward compatible with old hideBelow config
  if (meta.hideBelow) {
    const hideIndex = BREAKPOINT_ORDER.indexOf(meta.hideBelow);
    const currentIndex = BREAKPOINT_ORDER.indexOf(currentBreakpoint);
    return currentIndex >= hideIndex;
  }

  // No config set, default to priority 2 (important columns)
  const defaultBreakpoint = PRIORITY_TO_BREAKPOINT[2];
  const requiredIndex = BREAKPOINT_ORDER.indexOf(defaultBreakpoint);
  const currentIndex = BREAKPOINT_ORDER.indexOf(currentBreakpoint);
  return currentIndex >= requiredIndex;
};

// ============ DataTable Component ============

export function DataTable<TData>({
  columns,
  data,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  sorting: externalSorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  onRowClick,
  emptyMessage,
  contextMenuContent,
  enableContextMenu = false,
  ariaLabel,
  virtualizeThreshold = 50,
  estimatedRowHeight = 52,
  maxHeight = 600,
}: DataTableProps<TData>) {
  const { t } = useTranslation();
  // Responsive breakpoint
  const { current: currentBreakpoint } = useBreakpoint();
  // Ref for virtualization scroll container
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Internal sorting state (if not provided externally)
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sorting = externalSorting ?? internalSorting;
  const setSorting = onSortingChange ?? setInternalSorting;

  // Filter visible columns based on current breakpoint
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => {
      const meta = col.meta as ResponsiveColumnMeta | undefined;
      return shouldShowColumn(meta, currentBreakpoint);
    });
  }, [columns, currentBreakpoint]);

  const table = useReactTable({
    data,
    columns: visibleColumns,
    state: {
      sorting,
      rowSelection: rowSelection ?? {},
    },
    onSortingChange: setSorting,
    onRowSelectionChange: onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId,
    manualPagination: true,
    manualSorting: !!onSortingChange,
  });

  const { rows } = table.getRowModel();
  const colCount = visibleColumns.length;

  // Enable virtualization for large datasets
  const shouldVirtualize = rows.length > virtualizeThreshold;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 5, // Render 5 extra rows above/below viewport
    enabled: shouldVirtualize,
  });

  // Render a single row (shared between virtualized and non-virtualized modes)
  const renderRow = (row: (typeof rows)[number], style?: React.CSSProperties) => {
    const rowContent = (
      <tr
        key={row.id}
        onClick={() => onRowClick?.(row.original)}
        style={style}
        className={cn(
          onRowClick && 'cursor-pointer hover:bg-muted/50 transition-colors duration-200',
          row.getIsSelected() && 'bg-primary/5'
        )}
      >
        {row.getVisibleCells().map((cell) => {
          const meta = cell.column.columnDef.meta as ResponsiveColumnMeta | undefined;
          return (
            <td
              key={cell.id}
              role="gridcell"
              className={cn(
                'px-4 py-4 text-sm overflow-hidden',
                meta?.numeric && 'text-right tabular-nums',
                meta?.align === 'right' && 'text-right',
                meta?.align === 'center' && 'text-center'
              )}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
      </tr>
    );

    // Wrap with ContextMenu if enabled
    if (enableContextMenu && contextMenuContent) {
      return (
        <ContextMenu key={row.id}>
          <ContextMenuTrigger asChild>{rowContent}</ContextMenuTrigger>
          <ContextMenuPortal>
            <ContextMenuContent>{contextMenuContent(row.original)}</ContextMenuContent>
          </ContextMenuPortal>
        </ContextMenu>
      );
    }

    return rowContent;
  };

  // Render table body content
  const renderTableBody = () => {
    if (loading && data.length === 0) {
      return (
        <tr>
          <td colSpan={colCount} className="px-4 py-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2
                className="size-8 animate-spin text-primary"
                strokeWidth={2}
              />
              <p className="text-muted-foreground text-sm">
                {t('common.table.loading')}
              </p>
            </div>
          </td>
        </tr>
      );
    }

    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={colCount} className="px-4 py-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="size-12 rounded-full bg-muted/80 flex items-center justify-center">
                <svg
                  className="size-6 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <p className="text-muted-foreground text-sm">
                {emptyMessage ?? t('common.table.noData')}
              </p>
            </div>
          </td>
        </tr>
      );
    }

    // Virtualized rendering for large datasets
    if (shouldVirtualize) {
      const virtualRows = rowVirtualizer.getVirtualItems();
      const totalSize = rowVirtualizer.getTotalSize();

      return (
        <>
          {/* Top padding row */}
          {virtualRows[0]?.start > 0 && (
            <tr>
              <td
                colSpan={colCount}
                style={{ height: virtualRows[0].start }}
              />
            </tr>
          )}
          {/* Visible rows */}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            return renderRow(row);
          })}
          {/* Bottom padding row */}
          {virtualRows[virtualRows.length - 1]?.end < totalSize && (
            <tr>
              <td
                colSpan={colCount}
                style={{
                  height: totalSize - virtualRows[virtualRows.length - 1].end,
                }}
              />
            </tr>
          )}
        </>
      );
    }

    // Standard rendering for small datasets
    return rows.map((row) => renderRow(row));
  };

  return (
    <div className="flex flex-col @container">
      {/* Table Container - supports container queries for responsive column sizing */}
      <div
        ref={tableContainerRef}
        className={cn(
          'overflow-hidden border border-border rounded-lg',
          shouldVirtualize && 'overflow-y-auto'
        )}
        style={shouldVirtualize ? { maxHeight } : undefined}
      >
        <table
          className="w-full table-fixed divide-y divide-border"
          role="grid"
          aria-label={ariaLabel}
          aria-busy={loading}
          aria-rowcount={data.length}
        >
          <thead className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const meta = header.column.columnDef.meta as ResponsiveColumnMeta | undefined;

                  return (
                    <th
                      key={header.id}
                      scope="col"
                      role="columnheader"
                      aria-sort={
                        sorted
                          ? sorted === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : undefined
                      }
                      style={{
                        width: header.column.columnDef.size,
                      }}
                      className={cn(
                        'py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-muted-foreground truncate',
                        meta?.align === 'right' && 'text-right',
                        meta?.align === 'center' && 'text-center'
                      )}
                    >
                      {canSort ? (
                        <button
                          className="flex items-center gap-x-3 focus:outline-none"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </span>
                          {/* Sort Icon */}
                          <svg className="h-3" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M2.13347 0.0999756H2.98516L5.01902 4.79058H3.86226L3.45549 3.79907H1.63772L1.24366 4.79058H0.0996094L2.13347 0.0999756ZM2.54025 1.46012L1.96822 2.92196H3.11227L2.54025 1.46012Z"
                              fill="currentColor"
                              stroke="currentColor"
                              strokeWidth="0.1"
                            />
                            <path
                              d="M0.722656 9.60832L3.09974 6.78633H0.811638V5.87109H4.35819V6.78633L2.01925 9.60832H4.43446V10.5617H0.722656V9.60832Z"
                              fill="currentColor"
                              stroke="currentColor"
                              strokeWidth="0.1"
                            />
                            <path
                              d="M8.45558 7.25664V7.40664H8.60558H9.66065C9.72481 7.40664 9.74667 7.42274 9.75141 7.42691C9.75148 7.42808 9.75146 7.42993 9.75116 7.43262C9.75001 7.44265 9.74458 7.46304 9.72525 7.49314C9.72522 7.4932 9.72518 7.49326 9.72514 7.49332L7.86959 10.3529L7.86924 10.3534C7.83227 10.4109 7.79863 10.418 7.78568 10.418C7.77272 10.418 7.73908 10.4109 7.70211 10.3534L7.70177 10.3529L5.84621 7.49332C5.84617 7.49325 5.84612 7.49318 5.84608 7.49311C5.82677 7.46302 5.82135 7.44264 5.8202 7.43262C5.81989 7.42993 5.81987 7.42808 5.81994 7.42691C5.82469 7.42274 5.84655 7.40664 5.91071 7.40664H6.96578H7.11578V7.25664V0.633865C7.11578 0.42434 7.29014 0.249976 7.49967 0.249976H8.07169C8.28121 0.249976 8.45558 0.42434 8.45558 0.633865V7.25664Z"
                              fill="currentColor"
                              stroke="currentColor"
                              strokeWidth="0.3"
                            />
                          </svg>
                        </button>
                      ) : (
                        header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="bg-card divide-y divide-border">{renderTableBody()}</tbody>
        </table>
      </div>

      {/* Pagination */}
      {page !== undefined &&
        pageSize !== undefined &&
        total !== undefined &&
        onPageChange && (
          <AdminTablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            loading={loading}
          />
        )}
    </div>
  );
}

// ============ Export types for external use ============
export type { ColumnDef, SortingState, RowSelectionState, OnChangeFn };
