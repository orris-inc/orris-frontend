/**
 * 转发节点列表表格组件（管理端）
 * 使用 TanStack Table 实现
 */

import { useMemo, useState } from 'react';
import { Edit, Trash2, Key, Eye, Power, PowerOff, MoreHorizontal, Terminal, Copy, Check } from 'lucide-react';
import { DataTable, AdminBadge, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { SystemStatusDisplay } from '@/components/common/SystemStatusDisplay';
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

// 可复制地址组件（支持长地址截断和 Tooltip 显示完整内容）
const CopyableAddress: React.FC<{ address: string; className?: string; maxLength?: number }> = ({
  address,
  className = '',
  maxLength = 20,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (address && address !== '-') {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!address || address === '-') {
    return <span className={className}>-</span>;
  }

  // 判断是否需要截断显示
  const needsTruncate = address.length > maxLength;
  const displayAddress = needsTruncate
    ? `${address.slice(0, 8)}...${address.slice(-6)}`
    : address;

  const content = (
    <span className={`inline-flex items-center gap-1 group ${className}`}>
      <span className="truncate">{displayAddress}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-all flex-shrink-0"
        title="复制地址"
      >
        {copied ? (
          <Check className="size-3 text-green-500" />
        ) : (
          <Copy className="size-3 text-slate-400" />
        )}
      </button>
    </span>
  );

  // 如果地址被截断，使用 Tooltip 显示完整地址
  if (needsTruncate) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent className="font-mono text-xs max-w-xs break-all">
          {address}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
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
      size: 180,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        const addressContent = (
          <CopyableAddress
            address={agent.publicAddress || '-'}
            className="font-mono text-sm text-slate-700 dark:text-slate-300"
          />
        );

        if (agent.tunnelAddress) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="min-w-0 cursor-help">{addressContent}</div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <div className="text-xs text-slate-400">隧道地址</div>
                  <CopyableAddress
                    address={agent.tunnelAddress}
                    className="font-mono text-xs"
                    maxLength={50}
                  />
                </div>
              </TooltipContent>
            </Tooltip>
          );
        }

        return <div className="min-w-0">{addressContent}</div>;
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
        return (
          <SystemStatusDisplay
            status={status ? {
              cpu: status.cpuPercent,
              memory: status.memoryPercent,
              disk: status.diskPercent,
              uptime: status.uptimeSeconds,
            } : null}
          />
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
