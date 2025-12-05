/**
 * 节点列表表格组件（管理端）
 * 基于 Node API 类型定义设计
 */

import { useMemo } from 'react';
import {
  Edit,
  Trash2,
  Key,
  Eye,
  Power,
  PowerOff,
  MoreHorizontal,
  Cpu,
  MemoryStick,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wrench,
} from 'lucide-react';
import { DataTable, AdminBadge, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Badge } from '@/components/common/Badge';
import type { Node, NodeStatus } from '@/api/node';

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
const STATUS_CONFIG: Record<NodeStatus, { label: string; variant: 'success' | 'default' | 'warning'; icon: React.ElementType }> = {
  active: { label: '已激活', variant: 'success', icon: CheckCircle2 },
  inactive: { label: '未激活', variant: 'default', icon: XCircle },
  maintenance: { label: '维护中', variant: 'warning', icon: Wrench },
};

// 协议配置
const PROTOCOL_CONFIG: Record<string, { label: string; color: string }> = {
  shadowsocks: { label: 'SS', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  trojan: { label: 'Trojan', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};

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
      size: 60,
      meta: { priority: 4 } as ResponsiveColumnMeta, // 可选列 >= 1280px
      cell: ({ row }) => (
        <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
          {row.original.id}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: '节点',
      meta: { priority: 1 } as ResponsiveColumnMeta, // 核心列，始终显示
      cell: ({ row }) => {
        const node = row.original;
        const protocolConfig = PROTOCOL_CONFIG[node.protocol] || { label: node.protocol, color: 'bg-gray-100 text-gray-700' };
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900 dark:text-white">
                {node.name}
              </span>
              <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${protocolConfig.color}`}>
                {protocolConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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
      meta: { priority: 3 } as ResponsiveColumnMeta, // 次要列 >= 1024px
      cell: ({ row }) => {
        const node = row.original;
        if (node.protocol === 'shadowsocks') {
          return (
            <div className="text-xs">
              <span className="font-mono text-slate-600 dark:text-slate-400">
                {node.encryptionMethod || '-'}
              </span>
              {node.plugin && (
                <div className="text-slate-400 dark:text-slate-500 mt-0.5">
                  + {node.plugin}
                </div>
              )}
            </div>
          );
        }
        // Trojan 显示传输协议和 TLS 配置
        const transport = node.transportProtocol?.toUpperCase() || 'TCP';
        return (
          <Tooltip>
            <TooltipTrigger>
              <div className="text-xs">
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  {transport} + TLS
                </span>
                {node.sni && (
                  <div className="text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[120px]">
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
      meta: { priority: 2 } as ResponsiveColumnMeta, // 重要列 >= 640px
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
      meta: { priority: 3 } as ResponsiveColumnMeta, // 次要列 >= 1024px
      cell: ({ row }) => {
        const node = row.original;
        const status = node.systemStatus;

        if (!status) {
          return <span className="text-xs text-slate-400">暂无数据</span>;
        }

        const getHealthLevel = (value: string) => {
          const num = parseFloat(value);
          if (num >= 80) return 'high';
          if (num >= 60) return 'medium';
          return 'low';
        };

        const cpuLevel = getHealthLevel(status.cpu);
        const memLevel = getHealthLevel(status.memory);

        // 整体健康度：取最差的状态
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
                  <span className={`text-xs font-medium ${healthColors[cpuLevel]}`}>{status.cpu}%</span>
                </div>
                <div className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                <div className="flex items-center gap-1">
                  <MemoryStick className={`h-3.5 w-3.5 ${healthColors[memLevel]}`} />
                  <span className={`text-xs font-medium ${healthColors[memLevel]}`}>{status.memory}%</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">CPU</span>
                  <span className="font-mono">{status.cpu}%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">内存</span>
                  <span className="font-mono">{status.memory}%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">磁盘</span>
                  <span className="font-mono">{status.disk}%</span>
                </div>
                {status.uptime > 0 && (
                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-700">
                    <span className="text-slate-400">运行时间</span>
                    <span>{formatUptime(status.uptime)}</span>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'status',
      header: '状态',
      size: 100,
      meta: { priority: 1 } as ResponsiveColumnMeta, // 核心列，始终显示
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
      meta: { priority: 3 } as ResponsiveColumnMeta, // 次要列 >= 1024px
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
      accessorKey: 'updatedAt',
      header: '更新时间',
      size: 100,
      meta: { priority: 4 } as ResponsiveColumnMeta, // 可选列 >= 1280px
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatDate(row.original.updatedAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 48,
      meta: { priority: 1 } as ResponsiveColumnMeta, // 核心列，始终显示
      enableSorting: false,
      cell: ({ row }) => {
        const node = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200">
                <MoreHorizontal className="size-4" strokeWidth={2} />
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
