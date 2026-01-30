/**
 * Forward Rule Mobile List Component
 * Mobile-friendly card list with Accordion for expanded details
 * Supports drag-and-drop reordering with long-press activation
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DraggableMobileList } from '@/components/admin/DraggableMobileList';
import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  MoreHorizontal,
  RotateCcw,
  Activity,
  Loader2,
  Server,
  Bot,
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
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/common/Popover';
import { Skeleton } from '@/components/common/Skeleton';
import { CopyableAddress } from '@/components/common/CopyableAddress';
import { formatBytesGB } from '@/shared/utils/format-utils';
import { ENABLED_STATUS_CONFIG } from '@/shared/constants/status-config';
import type { ForwardRule, ForwardAgent, RuleOverallStatusResponse, RuleSyncStatus, RuleRunStatus } from '@/api/forward';
import type { Node } from '@/api/node';
import type { ResourceGroup } from '@/api/resource';

interface ForwardRuleMobileListProps {
  rules: ForwardRule[];
  agentsMap?: Record<string, ForwardAgent>;
  resourceGroupsMap?: Record<string, ResourceGroup>;
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
  // Drag and drop sorting
  enableDragSort?: boolean;
  onDragEnd?: (activeId: string, overId: string, oldIndex: number, newIndex: number) => void;
}

// Rule type configuration with icons and colors
const RULE_TYPE_CONFIG: Record<string, { labelKey: string; shortLabelKey: string; color: string; bgColor: string }> = {
  direct: {
    labelKey: 'admin.forwardRules.ruleType.direct',
    shortLabelKey: 'admin.forwardRules.ruleType.directShort',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  entry: {
    labelKey: 'admin.forwardRules.ruleType.entry',
    shortLabelKey: 'admin.forwardRules.ruleType.entryShort',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  chain: {
    labelKey: 'admin.forwardRules.ruleType.chain',
    shortLabelKey: 'admin.forwardRules.ruleType.chainShort',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  direct_chain: {
    labelKey: 'admin.forwardRules.ruleType.directChain',
    shortLabelKey: 'admin.forwardRules.ruleType.directChainShort',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
  external: {
    labelKey: 'admin.forwardRules.ruleType.external',
    shortLabelKey: 'admin.forwardRules.ruleType.externalShort',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
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
const SYNC_STATUS_CONFIG: Record<RuleSyncStatus, { labelKey: string; icon: React.ElementType; className: string }> = {
  synced: { labelKey: 'common.status.synced', icon: CheckCircle2, className: 'text-green-500' },
  pending: { labelKey: 'common.status.syncing', icon: CircleDashed, className: 'text-yellow-500' },
  failed: { labelKey: 'common.status.syncFailed', icon: AlertCircle, className: 'text-red-500' },
};

// Run status display config
const RUN_STATUS_CONFIG: Record<RuleRunStatus | 'unknown', { labelKey: string; icon: React.ElementType; className: string }> = {
  running: { labelKey: 'common.status.running', icon: Play, className: 'text-green-500' },
  stopped: { labelKey: 'common.status.stopped', icon: Square, className: 'text-gray-500' },
  error: { labelKey: 'common.status.error', icon: AlertTriangle, className: 'text-red-500' },
  starting: { labelKey: 'admin.forwardRules.status.starting', icon: RotateCw, className: 'text-blue-500' },
  unknown: { labelKey: 'common.status.unknown', icon: CircleDashed, className: 'text-gray-400' },
};

// Mobile flow node type configuration - consistent with desktop
const MOBILE_NODE_CONFIG = {
  entry: {
    icon: Bot,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-700',
    labelKey: 'admin.forwardRules.flowNode.entry',
  },
  relay: {
    icon: Bot,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    borderColor: 'border-purple-300 dark:border-purple-700',
    labelKey: 'admin.forwardRules.flowNode.relay',
  },
  exit: {
    icon: Bot,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/30',
    borderColor: 'border-orange-300 dark:border-orange-700',
    labelKey: 'admin.forwardRules.flowNode.exit',
  },
  target: {
    icon: Server,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    borderColor: 'border-blue-300 dark:border-blue-700',
    labelKey: 'admin.forwardRules.flowNode.target',
  },
};

// Mobile flow node component - simplified for better touch scrolling
const MobileFlowNode: React.FC<{
  type: 'entry' | 'relay' | 'exit' | 'target';
  name: string;
  address?: string;
  label: string;
}> = ({ type, name, address, label }) => {
  const config = MOBILE_NODE_CONFIG[type];
  const IconComponent = config.icon;

  // Simple static display for mobile - avoids touch scroll issues
  return (
    <div
      className={`flex items-center gap-0.5 px-1 py-0.5 rounded ${config.bgColor} border ${config.borderColor} touch-manipulation`}
      title={address ? `${label}: ${name}\n${address}` : `${label}: ${name}`}
    >
      <IconComponent className={`size-2.5 flex-shrink-0 ${config.color}`} />
      <span className="text-[10px] font-medium text-foreground truncate max-w-[45px]">{name}</span>
    </div>
  );
};

// Mobile flow arrow component
const MobileFlowArrow: React.FC<{ color?: 'purple' | 'blue' }> = ({ color = 'blue' }) => (
  <ArrowRight className={`size-2.5 flex-shrink-0 ${color === 'purple' ? 'text-purple-400' : 'text-blue-400'}`} />
);

// Mobile flow path display - unified with desktop style
const FlowPathDisplayMobile: React.FC<{
  rule: ForwardRule;
  agentsMap: Record<string, ForwardAgent>;
  nodes: Node[];
}> = ({ rule, agentsMap, nodes }) => {
  const { t } = useTranslation();

  // Get entry agent info
  const entryAgent = agentsMap[rule.agentId];
  const entryName = entryAgent?.name || `ID: ${rule.agentId.slice(0, 8)}`;
  const entryAddress = entryAgent?.publicAddress ? `${entryAgent.publicAddress}:${rule.listenPort}` : undefined;

  // Get target display info
  const getTargetDisplay = () => {
    if (rule.targetNodeId) {
      const targetNode = nodes.find((n) => n.id === rule.targetNodeId);
      const nodeName = targetNode?.name || `ID: ${rule.targetNodeId.slice(0, 8)}`;
      const nodePort = targetNode?.subscriptionPort || targetNode?.agentPort;
      let address: string | undefined;
      if (rule.ipVersion === 'ipv4' && rule.targetNodePublicIpv4) {
        address = rule.targetNodePublicIpv4;
      } else if (rule.ipVersion === 'ipv6' && rule.targetNodePublicIpv6) {
        address = rule.targetNodePublicIpv6;
      } else {
        address = rule.targetNodeServerAddress || rule.targetNodePublicIpv4 || rule.targetNodePublicIpv6;
      }
      const nodeAddress = address ? (nodePort ? `${address}:${nodePort}` : address) : undefined;
      return { name: nodeName, address: nodeAddress };
    }
    if (rule.targetAddress) {
      return { name: t('admin.forwardRules.target.manual'), address: `${rule.targetAddress}:${rule.targetPort}` };
    }
    return null;
  };

  const target = getTargetDisplay();

  // Build relay chain
  type RelayInfo = { id: string; name: string; address?: string };
  const relayAgents: RelayInfo[] = [];

  // For entry type, exit agent is the relay
  if (rule.ruleType === 'entry' && rule.exitAgentId) {
    const exitAgent = agentsMap[rule.exitAgentId];
    relayAgents.push({
      id: rule.exitAgentId,
      name: exitAgent?.name || `ID: ${rule.exitAgentId.slice(0, 8)}`,
      address: exitAgent?.publicAddress,
    });
  }

  // For chain types, add chain agents
  if ((rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && rule.chainAgentIds?.length) {
    rule.chainAgentIds
      .filter((id) => id !== rule.agentId)
      .forEach((id) => {
        const agent = agentsMap[id];
        relayAgents.push({
          id,
          name: agent?.name || `ID: ${id.slice(0, 8)}`,
          address: agent?.publicAddress,
        });
      });
  }

  const showRelays = relayAgents.length > 0;
  const firstRelay = relayAgents[0];
  const remainingRelays = relayAgents.slice(1);

  return (
    <div className="flex items-center gap-0.5 flex-wrap py-0.5">
      {/* Entry node */}
      <MobileFlowNode type="entry" name={entryName} address={entryAddress} label={t('admin.forwardRules.flowNode.entry')} />

      <MobileFlowArrow color={showRelays ? 'purple' : 'blue'} />

      {/* Relay nodes */}
      {showRelays && (
        <>
          <MobileFlowNode
            type={rule.ruleType === 'entry' ? 'exit' : 'relay'}
            name={firstRelay.name}
            address={firstRelay.address}
            label={t(rule.ruleType === 'entry' ? 'admin.forwardRules.flowNode.exit' : 'admin.forwardRules.flowNode.relay')}
          />
          {remainingRelays.length > 0 && (
            <>
              <MobileFlowArrow color="purple" />
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-0.5 px-1 py-0.5 text-[9px] font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 cursor-pointer touch-manipulation">
                    +{remainingRelays.length}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="start">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold">{t('admin.forwardRules.columns.path')}</h4>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        {t('admin.forwardRules.status.agents', { count: relayAgents.length + 2 })}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute left-2 top-3 bottom-3 w-px bg-gradient-to-b from-green-400 via-purple-400 to-blue-400" />
                      <div className="space-y-1.5">
                        {/* Entry */}
                        <div className="flex items-center gap-1.5 relative">
                          <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 flex items-center justify-center z-10">
                            <Bot className="size-2.5 text-green-500" />
                          </div>
                          <span className="text-[11px] font-medium truncate">{entryName}</span>
                          <span className="text-[9px] px-1 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium">{t('admin.forwardRules.flowNode.entry')}</span>
                        </div>
                        {/* Relays */}
                        {relayAgents.map((relay, index) => (
                          <div key={relay.id} className="flex items-center gap-1.5 relative">
                            <div className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 flex items-center justify-center text-[9px] font-bold text-purple-600 dark:text-purple-400 z-10">
                              {index + 1}
                            </div>
                            <span className="text-[11px] font-medium truncate">{relay.name}</span>
                          </div>
                        ))}
                        {/* Target */}
                        {target && (
                          <div className="flex items-center gap-1.5 relative">
                            <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 flex items-center justify-center z-10">
                              <Server className="size-2.5 text-blue-500" />
                            </div>
                            <span className="text-[11px] font-medium truncate">{target.name}</span>
                            <span className="text-[9px] px-1 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">{t('admin.forwardRules.flowNode.target')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
          <MobileFlowArrow color="blue" />
        </>
      )}

      {/* Target node */}
      {target ? (
        <MobileFlowNode type="target" name={target.name} address={target.address} label={t('admin.forwardRules.flowNode.target')} />
      ) : (
        <span className="text-[10px] text-muted-foreground">-</span>
      )}
    </div>
  );
};

// Loading skeleton for mobile cards
const MobileCardSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="ring-1 ring-border rounded-xl p-4 space-y-3">
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
  resourceGroupsMap = {},
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
  enableDragSort = false,
  onDragEnd,
}) => {
  const { t } = useTranslation();
  // Get rule ID for drag-and-drop
  const getRuleId = useCallback((rule: ForwardRule) => rule.id, []);
  // Get entry address for a rule
  const getEntryAddress = useCallback((rule: ForwardRule) => {
    const agent = agentsMap[rule.agentId];
    return agent?.publicAddress ? `${agent.publicAddress}:${rule.listenPort}` : '-';
  }, [agentsMap]);

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

    // Simplified for mobile - use title for hover info
    return (
      <div
        className="flex items-center gap-1"
        title={`${isPolling ? `${t('common.loading.syncing')} / ` : ''}${t('admin.forwardRules.status.syncLabel')}: ${t(syncConfig.labelKey)} / ${t('admin.forwardRules.status.runLabel')}: ${t(runConfig.labelKey)}`}
      >
        {isPolling && <Loader2 className="size-3 animate-spin text-blue-400" />}
        <SyncIcon className={`size-3.5 ${syncConfig.className}`} />
        <RunIcon className={`size-3.5 ${runConfig.className}`} />
      </div>
    );
  }, [polledStatusMap, pollingRuleIds, t]);

  // Render dropdown menu
  const renderDropdownMenu = useCallback((rule: ForwardRule) => {
    const isProbing = probingRuleId === rule.id;
    const canProbe = rule.status === 'enabled' && !isProbing;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4 text-slate-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent align="end" collisionPadding={16}>
            <DropdownMenuItem onClick={() => onViewDetail(rule)}>
              <Eye className="mr-2 size-4" />
              {t('admin.forwardRules.actions.viewDetail')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(rule)}>
              <Edit className="mr-2 size-4" />
              {t('common.actions.edit')}
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
              {isProbing ? t('admin.forwardRules.actions.probing') : t('admin.forwardRules.actions.probe')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCopy(rule)}>
              <Files className="mr-2 size-4" />
              {t('admin.forwardRules.actions.copyRule')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onResetTraffic(rule)}>
              <RotateCcw className="mr-2 size-4" />
              {t('admin.forwardRules.actions.resetTraffic')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {rule.status === 'enabled' ? (
              <DropdownMenuItem onClick={() => onDisable(rule)}>
                <PowerOff className="mr-2 size-4" />
                {t('common.actions.disable')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onEnable(rule)}>
                <Power className="mr-2 size-4" />
                {t('common.actions.enable')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDelete(rule)} className="text-red-600 dark:text-red-400">
              <Trash2 className="mr-2 size-4" />
              {t('common.actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    );
  }, [onViewDetail, onEdit, onProbe, onCopy, onResetTraffic, onEnable, onDisable, onDelete, probingRuleId, t]);

  if (loading) {
    return <MobileCardSkeleton />;
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        {t('admin.forwardRules.noData')}
      </div>
    );
  }

  // Render a single rule card
  const renderRuleCard = (rule: ForwardRule) => {
    const agent = agentsMap[rule.agentId];
    const agentName = agent?.name || `ID: ${rule.agentId}`;
    const entryAddress = getEntryAddress(rule);
    const statusConfig = ENABLED_STATUS_CONFIG[rule.status] || { labelKey: 'common.status.unknown', variant: 'default' as const };
    const ruleTypeConfig = RULE_TYPE_CONFIG[rule.ruleType] || RULE_TYPE_CONFIG.direct;
    const protocolConfig = PROTOCOL_CONFIG[rule.protocol] || PROTOCOL_CONFIG.tcp;
    const tunnelTypeConfig = rule.tunnelType ? TUNNEL_TYPE_CONFIG[rule.tunnelType] : null;
    const isChainType = rule.ruleType === 'chain' || rule.ruleType === 'direct_chain' || rule.ruleType === 'entry';
    const totalBytes = (rule.uploadBytes || 0) + (rule.downloadBytes || 0);
    const uploadBytes = rule.uploadBytes || 0;
    const downloadBytes = rule.downloadBytes || 0;
    const uploadRatio = totalBytes > 0 ? (uploadBytes / totalBytes) * 100 : 50;

    return (
      <AccordionItem
            key={rule.id}
            value={rule.id}
            className="ring-1 ring-border rounded-xl bg-white dark:bg-slate-800 overflow-hidden"
          >
            {/* Card Header - Always visible */}
            <div className="px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Rule name with type badge, tunnel type, and status */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={`inline-flex items-center justify-center px-1 py-0.5 text-[9px] font-semibold rounded ${ruleTypeConfig.bgColor} ${ruleTypeConfig.color}`}>
                          {t(ruleTypeConfig.shortLabelKey)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{t(ruleTypeConfig.labelKey)}{t('admin.forwardRules.mode')}</TooltipContent>
                    </Tooltip>
                    {/* Show tunnel type for chain/entry types */}
                    {isChainType && tunnelTypeConfig && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={`inline-flex items-center justify-center px-1 py-0.5 text-[8px] font-semibold rounded ${tunnelTypeConfig.bgColor} ${tunnelTypeConfig.color}`}>
                            {tunnelTypeConfig.label}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{tunnelTypeConfig.label}{t('admin.forwardRules.tunnel')}</TooltipContent>
                      </Tooltip>
                    )}
                    <span className="font-medium text-sm text-foreground truncate">
                      {rule.name}
                    </span>
                    <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      {t(statusConfig.labelKey)}
                    </AdminBadge>
                    {renderStatus(rule)}
                  </div>

                  {/* Entry info with protocol */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`font-mono text-[10px] ${protocolConfig.color}`}>{protocolConfig.label}</span>
                    <span className="text-border">·</span>
                    <Bot className="size-3 text-green-500 flex-shrink-0" />
                    <span className="truncate max-w-[70px]">{agentName}</span>
                    <span className="text-border">·</span>
                    <CopyableAddress address={entryAddress} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                {/* Quick Actions - touch-manipulation for better mobile scrolling */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => onEdit(rule)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation"
                    title={t('common.actions.edit')}
                  >
                    <Edit className="size-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  </button>
                  <button
                    onClick={() => rule.status === 'enabled' && onProbe(rule)}
                    disabled={rule.status !== 'enabled' || probingRuleId === rule.id}
                    className={`p-1.5 rounded transition-colors touch-manipulation ${
                      rule.status === 'enabled' && probingRuleId !== rule.id
                        ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    title={probingRuleId === rule.id ? t('admin.forwardRules.actions.probing') : t('admin.forwardRules.actions.probe')}
                  >
                    {probingRuleId === rule.id ? (
                      <Loader2 className="size-3.5 text-blue-500 animate-spin" />
                    ) : (
                      <Activity className="size-3.5 text-slate-400 hover:text-blue-500" />
                    )}
                  </button>
                  <button
                    onClick={() => rule.status === 'enabled' ? onDisable(rule) : onEnable(rule)}
                    className={`p-1.5 rounded transition-colors touch-manipulation ${
                      rule.status === 'enabled'
                        ? 'hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                    title={rule.status === 'enabled' ? t('admin.forwardRules.actions.clickToDisable') : t('admin.forwardRules.actions.clickToEnable')}
                  >
                    {rule.status === 'enabled' ? (
                      <PowerOff className="size-3.5 text-slate-400 hover:text-red-500" />
                    ) : (
                      <Power className="size-3.5 text-slate-400 hover:text-green-500" />
                    )}
                  </button>
                  {renderDropdownMenu(rule)}
                </div>
              </div>
            </div>

            {/* Accordion Trigger */}
            <AccordionTrigger className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-700 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-xs text-slate-400 dark:text-slate-500">{t('common.actions.view')}</span>
            </AccordionTrigger>

            {/* Accordion Content - Expanded details */}
            <AccordionContent>
              <div className="px-3 pb-2 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-2">
                {/* Flow path visualization - unified style */}
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-6 pt-1 flex-shrink-0">{t('admin.forwardRules.columns.path')}</span>
                  <div className="flex-1 min-w-0">
                    <FlowPathDisplayMobile rule={rule} agentsMap={agentsMap} nodes={nodes} />
                  </div>
                </div>

                {/* Traffic with mini bar - simplified for mobile */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-6 flex-shrink-0">{t('admin.forwardRules.columns.traffic')}</span>
                  <div
                    className="flex items-center gap-2 flex-1"
                    title={`${t('common.actions.upload')}: ${formatBytesGB(uploadBytes)} / ${t('common.actions.download')}: ${formatBytesGB(downloadBytes)} / ${t('admin.forwardRules.traffic.multiplier')}: ${rule.effectiveTrafficMultiplier?.toFixed(2) || '1.00'}x`}
                  >
                    <span className="text-xs font-medium text-foreground tabular-nums">
                      {formatBytesGB(totalBytes)}
                    </span>
                    {rule.effectiveTrafficMultiplier && rule.effectiveTrafficMultiplier !== 1 && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
                        ×{rule.effectiveTrafficMultiplier.toFixed(1)}
                      </span>
                    )}
                    {/* Mini traffic bar */}
                    <div className="flex-1 max-w-16 h-1 bg-muted rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${uploadRatio}%` }}
                      />
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${100 - uploadRatio}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Resource Groups */}
                {rule.groupSids && rule.groupSids.length > 0 && (() => {
                  const groups = rule.groupSids
                    .map((sid) => resourceGroupsMap[sid])
                    .filter((g): g is ResourceGroup => !!g);
                  if (groups.length === 0) return null;
                  return (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-6 pt-0.5 flex-shrink-0">{t('admin.forwardRules.columns.resourceGroup')}</span>
                      <div className="flex-1 flex flex-wrap gap-1">
                        {groups.map((g) => (
                          <span
                            key={g.sid}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          >
                            {g.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Remark - Inline */}
                {rule.remark && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-6 pt-0.5 flex-shrink-0">{t('common.fields.remark')}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 flex-1">{rule.remark}</span>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
  };

  // Drag mode: use DraggableMobileList wrapper
  if (enableDragSort && onDragEnd) {
    return (
      <DraggableMobileList
        items={rules}
        getItemId={getRuleId}
        renderItem={(rule) => (
          <Accordion type="single" collapsible className="mb-1.5">
            {renderRuleCard(rule)}
          </Accordion>
        )}
        onDragEnd={onDragEnd}
        enabled={true}
        longPressDelay={250}
        className="space-y-0"
      />
    );
  }

  // Normal mode: standard Accordion
  return (
    <Accordion type="multiple" className="space-y-1.5">
      {rules.map((rule) => renderRuleCard(rule))}
    </Accordion>
  );
};
