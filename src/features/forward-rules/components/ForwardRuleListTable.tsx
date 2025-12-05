/**
 * 转发规则列表表格组件（管理端）
 * 使用 TanStack Table 实现，支持响应式列隐藏
 */

import { useMemo } from 'react';
import { Edit, Trash2, Eye, Power, PowerOff, MoreHorizontal, RotateCcw } from 'lucide-react';
import { DataTable, AdminBadge, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import type { ForwardRule, ForwardAgent } from '@/api/forward';

interface ForwardRuleListTableProps {
  rules: ForwardRule[];
  agentsMap?: Record<number, ForwardAgent>;
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

// 规则类型标签
const RULE_TYPE_LABELS: Record<string, string> = {
  direct: '直连',
  entry: '入口',
  exit: '出口',
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
  agentsMap = {},
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
  const columns = useMemo<ColumnDef<ForwardRule, unknown>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 56,
      meta: { priority: 4 } as ResponsiveColumnMeta, // 可选列 >= 1280px
      cell: ({ row }) => (
        <span className="font-mono text-slate-600 dark:text-slate-400">
          {row.original.id}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: '名称',
      size: 120,
      meta: { priority: 1 } as ResponsiveColumnMeta, // 核心列，始终显示
      cell: ({ row }) => (
        <div className="space-y-1 min-w-0">
          <div className="font-medium text-slate-900 dark:text-white truncate">{row.original.name}</div>
          {row.original.remark && (
            <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {row.original.remark}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'ruleType',
      header: '类型',
      size: 72,
      meta: { priority: 1 } as ResponsiveColumnMeta, // 核心列，始终显示
      cell: ({ row }) => (
        <AdminBadge variant="outline">
          {RULE_TYPE_LABELS[row.original.ruleType] || row.original.ruleType}
        </AdminBadge>
      ),
    },
    {
      accessorKey: 'protocol',
      header: '协议',
      size: 80,
      meta: { priority: 2 } as ResponsiveColumnMeta, // 重要列 >= 640px
      cell: ({ row }) => (
        <AdminBadge variant="outline">
          {PROTOCOL_LABELS[row.original.protocol] || row.original.protocol}
        </AdminBadge>
      ),
    },
    {
      accessorKey: 'listenPort',
      header: '端口',
      size: 72,
      meta: { priority: 1 } as ResponsiveColumnMeta, // 核心列，始终显示
      cell: ({ row }) => (
        <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
          {row.original.listenPort}
        </span>
      ),
    },
    {
      id: 'connectAddress',
      header: '连接地址',
      size: 180,
      meta: { priority: 2 } as ResponsiveColumnMeta, // 重要列 >= 640px
      cell: ({ row }) => {
        const rule = row.original;
        const agent = agentsMap[rule.agentId];
        if (!agent?.publicAddress) {
          return <span className="text-slate-400 dark:text-slate-500">-</span>;
        }
        const connectAddress = `${agent.publicAddress}:${rule.listenPort}`;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-mono text-sm text-blue-600 dark:text-blue-400 truncate block max-w-[160px] cursor-pointer hover:underline">
                {connectAddress}
              </span>
            </TooltipTrigger>
            <TooltipContent className="font-mono">{connectAddress}</TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'target',
      header: '目标',
      size: 140,
      meta: { priority: 3 } as ResponsiveColumnMeta, // 次要列 >= 1024px
      cell: ({ row }) => {
        const rule = row.original;
        // entry 类型显示出口节点ID
        if (rule.ruleType === 'entry') {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate block max-w-[120px]">
                  出口: {rule.exitAgentId}
                </span>
              </TooltipTrigger>
              <TooltipContent>出口节点: {rule.exitAgentId}</TooltipContent>
            </Tooltip>
          );
        }
        // 使用节点ID
        if (rule.targetNodeId) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate block max-w-[120px]">
                  节点: {rule.targetNodeId}
                </span>
              </TooltipTrigger>
              <TooltipContent>目标节点: {rule.targetNodeId}</TooltipContent>
            </Tooltip>
          );
        }
        // 手动输入的地址
        const fullTarget = `${rule.targetAddress}:${rule.targetPort}`;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-mono text-sm text-slate-700 dark:text-slate-300 truncate block max-w-[120px]">
                {fullTarget}
              </span>
            </TooltipTrigger>
            <TooltipContent className="font-mono">{fullTarget}</TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'status',
      header: '状态',
      size: 88,
      meta: { priority: 1 } as ResponsiveColumnMeta, // 核心列，始终显示
      cell: ({ row }) => {
        const rule = row.original;
        const statusConfig = STATUS_CONFIG[rule.status] || { label: rule.status, variant: 'default' as const };
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <AdminBadge
                  variant={statusConfig.variant}
                  className="whitespace-nowrap"
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
      header: '上传',
      size: 90,
      meta: { priority: 3 } as ResponsiveColumnMeta, // 次要列 >= 1024px
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {formatBytes(row.original.uploadBytes)}
        </span>
      ),
    },
    {
      id: 'download',
      header: '下载',
      size: 90,
      meta: { priority: 3 } as ResponsiveColumnMeta, // 次要列 >= 1024px
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {formatBytes(row.original.downloadBytes)}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      size: 130,
      meta: { priority: 4 } as ResponsiveColumnMeta, // 可选列 >= 1280px
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
      meta: { priority: 1 } as ResponsiveColumnMeta, // 核心列，始终显示
      enableSorting: false,
      cell: ({ row }) => {
        const rule = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 group touch-target">
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
  ], [agentsMap, onEdit, onDelete, onEnable, onDisable, onResetTraffic, onViewDetail]);

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
