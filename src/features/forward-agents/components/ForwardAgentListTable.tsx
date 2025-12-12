/**
 * 转发节点列表表格组件（管理端）
 * 使用 TanStack Table 实现
 */

import { useMemo } from 'react';
import { Edit, Trash2, Key, Eye, Power, PowerOff, MoreHorizontal, Terminal, Cpu, MemoryStick } from 'lucide-react';
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
  onGetInstallScript: (agent: ForwardAgent) => void;
  onViewDetail: (agent: ForwardAgent) => void;
}

// 格式化运行时间
const formatUptime = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}天${hours}时`;
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}时${minutes}分`;
  return `${minutes}分钟`;
};

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
  onGetInstallScript,
  onViewDetail,
}) => {
  const columns = useMemo<ColumnDef<ForwardAgent>[]>(() => [
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
      header: '地址',
      size: 160,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <div className="space-y-0.5">
            <div className="font-mono text-sm text-slate-700 dark:text-slate-300">
              {agent.publicAddress || '-'}
            </div>
            {agent.tunnelAddress && (
              <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                隧道: {agent.tunnelAddress}
              </div>
            )}
          </div>
        );
      },
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
      id: 'systemStatus',
      header: '系统状态',
      size: 160,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        const status = agent.systemStatus;

        if (!status) {
          return <span className="text-xs text-slate-400">暂无数据</span>;
        }

        const getHealthLevel = (value: number) => {
          if (value >= 80) return 'high';
          if (value >= 60) return 'medium';
          return 'low';
        };

        const cpuLevel = getHealthLevel(status.cpuPercent);
        const memLevel = getHealthLevel(status.memoryPercent);

        const overallHealth = cpuLevel === 'high' || memLevel === 'high' ? 'high'
          : cpuLevel === 'medium' || memLevel === 'medium' ? 'medium'
          : 'low';

        const healthColors = {
          low: 'text-green-600 dark:text-green-400',
          medium: 'text-yellow-600 dark:text-yellow-400',
          high: 'text-red-600 dark:text-red-400',
        };

        const healthBg = {
          low: 'bg-green-50 dark:bg-green-900/20',
          medium: 'bg-yellow-50 dark:bg-yellow-900/20',
          high: 'bg-red-50 dark:bg-red-900/20',
        };

        return (
          <Tooltip>
            <TooltipTrigger>
              <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md ${healthBg[overallHealth]}`}>
                <div className="flex items-center gap-1">
                  <Cpu className={`h-3.5 w-3.5 ${healthColors[cpuLevel]}`} />
                  <span className={`text-xs font-medium ${healthColors[cpuLevel]}`}>{status.cpuPercent.toFixed(1)}%</span>
                </div>
                <div className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                <div className="flex items-center gap-1">
                  <MemoryStick className={`h-3.5 w-3.5 ${healthColors[memLevel]}`} />
                  <span className={`text-xs font-medium ${healthColors[memLevel]}`}>{status.memoryPercent.toFixed(1)}%</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">CPU</span>
                  <span className="font-mono">{status.cpuPercent.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">内存</span>
                  <span className="font-mono">{status.memoryPercent.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">磁盘</span>
                  <span className="font-mono">{status.diskPercent.toFixed(1)}%</span>
                </div>
                {status.uptimeSeconds > 0 && (
                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-700">
                    <span className="text-slate-400">运行时间</span>
                    <span>{formatUptime(status.uptimeSeconds)}</span>
                  </div>
                )}
              </div>
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
      size: 140,
      enableSorting: false,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onViewDetail(agent)}
                  className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                >
                  <Eye className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>查看详情</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onEdit(agent)}
                  className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                >
                  <Edit className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>编辑</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onGetInstallScript(agent)}
                  className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                >
                  <Terminal className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>获取安装脚本</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200">
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
          </div>
        );
      },
    },
  ], [onEdit, onDelete, onEnable, onDisable, onRegenerateToken, onGetInstallScript, onViewDetail]);

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
