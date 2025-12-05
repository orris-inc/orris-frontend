/**
 * 转发节点列表表格组件（管理端）
 * 使用 TanStack Table 实现
 */

import { useMemo } from 'react';
import { Edit, Trash2, Key, Eye, Power, PowerOff, MoreHorizontal } from 'lucide-react';
import { DataTable, AdminBadge, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import type { ForwardAgent } from '@/api/forward';

interface ForwardAgentListTableProps {
  forwardAgents: ForwardAgent[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (agent: ForwardAgent) => void;
  onDelete: (agent: ForwardAgent) => void;
  onEnable: (agent: ForwardAgent) => void;
  onDisable: (agent: ForwardAgent) => void;
  onRegenerateToken: (agent: ForwardAgent) => void;
  onViewDetail: (agent: ForwardAgent) => void;
}

// 格式化时间
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ForwardAgentListTable: React.FC<ForwardAgentListTableProps> = ({
  forwardAgents,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onEnable,
  onDisable,
  onRegenerateToken,
  onViewDetail,
}) => {
  const columns = useMemo<ColumnDef<ForwardAgent>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 56,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <span className="font-mono text-slate-600 dark:text-slate-400">
          {row.original.id}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: '名称',
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium text-slate-900 dark:text-white">{row.original.name}</div>
          {row.original.remark && (
            <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {row.original.remark}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'publicAddress',
      header: '公网地址',
      size: 140,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
          {row.original.publicAddress || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: '状态',
      size: 72,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <AdminBadge
                  variant={agent.status === 'enabled' ? 'success' : 'default'}
                  onClick={() => agent.status === 'enabled' ? onDisable(agent) : onEnable(agent)}
                >
                  {agent.status === 'enabled' ? '启用' : '禁用'}
                </AdminBadge>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {agent.status === 'enabled' ? '点击禁用' : '点击启用'}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      size: 140,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      size: 56,
      enableSorting: false,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 group">
                <MoreHorizontal className="size-4 group-hover:scale-110 transition-transform" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetail(agent)}>
                <Eye className="mr-2 size-4" />
                查看详情
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(agent)}>
                <Edit className="mr-2 size-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRegenerateToken(agent)}>
                <Key className="mr-2 size-4" />
                重新生成Token
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {agent.status === 'enabled' ? (
                <DropdownMenuItem onClick={() => onDisable(agent)}>
                  <PowerOff className="mr-2 size-4" />
                  禁用
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onEnable(agent)}>
                  <Power className="mr-2 size-4" />
                  启用
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(agent)} className="text-red-600 dark:text-red-400">
                <Trash2 className="mr-2 size-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [onEdit, onDelete, onEnable, onDisable, onRegenerateToken, onViewDetail]);

  return (
    <DataTable
      columns={columns}
      data={forwardAgents}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyMessage="暂无转发节点数据"
      getRowId={(row) => String(row.id)}
    />
  );
};
