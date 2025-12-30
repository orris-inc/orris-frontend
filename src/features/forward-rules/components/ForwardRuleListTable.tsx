/**
 * Forward Rule List Table Component (Admin)
 * Implemented using TanStack Table with responsive column hiding support
 * Switches to mobile card list on small screens
 */

import { useMemo, useState, useCallback } from 'react';
import { Edit, Trash2, Eye, Power, PowerOff, MoreHorizontal, RotateCcw, Activity, Loader2, Copy, Check, Server, Bot, Settings, ArrowRight, Files, CheckCircle2, CircleDashed, AlertCircle, Play, Square, AlertTriangle, RotateCw } from 'lucide-react';
import { DataTable, AdminBadge, TruncatedId, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { ForwardRuleMobileList } from './ForwardRuleMobileList';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/common/Popover';
import type { ForwardRule, ForwardAgent, RuleOverallStatusResponse, RuleSyncStatus, RuleRunStatus } from '@/api/forward';
import type { Node } from '@/api/node';

interface ForwardRuleListTableProps {
  rules: ForwardRule[];
  agentsMap?: Record<string, ForwardAgent>;
  nodes?: Node[];
  polledStatusMap?: Record<string, RuleOverallStatusResponse>;
  pollingRuleIds?: string[];
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
  onProbe: (rule: ForwardRule) => void;
  onCopy: (rule: ForwardRule) => void;
  probingRuleId?: string | null;
}

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'default' }> = {
  enabled: { label: '已启用', variant: 'success' },
  disabled: { label: '已禁用', variant: 'default' },
};

// Sync status display config
const SYNC_STATUS_CONFIG: Record<RuleSyncStatus, { label: string; icon: React.ElementType; className: string }> = {
  synced: { label: '已同步', icon: CheckCircle2, className: 'text-green-500' },
  pending: { label: '同步中', icon: CircleDashed, className: 'text-yellow-500' },
  failed: { label: '同步失败', icon: AlertCircle, className: 'text-red-500' },
};

// Run status display config
const RUN_STATUS_CONFIG: Record<RuleRunStatus | 'unknown', { label: string; icon: React.ElementType; className: string }> = {
  running: { label: '运行中', icon: Play, className: 'text-green-500' },
  stopped: { label: '已停止', icon: Square, className: 'text-gray-500' },
  error: { label: '错误', icon: AlertTriangle, className: 'text-red-500' },
  starting: { label: '启动中', icon: RotateCw, className: 'text-blue-500' },
  unknown: { label: '未知', icon: CircleDashed, className: 'text-gray-400' },
};

// Copyable address component
const CopyableAddress: React.FC<{ address: string; className?: string }> = ({ address, className = '' }) => {
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
    return <span className="text-slate-400 dark:text-slate-500">-</span>;
  }

  return (
    <div className={`flex items-center gap-1 min-w-0 ${className}`}>
      <span className="font-mono text-xs truncate">{address}</span>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        title={copied ? '已复制' : '复制'}
      >
        {copied ? (
          <Check className="size-3 text-green-500" />
        ) : (
          <Copy className="size-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
        )}
      </button>
    </div>
  );
};

// Format bytes (default display in GB)
const formatBytes = (bytes?: number) => {
  if (!bytes) return '0 GB';
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
};

