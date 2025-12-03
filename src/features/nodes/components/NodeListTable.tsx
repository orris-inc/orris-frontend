/**
 * 节点列表表格组件（管理端）
 * 使用 TanStack Table 实现
 */

import { useMemo } from 'react';
import { Edit, Trash2, Key, Eye, Power, PowerOff, MoreHorizontal } from 'lucide-react';
import { DataTable, AdminBadge, type ColumnDef } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import type { Node } from '@/api/node';

interface NodeListTableProps {
  nodes: Node[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (node: Node) => void;
  onDelete: (node: Node) => void;
  onActivate: (node: Node) => void;
  onDeactivate: (node: Node) => void;
  onGenerateToken: (node: Node) => void;
  onViewDetail: (node: Node) => void;
}

// 状态配置
const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'default' | 'warning' | 'danger' }> = {
  active: { label: '激活', variant: 'success' },
  inactive: { label: '未激活', variant: 'default' },
  maintenance: { label: '维护中', variant: 'warning' },
  error: { label: '错误', variant: 'danger' },
};

// 协议标签
const PROTOCOL_LABELS: Record<string, string> = {
  shadowsocks: 'Shadowsocks',
  trojan: 'Trojan',
};

// 格式化时间
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const NodeListTable: React.FC<NodeListTableProps> = ({
  nodes,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onGenerateToken,
  onViewDetail,
}) => {
  const columns = useMemo<ColumnDef<Node>[]>(() => [
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
          <div className="font-medium text-slate-900 dark:text-white">{row.original.name}</div>
          {row.original.description && (
            <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'protocol',
      header: '协议',
      size: 100,
      cell: ({ row }) => (
        <AdminBadge variant="outline">
          {PROTOCOL_LABELS[row.original.protocol] || row.original.protocol}
        </AdminBadge>
      ),
    },
    {
      id: 'server',
      header: '服务器地址',
      size: 180,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
          {row.original.serverAddress}:{row.original.serverPort}
        </span>
      ),
    },
    {
      accessorKey: 'region',
      header: '地区',
      size: 72,
      cell: ({ row }) => (
        <span className="text-slate-700 dark:text-slate-300">
          {row.original.region || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'encryptionMethod',
      header: '加密方法',
      size: 120,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {row.original.encryptionMethod}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: '状态',
      size: 72,
      cell: ({ row }) => {
        const node = row.original;
        const statusConfig = STATUS_CONFIG[node.status] || { label: node.status, variant: 'default' as const };
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <AdminBadge
                  variant={statusConfig.variant}
                  onClick={() => node.status === 'active' ? onDeactivate(node) : onActivate(node)}
                >
                  {statusConfig.label}
                </AdminBadge>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {node.status === 'active' ? '点击停用' : '点击激活'}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      size: 140,
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
      cell: ({ row }) => {
        const node = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 group">
                <MoreHorizontal className="size-4 group-hover:scale-110 transition-transform" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetail(node)}>
                <Eye className="mr-2 size-4" />
                查看详情
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(node)}>
                <Edit className="mr-2 size-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onGenerateToken(node)}>
                <Key className="mr-2 size-4" />
                生成Token
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {node.status === 'active' ? (
                <DropdownMenuItem onClick={() => onDeactivate(node)}>
                  <PowerOff className="mr-2 size-4" />
                  停用
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onActivate(node)}>
                  <Power className="mr-2 size-4" />
                  激活
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(node)} className="text-red-600 dark:text-red-400">
                <Trash2 className="mr-2 size-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [onEdit, onDelete, onActivate, onDeactivate, onGenerateToken, onViewDetail]);

  return (
    <DataTable
      columns={columns}
      data={nodes}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyMessage="暂无节点数据"
      getRowId={(row) => String(row.id)}
    />
  );
};
