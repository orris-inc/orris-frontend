/**
 * Admin Data Table Component
 * Built on TanStack Table v8
 * Maintains consistent elegant business style with AdminTable
 * Supports responsive column hiding and virtualization for large datasets
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
import { Loader2, ChevronUp, ChevronDown, ChevronsUpDown, HelpCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminTablePagination } from './AdminTable';
import { useBreakpoint, type BreakpointKey } from '@/hooks/useBreakpoint';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuPortal,
  ContextMenuTrigger,
} from '@/components/common/ContextMenu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/common/HoverCard';
import { TableRowProvider } from './TableHoverCard';
import { Button } from '@/components/common/Button';
import { createSelectionColumn } from './data-table-utils';

// ============ Type Definitions ============

/**
 * Responsive column configuration
 * hideBelow: Hide column below specified breakpoint (backward compatible)
 * priority: Column priority (1=must show, 2=important, 3=secondary, 4=optional)
 * minWidth: Column minimum width (pixels)
 * align: Text alignment (left, center, right)
 * numeric: Whether this column contains numeric data (auto right-align)
 * sticky: Stick column to left or right edge during horizontal scroll
 * headerTooltip: Tooltip content for column header (string or ReactNode)
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
  /** Stick column to left or right edge during horizontal scroll */
  sticky?: 'left' | 'right';
  /** Tooltip content for column header explanation */
  headerTooltip?: React.ReactNode;
}

/**
 * Enhanced empty state configuration
 */
