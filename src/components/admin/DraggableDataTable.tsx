/**
 * Draggable Data Table Component
 * Built on TanStack Table v8 + @dnd-kit
 *
 * Performance optimizations:
 * - Only dragged row gets transform (other rows stay static)
 * - Empty SortableContext strategy (no real-time reordering preview)
 * - React.memo on row components
 * - State sync only on drag end
 */

import { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
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
  type Row,
} from '@tanstack/react-table';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { ChevronUp, ChevronDown, ChevronsUpDown, Loader2, GripVertical, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminTablePagination } from './AdminTable';
import { useBreakpoint, type BreakpointKey } from '@/hooks/useBreakpoint';
import type { ResponsiveColumnMeta } from './DataTable';
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

// ============ Breakpoint Priority ============
const BREAKPOINT_ORDER: (BreakpointKey | 'xs')[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

const PRIORITY_TO_BREAKPOINT: Record<number, BreakpointKey | 'xs'> = {
  1: 'xs',
  2: 'sm',
  3: 'lg',
  4: 'xl',
};

const shouldShowColumn = (
  meta: ResponsiveColumnMeta | undefined,
  currentBreakpoint: BreakpointKey | 'xs'
): boolean => {
  if (!meta) return true;

  if (meta.priority !== undefined) {
    const requiredBreakpoint = PRIORITY_TO_BREAKPOINT[meta.priority] || 'sm';
    const requiredIndex = BREAKPOINT_ORDER.indexOf(requiredBreakpoint);
    const currentIndex = BREAKPOINT_ORDER.indexOf(currentBreakpoint);
    const showByPriority = currentIndex >= requiredIndex;

    if (meta.hideBelow) {
      const hideIndex = BREAKPOINT_ORDER.indexOf(meta.hideBelow);
      const showByHideBelow = currentIndex >= hideIndex;
      return showByPriority && showByHideBelow;
    }

    return showByPriority;
  }

  if (meta.hideBelow) {
    const hideIndex = BREAKPOINT_ORDER.indexOf(meta.hideBelow);
    const currentIndex = BREAKPOINT_ORDER.indexOf(currentBreakpoint);
    return currentIndex >= hideIndex;
  }

  const defaultBreakpoint = PRIORITY_TO_BREAKPOINT[2];
  const requiredIndex = BREAKPOINT_ORDER.indexOf(defaultBreakpoint);
  const currentIndex = BREAKPOINT_ORDER.indexOf(currentBreakpoint);
  return currentIndex >= requiredIndex;
};

// ============ Sortable Row Component ============

interface StickyConfig {
  leftOffsets: Record<string, number>;
  rightOffsets: Record<string, number>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

interface SortableRowProps<TData> {
  row: Row<TData>;
  contextMenuContent?: (data: TData) => React.ReactNode;
  enableContextMenu?: boolean;
  stickyConfig?: StickyConfig;
}

/**
 * Sortable row component - memoized to prevent unnecessary re-renders.
 * Hover effects are controlled by parent's data-dragging attribute via CSS.
 */
const SortableRowInner = memo(function SortableRowInner<TData>({
  row,
  contextMenuContent,
  enableContextMenu = false,
  stickyConfig,
}: SortableRowProps<TData>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: row.id });

  // Only the dragged row gets transform - nothing else updates
  const style: React.CSSProperties | undefined = isDragging && transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
        position: 'relative',
      }
    : undefined;

  const rowContent = (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        // Hover effect controlled by parent [data-dragging=false]
        'group-data-[dragging=false]:hover:bg-accent/50',
        isDragging && 'shadow-lg bg-card opacity-90'
      )}
      {...attributes}
    >
      <td className="w-10 px-2 py-3.5 align-middle">
        <button
          type="button"
          className="flex items-center justify-center size-8 rounded-md text-muted-foreground group-data-[dragging=false]:hover:text-foreground group-data-[dragging=false]:hover:bg-accent/50 cursor-grab active:cursor-grabbing touch-none"
          {...listeners}
        >
          <GripVertical className="size-4" strokeWidth={1.5} />
        </button>
      </td>
      {row.getVisibleCells().map((cell) => {
        const meta = cell.column.columnDef.meta as ResponsiveColumnMeta | undefined;
        const colId = cell.column.id;
        const isLeftSticky = meta?.sticky === 'left';
        const isRightSticky = meta?.sticky === 'right';
        const leftOffset = stickyConfig?.leftOffsets[colId];
        const rightOffset = stickyConfig?.rightOffsets[colId];

        return (
          <td
            key={cell.id}
            className={cn(
              'px-4 py-3.5 text-foreground align-middle',
              // Sticky cell styles
              (isLeftSticky || isRightSticky) && 'sticky z-10 bg-card',
              isLeftSticky && stickyConfig?.canScrollLeft && 'shadow-[2px_0_8px_-2px_rgba(0,0,0,0.1)]',
              isRightSticky && stickyConfig?.canScrollRight && 'shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.1)]'
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
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {rowContent}
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent>
            {contextMenuContent(row.original)}
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    );
  }

  return rowContent;
}) as <TData>(props: SortableRowProps<TData>) => React.ReactElement;

// ============ Static Row (non-draggable mode) ============

interface StaticRowProps<TData> {
  row: Row<TData>;
  contextMenuContent?: (data: TData) => React.ReactNode;
  enableContextMenu?: boolean;
  stickyConfig?: StickyConfig;
}

const StaticRow = memo(function StaticRow<TData>({
  row,
  contextMenuContent,
  enableContextMenu = false,
  stickyConfig,
}: StaticRowProps<TData>) {
  const rowContent = (
    <tr className="hover:bg-accent/50">
      {row.getVisibleCells().map((cell) => {
        const meta = cell.column.columnDef.meta as ResponsiveColumnMeta | undefined;
        const colId = cell.column.id;
        const isLeftSticky = meta?.sticky === 'left';
        const isRightSticky = meta?.sticky === 'right';
        const leftOffset = stickyConfig?.leftOffsets[colId];
        const rightOffset = stickyConfig?.rightOffsets[colId];

        return (
          <td
            key={cell.id}
            className={cn(
              'px-4 py-3.5 text-foreground align-middle',
              // Sticky cell styles
              (isLeftSticky || isRightSticky) && 'sticky z-10 bg-card',
              isLeftSticky && stickyConfig?.canScrollLeft && 'shadow-[2px_0_8px_-2px_rgba(0,0,0,0.1)]',
              isRightSticky && stickyConfig?.canScrollRight && 'shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.1)]'
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
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {rowContent}
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent>
            {contextMenuContent(row.original)}
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    );
  }

  return rowContent;
}) as <TData>(props: StaticRowProps<TData>) => React.ReactElement;

// ============ DraggableDataTable Component ============

interface DraggableDataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  // Row selection
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId: (row: TData) => string;
  emptyMessage?: string;
  enableDragSort?: boolean;
  onDragEnd?: (activeId: string, overId: string, oldIndex: number, newIndex: number) => void;
  // Context menu
  contextMenuContent?: (row: TData) => React.ReactNode;
  enableContextMenu?: boolean;
}

export function DraggableDataTable<TData>({
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
  emptyMessage = 'No data',
  enableDragSort = false,
  onDragEnd,
  contextMenuContent,
  enableContextMenu = false,
}: DraggableDataTableProps<TData>) {
  const { t } = useTranslation();
  const { current: currentBreakpoint } = useBreakpoint();
  const [activeId, setActiveId] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

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

  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sorting = externalSorting ?? internalSorting;
  const setSorting = onSortingChange ?? setInternalSorting;

  const visibleColumns = useMemo(() => {
    return columns.filter((col) => {
      const meta = col.meta as ResponsiveColumnMeta | undefined;
      return shouldShowColumn(meta, currentBreakpoint);
    });
  }, [columns, currentBreakpoint]);

  // Calculate sticky column positions
  const stickyOffsets = useMemo(() => {
    const leftOffsets: Record<string, number> = {};
    const rightOffsets: Record<string, number> = {};

    // For draggable table, add drag handle width (40px) to left offsets
    const dragHandleWidth = enableDragSort ? 40 : 0;

    // Calculate left sticky offsets (cumulative from left)
    let leftAccum = dragHandleWidth;
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

    return { leftOffsets, rightOffsets, hasSticky: Object.keys(leftOffsets).length > 0 || Object.keys(rightOffsets).length > 0 };
  }, [visibleColumns, enableDragSort]);

  const table = useReactTable({
    data,
    columns: visibleColumns,
    state: {
      sorting,
      rowSelection: rowSelection ?? {},
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
    },
    onRowSelectionChange: onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId,
    manualPagination: true,
    manualSorting: !!onSortingChange,
  });

  const rowIds = useMemo(() => data.map(getRowId), [data, getRowId]);

  // Memoized sensor configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id && onDragEnd) {
      const oldIndex = rowIds.indexOf(String(active.id));
      const newIndex = rowIds.indexOf(String(over.id));

      if (oldIndex !== -1 && newIndex !== -1) {
        onDragEnd(String(active.id), String(over.id), oldIndex, newIndex);
      }
    }
  }, [rowIds, onDragEnd]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const colCount = visibleColumns.length + (enableDragSort ? 1 : 0);
  const rows = table.getRowModel().rows;

  const tableContent = (
    <div className="relative">
      <div ref={tableContainerRef} className="overflow-x-auto bg-card rounded-xl">
        <table className="w-full table-fixed text-sm border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-muted/50">
                {enableDragSort && (
                  <th className="w-10 px-2 py-3.5 font-medium text-sm text-muted-foreground whitespace-nowrap text-left border-b-2 border-border/60 first:rounded-tl-xl">
                    <span className="sr-only">{t('common.table.sort')}</span>
                  </th>
                )}
                {headerGroup.headers.map((header, index) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const isFirst = !enableDragSort && index === 0;
                  const isLast = index === headerGroup.headers.length - 1;
                  const meta = header.column.columnDef.meta as ResponsiveColumnMeta | undefined;
                  const colId = header.column.id;
                  const isLeftSticky = meta?.sticky === 'left';
                  const isRightSticky = meta?.sticky === 'right';
                  const leftOffset = stickyOffsets.leftOffsets[colId];
                  const rightOffset = stickyOffsets.rightOffsets[colId];

                  return (
                    <th
                      key={header.id}
                      style={{
                        width: header.column.columnDef.size,
                        ...(isLeftSticky && leftOffset !== undefined ? { left: leftOffset } : {}),
                        ...(isRightSticky && rightOffset !== undefined ? { right: rightOffset } : {}),
                      }}
                      className={cn(
                        'px-4 py-3.5 font-medium text-sm text-muted-foreground',
                        'whitespace-nowrap text-left border-b-2 border-border/60',
                        isFirst && 'rounded-tl-xl',
                        isLast && 'rounded-tr-xl',
                        canSort && 'cursor-pointer select-none hover:text-foreground hover:bg-muted/80',
                        // Sticky header styles
                        (isLeftSticky || isRightSticky) && 'sticky z-20 bg-muted/50',
                        isLeftSticky && scrollState.canScrollLeft && 'shadow-[2px_0_8px_-2px_rgba(0,0,0,0.15)]',
                        isRightSticky && scrollState.canScrollRight && 'shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.15)]'
                      )}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-1.5">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        {meta?.headerTooltip && (
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
                        )}
                        {canSort && (
                          <span className={sorted ? 'text-primary' : 'text-muted-foreground/40'}>
                            {sorted === 'asc' ? (
                              <ChevronUp className="size-4" />
                            ) : sorted === 'desc' ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronsUpDown className="size-3.5 opacity-60" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody
            className="divide-y divide-border/60 group"
            data-dragging={activeId !== null}
          >
            {loading && data.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="size-8 animate-spin text-primary" strokeWidth={2} />
                    <p className="text-muted-foreground text-sm">{t('common.table.loading')}</p>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="py-20 text-center">
                  <p className="text-muted-foreground text-sm">{emptyMessage}</p>
                </td>
              </tr>
            ) : enableDragSort ? (
              <SortableContext items={rowIds} strategy={() => null}>
                {rows.map((row) => (
                  <SortableRowInner
                    key={row.id}
                    row={row}
                    contextMenuContent={contextMenuContent}
                    enableContextMenu={enableContextMenu}
                    stickyConfig={{
                      leftOffsets: stickyOffsets.leftOffsets,
                      rightOffsets: stickyOffsets.rightOffsets,
                      canScrollLeft: scrollState.canScrollLeft,
                      canScrollRight: scrollState.canScrollRight,
                    }}
                  />
                ))}
              </SortableContext>
            ) : (
              rows.map((row) => (
                <StaticRow
                  key={row.id}
                  row={row}
                  contextMenuContent={contextMenuContent}
                  enableContextMenu={enableContextMenu}
                  stickyConfig={{
                    leftOffsets: stickyOffsets.leftOffsets,
                    rightOffsets: stickyOffsets.rightOffsets,
                    canScrollLeft: scrollState.canScrollLeft,
                    canScrollRight: scrollState.canScrollRight,
                  }}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {page !== undefined && pageSize !== undefined && total !== undefined && onPageChange && (
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

  if (enableDragSort) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {tableContent}
      </DndContext>
    );
  }

  return tableContent;
}