// Chain nodes display component
const ChainNodesDisplay: React.FC<{
  chainAgentIds: string[];
  agentsMap: Record<string, ForwardAgent>;
  targetDisplay: { name: string; address: string } | null;
}> = ({ chainAgentIds, agentsMap, targetDisplay }) => {
  const chainCount = chainAgentIds.length;

  // Get agent name
  const getAgentName = (id: string) => {
    const agent = agentsMap[id];
    return agent?.name || `ID: ${id}`;
  };

  // First two node names
  const firstTwoNames = chainAgentIds
    .slice(0, 2)
    .map(getAgentName)
    .join(' → ');

  // If node count <= 2, display directly without Popover
  if (chainCount <= 2) {
    return (
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-1.5 text-sm text-slate-900 dark:text-white">
          <Tooltip>
            <TooltipTrigger asChild>
              <Bot className="size-3.5 text-purple-500 flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent>经由转发 Agent</TooltipContent>
          </Tooltip>
          <span className="truncate">{firstTwoNames}</span>
        </div>
        <CopyableAddress address={targetDisplay?.address || '-'} className="text-slate-500 dark:text-slate-400 pl-5" />
      </div>
    );
  }

  // Node count > 2, show Popover
  return (
    <div className="space-y-0.5 min-w-0">
      <div className="flex items-center gap-1.5 text-sm text-slate-900 dark:text-white">
        <Tooltip>
          <TooltipTrigger asChild>
            <Bot className="size-3.5 text-purple-500 flex-shrink-0" />
          </TooltipTrigger>
          <TooltipContent>经由转发 Agent</TooltipContent>
        </Tooltip>
        <span className="truncate">{firstTwoNames} ...</span>
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
              +{chainCount - 2}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">链路节点详情</h4>
                <AdminBadge variant="default" className="text-xs">
                  {chainCount} 个节点
                </AdminBadge>
              </div>
              <div className="space-y-2">
                {chainAgentIds.map((id, index) => {
                  const agent = agentsMap[id];
                  const agentName = agent?.name || `ID: ${id}`;
                  const isLast = index === chainAgentIds.length - 1;
                  return (
                    <div key={id} className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-medium text-purple-700 dark:text-purple-300">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{agentName}</div>
                        {agent?.publicAddress && (
                          <div className="text-xs text-muted-foreground font-mono truncate">
                            {agent.publicAddress}
                          </div>
                        )}
                      </div>
                      {!isLast && (
                        <ArrowRight className="size-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
                {targetDisplay && (
                  <>
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Server className="size-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{targetDisplay.name}</div>
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          {targetDisplay.address}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <CopyableAddress address={targetDisplay?.address || '-'} className="text-slate-500 dark:text-slate-400 pl-5" />
    </div>
  );
};

export const ForwardRuleListTable: React.FC<ForwardRuleListTableProps> = ({
  rules,
  agentsMap = {},
  nodes = [],
  polledStatusMap = {},
  pollingRuleIds = [],
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
  onProbe,
  onCopy,
  probingRuleId,
}) => {
  // Detect mobile screen
  const { isMobile } = useBreakpoint();
  // Forward rule context menu content
  const renderContextMenuActions = useCallback((rule: ForwardRule) => (
    <>
      <ContextMenuItem onClick={() => onEdit(rule)}>
        <Edit className="mr-2 size-4" />
        编辑
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onCopy(rule)}>
        <Files className="mr-2 size-4" />
        复制规则
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onResetTraffic(rule)}>
        <RotateCcw className="mr-2 size-4" />
        重置流量
      </ContextMenuItem>
      <ContextMenuSeparator />
      {rule.status === 'enabled' ? (
        <ContextMenuItem onClick={() => onDisable(rule)}>
          <PowerOff className="mr-2 size-4" />
          禁用
        </ContextMenuItem>
      ) : (
        <ContextMenuItem onClick={() => onEnable(rule)}>
          <Power className="mr-2 size-4" />
          启用
        </ContextMenuItem>
      )}
      <ContextMenuItem onClick={() => onDelete(rule)} className="text-red-600 dark:text-red-400">
        <Trash2 className="mr-2 size-4" />
        删除
      </ContextMenuItem>
    </>
  ), [onEdit, onCopy, onResetTraffic, onEnable, onDisable, onDelete]);

  // Forward rule dropdown menu content
  const renderDropdownMenuActions = useCallback((rule: ForwardRule) => (
    <>
      <DropdownMenuItem onClick={() => onCopy(rule)}>
        <Files className="mr-2 size-4" />
        复制规则
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
    </>
  ), [onCopy, onResetTraffic, onEnable, onDisable, onDelete]);

  const columns = useMemo<ColumnDef<ForwardRule, unknown>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 120,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => <TruncatedId id={row.original.id} />,
    },
    {
      accessorKey: 'name',
      header: '规则名',
      size: 150,
      meta: { priority: 1 } as ResponsiveColumnMeta,
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
      id: 'entry',
      header: '入口',
      size: 220,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const rule = row.original;
        const agent = agentsMap[rule.agentId];
        const agentName = agent?.name || `ID: ${rule.agentId}`;
        const entryAddress = agent?.publicAddress ? `${agent.publicAddress}:${rule.listenPort}` : '-';
        return (
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-sm text-slate-900 dark:text-white">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Bot className="size-3.5 text-green-500 flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent>入口 Agent</TooltipContent>
              </Tooltip>
              <span className="truncate">{agentName}</span>
            </div>
            <CopyableAddress address={entryAddress} className="text-blue-600 dark:text-blue-400 pl-5" />
          </div>
        );
      },
    },
    {
      id: 'exit',
      header: '出口',
      size: 240,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const rule = row.original;

        // Helper function to get target address
        const getTargetDisplay = () => {
          if (rule.targetNodeId) {
            const targetNode = nodes.find((n) => n.id === rule.targetNodeId);
            const nodeName = targetNode?.name || `ID: ${rule.targetNodeId}`;
            const nodePort = targetNode?.subscriptionPort || targetNode?.agentPort;
            // Use API returned target node address (selected based on ipVersion)
            let address: string | undefined;
            if (rule.ipVersion === 'ipv4' && rule.targetNodePublicIpv4) {
              address = rule.targetNodePublicIpv4;
            } else if (rule.ipVersion === 'ipv6' && rule.targetNodePublicIpv6) {
              address = rule.targetNodePublicIpv6;
            } else {
              // auto or fallback: prefer serverAddress, then IPv4, then IPv6
              address = rule.targetNodeServerAddress || rule.targetNodePublicIpv4 || rule.targetNodePublicIpv6;
            }
            const nodeAddress = address ? (nodePort ? `${address}:${nodePort}` : address) : '-';
            return { name: nodeName, address: nodeAddress, type: 'node' as const };
          }
          if (rule.targetAddress) {
            return {
              name: '手动配置',
              address: `${rule.targetAddress}:${rule.targetPort}`,
              type: 'manual' as const,
            };
          }
          return null;
        };

        // Exit type icon component
        const ExitTypeIcon: React.FC<{ type: 'agent' | 'node' | 'manual'; className?: string }> = ({ type, className = '' }) => {
          const iconProps = { className: `size-3.5 ${className}` };
          switch (type) {
            case 'agent':
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Bot {...iconProps} />
                  </TooltipTrigger>
                  <TooltipContent>经由转发 Agent</TooltipContent>
                </Tooltip>
              );
            case 'node':
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Server {...iconProps} />
                  </TooltipTrigger>
                  <TooltipContent>目标节点</TooltipContent>
                </Tooltip>
              );
            case 'manual':
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Settings {...iconProps} />
                  </TooltipTrigger>
                  <TooltipContent>手动配置地址</TooltipContent>
                </Tooltip>
              );
          }
        };

        // entry type: show exit agent -> target
        if (rule.ruleType === 'entry' && rule.exitAgentId) {
          const exitAgent = agentsMap[rule.exitAgentId];
          const exitName = exitAgent?.name || `ID: ${rule.exitAgentId}`;
          const target = getTargetDisplay();
          // Show exit agent name and target address
          const targetAddress = target?.address || '-';
          return (
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 text-sm text-slate-900 dark:text-white">
                <ExitTypeIcon type="agent" className="text-purple-500 flex-shrink-0" />
                <span className="truncate">{exitName}</span>
              </div>
              <CopyableAddress address={targetAddress} className="text-slate-500 dark:text-slate-400 pl-5" />
            </div>
          );
        }

        // chain and direct_chain types: show chain nodes info -> target
        if ((rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && rule.chainAgentIds && rule.chainAgentIds.length > 0) {
          const target = getTargetDisplay();
          return (
            <ChainNodesDisplay
              chainAgentIds={rule.chainAgentIds}
              agentsMap={agentsMap}
              targetDisplay={target}
            />
          );
        }

        // direct type: show target
        const target = getTargetDisplay();
        if (target) {
          const iconType = target.type === 'node' ? 'node' : 'manual';
          const iconColor = target.type === 'node' ? 'text-blue-500' : 'text-slate-400';
          return (
            <div className="space-y-0.5 min-w-0">
              <div className={`flex items-center gap-1.5 text-sm ${target.type === 'manual' ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                <ExitTypeIcon type={iconType} className={`${iconColor} flex-shrink-0`} />
                <span className="truncate">{target.name}</span>
              </div>
              <CopyableAddress address={target.address} className="text-slate-500 dark:text-slate-400 pl-5" />
            </div>
          );
        }

        return <span className="text-slate-400 dark:text-slate-500">-</span>;
      },
    },
    {
      id: 'traffic',
      header: '已用流量',
      size: 100,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const totalBytes = (row.original.uploadBytes || 0) + (row.original.downloadBytes || 0);
        const multiplier = row.original.effectiveTrafficMultiplier;
        const nodeCount = row.original.nodeCount;
        const isAuto = row.original.isAutoMultiplier;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {formatBytes(totalBytes)}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <div>上传: {formatBytes(row.original.uploadBytes)} / 下载: {formatBytes(row.original.downloadBytes)}</div>
                <div>流量倍率: {multiplier?.toFixed(2) || '1.00'}x ({isAuto ? '自动' : '自定义'})</div>
                <div>节点数量: {nodeCount || 0}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'syncStatus',
      header: '同步状态',
      size: 100,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const rule = row.original;
        const isPolling = pollingRuleIds.includes(rule.id);
        const polledStatus = polledStatusMap[rule.id];

        // Rule not enabled, show disabled state
        if (rule.status !== 'enabled') {
          return (
            <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
          );
        }

        // Determine status source: polled status (if polling) > inline status from list API
        let syncStatus: RuleSyncStatus | undefined;
        let runStatus: RuleRunStatus | 'unknown' | undefined;
        let totalAgents: number | undefined;
        let healthyAgents: number | undefined;

        if (polledStatus) {
          // Use polled status when available (during/after polling)
          syncStatus = polledStatus.overallSyncStatus;
          runStatus = polledStatus.overallRunStatus;
          totalAgents = polledStatus.totalAgents;
          healthyAgents = polledStatus.healthyAgents;
        } else if (rule.syncStatus) {
          // Use inline status from list API
          syncStatus = rule.syncStatus;
          runStatus = rule.runStatus;
          totalAgents = rule.totalAgents;
          healthyAgents = rule.healthyAgents;
        }

        // Show loading spinner while polling and no status yet
        if (isPolling && !polledStatus && !rule.syncStatus) {
          return (
            <Loader2 className="size-3.5 animate-spin text-slate-400" />
          );
        }

        // No status data available
        if (!syncStatus) {
          return (
            <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
          );
        }

        const syncConfig = SYNC_STATUS_CONFIG[syncStatus];
        const runConfig = RUN_STATUS_CONFIG[runStatus || 'unknown'];
        const SyncIcon = syncConfig.icon;
        const RunIcon = runConfig.icon;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                {/* Show polling indicator */}
                {isPolling && (
                  <Loader2 className="size-3 animate-spin text-blue-400" />
                )}
                <span className={`flex items-center ${syncConfig.className}`}>
                  <SyncIcon className="size-3.5" />
                </span>
                <span className={`flex items-center ${runConfig.className}`}>
                  <RunIcon className="size-3.5" />
                </span>
                {(totalAgents ?? 0) > 1 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {healthyAgents ?? 0}/{totalAgents ?? 0}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-xs">
                {isPolling && <div className="text-blue-400">正在同步...</div>}
                <div>同步: {syncConfig.label}</div>
                <div>运行: {runConfig.label}</div>
                {(totalAgents ?? 0) > 0 && (
                  <div>节点: {healthyAgents ?? 0}/{totalAgents ?? 0} 正常</div>
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
      size: 88,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const rule = row.original;
        const statusConfig = STATUS_CONFIG[rule.status] || { label: rule.status, variant: 'default' as const };
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <AdminBadge
                  variant={statusConfig.variant}
                  className="whitespace-nowrap cursor-pointer"
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
      id: 'actions',
      header: '操作',
      size: 140,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      enableSorting: false,
      cell: ({ row }) => {
        const rule = row.original;
        const isProbing = probingRuleId === rule.id;
        const canProbe = rule.status === 'enabled' && !isProbing;
        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onViewDetail(rule)}
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
                  onClick={() => onEdit(rule)}
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
                  onClick={() => canProbe && onProbe(rule)}
                  disabled={!canProbe}
                  className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProbing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Activity className="size-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isProbing ? '拨测中...' : rule.status !== 'enabled' ? '仅启用状态可拨测' : '拨测'}
              </TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200">
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {renderDropdownMenuActions(rule)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [agentsMap, nodes, polledStatusMap, pollingRuleIds, onDisable, onEnable, onViewDetail, onEdit, onProbe, probingRuleId, renderDropdownMenuActions]);

  // Render mobile card list on small screens
  if (isMobile) {
    return (
      <ForwardRuleMobileList
        rules={rules}
        agentsMap={agentsMap}
        nodes={nodes}
        polledStatusMap={polledStatusMap}
        pollingRuleIds={pollingRuleIds}
        loading={loading}
        onEdit={onEdit}
        onDelete={onDelete}
        onEnable={onEnable}
        onDisable={onDisable}
        onResetTraffic={onResetTraffic}
        onViewDetail={onViewDetail}
        onProbe={onProbe}
        onCopy={onCopy}
        probingRuleId={probingRuleId}
      />
    );
  }

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
      enableContextMenu={true}
      contextMenuContent={renderContextMenuActions}
    />
  );
};