export interface EmptyStateConfig {
  /** Custom icon component */
  icon?: LucideIcon;
  /** Custom message (overrides emptyMessage prop) */
  message?: string;
  /** Action button text */
  actionLabel?: string;
  /** Action button handler */
  onAction?: () => void;
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
  // Row selection - enables checkbox column when provided
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (row: TData) => string;
  /** Enable row selection with checkbox column */
  enableRowSelection?: boolean;
  // Row click
  onRowClick?: (row: TData) => void;
  // Empty state
  emptyMessage?: string;
  /** Enhanced empty state with action button */
  emptyState?: EmptyStateConfig;
  // Context menu
  contextMenuContent?: (row: TData) => React.ReactNode;
  enableContextMenu?: boolean;
  // Accessibility
  ariaLabel?: string;
  // Virtualization - auto-enabled when rows > threshold
  virtualizeThreshold?: number; // Default: 50
  estimatedRowHeight?: number; // Default: 52
  maxHeight?: number | string; // Default: 600
  /** Show skeleton loading on first load instead of spinner */
  enableSkeletonLoading?: boolean;
  /** Number of skeleton rows to show */
  skeletonRowCount?: number;
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

// ============ Skeleton Row Component ============

const SkeletonRow = ({ colCount }: { colCount: number }) => (
  <tr className="animate-pulse">
    {Array.from({ length: colCount }).map((_, i) => (
      <td key={i} className="px-3 py-3">
        <div className="h-4 bg-muted rounded w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);

// ============ Selection Column Definition ============


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
  enableRowSelection = false,
  onRowClick,
  emptyMessage,
  emptyState,
  contextMenuContent,
  enableContextMenu = false,
  ariaLabel,
  virtualizeThreshold = 50,
  estimatedRowHeight = 52,
  maxHeight = 600,
  enableSkeletonLoading = false,
  skeletonRowCount = 5,
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

  // Add selection column if enabled
  const columnsWithSelection = useMemo(() => {
    if (enableRowSelection && onRowSelectionChange) {
      return [createSelectionColumn<TData>(), ...columns];
    }
    return columns;
  }, [columns, enableRowSelection, onRowSelectionChange]);

  // Filter visible columns based on current breakpoint
  const visibleColumns = useMemo(() => {
    return columnsWithSelection.filter((col) => {
      const meta = col.meta as ResponsiveColumnMeta | undefined;
      return shouldShowColumn(meta, currentBreakpoint);
    });
  }, [columnsWithSelection, currentBreakpoint]);

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

  // Scroll state for shadow indicators
  const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: false });

  // Handle scroll to update shadow indicators
  const handleScroll = useCallback(() => {
    const container = tableContainerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setScrollState({
      canScrollLeft: scrollLeft > 1,
      canScrollRight: scrollLeft < scrollWidth - clientWidth - 1,
    });
  }, []);

  // Initialize and observe scroll state
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    // Initial check
    handleScroll();

    // Listen for scroll events
    container.addEventListener('scroll', handleScroll, { passive: true });

    // Observe resize to update scroll state
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [handleScroll]);

  // Calculate sticky column positions
  const stickyOffsets = useMemo(() => {
    const leftOffsets: Record<string, number> = {};
    const rightOffsets: Record<string, number> = {};

    // Calculate left sticky offsets (cumulative from left)
    let leftAccum = 0;
    for (const col of visibleColumns) {
      const meta = col.meta as ResponsiveColumnMeta | undefined;
      const colId = col.id || (col as { accessorKey?: string }).accessorKey || '';
      if (meta?.sticky === 'left') {
        leftOffsets[colId] = leftAccum;
        leftAccum += (col.size as number) || 150;
      }
    }

    // Calculate right sticky offsets (cumulative from right, reversed)
    let rightAccum = 0;
    for (let i = visibleColumns.length - 1; i >= 0; i--) {
      const col = visibleColumns[i];
      const meta = col.meta as ResponsiveColumnMeta | undefined;
      const colId = col.id || (col as { accessorKey?: string }).accessorKey || '';
      if (meta?.sticky === 'right') {
        rightOffsets[colId] = rightAccum;
        rightAccum += (col.size as number) || 150;
      }
    }

    return { leftOffsets, rightOffsets, hasSticky: leftAccum > 0 || rightAccum > 0 };
  }, [visibleColumns]);

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
          const colId = cell.column.id;
          const isLeftSticky = meta?.sticky === 'left';
          const isRightSticky = meta?.sticky === 'right';
          const leftOffset = stickyOffsets.leftOffsets[colId];
          const rightOffset = stickyOffsets.rightOffsets[colId];

          return (
            <td
              key={cell.id}
              role="gridcell"
              className={cn(
                'px-3 py-2.5 text-[13px]',
                meta?.numeric && 'text-right tabular-nums',
                meta?.align === 'right' && 'text-right',
                meta?.align === 'center' && 'text-center',
                // Sticky column styles
                (isLeftSticky || isRightSticky) && 'sticky z-10 bg-card',
                isLeftSticky && scrollState.canScrollLeft && 'shadow-[2px_0_8px_-2px_rgba(0,0,0,0.1)]',
                isRightSticky && scrollState.canScrollRight && 'shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.1)]'
              )}
              style={{
                ...(isLeftSticky && leftOffset !== undefined ? { left: leftOffset } : {}),
                ...(isRightSticky && rightOffset !== undefined ? { right: rightOffset } : {}),
              }}
            >
              <TableRowProvider rowId={row.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableRowProvider>
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
    // Skeleton loading for first load
    if (loading && data.length === 0 && enableSkeletonLoading) {
      return Array.from({ length: skeletonRowCount }).map((_, i) => (
        <SkeletonRow key={`skeleton-${i}`} colCount={colCount} />
      ));
    }

    // Spinner loading (default behavior)
    if (loading && data.length === 0) {
      return (
        <tr>
          <td colSpan={colCount} className="px-4 py-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2
                className="size-5 animate-spin text-muted-foreground"
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

    // Enhanced empty state
    if (rows.length === 0) {
      const EmptyIcon = emptyState?.icon;
      const displayMessage = emptyState?.message || emptyMessage || t('common.table.noData');

      return (
        <tr>
          <td colSpan={colCount} className="px-4 py-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="size-12 rounded-full bg-muted/80 flex items-center justify-center">
                {EmptyIcon ? (
                  <EmptyIcon className="size-6 text-muted-foreground" strokeWidth={1.5} />
                ) : (
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
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {displayMessage}
              </p>
              {emptyState?.actionLabel && emptyState?.onAction && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={emptyState.onAction}
                  className="mt-2"
                >
                  {emptyState.actionLabel}
                </Button>
              )}
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
      {/* Table Container with scroll indicators */}
      <div className="relative">
        {/* Left scroll fade indicator */}
        <div
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 z-10 w-8',
            'bg-gradient-to-r from-background to-transparent',
            'rounded-l-lg opacity-0 transition-opacity duration-200',
            scrollState.canScrollLeft && 'opacity-100'
          )}
          aria-hidden="true"
        />

        {/* Table scroll container */}
        <div
          ref={tableContainerRef}
          className={cn(
            'overflow-x-auto border border-border/60 rounded-lg',
            shouldVirtualize && 'overflow-y-auto'
          )}
          style={shouldVirtualize ? { maxHeight } : undefined}
        >
          <table
          className="min-w-full divide-y divide-border/60"
          role="grid"
          aria-label={ariaLabel}
          aria-busy={loading}
          aria-rowcount={data.length}
        >
          <thead className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const meta = header.column.columnDef.meta as ResponsiveColumnMeta | undefined;
                  const colId = header.column.id;
                  const isLeftSticky = meta?.sticky === 'left';
                  const isRightSticky = meta?.sticky === 'right';
                  const leftOffset = stickyOffsets.leftOffsets[colId];
                  const rightOffset = stickyOffsets.rightOffsets[colId];

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
                        ...(isLeftSticky && leftOffset !== undefined ? { left: leftOffset } : {}),
                        ...(isRightSticky && rightOffset !== undefined ? { right: rightOffset } : {}),
                      }}
                      className={cn(
                        'py-2.5 px-3 text-xs font-medium text-left rtl:text-right text-muted-foreground/70 whitespace-nowrap',
                        meta?.align === 'right' && 'text-right',
                        meta?.align === 'center' && 'text-center',
                        // Sticky header styles
                        (isLeftSticky || isRightSticky) && 'sticky z-20 bg-muted/40',
                        isLeftSticky && scrollState.canScrollLeft && 'shadow-[2px_0_8px_-2px_rgba(0,0,0,0.15)]',
                        isRightSticky && scrollState.canScrollRight && 'shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.15)]'
                      )}
                    >
                      {(() => {
                        const headerContent = header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext());

                        // Render header with optional HoverCard tooltip
                        const renderHeaderWithTooltip = (content: React.ReactNode) => {
                          if (!meta?.headerTooltip) return content;
                          return (
                            <span className="inline-flex items-center gap-1">
                              {content}
                              <HoverCard openDelay={200} closeDelay={300}>
                                <HoverCardTrigger asChild>
                                  <button
                                    type="button"
                                    className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <HelpCircle className="size-3.5" />
                                  </button>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-72 text-sm font-normal">
                                  {meta.headerTooltip}
                                </HoverCardContent>
                              </HoverCard>
                            </span>
                          );
                        };

                        if (canSort) {
                          return (
                            <button
                              className="flex items-center gap-1.5 focus:outline-none"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {renderHeaderWithTooltip(<span>{headerContent}</span>)}
                              {/* Sort Icon */}
                              <span className={sorted ? 'text-foreground' : 'text-muted-foreground/40'}>
                                {sorted === 'asc' ? (
                                  <ChevronUp className="size-4" />
                                ) : sorted === 'desc' ? (
                                  <ChevronDown className="size-4" />
                                ) : (
                                  <ChevronsUpDown className="size-3.5" />
                                )}
                              </span>
                            </button>
                          );
                        }
                        return renderHeaderWithTooltip(headerContent);
                      })()}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="bg-card divide-y divide-border/40">{renderTableBody()}</tbody>
        </table>
        </div>

        {/* Right scroll fade indicator */}
        <div
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 z-10 w-8',
            'bg-gradient-to-l from-background to-transparent',
            'rounded-r-lg opacity-0 transition-opacity duration-200',
            scrollState.canScrollRight && 'opacity-100'
          )}
          aria-hidden="true"
        />
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
