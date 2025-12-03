/**
 * 节点组列表表格组件（管理端）
 * 使用 TanStack Table 实现
 */

import { useMemo } from 'react';
import { Edit, Trash2, Eye, Network, MoreHorizontal } from 'lucide-react';
import { DataTable, AdminBadge, type ColumnDef } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import type { NodeGroup } from '@/api/node';
import { formatDateTime } from '@/shared/utils/date-utils';

interface NodeGroupListTableProps {
  nodeGroups: NodeGroup[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (group: NodeGroup) => void;
  onDelete: (group: NodeGroup) => void;
  onManageNodes: (group: NodeGroup) => void;
  onViewDetail: (group: NodeGroup) => void;
}

export const NodeGroupListTable = ({
  nodeGroups,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onManageNodes,
  onViewDetail,
}: NodeGroupListTableProps) => {
  const columns = useMemo<ColumnDef<NodeGroup>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 56,
      cell: ({ row }) => (
        <span className="font-mono text-slate-600 dark:text-slate-400">
          {row.original.id}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: '名称',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium text-slate-900 dark:text-white">
            {row.original.name}
          </div>
          {row.original.description && (
            <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'isPublic',
      header: '公开性',
      size: 72,
      cell: ({ row }) => (
        <AdminBadge variant={row.original.isPublic ? 'success' : 'default'}>
          {row.original.isPublic ? '公开' : '私有'}
        </AdminBadge>
      ),
    },
    {
      accessorKey: 'nodeCount',
      header: '节点数',
      size: 72,
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
          {row.original.nodeCount || 0}
        </span>
      ),
    },
    {
      accessorKey: 'sortOrder',
      header: '排序',
      size: 56,
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
          {row.original.sortOrder ?? '-'}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      size: 140,
      cell: ({ row }) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      size: 56,
      enableSorting: false,
      cell: ({ row }) => {
        const group = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 group">
                <MoreHorizontal className="size-4 group-hover:scale-110 transition-transform" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetail(group)}>
                <Eye className="mr-2 size-4" />
                查看详情
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageNodes(group)}>
                <Network className="mr-2 size-4" />
                管理节点
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(group)}>
                <Edit className="mr-2 size-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(group)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="mr-2 size-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [onEdit, onDelete, onManageNodes, onViewDetail]);

  return (
    <DataTable
      columns={columns}
      data={nodeGroups}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyMessage="暂无节点组数据"
      getRowId={(row) => String(row.id)}
    />
  );
};
