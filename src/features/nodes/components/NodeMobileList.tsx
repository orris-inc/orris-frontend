/**
 * Node Mobile List Component
 * Mobile-friendly card list with Accordion for expanded details
 */

import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  MoreHorizontal,
  Key,
  Terminal,
  Copy,
  Eye,
  CheckCircle2,
  XCircle,
  Wrench,
  User,
  Shield,
  ArrowUpCircle,
} from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/common/Accordion';
import { AdminBadge } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { SystemStatusDisplay } from '@/components/common/SystemStatusDisplay';
import type { Node, NodeStatus } from '@/api/node';
import type { ResourceGroup } from '@/api/resource/types';

interface NodeMobileListProps {
  nodes: Node[];
  loading?: boolean;
  resourceGroupsMap?: Record<string, ResourceGroup>;
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

// Loading skeleton for mobile cards
const MobileCardSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
    ))}
  </div>
);

// Online status indicator
const OnlineIndicator: React.FC<{ isOnline: boolean; lastSeenAt?: string }> = ({ isOnline, lastSeenAt }) => {
  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
        </span>
        <span className="text-[10px] font-medium">在线</span>
      </span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
          <span className="text-[10px]">离线</span>
        </span>
      </TooltipTrigger>
      {lastSeenAt && (
        <TooltipContent>
          最后在线: {formatDate(lastSeenAt)}
        </TooltipContent>
      )}
    </Tooltip>
  );
};

export const NodeMobileList: React.FC<NodeMobileListProps> = ({
  nodes,
  loading = false,
  resourceGroupsMap = {},
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onGenerateToken,
  onGetInstallScript,
  onViewDetail,
  onCopy,
}) => {
  // Render dropdown menu
  const renderDropdownMenu = (node: Node) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4 text-slate-500" />
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
          <DropdownMenuItem onClick={() => onGetInstallScript(node)}>
            <Terminal className="mr-2 size-4" />
            安装脚本
          </DropdownMenuItem>
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
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (loading) {
    return <MobileCardSkeleton />;
  }

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        暂无节点数据
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-1.5">
      {nodes.map((node) => {
        const statusConfig = STATUS_CONFIG[node.status] || { label: node.status, variant: 'default' as const, icon: XCircle };
        const StatusIcon = statusConfig.icon;
        const protocolConfig = PROTOCOL_CONFIG[node.protocol] || { label: node.protocol, color: 'bg-gray-100 text-gray-700' };

        return (
          <AccordionItem
            key={node.id}
            value={node.id}
            className="border rounded-lg bg-white dark:bg-slate-800 overflow-hidden"
          >
            {/* Card Header - Always visible */}
            <div className="px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Node name and status */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                      {node.name}
                    </span>
                    <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      <StatusIcon className="size-2.5 mr-0.5" />
                      {statusConfig.label}
                    </AdminBadge>
                    <OnlineIndicator isOnline={node.isOnline} lastSeenAt={node.lastSeenAt} />
                  </div>

                  {/* Address and region info */}
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono truncate">{node.serverAddress}:{node.agentPort}</span>
                    {node.region && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="truncate">{node.region}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onEdit(node)}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Edit className="size-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>编辑</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onGetInstallScript(node)}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Terminal className="size-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>安装脚本</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => node.status === 'active' ? onDeactivate(node) : onActivate(node)}
                        className={`p-1.5 rounded transition-colors ${
                          node.status === 'active'
                            ? 'hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                      >
                        {node.status === 'active' ? (
                          <PowerOff className="size-3.5 text-slate-400 hover:text-red-500" />
                        ) : (
                          <Power className="size-3.5 text-slate-400 hover:text-green-500" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{node.status === 'active' ? '停用' : '激活'}</TooltipContent>
                  </Tooltip>
                  {renderDropdownMenu(node)}
                </div>
              </div>
            </div>

            {/* Accordion Trigger */}
            <AccordionTrigger className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-700 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-xs text-slate-400 dark:text-slate-500">详情</span>
            </AccordionTrigger>

            {/* Accordion Content - Expanded details */}
            <AccordionContent>
              <div className="px-3 pb-2 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-2">
                {/* Protocol config */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 flex-shrink-0">协议</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${protocolConfig.color}`}>
                      {protocolConfig.label}
                    </span>
                    {node.protocol === 'shadowsocks' && node.encryptionMethod && (
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                        {node.encryptionMethod}
                      </span>
                    )}
                    {node.protocol === 'trojan' && (
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                        {node.transportProtocol?.toUpperCase() || 'TCP'} + TLS
                      </span>
                    )}
                  </div>
                </div>

                {/* System status */}
                {node.systemStatus && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 pt-0.5 flex-shrink-0">系统</span>
                    <SystemStatusDisplay
                      status={{
                        cpu: node.systemStatus.cpuPercent,
                        memory: node.systemStatus.memoryPercent,
                        disk: node.systemStatus.diskPercent,
                        uptime: node.systemStatus.uptimeSeconds,
                      }}
                    />
                  </div>
                )}

                {/* Version */}
                {(node.agentVersion || node.systemStatus?.agentVersion) && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 flex-shrink-0">版本</span>
                    <div className="flex items-center gap-1.5">
                      {node.hasUpdate && (
                        <ArrowUpCircle className="size-3.5 text-amber-500" />
                      )}
                      <span className={`text-xs font-mono ${node.hasUpdate ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        v{node.agentVersion || node.systemStatus?.agentVersion}
                        {(node.platform || node.systemStatus?.platform) && (node.arch || node.systemStatus?.arch) && (
                          <span className="text-slate-400 ml-1">
                            ({node.platform || node.systemStatus?.platform}/{node.arch || node.systemStatus?.arch})
                          </span>
                        )}
                      </span>
                      {node.hasUpdate && (
                        <span className="text-[10px] text-amber-500">可更新</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {node.tags && node.tags.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 pt-0.5 flex-shrink-0">标签</span>
                    <div className="flex flex-wrap gap-1">
                      {node.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resource groups */}
                {node.groupIds && node.groupIds.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 pt-0.5 flex-shrink-0">资源</span>
                    <div className="flex flex-wrap gap-1">
                      {node.groupIds.map((gid) => {
                        const group = resourceGroupsMap[gid];
                        return (
                          <Badge key={gid} variant="outline" className="text-[10px] px-1.5 py-0">
                            {group?.name || gid}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Owner */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 flex-shrink-0">创建</span>
                  {node.owner ? (
                    <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                      <User className="size-3 text-slate-400" />
                      <span className="truncate">{node.owner.name || node.owner.email}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs">
                      <Shield className="size-3 text-blue-500" />
                      <span className="text-blue-600 dark:text-blue-400">管理员</span>
                    </div>
                  )}
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-xs text-slate-500">{formatDate(node.createdAt)}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
