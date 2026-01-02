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

// Rule type configuration with icons and colors
const RULE_TYPE_CONFIG: Record<string, { label: string; shortLabel: string; color: string; bgColor: string }> = {
  direct: {
    label: '直连',
    shortLabel: '直',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  entry: {
    label: '入口',
    shortLabel: '入',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  chain: {
    label: '链式',
    shortLabel: '链',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  direct_chain: {
    label: '直连链',
    shortLabel: '直链',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
};

// Protocol configuration
const PROTOCOL_CONFIG: Record<string, { label: string; color: string }> = {
  tcp: { label: 'TCP', color: 'text-sky-600 dark:text-sky-400' },
  udp: { label: 'UDP', color: 'text-orange-600 dark:text-orange-400' },
  both: { label: 'TCP/UDP', color: 'text-violet-600 dark:text-violet-400' },
};

// Tunnel type configuration
const TUNNEL_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  ws: {
    label: 'WS',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
  },
  tls: {
    label: 'TLS',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
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

// Exit type configuration for visual consistency
const EXIT_TYPE_CONFIG = {
  agent: {
    label: '中转',
    icon: Bot,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  node: {
    label: '节点',
    icon: Server,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  manual: {
    label: '手动',
    icon: Settings,
    color: 'text-slate-500',
    bgColor: 'bg-slate-50 dark:bg-slate-800/50',
    borderColor: 'border-slate-200 dark:border-slate-700',
  },
};

// Flow arrow component for chain visualization
const FlowArrow: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="w-3 h-px bg-gradient-to-r from-purple-300 to-purple-500 dark:from-purple-700 dark:to-purple-400" />
    <ArrowRight className="size-2.5 -ml-0.5 text-purple-500 dark:text-purple-400" />
  </div>
);

// Chain nodes display component with improved flow visualization
const ChainNodesDisplay: React.FC<{
  chainAgentIds: string[];
  agentsMap: Record<string, ForwardAgent>;
  targetDisplay: { name: string; address: string } | null;
  tunnelHops?: number;
}> = ({ chainAgentIds, agentsMap, targetDisplay, tunnelHops }) => {
  const chainCount = chainAgentIds.length;

  const getAgentName = (id: string) => {
    const agent = agentsMap[id];
    return agent?.name || `ID: ${id}`;
  };

  // Get first agent for display
  const firstAgentName = getAgentName(chainAgentIds[0]);

  return (
    <div className="space-y-1 min-w-0">
      {/* Chain flow header */}
      <div className="flex items-center gap-1">
        {/* Chain indicator with count */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <Bot className="size-3 text-purple-500" />
              <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">{chainCount}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>{chainCount} 个中转节点</TooltipContent>
        </Tooltip>

        {/* First node name with flow */}
        <FlowArrow />
        <span className="text-xs font-medium text-foreground truncate max-w-[60px]">{firstAgentName}</span>

        {/* More nodes indicator */}
        {chainCount > 1 && (
          <>
            <FlowArrow />
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors cursor-pointer">
                  +{chainCount - 1}
                  <ArrowRight className="size-2.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="start">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">链路拓扑</h4>
                    <div className="flex items-center gap-1.5">
                      {tunnelHops && tunnelHops > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 font-medium">
                          {tunnelHops} 跳隧道
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        {chainCount} 节点
                      </span>
                    </div>
                  </div>

                  {/* Flow visualization */}
                  <div className="relative">
                    {/* Vertical flow line */}
                    <div className="absolute left-3 top-4 bottom-4 w-px bg-gradient-to-b from-purple-300 via-purple-400 to-blue-400 dark:from-purple-700 dark:via-purple-500 dark:to-blue-500" />

                    <div className="space-y-1.5">
                      {chainAgentIds.map((id, index) => {
                        const agent = agentsMap[id];
                        const agentName = agent?.name || `ID: ${id}`;
                        return (
                          <div key={id} className="flex items-center gap-2 relative">
                            {/* Step indicator */}
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700 flex items-center justify-center text-[10px] font-bold text-purple-600 dark:text-purple-400 z-10">
                              {index + 1}
                            </div>
                            {/* Node info */}
                            <div className="flex-1 min-w-0 py-1">
                              <div className="flex items-center gap-1.5">
                                <Bot className="size-3 text-purple-500 flex-shrink-0" />
                                <span className="text-xs font-medium text-foreground truncate">{agentName}</span>
                              </div>
                              {agent?.publicAddress && (
                                <span className="text-[10px] text-muted-foreground font-mono truncate block pl-4">
                                  {agent.publicAddress}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Target node */}
                      {targetDisplay && (
                        <div className="flex items-center gap-2 relative">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 flex items-center justify-center z-10">
                            <Server className="size-3 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] px-1 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">目标</span>
                              <span className="text-xs font-medium text-foreground truncate">{targetDisplay.name}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono truncate block">
                              {targetDisplay.address}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>

      {/* Target address */}
      <div className="flex items-center gap-1 pl-1">
        <Server className="size-2.5 text-blue-500 flex-shrink-0" />
        <CopyableAddress address={targetDisplay?.address || '-'} className="text-muted-foreground" />
      </div>
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
      size: 200,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const rule = row.original;
        const ruleTypeConfig = RULE_TYPE_CONFIG[rule.ruleType] || RULE_TYPE_CONFIG.direct;
        const protocolConfig = PROTOCOL_CONFIG[rule.protocol] || PROTOCOL_CONFIG.tcp;
        const tunnelTypeConfig = rule.tunnelType ? TUNNEL_TYPE_CONFIG[rule.tunnelType] : null;
        const isChainType = rule.ruleType === 'chain' || rule.ruleType === 'direct_chain' || rule.ruleType === 'entry';
        return (
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold rounded ${ruleTypeConfig.bgColor} ${ruleTypeConfig.color}`}>
                    {ruleTypeConfig.shortLabel}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{ruleTypeConfig.label}模式</TooltipContent>
              </Tooltip>
              {/* Show tunnel type for chain/entry types */}
              {isChainType && tunnelTypeConfig && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`inline-flex items-center justify-center px-1 py-0.5 text-[9px] font-semibold rounded ${tunnelTypeConfig.bgColor} ${tunnelTypeConfig.color}`}>
                      {tunnelTypeConfig.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{tunnelTypeConfig.label} 隧道</TooltipContent>
                </Tooltip>
              )}
              <span className="font-medium text-foreground truncate">{rule.name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`font-mono ${protocolConfig.color}`}>{protocolConfig.label}</span>
              {rule.remark && (
                <>
                  <span className="text-border">·</span>
                  <span className="text-muted-foreground truncate">{rule.remark}</span>
                </>
              )}
            </div>
          </div>
        );
      },
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

        // entry type: show exit agent -> target with improved design
        if (rule.ruleType === 'entry' && rule.exitAgentId) {
          const exitAgent = agentsMap[rule.exitAgentId];
          const exitName = exitAgent?.name || `ID: ${rule.exitAgentId}`;
          const target = getTargetDisplay();
          const targetAddress = target?.address || '-';
          const config = EXIT_TYPE_CONFIG.agent;

          return (
            <div className="space-y-1 min-w-0">
              {/* Exit agent with type indicator */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${config.bgColor} border ${config.borderColor}`}>
                      <Bot className={`size-3 ${config.color}`} />
                      <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">出口</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>出口 Agent</TooltipContent>
                </Tooltip>
                <FlowArrow />
                <span className="text-xs font-medium text-foreground truncate">{exitName}</span>
              </div>
              {/* Target address */}
              <div className="flex items-center gap-1 pl-1">
                <Server className="size-2.5 text-blue-500 flex-shrink-0" />
                <CopyableAddress address={targetAddress} className="text-muted-foreground" />
              </div>
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
              tunnelHops={rule.tunnelHops}
            />
          );
        }

        // direct type: show target with improved design
        const target = getTargetDisplay();
        if (target) {
          const config = target.type === 'node' ? EXIT_TYPE_CONFIG.node : EXIT_TYPE_CONFIG.manual;
          const IconComponent = config.icon;

          return (
            <div className="space-y-1 min-w-0">
              {/* Target with type indicator */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${config.bgColor} border ${config.borderColor}`}>
                      <IconComponent className={`size-3 ${config.color}`} />
                      <span className={`text-[10px] font-semibold ${config.color}`}>{config.label}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{target.type === 'node' ? '目标节点' : '手动配置'}</TooltipContent>
                </Tooltip>
                <span className="text-xs font-medium text-foreground truncate">{target.name}</span>
              </div>
              {/* Target address */}
              <div className="flex items-center gap-1 pl-1">
                <IconComponent className={`size-2.5 ${config.color} flex-shrink-0`} />
                <CopyableAddress address={target.address} className="text-muted-foreground" />
              </div>
            </div>
          );
        }

        return <span className="text-slate-400 dark:text-slate-500">-</span>;
      },
    },
    {
      id: 'traffic',
      header: '流量',
      size: 130,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const rule = row.original;
        const uploadBytes = rule.uploadBytes || 0;
        const downloadBytes = rule.downloadBytes || 0;
        const totalBytes = uploadBytes + downloadBytes;
        const multiplier = rule.effectiveTrafficMultiplier;
        const isAuto = rule.isAutoMultiplier;

        // Calculate upload/download ratio for mini bar
        const uploadRatio = totalBytes > 0 ? (uploadBytes / totalBytes) * 100 : 50;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-1.5 min-w-0 cursor-default">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground tabular-nums">
                    {formatBytes(totalBytes)}
                  </span>
                  {multiplier && multiplier !== 1 && (
                    <span className={`text-[10px] px-1 py-0.5 rounded font-medium ${isAuto ? 'bg-muted text-muted-foreground' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'}`}>
                      ×{multiplier.toFixed(1)}
                    </span>
                  )}
                </div>
                {/* Mini traffic ratio bar */}
                <div className="flex items-center gap-1 h-1.5">
                  <div className="flex-1 h-full bg-muted rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${uploadRatio}%` }}
                    />
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${100 - uploadRatio}%` }}
                    />
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                  <span>上传: {formatBytes(uploadBytes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                  <span>下载: {formatBytes(downloadBytes)}</span>
                </div>
                <div className="pt-1 border-t border-border">
                  流量倍率: {multiplier?.toFixed(2) || '1.00'}x ({isAuto ? '自动' : '自定义'})
                </div>
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
