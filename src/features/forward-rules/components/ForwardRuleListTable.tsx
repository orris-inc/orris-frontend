/**
 * 转发规则列表表格组件（管理端）
 * 使用 TanStack Table 实现
 */

import { useMemo } from 'react';
import { Edit, Trash2, Eye, Power, PowerOff, MoreHorizontal, RotateCcw } from 'lucide-react';
import { DataTable, AdminBadge, type ColumnDef } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import type { ForwardRule } from '@/api/forward';

interface ForwardRuleListTableProps {
  rules: ForwardRule[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (rule: ForwardRule) => void;
  onDelete: (rule: ForwardRule) => void;
  onEnable: (rule: ForwardRule) => void;
  onDisable: (rule: ForwardRule) => void;
  onResetTraffic: (rule: ForwardRule) => void;
  onViewDetail: (rule: ForwardRule) => void;
}

// 状态配置
const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'default' }> = {
  enabled: { label: '已启用', variant: 'success' },
  disabled: { label: '已禁用', variant: 'default' },
};

// 协议标签
const PROTOCOL_LABELS: Record<string, string> = {
  tcp: 'TCP',
  udp: 'UDP',
  both: 'TCP/UDP',
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

// 格式化流量
const formatBytes = (bytes?: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

export const ForwardRuleListTable: React.FC<ForwardRuleListTableProps> = ({
  rules,
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
  onResetTraffic,
  onViewDetail,
}) => {
  const columns = useMemo<ColumnDef<ForwardRule>[]>(() => [
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
          {row.original.remark && (
            <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {row.original.remark}
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
      accessorKey: 'listenPort',
      header: '监听端口',
      size: 80,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
          {row.original.listenPort}
        </span>
      ),
    },
    {
      id: 'target',
      header: '目标地址',
      size: 180,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
          {row.original.targetAddress}:{row.original.targetPort}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: '状态',
      size: 72,
      cell: ({ row }) => {
        const rule = row.original;
        const statusConfig = STATUS_CONFIG[rule.status] || { label: rule.status, variant: 'default' as const };
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <AdminBadge
                  variant={statusConfig.variant}
                  onClick={() => rule.status === 'enabled' ? onDisable(rule) : onEnable(rule)}
                >
                  {statusConfig.label}
                </AdminBadge>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {rule.status === 'enabled' ? '点击禁用' : '点击启用'}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'upload',
      header: '上传流量',
      size: 100,
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {formatBytes(row.original.uploadBytes)}
        </span>
      ),
    },
    {
      id: 'download',
      header: '下载流量',
      size: 100,
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {formatBytes(row.original.downloadBytes)}
        </span>
      ),
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
        const rule = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 group">
                <MoreHorizontal className="size-4 group-hover:scale-110 transition-transform" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetail(rule)}>
                <Eye className="mr-2 size-4" />
                查看详情
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(rule)}>
                <Edit className="mr-2 size-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetTraffic(rule)}>
                <RotateCcw className="mr-2 size-4" />
                重置流量
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {rule.status === 'enabled' ? (
                <DropdownMenuItem onClick={() => onDisable(rule)}>
                  <PowerOff className="mr-2 size-4" />
                  禁用
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onEnable(rule)}>
                  <Power className="mr-2 size-4" />
                  启用
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(rule)} className="text-red-600 dark:text-red-400">
                <Trash2 className="mr-2 size-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [onEdit, onDelete, onEnable, onDisable, onResetTraffic, onViewDetail]);

  return (
    <DataTable
      columns={columns}
      data={rules}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyMessage="暂无转发规则数据"
      getRowId={(row) => String(row.id)}
    />
  );
};
