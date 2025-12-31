/**
 * Node list table component (admin)
 * Designed based on Node API type definitions
 * Switches to mobile card list on small screens
 */

import { useMemo, useCallback } from 'react';
import {
  Edit,
  Trash2,
  Key,
  Eye,
  Power,
  PowerOff,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wrench,
  Terminal,
  Copy,
  User,
  Shield,
  Package,
  ArrowUpCircle,
} from 'lucide-react';
import { DataTable, AdminBadge, TruncatedId, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { NodeMobileList } from './NodeMobileList';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Badge } from '@/components/common/Badge';
import { SystemStatusDisplay } from '@/components/common/SystemStatusDisplay';
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/common/ContextMenu';
import type { Node, NodeStatus } from '@/api/node';
import type { ResourceGroup } from '@/api/resource/types';

interface NodeListTableProps {
  nodes: Node[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  resourceGroupsMap?: Record<string, ResourceGroup>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (node: Node) => void;
  onDelete: (node: Node) => void;
  onActivate: (node: Node) => void;
  onDeactivate: (node: Node) => void;
  onGenerateToken: (node: Node) => void;
  onGetInstallScript: (node: Node) => void;
  onViewDetail: (node: Node) => void;
  onCopy: (node: Node) => void;
}

// Status configuration
const STATUS_CONFIG: Record<NodeStatus, { label: string; variant: 'success' | 'default' | 'warning'; icon: React.ElementType }> = {
  active: { label: '激活', variant: 'success', icon: CheckCircle2 },
  inactive: { label: '未激活', variant: 'default', icon: XCircle },
  maintenance: { label: '维护中', variant: 'warning', icon: Wrench },
};

// Protocol configuration
const PROTOCOL_CONFIG: Record<string, { label: string; color: string }> = {
  shadowsocks: { label: 'SS', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  trojan: { label: 'Trojan', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};


// Format date
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('zh-CN', {
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
  resourceGroupsMap = {},
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onGenerateToken,
  onGetInstallScript,
  onViewDetail,
  onCopy,
}) => {
  // Detect mobile screen
  const { isMobile } = useBreakpoint();

  // Node context menu content
  const renderContextMenuActions = useCallback((node: Node) => (
    <>
      <ContextMenuItem onClick={() => onEdit(node)}>
        <Edit className="mr-2 size-4" />
        编辑
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onCopy(node)}>
        <Copy className="mr-2 size-4" />
        复制节点
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onGenerateToken(node)}>
        <Key className="mr-2 size-4" />
        生成 Token
      </ContextMenuItem>
      <ContextMenuSeparator />
      {node.status === 'active' ? (
        <ContextMenuItem onClick={() => onDeactivate(node)}>
          <PowerOff className="mr-2 size-4" />
          停用节点
        </ContextMenuItem>
      ) : (
        <ContextMenuItem onClick={() => onActivate(node)}>
          <Power className="mr-2 size-4" />
          激活节点
        </ContextMenuItem>
      )}
      <ContextMenuItem onClick={() => onDelete(node)} className="text-red-600 dark:text-red-400">
        <Trash2 className="mr-2 size-4" />
        删除节点
      </ContextMenuItem>
    </>
  ), [onEdit, onCopy, onGenerateToken, onActivate, onDeactivate, onDelete]);

  // Node dropdown menu content
  const renderDropdownMenuActions = useCallback((node: Node) => (
    <>
      <DropdownMenuItem onClick={() => onCopy(node)}>
        <Copy className="mr-2 size-4" />
        复制节点
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onGenerateToken(node)}>
        <Key className="mr-2 size-4" />
        生成 Token
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      {node.status === 'active' ? (
        <DropdownMenuItem onClick={() => onDeactivate(node)}>
          <PowerOff className="mr-2 size-4" />
          停用节点
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onClick={() => onActivate(node)}>
          <Power className="mr-2 size-4" />
          激活节点
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={() => onDelete(node)} className="text-red-600 dark:text-red-400">
        <Trash2 className="mr-2 size-4" />
        删除节点
      </DropdownMenuItem>
    </>
  ), [onCopy, onGenerateToken, onActivate, onDeactivate, onDelete]);

  const columns = useMemo<ColumnDef<Node>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 120,
      meta: { priority: 4 } as ResponsiveColumnMeta, // Optional column >= 1280px
      cell: ({ row }) => <TruncatedId id={row.original.id} />,
    },
    {
      accessorKey: 'name',
      header: '节点',
      size: 160,
      meta: { priority: 1 } as ResponsiveColumnMeta, // Core column, always visible
      cell: ({ row }) => {
        const node = row.original;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-slate-900 dark:text-white whitespace-nowrap">
              {node.name}
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              <span className="font-mono">{node.serverAddress}:{node.agentPort}</span>
              {node.region && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span>{node.region}</span>
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'config',
      header: '配置',
      size: 160,
      meta: { priority: 3 } as ResponsiveColumnMeta, // Secondary column >= 1024px
      cell: ({ row }) => {
        const node = row.original;
        const protocolConfig = PROTOCOL_CONFIG[node.protocol] || { label: node.protocol, color: 'bg-gray-100 text-gray-700' };

        if (node.protocol === 'shadowsocks') {
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${protocolConfig.color}`}>
                  {protocolConfig.label}
                </span>
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  {node.encryptionMethod || '-'}
                </span>
              </div>
              {node.plugin && (
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  + {node.plugin}
                </div>
              )}
            </div>
          );
        }
        // Trojan displays transport protocol and TLS configuration
        const transport = node.transportProtocol?.toUpperCase() || 'TCP';
        return (
          <Tooltip>
            <TooltipTrigger>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${protocolConfig.color}`}>
                    {protocolConfig.label}
                  </span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                    {transport} + TLS
                  </span>
                </div>
                {node.sni && (
                  <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                    SNI: {node.sni}
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                <div>传输协议: {transport}</div>
                {node.sni && <div>SNI: {node.sni}</div>}
                {node.host && <div>Host: {node.host}</div>}
                {node.path && <div>Path: {node.path}</div>}
                {node.allowInsecure && <div className="text-yellow-500">允许不安全连接</div>}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'availability',
      header: '在线',
      size: 100,
      meta: { priority: 2 } as ResponsiveColumnMeta, // Important column >= 640px
      cell: ({ row }) => {
        const node = row.original;
        if (node.isOnline) {
          return (
            <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium">在线</span>
            </span>
          );
        }
        return (
          <Tooltip>
            <TooltipTrigger>
              <span className="inline-flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                <span className="text-xs">离线</span>
              </span>
            </TooltipTrigger>
            {node.lastSeenAt && (
              <TooltipContent>
                最后在线: {formatDate(node.lastSeenAt)}
              </TooltipContent>
            )}
          </Tooltip>
        );
      },
    },
    {
      id: 'systemStatus',
      header: '系统状态',
      size: 160,
      meta: { priority: 3 } as ResponsiveColumnMeta, // Secondary column >= 1024px
      cell: ({ row }) => {
        const node = row.original;
        const status = node.systemStatus;
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
      accessorKey: 'status',
      header: '状态',
      size: 100,
      meta: { priority: 1 } as ResponsiveColumnMeta, // Core column, always visible
      cell: ({ row }) => {
        const node = row.original;
        const statusConfig = STATUS_CONFIG[node.status] || { label: node.status, variant: 'default' as const, icon: AlertTriangle };
        const StatusIcon = statusConfig.icon;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => node.status === 'active' ? onDeactivate(node) : onActivate(node)}
                className="cursor-pointer"
              >
                <AdminBadge variant={statusConfig.variant}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </AdminBadge>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {node.status === 'active' ? '点击停用' : '点击激活'}
              {node.status === 'maintenance' && node.maintenanceReason && (
                <div className="mt-1 text-xs opacity-80">原因: {node.maintenanceReason}</div>
              )}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'tags',
      header: '标签',
      size: 120,
      meta: { priority: 3 } as ResponsiveColumnMeta, // Secondary column >= 1024px
      cell: ({ row }) => {
        const node = row.original;
        if (!node.tags || node.tags.length === 0) {
          return <span className="text-xs text-slate-400">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {node.tags.slice(0, 2).map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {node.tags.length > 2 && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    +{node.tags.length - 2}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {node.tags.slice(2).join(', ')}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      id: 'version',
      header: '版本',
      size: 100,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const node = row.original;
        // Use fields directly (extracted from systemStatus by backend)
        const version = node.agentVersion || node.systemStatus?.agentVersion;
        const platform = node.platform || node.systemStatus?.platform;
        const arch = node.arch || node.systemStatus?.arch;

        if (!version) {
          return <span className="text-xs text-slate-400">-</span>;
        }

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-default">
                {node.hasUpdate ? (
                  <ArrowUpCircle className="size-3.5 text-amber-500" />
                ) : (
                  <Package className="size-3.5 text-slate-400" />
                )}
                <span className={`text-xs font-mono ${node.hasUpdate ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
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
                {node.hasUpdate && (
                  <div className="text-xs text-amber-500">有新版本可用</div>
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
      size: 140,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const node = row.original;
        const groupIds = node.groupIds || [];
        if (groupIds.length === 0) {
          return <span className="text-xs text-slate-400">-</span>;
        }
        const firstGroup = resourceGroupsMap[groupIds[0]];
        const remainingCount = groupIds.length - 1;
        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs truncate max-w-[80px]">
                  {firstGroup?.name || groupIds[0]}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <div>{firstGroup?.name || '未知资源组'}</div>
                  <div className="text-xs text-slate-400 font-mono">{groupIds[0]}</div>
                </div>
              </TooltipContent>
            </Tooltip>
            {remainingCount > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="text-xs px-1.5">
                    +{remainingCount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    {groupIds.slice(1).map((gid) => {
                      const g = resourceGroupsMap[gid];
                      return (
                        <div key={gid}>
                          {g?.name || gid}
                        </div>
                      );
                    })}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      id: 'owner',
      header: '创建者',
      size: 120,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const node = row.original;
        if (node.owner) {
          return (
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1.5">
                  <User className="size-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[80px]">
                    {node.owner.name || node.owner.email}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  {node.owner.name && <div>{node.owner.name}</div>}
                  <div className="text-xs text-slate-400">{node.owner.email}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        }
        return (
          <div className="flex items-center gap-1.5">
            <Shield className="size-3.5 text-blue-500" />
            <span className="text-xs text-blue-600 dark:text-blue-400">管理员</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      size: 100,
      meta: { priority: 4 } as ResponsiveColumnMeta, // Optional column >= 1280px
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      size: 140,
      meta: { priority: 1 } as ResponsiveColumnMeta, // Core column, always visible
      enableSorting: false,
      cell: ({ row }) => {
        const node = row.original;
        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onViewDetail(node)}
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
                  onClick={() => onEdit(node)}
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
                  onClick={() => onGetInstallScript(node)}
                  className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                >
                  <Terminal className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>安装脚本</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200">
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {renderDropdownMenuActions(node)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [onEdit, onActivate, onDeactivate, onGetInstallScript, onViewDetail, renderDropdownMenuActions, resourceGroupsMap]);

  // Render mobile card list on small screens
  if (isMobile) {
    return (
      <NodeMobileList
        nodes={nodes}
        loading={loading}
        resourceGroupsMap={resourceGroupsMap}
        onEdit={onEdit}
        onDelete={onDelete}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
        onGenerateToken={onGenerateToken}
        onGetInstallScript={onGetInstallScript}
        onViewDetail={onViewDetail}
        onCopy={onCopy}
      />
    );
  }

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
      enableContextMenu={true}
      contextMenuContent={renderContextMenuActions}
    />
  );
};
