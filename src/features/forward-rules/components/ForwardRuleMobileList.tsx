/**
 * Forward Rule Mobile List Component
 * Mobile-friendly card list with Accordion for expanded details
 */

import { useState, useCallback } from 'react';
import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  MoreHorizontal,
  RotateCcw,
  Activity,
  Loader2,
  Copy,
  Check,
  Server,
  Bot,
  Settings,
  ArrowRight,
  Files,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
  Play,
  Square,
  AlertTriangle,
  RotateCw,
  Eye,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/common/Popover';
import { Skeleton } from '@/components/common/Skeleton';
import type { ForwardRule, ForwardAgent, RuleOverallStatusResponse, RuleSyncStatus, RuleRunStatus } from '@/api/forward';
import type { Node } from '@/api/node';

interface ForwardRuleMobileListProps {
  rules: ForwardRule[];
  agentsMap?: Record<string, ForwardAgent>;
  nodes?: Node[];
  polledStatusMap?: Record<string, RuleOverallStatusResponse>;
  pollingRuleIds?: string[];
  loading?: boolean;
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

// Chain nodes display component for mobile - Compact version
const ChainNodesDisplayMobile: React.FC<{
  chainAgentIds: string[];
  agentsMap: Record<string, ForwardAgent>;
  targetDisplay: { name: string; address: string } | null;
}> = ({ chainAgentIds, agentsMap, targetDisplay }) => {
  const chainCount = chainAgentIds.length;

  const getAgentName = (id: string) => {
    const agent = agentsMap[id];
    return agent?.name || `ID: ${id}`;
  };

  const firstTwoNames = chainAgentIds
    .slice(0, 2)
    .map(getAgentName)
    .join(' → ');

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-200">
        <Bot className="size-3 text-purple-500 flex-shrink-0" />
        <span className="truncate">{firstTwoNames}{chainCount > 2 ? ' ...' : ''}</span>
        {chainCount > 2 && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex-shrink-0 px-1 py-0 text-[10px] font-medium rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                +{chainCount - 2}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold">链路节点</h4>
                  <span className="text-[10px] text-muted-foreground">{chainCount} 个</span>
                </div>
                <div className="space-y-1">
                  {chainAgentIds.map((id, index) => {
                    const agentName = getAgentName(id);
                    return (
                      <div key={id} className="flex items-center gap-1.5 text-xs">
                        <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-[10px] font-medium text-purple-700 dark:text-purple-300 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="truncate">{agentName}</span>
                        {index < chainAgentIds.length - 1 && (
                          <ArrowRight className="size-3 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                  {targetDisplay && (
                    <div className="flex items-center gap-1.5 text-xs pt-1 border-t">
                      <Server className="size-3 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{targetDisplay.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <CopyableAddress address={targetDisplay?.address || '-'} className="text-slate-500 dark:text-slate-400" />
    </div>
  );
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

export const ForwardRuleMobileList: React.FC<ForwardRuleMobileListProps> = ({
  rules,
  agentsMap = {},
  nodes = [],
  polledStatusMap = {},
  pollingRuleIds = [],
  loading = false,
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
  // Get entry address for a rule
  const getEntryAddress = useCallback((rule: ForwardRule) => {
    const agent = agentsMap[rule.agentId];
    return agent?.publicAddress ? `${agent.publicAddress}:${rule.listenPort}` : '-';
  }, [agentsMap]);

  // Get exit display info
  const getExitDisplay = useCallback((rule: ForwardRule) => {
    const getTargetDisplay = () => {
      if (rule.targetNodeId) {
        const targetNode = nodes.find((n) => n.id === rule.targetNodeId);
        const nodeName = targetNode?.name || `ID: ${rule.targetNodeId}`;
        const nodePort = targetNode?.subscriptionPort || targetNode?.agentPort;
        let address: string | undefined;
        if (rule.ipVersion === 'ipv4' && rule.targetNodePublicIpv4) {
          address = rule.targetNodePublicIpv4;
        } else if (rule.ipVersion === 'ipv6' && rule.targetNodePublicIpv6) {
          address = rule.targetNodePublicIpv6;
        } else {
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

    // entry type
    if (rule.ruleType === 'entry' && rule.exitAgentId) {
      const exitAgent = agentsMap[rule.exitAgentId];
      const exitName = exitAgent?.name || `ID: ${rule.exitAgentId}`;
      const target = getTargetDisplay();
      return {
        type: 'agent' as const,
        name: exitName,
        address: target?.address || '-',
        chainAgentIds: null,
        targetDisplay: target,
      };
    }

    // chain types
    if ((rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && rule.chainAgentIds && rule.chainAgentIds.length > 0) {
      const target = getTargetDisplay();
      return {
        type: 'chain' as const,
        name: null,
        address: target?.address || '-',
        chainAgentIds: rule.chainAgentIds,
        targetDisplay: target,
      };
    }

    // direct type
    const target = getTargetDisplay();
    if (target) {
      return {
        type: target.type,
        name: target.name,
        address: target.address,
        chainAgentIds: null,
        targetDisplay: target,
      };
    }

    return null;
  }, [agentsMap, nodes]);

  // Render sync and run status
  const renderStatus = useCallback((rule: ForwardRule) => {
    const isPolling = pollingRuleIds.includes(rule.id);
    const polledStatus = polledStatusMap[rule.id];

    if (rule.status !== 'enabled') {
      return null;
    }

    let syncStatus: RuleSyncStatus | undefined;
    let runStatus: RuleRunStatus | 'unknown' | undefined;

    if (polledStatus) {
      syncStatus = polledStatus.overallSyncStatus;
      runStatus = polledStatus.overallRunStatus;
    } else if (rule.syncStatus) {
      syncStatus = rule.syncStatus;
      runStatus = rule.runStatus;
    }

    if (isPolling && !polledStatus && !rule.syncStatus) {
      return <Loader2 className="size-3.5 animate-spin text-slate-400" />;
    }

    if (!syncStatus) return null;

    const syncConfig = SYNC_STATUS_CONFIG[syncStatus];
    const runConfig = RUN_STATUS_CONFIG[runStatus || 'unknown'];
    const SyncIcon = syncConfig.icon;
    const RunIcon = runConfig.icon;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            {isPolling && <Loader2 className="size-3 animate-spin text-blue-400" />}
            <SyncIcon className={`size-3.5 ${syncConfig.className}`} />
            <RunIcon className={`size-3.5 ${runConfig.className}`} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            {isPolling && <div className="text-blue-400">正在同步...</div>}
            <div>同步: {syncConfig.label}</div>
            <div>运行: {runConfig.label}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }, [polledStatusMap, pollingRuleIds]);

  // Render dropdown menu
  const renderDropdownMenu = useCallback((rule: ForwardRule) => {
    const isProbing = probingRuleId === rule.id;
    const canProbe = rule.status === 'enabled' && !isProbing;

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
          <DropdownMenuItem onClick={() => onViewDetail(rule)}>
            <Eye className="mr-2 size-4" />
            查看详情
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(rule)}>
            <Edit className="mr-2 size-4" />
            编辑
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => canProbe && onProbe(rule)}
            disabled={!canProbe}
          >
            {isProbing ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Activity className="mr-2 size-4" />
            )}
            {isProbing ? '拨测中...' : '拨测'}
          </DropdownMenuItem>
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
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }, [onViewDetail, onEdit, onProbe, onCopy, onResetTraffic, onEnable, onDisable, onDelete, probingRuleId]);

  if (loading) {
    return <MobileCardSkeleton />;
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        暂无转发规则数据
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-1.5">
      {rules.map((rule) => {
        const agent = agentsMap[rule.agentId];
        const agentName = agent?.name || `ID: ${rule.agentId}`;
        const entryAddress = getEntryAddress(rule);
        const exitDisplay = getExitDisplay(rule);
        const statusConfig = STATUS_CONFIG[rule.status] || { label: rule.status, variant: 'default' as const };
        const totalBytes = (rule.uploadBytes || 0) + (rule.downloadBytes || 0);

        return (
          <AccordionItem
            key={rule.id}
            value={rule.id}
            className="border rounded-lg bg-white dark:bg-slate-800 overflow-hidden"
          >
            {/* Card Header - Always visible */}
            <div className="px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Rule name and status */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                      {rule.name}
                    </span>
                    <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      {statusConfig.label}
                    </AdminBadge>
                    {renderStatus(rule)}
                  </div>

                  {/* Entry info */}
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Bot className="size-3 text-green-500 flex-shrink-0" />
                    <span className="truncate max-w-[80px]">{agentName}</span>
                    <span className="text-slate-300">·</span>
                    <CopyableAddress address={entryAddress} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onEdit(rule)}
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
                        onClick={() => rule.status === 'enabled' && onProbe(rule)}
                        disabled={rule.status !== 'enabled' || probingRuleId === rule.id}
                        className={`p-1.5 rounded transition-colors ${
                          rule.status === 'enabled' && probingRuleId !== rule.id
                            ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {probingRuleId === rule.id ? (
                          <Loader2 className="size-3.5 text-blue-500 animate-spin" />
                        ) : (
                          <Activity className="size-3.5 text-slate-400 hover:text-blue-500" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{probingRuleId === rule.id ? '拨测中...' : '拨测'}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => rule.status === 'enabled' ? onDisable(rule) : onEnable(rule)}
                        className={`p-1.5 rounded transition-colors ${
                          rule.status === 'enabled'
                            ? 'hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                      >
                        {rule.status === 'enabled' ? (
                          <PowerOff className="size-3.5 text-slate-400 hover:text-red-500" />
                        ) : (
                          <Power className="size-3.5 text-slate-400 hover:text-green-500" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{rule.status === 'enabled' ? '禁用' : '启用'}</TooltipContent>
                  </Tooltip>
                  {renderDropdownMenu(rule)}
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
                {/* Exit info - Compact */}
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-6 pt-0.5 flex-shrink-0">出口</span>
                  <div className="flex-1 min-w-0">
                    {exitDisplay?.type === 'chain' && exitDisplay.chainAgentIds ? (
                      <ChainNodesDisplayMobile
                        chainAgentIds={exitDisplay.chainAgentIds}
                        agentsMap={agentsMap}
                        targetDisplay={exitDisplay.targetDisplay}
                      />
                    ) : exitDisplay ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-200">
                          {exitDisplay.type === 'agent' && <Bot className="size-3 text-purple-500 flex-shrink-0" />}
                          {exitDisplay.type === 'node' && <Server className="size-3 text-blue-500 flex-shrink-0" />}
                          {exitDisplay.type === 'manual' && <Settings className="size-3 text-slate-400 flex-shrink-0" />}
                          <span className="truncate">{exitDisplay.name}</span>
                        </div>
                        <CopyableAddress address={exitDisplay.address} className="text-slate-500 dark:text-slate-400" />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </div>
                </div>

                {/* Traffic - Inline */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-6 flex-shrink-0">流量</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {formatBytes(totalBytes)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs space-y-0.5">
                        <div>↑ {formatBytes(rule.uploadBytes)} / ↓ {formatBytes(rule.downloadBytes)}</div>
                        <div>倍率: {rule.effectiveTrafficMultiplier?.toFixed(2) || '1.00'}x</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Remark - Inline */}
                {rule.remark && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-6 pt-0.5 flex-shrink-0">备注</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 flex-1">{rule.remark}</span>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
