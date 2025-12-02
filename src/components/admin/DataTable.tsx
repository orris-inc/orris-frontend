/**
 * 管理端数据表格组件
 * 基于 TanStack Table v8 实现
 * 保持与 AdminTable 一致的精致商务风格
 */

import { useState } from 'react';
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

// ============ 类型定义 ============

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
}

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
}: DataTableProps<TData>) {
  // 内部排序状态（如果外部未提供）
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sorting = externalSorting ?? internalSorting;
  const setSorting = onSortingChange ?? setInternalSorting;

  const table = useReactTable({
    data,
    columns,
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

  const colCount = columns.length;

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
              table.getRowModel().rows.map((row) => (
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
                        'align-middle',
                        'transition-colors duration-200'
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
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

// ============ 导出 ColumnDef 类型供外部使用 ============
export type { ColumnDef, SortingState, RowSelectionState };
