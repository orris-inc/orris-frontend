/**
 * Forward Agent List Table Component (Admin)
 * Implemented using TanStack Table
 * Switches to mobile card list on small screens
 */

import { useMemo, useState, useCallback } from 'react';
import { Edit, Trash2, Key, Eye, Power, PowerOff, MoreHorizontal, Terminal, Copy, Check, Download, Loader2, Package, ArrowUpCircle } from 'lucide-react';
import { DataTable, AdminBadge, TruncatedId, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { ForwardAgentMobileList } from './ForwardAgentMobileList';
import { Badge } from '@/components/common/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/common/ContextMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import type { ForwardAgent } from '@/api/forward';
import type { ResourceGroup } from '@/api/resource/types';

interface ForwardAgentListTableProps {
  forwardAgents: ForwardAgent[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  resourceGroupsMap?: Record<string, ResourceGroup>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (agent: ForwardAgent) => void;
  onDelete: (agent: ForwardAgent) => void;
  onEnable: (agent: ForwardAgent) => void;
  onDisable: (agent: ForwardAgent) => void;
  onRegenerateToken: (agent: ForwardAgent) => void;
  onGetInstallScript: (agent: ForwardAgent) => void;
  onViewDetail: (agent: ForwardAgent) => void;
  onCopy: (agent: ForwardAgent) => void;
  onCheckUpdate: (agent: ForwardAgent) => void;
  checkingAgentId?: string | number | null;
}

// Copyable address component (supports long address truncation and Tooltip for full content)
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

  // Check if truncation is needed
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

  // If address is truncated, use Tooltip to show full address
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

// Format date
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

// Format bytes rate to human readable (per second)
const formatBytesRate = (bytesPerSec?: number): string => {
  if (!bytesPerSec || bytesPerSec <= 0) return '0';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(1024));
  const value = bytesPerSec / Math.pow(1024, i);
  return `${value < 10 ? value.toFixed(1) : Math.round(value)}${units[i]}`;
};

// Format bytes to human readable (total)
const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 ? value.toFixed(2) : value.toFixed(1)} ${units[i]}`;
};

export const ForwardAgentListTable: React.FC<ForwardAgentListTableProps> = ({
  forwardAgents,
  loading = false,
  page,
  pageSize,
  total,
  resourceGroupsMap = {},
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onEnable,
  onDisable,
  onRegenerateToken,
  onGetInstallScript,
  onViewDetail,
  onCopy,
  onCheckUpdate,
  checkingAgentId,
}) => {
  // Detect mobile screen
  const { isMobile } = useBreakpoint();

  // Forward agent context menu content
  const renderContextMenuActions = useCallback((agent: ForwardAgent) => (
    <>
      <ContextMenuItem onClick={() => onCopy(agent)}>
        <Copy className="mr-2 size-4" />
        复制节点
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onRegenerateToken(agent)}>
        <Key className="mr-2 size-4" />
        重新生成Token
      </ContextMenuItem>
      {agent.status === 'enabled' && (
        <ContextMenuItem
          onClick={() => onCheckUpdate(agent)}
          disabled={checkingAgentId === agent.id}
        >
          {checkingAgentId === agent.id ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          {checkingAgentId === agent.id ? '检查中...' : '检查更新'}
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      {agent.status === 'enabled' ? (
        <ContextMenuItem onClick={() => onDisable(agent)}>
          <PowerOff className="mr-2 size-4" />
          禁用
        </ContextMenuItem>
      ) : (
        <ContextMenuItem onClick={() => onEnable(agent)}>
          <Power className="mr-2 size-4" />
          启用
        </ContextMenuItem>
      )}
      <ContextMenuItem onClick={() => onDelete(agent)} className="text-red-600 dark:text-red-400">
        <Trash2 className="mr-2 size-4" />
        删除
      </ContextMenuItem>
    </>
  ), [onCopy, onRegenerateToken, onCheckUpdate, checkingAgentId, onEnable, onDisable, onDelete]);

  // Forward agent dropdown menu content
  const renderDropdownMenuActions = useCallback((agent: ForwardAgent) => (
    <>
      <DropdownMenuItem onClick={() => onCopy(agent)}>
        <Copy className="mr-2 size-4" />
        复制节点
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onRegenerateToken(agent)}>
        <Key className="mr-2 size-4" />
        重新生成Token
      </DropdownMenuItem>
      {agent.status === 'enabled' && (
        <DropdownMenuItem
          onClick={() => onCheckUpdate(agent)}
          disabled={checkingAgentId === agent.id}
        >
          {checkingAgentId === agent.id ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          {checkingAgentId === agent.id ? '检查中...' : '检查更新'}
        </DropdownMenuItem>
      )}
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
    </>
  ), [onCopy, onRegenerateToken, onCheckUpdate, checkingAgentId, onEnable, onDisable, onDelete]);

  const columns = useMemo<ColumnDef<ForwardAgent>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 120,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => <TruncatedId id={row.original.id} />,
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
      header: '监控',
      size: 160,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        const status = agent.systemStatus;

        if (!status) {
          return <span className="text-xs text-muted-foreground/50">-</span>;
        }

        const totalConnections = (status.tcpConnections || 0) + (status.udpConnections || 0);
        const cpuPercent = status.cpuPercent ?? 0;
        const memoryPercent = status.memoryPercent ?? 0;
        const diskPercent = status.diskPercent ?? 0;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-2.5 cursor-default">
                {/* System mini bars */}
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-muted-foreground/70 leading-none">C</span>
                    <div className="w-6 h-1 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${cpuPercent >= 80 ? 'bg-red-500' : cpuPercent >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(cpuPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-muted-foreground/70 leading-none">M</span>
                    <div className="w-6 h-1 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${memoryPercent >= 80 ? 'bg-red-500' : memoryPercent >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(memoryPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-muted-foreground/70 leading-none">D</span>
                    <div className="w-6 h-1 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${diskPercent >= 80 ? 'bg-red-500' : diskPercent >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(diskPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                {/* Network rates */}
                <div className="w-px h-4 bg-border" />
                <div className="flex flex-col gap-0 min-w-[52px]">
                  <span className="text-[10px] font-mono text-success leading-tight">
                    ↓{formatBytesRate(status.networkRxRate)}
                  </span>
                  <span className="text-[10px] font-mono text-info leading-tight">
                    ↑{formatBytesRate(status.networkTxRate)}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="w-64">
              <div className="space-y-2.5 text-xs">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">系统监控</span>
                </div>
                {/* System stats */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">CPU</span>
                    <span className="font-mono">{cpuPercent.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">内存</span>
                    <span className="font-mono">
                      {memoryPercent.toFixed(1)}%
                      {status.memoryUsed !== undefined && status.memoryTotal !== undefined && (
                        <span className="text-muted-foreground ml-1">({formatBytes(status.memoryUsed)}/{formatBytes(status.memoryTotal)})</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">磁盘</span>
                    <span className="font-mono">
                      {diskPercent.toFixed(1)}%
                      {status.diskUsed !== undefined && status.diskTotal !== undefined && (
                        <span className="text-muted-foreground ml-1">({formatBytes(status.diskUsed)}/{formatBytes(status.diskTotal)})</span>
                      )}
                    </span>
                  </div>
                  {status.loadAvg1 !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">负载</span>
                      <span className="font-mono">{status.loadAvg1.toFixed(2)} / {status.loadAvg5?.toFixed(2)} / {status.loadAvg15?.toFixed(2)}</span>
                    </div>
                  )}
                  {status.uptimeSeconds !== undefined && status.uptimeSeconds > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">运行</span>
                      <span className="font-mono">{Math.floor(status.uptimeSeconds / 86400)}d {Math.floor((status.uptimeSeconds % 86400) / 3600)}h</span>
                    </div>
                  )}
                </div>
                {/* Network stats */}
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">下载</span>
                    <span className="font-mono text-success">{formatBytesRate(status.networkRxRate)}/s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">上传</span>
                    <span className="font-mono text-info">{formatBytesRate(status.networkTxRate)}/s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">累计</span>
                    <span className="font-mono text-[11px]">↓{formatBytes(status.networkRxBytes)} ↑{formatBytes(status.networkTxBytes)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">连接</span>
                    <span className="font-mono">{totalConnections} (TCP:{status.tcpConnections || 0} UDP:{status.udpConnections || 0})</span>
                  </div>
                </div>
                {/* Forward stats */}
                {(status.activeRules !== undefined || status.activeConnections !== undefined) && (
                  <div className="space-y-1.5 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">活跃规则</span>
                      <span className="font-mono">{status.activeRules ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">活跃连接</span>
                      <span className="font-mono">{status.activeConnections ?? 0}</span>
                    </div>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'resourceGroup',
      header: '资源组',
      size: 120,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        if (!agent.groupId) {
          return <span className="text-xs text-slate-400">-</span>;
        }
        const group = resourceGroupsMap[agent.groupId];
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs truncate max-w-[100px]">
                {group?.name || agent.groupId}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <div>{group?.name || '未知资源组'}</div>
                <div className="text-xs text-slate-400 font-mono">{agent.groupId}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'version',
      header: '版本',
      size: 100,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        // Use agentVersion field directly (extracted from systemStatus by backend)
        const version = agent.agentVersion || agent.systemStatus?.agentVersion;
        const platform = agent.systemStatus?.platform;
        const arch = agent.systemStatus?.arch;

        if (!version) {
          return <span className="text-xs text-slate-400">-</span>;
        }

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-default">
                {agent.hasUpdate ? (
                  <ArrowUpCircle className="size-3.5 text-amber-500" />
                ) : (
                  <Package className="size-3.5 text-slate-400" />
                )}
                <span className={`text-xs font-mono ${agent.hasUpdate ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
                  v{version}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <div className="text-xs">版本: v{version}</div>
                {platform && arch && (
                  <div className="text-xs text-slate-400">{platform}/{arch}</div>
                )}
                {agent.hasUpdate && (
                  <div className="text-xs text-amber-500">有新版本可用</div>
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
                {renderDropdownMenuActions(agent)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [onEdit, onDisable, onEnable, onGetInstallScript, onViewDetail, renderDropdownMenuActions, resourceGroupsMap]);

  // Render mobile card list on small screens
  if (isMobile) {
    return (
      <ForwardAgentMobileList
        forwardAgents={forwardAgents}
        loading={loading}
        resourceGroupsMap={resourceGroupsMap}
        onEdit={onEdit}
        onDelete={onDelete}
        onEnable={onEnable}
        onDisable={onDisable}
        onRegenerateToken={onRegenerateToken}
        onGetInstallScript={onGetInstallScript}
        onViewDetail={onViewDetail}
        onCopy={onCopy}
        onCheckUpdate={onCheckUpdate}
        checkingAgentId={checkingAgentId}
      />
    );
  }

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
      enableContextMenu={true}
      contextMenuContent={renderContextMenuActions}
    />
  );
};
