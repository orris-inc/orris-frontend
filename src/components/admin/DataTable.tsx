/**
 * 管理端数据表格组件
 * 基于 TanStack Table v8 实现
 * 保持与 AdminTable 一致的精致商务风格
 * 支持响应式列隐藏
 */

import { useState, useMemo } from 'react';
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
import { ChevronUp, ChevronDown, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminTablePagination } from './AdminTable';
import { useBreakpoint, type BreakpointKey } from '@/hooks/useBreakpoint';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuPortal,
  ContextMenuTrigger,
} from '@/components/common/ContextMenu';

// ============ 类型定义 ============

/**
 * 列的响应式配置
 * hideBelow: 在指定断点以下隐藏该列（保留向后兼容）
 * priority: 列优先级（1=必须显示，2=重要，3=次要，4=可选）
 * minWidth: 列最小宽度（像素）
 */
export interface ResponsiveColumnMeta {
  /** 在此断点以下隐藏 (xs < sm < md < lg < xl < 2xl) - 保留向后兼容 */
  hideBelow?: BreakpointKey | 'xs';
  /** 列优先级：1=必须显示，2=重要(>=640px)，3=次要(>=1024px)，4=可选(>=1280px) */
  priority?: 1 | 2 | 3 | 4;
  /** 列最小宽度（像素） */
  minWidth?: number;
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  loading?: boolean;
  // 服务端分页
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  // 排序
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  // 行选择
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (row: TData) => string;
  // 行点击
  onRowClick?: (row: TData) => void;
  // 空状态
  emptyMessage?: string;
  // 右键菜单
  contextMenuContent?: (row: TData) => React.ReactNode;
  enableContextMenu?: boolean;
}

// ============ 断点优先级 ============
const BREAKPOINT_ORDER: (BreakpointKey | 'xs')[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

/**
 * 优先级对应的最小断点映射
 * priority 1: 始终显示
 * priority 2: >= sm (640px)
 * priority 3: >= lg (1024px)
 * priority 4: >= xl (1280px)
 */
const PRIORITY_TO_BREAKPOINT: Record<number, BreakpointKey | 'xs'> = {
  1: 'xs',  // 始终显示
  2: 'sm',  // >= 640px
  3: 'lg',  // >= 1024px
  4: 'xl',  // >= 1280px
};

/**
 * 判断当前断点是否应该显示列（兼容 hideBelow 和 priority）
 */
const shouldShowColumn = (
  meta: ResponsiveColumnMeta | undefined,
  currentBreakpoint: BreakpointKey | 'xs'
): boolean => {
  if (!meta) return true;

  // 如果设置了 priority，使用优先级逻辑
  if (meta.priority !== undefined) {
    const requiredBreakpoint = PRIORITY_TO_BREAKPOINT[meta.priority] || 'sm';
    const requiredIndex = BREAKPOINT_ORDER.indexOf(requiredBreakpoint);
    const currentIndex = BREAKPOINT_ORDER.indexOf(currentBreakpoint);
    const showByPriority = currentIndex >= requiredIndex;

    // 如果同时设置了 hideBelow，取更严格的条件
    if (meta.hideBelow) {
      const hideIndex = BREAKPOINT_ORDER.indexOf(meta.hideBelow);
      const showByHideBelow = currentIndex >= hideIndex;
      return showByPriority && showByHideBelow;
    }

    return showByPriority;
  }

  // 兼容旧的 hideBelow 配置
  if (meta.hideBelow) {
    const hideIndex = BREAKPOINT_ORDER.indexOf(meta.hideBelow);
    const currentIndex = BREAKPOINT_ORDER.indexOf(currentBreakpoint);
    return currentIndex >= hideIndex;
  }

  // 没有设置任何配置，默认为 priority 2（重要列）
  const defaultBreakpoint = PRIORITY_TO_BREAKPOINT[2];
  const requiredIndex = BREAKPOINT_ORDER.indexOf(defaultBreakpoint);
  const currentIndex = BREAKPOINT_ORDER.indexOf(currentBreakpoint);
  return currentIndex >= requiredIndex;
};

// ============ DataTable 组件 ============

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
  emptyMessage = '暂无数据',
  contextMenuContent,
  enableContextMenu = false,
}: DataTableProps<TData>) {
  // 响应式断点
  const { current: currentBreakpoint } = useBreakpoint();

  // 内部排序状态（如果外部未提供）
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sorting = externalSorting ?? internalSorting;
  const setSorting = onSortingChange ?? setInternalSorting;

  // 根据当前断点过滤可见列
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

  const colCount = visibleColumns.length;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm border-separate border-spacing-0">
          <thead className={cn(
            'bg-gradient-to-b from-slate-50 to-slate-50/80 dark:from-slate-800/50 dark:to-slate-800/30',
            'border-b-2 border-slate-200/60 dark:border-slate-700/60'
          )}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      style={{ width: header.column.columnDef.size }}
                      className={cn(
                        'px-4 py-3.5 font-medium',
                        'text-sm text-slate-600 dark:text-slate-300',
                        'whitespace-nowrap text-left',
                        'first:rounded-tl-lg last:rounded-tr-lg',
                        canSort && 'cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors'
                      )}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-1.5">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-slate-400">
                            {sorted === 'asc' ? (
                              <ChevronUp className="size-4" />
                            ) : sorted === 'desc' ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronsUpDown className="size-3.5 opacity-50" />
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
          <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
            {loading && data.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <Loader2 className="size-9 animate-spin text-indigo-500" strokeWidth={2.5} />
                      <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">加载中...</p>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="size-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-inner">
                        <svg className="size-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-200/20 to-transparent dark:from-slate-700/20 blur-xl -z-10" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const rowContent = (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      'group transition-all duration-200',
                      'hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-transparent',
                      'dark:hover:from-slate-800/40 dark:hover:to-transparent',
                      'hover:shadow-[0_1px_3px_-1px_rgba(0,0,0,0.05)]',
                      onRowClick && 'cursor-pointer',
                      row.getIsSelected() && 'bg-gradient-to-r from-indigo-50/60 to-transparent dark:from-indigo-900/20 dark:to-transparent'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          'px-4 py-3.5 text-slate-700 dark:text-slate-200',
                          'align-top',
                          'transition-colors duration-200'
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );

                // 如果启用了右键菜单，用 ContextMenu 包裹
                if (enableContextMenu && contextMenuContent) {
                  return (
                    <ContextMenu key={row.id}>
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
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
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
    </>
  );
}

// ============ 导出类型供外部使用 ============
export type { ColumnDef, SortingState, RowSelectionState };
