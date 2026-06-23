/**
 * Forward Rule List Table Component (Admin)
 * Implemented using TanStack Table with responsive column hiding support
 * Switches to mobile card list on small screens
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Eye, Power, PowerOff, MoreHorizontal, RotateCcw, Activity, Loader2, Server, Bot, ArrowRight, Files, CheckCircle2, CircleDashed, AlertCircle, Play, Square, AlertTriangle, RotateCw } from 'lucide-react';
import { DataTable, DraggableDataTable, TableHoverCardProvider, TableHoverCardList, type ColumnDef, type ResponsiveColumnMeta, type RowSelectionState, type OnChangeFn } from '@/components/admin';
import { Checkbox } from '@/components/common/Checkbox';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { ForwardRuleMobileList } from './ForwardRuleMobileList';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/common/ContextMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/common/Popover';
import { CopyableAddressRow } from '@/components/common/CopyableAddress';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import { formatBytesGB } from '@/shared/utils/format-utils';
import { SYNC_STATUS_COLORS, RUN_STATUS_COLORS } from '@/shared/utils/status-colors';
import type { ForwardRule, ForwardAgent, RuleOverallStatusResponse, RuleSyncStatus, RuleRunStatus } from '@/api/forward';
import type { Node } from '@/api/node';
import type { ResourceGroup } from '@/api/resource';

interface ForwardRuleListTableProps {
  rules: ForwardRule[];
  agentsMap?: Record<string, ForwardAgent>;
  resourceGroupsMap?: Record<string, ResourceGroup>;
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
  // Drag and drop sorting
  enableDragSort?: boolean;
  onDragEnd?: (activeId: string, overId: string, oldIndex: number, newIndex: number) => void;
  // Row selection
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  enableSelection?: boolean;
}

// Rule type configuration with icons and colors
const RULE_TYPE_CONFIG: Record<string, { labelKey: string; shortLabelKey: string; color: string; bgColor: string }> = {
  direct: {
    labelKey: 'admin.forwardRules.ruleType.direct',
    shortLabelKey: 'admin.forwardRules.ruleType.directShort',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  entry: {
    labelKey: 'admin.forwardRules.ruleType.entry',
    shortLabelKey: 'admin.forwardRules.ruleType.entryShort',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  chain: {
    labelKey: 'admin.forwardRules.ruleType.chain',
    shortLabelKey: 'admin.forwardRules.ruleType.chainShort',
    color: 'text-relay',
    bgColor: 'bg-relay/10',
  },
  direct_chain: {
    labelKey: 'admin.forwardRules.ruleType.directChain',
    shortLabelKey: 'admin.forwardRules.ruleType.directChainShort',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  external: {
    labelKey: 'admin.forwardRules.ruleType.external',
    shortLabelKey: 'admin.forwardRules.ruleType.externalShort',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
};

// Protocol configuration
const PROTOCOL_CONFIG: Record<string, { label: string; color: string }> = {
  tcp: { label: 'TCP', color: 'text-info' },
  udp: { label: 'UDP', color: 'text-warning' },
  both: { label: 'TCP/UDP', color: 'text-relay' },
};

// Tunnel type configuration
const TUNNEL_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  ws: {
    label: 'WS',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  tls: {
    label: 'TLS',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  ws_smux: {
    label: 'WS+MUX',
    color: 'text-relay',
    bgColor: 'bg-relay/10',
  },
  tls_smux: {
    label: 'TLS+MUX',
    color: 'text-fuchsia-600 dark:text-fuchsia-400',
    bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
  },
};

// Sync status display config
const SYNC_STATUS_CONFIG: Record<RuleSyncStatus, { labelKey: string; icon: React.ElementType; className: string }> = {
  synced: { labelKey: 'common.status.synced', icon: CheckCircle2, className: SYNC_STATUS_COLORS.synced },
  pending: { labelKey: 'common.status.syncing', icon: CircleDashed, className: SYNC_STATUS_COLORS.pending },
  failed: { labelKey: 'common.status.syncFailed', icon: AlertCircle, className: SYNC_STATUS_COLORS.failed },
};

// Run status display config
const RUN_STATUS_CONFIG: Record<RuleRunStatus | 'unknown', { labelKey: string; icon: React.ElementType; className: string }> = {
  running: { labelKey: 'common.status.running', icon: Play, className: RUN_STATUS_COLORS.running },
  stopped: { labelKey: 'common.status.stopped', icon: Square, className: RUN_STATUS_COLORS.stopped },
  error: { labelKey: 'common.status.error', icon: AlertTriangle, className: RUN_STATUS_COLORS.error },
  starting: { labelKey: 'admin.forwardRules.status.starting', icon: RotateCw, className: RUN_STATUS_COLORS.starting },
  unknown: { labelKey: 'common.status.unknown', icon: CircleDashed, className: RUN_STATUS_COLORS.unknown },
};

// Flow arrow component for chain visualization
const FlowArrow: React.FC<{ className?: string; color?: 'purple' | 'blue' | 'green' }> = ({ className = '', color = 'purple' }) => {
  const colorClasses = {
    purple: 'from-relay/40 to-relay/50',
    blue: 'from-info/40 to-info/50',
    green: 'from-success/40 to-success/50',
  };
  const arrowColor = {
    purple: 'text-relay',
    blue: 'text-info',
    green: 'text-success',
  };
  return (
    <div className={`flex items-center justify-center flex-shrink-0 ${className}`}>
      <div className={`w-4 h-px bg-gradient-to-r ${colorClasses[color]}`} />
      <ArrowRight className={`size-3 -ml-1 ${arrowColor[color]}`} />
    </div>
  );
};

// Flow node component for path visualization
interface FlowNodeProps {
  type: 'entry' | 'relay' | 'exit' | 'target';
  name: string;
  address?: string;
  tunnelAddress?: string;
  isFirst?: boolean;
  t: (key: string) => string;
}

// Flow node config with i18n keys
const FLOW_NODE_CONFIG = {
  entry: {
    icon: Bot,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/50',
    labelKey: 'admin.forwardRules.flowNode.entry',
  },
  relay: {
    icon: Bot,
    color: 'text-relay',
    bgColor: 'bg-relay/10',
    borderColor: 'border-relay/50',
    labelKey: 'admin.forwardRules.flowNode.relay',
  },
  exit: {
    icon: Bot,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/50',
    labelKey: 'admin.forwardRules.flowNode.exit',
  },
  target: {
    icon: Server,
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/50',
    labelKey: 'admin.forwardRules.flowNode.target',
  },
};

const FlowNode: React.FC<FlowNodeProps> = ({ type, name, address, tunnelAddress, t }) => {
  const config = FLOW_NODE_CONFIG;

  const nodeConfig = config[type];
  const IconComponent = nodeConfig.icon;
  const hasAddress = (address && address !== '-') || tunnelAddress;

  // If has address, use Popover for copy functionality
  if (hasAddress) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${nodeConfig.bgColor} border ${nodeConfig.borderColor} cursor-pointer hover:opacity-80 transition-opacity min-w-0`}>
            <IconComponent className={`size-3 flex-shrink-0 ${nodeConfig.color}`} />
            <SmartTruncate text={name} className="text-xs font-medium text-foreground max-w-[80px]" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] px-1 py-0.5 rounded ${nodeConfig.bgColor} ${nodeConfig.color} font-medium`}>
                {t(nodeConfig.labelKey)}
              </span>
              <span className="text-[13px] font-medium">{name}</span>
            </div>
            {address && address !== '-' && (
              <CopyableAddressRow label={t('admin.forwardRules.addressType.public')} address={address} />
            )}
            {tunnelAddress && (
              <CopyableAddressRow label={t('admin.forwardRules.addressType.tunnel')} address={tunnelAddress} />
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // No address, use simple Tooltip
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${nodeConfig.bgColor} border ${nodeConfig.borderColor} cursor-default min-w-0`}>
          <IconComponent className={`size-3 flex-shrink-0 ${nodeConfig.color}`} />
          <SmartTruncate text={name} className="text-xs font-medium text-foreground max-w-[80px]" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-1 py-0.5 rounded ${nodeConfig.bgColor} ${nodeConfig.color} font-medium`}>
            {t(nodeConfig.labelKey)}
          </span>
          <span className="text-[13px] font-medium">{name}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

// Collapsed relay nodes indicator
interface RelayAgentInfo {
  id: string;
  name: string;
  address?: string;
  tunnelAddress?: string;
  weight?: number;
}

interface CollapsedRelaysProps {
  count: number;
  agents: RelayAgentInfo[];
}

// Single relay item with copy functionality
interface RelayItemProps {
  agent: RelayAgentInfo;
  index: number;
  t: (key: string) => string;
}

const RelayItem: React.FC<RelayItemProps> = ({ agent, index, t }) => {
  return (
    <div className="flex items-start gap-2 text-[13px] py-1.5">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-relay/10 text-[10px] font-bold text-relay flex items-center justify-center mt-0.5">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Bot className="size-3 text-relay flex-shrink-0" />
          <span className="truncate font-medium text-foreground">{agent.name}</span>
        </div>
        {agent.address && (
          <div className="mt-0.5 pl-4">
            <CopyableAddressRow label={t('admin.forwardRules.addressType.public')} address={agent.address} showTooltip={false} />
          </div>
        )}
        {agent.tunnelAddress && (
          <div className="mt-0.5 pl-4">
            <CopyableAddressRow label={t('admin.forwardRules.addressType.tunnel')} address={agent.tunnelAddress} showTooltip={false} />
          </div>
        )}
      </div>
    </div>
  );
};

interface CollapsedRelaysWithTranslationProps extends CollapsedRelaysProps {
  t: (key: string) => string;
}

const CollapsedRelays: React.FC<CollapsedRelaysWithTranslationProps> = ({ count, agents, t }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-relay/10 text-relay text-relay border border-relay/20 hover:bg-relay/20 transition-colors cursor-pointer">
          +{count}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">{t('admin.forwardRules.flowNode.relay')}</h4>
          <div className="divide-y divide-border">
            {agents.map((agent, idx) => (
              <RelayItem key={agent.id} agent={agent} index={idx} t={t} />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Load balanced exit agents display component
interface LoadBalancedExitNodesProps {
  agents: RelayAgentInfo[];
  t: (key: string) => string;
}

const LoadBalancedExitItem: React.FC<{ agent: RelayAgentInfo; t: (key: string) => string }> = ({ agent, t }) => {
  return (
    <div className="flex items-start gap-2 text-[13px] py-1.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Bot className="size-3 text-warning flex-shrink-0" />
            <span className="truncate font-medium text-foreground">{agent.name}</span>
          </div>
          {agent.weight !== undefined && (
            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
              {agent.weight}%
            </span>
          )}
        </div>
        {agent.address && (
          <div className="mt-0.5 pl-4">
            <CopyableAddressRow label={t('admin.forwardRules.addressType.public')} address={agent.address} showTooltip={false} />
          </div>
        )}
        {agent.tunnelAddress && (
          <div className="mt-0.5 pl-4">
            <CopyableAddressRow label={t('admin.forwardRules.addressType.tunnel')} address={agent.tunnelAddress} showTooltip={false} />
          </div>
        )}
      </div>
    </div>
  );
};

const LoadBalancedExitNodes: React.FC<LoadBalancedExitNodesProps> = ({ agents, t }) => {
  const firstAgent = agents[0];
  const nodeConfig = FLOW_NODE_CONFIG.exit;
  const IconComponent = nodeConfig.icon;
  const hasMultiple = agents.length > 1;

  // Calculate total weight for percentage display
  const totalWeight = agents.reduce((sum, a) => sum + (a.weight || 100), 0);
  const agentsWithPercent = agents.map(a => ({
    ...a,
    weight: totalWeight > 0 ? Math.round(((a.weight || 100) / totalWeight) * 100) : 100,
  }));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${nodeConfig.bgColor} border ${nodeConfig.borderColor} cursor-pointer hover:opacity-80 transition-opacity min-w-0`}>
          <IconComponent className={`size-3 flex-shrink-0 ${nodeConfig.color}`} />
          <SmartTruncate text={firstAgent.name} className="text-xs font-medium text-foreground max-w-[80px]" />
          {hasMultiple && (
            <span className="flex items-center gap-0.5 px-1 py-0 text-[9px] font-semibold rounded bg-warning/15 text-warning">
              LB {agents.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground">{t('admin.forwardRules.flowNode.exit')}</h4>
            {hasMultiple && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-medium">
                {t('admin.forwardRules.exitAgents.loadBalancing')}
              </span>
            )}
          </div>
          <div className="divide-y divide-border">
            {agentsWithPercent.map((agent) => (
              <LoadBalancedExitItem key={agent.id} agent={agent} t={t} />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Full path display component - shows entry -> relays -> target in horizontal flow
interface FlowPathDisplayProps {
  rule: ForwardRule;
  agentsMap: Record<string, ForwardAgent>;
  nodes: Node[];
  t: (key: string) => string;
}

const FlowPathDisplay: React.FC<FlowPathDisplayProps> = ({ rule, agentsMap, nodes, t }) => {
  // Get entry agent info
  const entryAgent = agentsMap[rule.agentId];
  const entryName = entryAgent?.name || `ID: ${rule.agentId.slice(0, 8)}`;
  const entryAddress = entryAgent?.publicAddress ? `${entryAgent.publicAddress}:${rule.listenPort}` : undefined;
  const entryTunnelAddress = entryAgent?.tunnelAddress;

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

  // Build exit agents for entry type (load balancing - parallel relationship)
  const exitAgentsList: RelayAgentInfo[] = [];
  if (rule.ruleType === 'entry') {
    if (rule.exitAgents && rule.exitAgents.length > 0) {
      rule.exitAgents.forEach((ea) => {
        const exitAgent = agentsMap[ea.agentId];
        exitAgentsList.push({
          id: ea.agentId,
          name: exitAgent?.name || `ID: ${ea.agentId.slice(0, 8)}`,
          address: exitAgent?.publicAddress,
          tunnelAddress: exitAgent?.tunnelAddress,
          weight: ea.weight,
        });
      });
    } else if (rule.exitAgentId) {
      const exitAgent = agentsMap[rule.exitAgentId];
      exitAgentsList.push({
        id: rule.exitAgentId,
        name: exitAgent?.name || `ID: ${rule.exitAgentId.slice(0, 8)}`,
        address: exitAgent?.publicAddress,
        tunnelAddress: exitAgent?.tunnelAddress,
      });
    }
  }

  // Build relay chain for chain types (serial relationship)
  const relayAgents: RelayAgentInfo[] = [];
  if ((rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && rule.chainAgentIds?.length) {
    rule.chainAgentIds
      .filter((id) => id !== rule.agentId)
      .forEach((id) => {
        const agent = agentsMap[id];
        relayAgents.push({
          id,
          name: agent?.name || `ID: ${id.slice(0, 8)}`,
          address: agent?.publicAddress,
          tunnelAddress: agent?.tunnelAddress,
        });
      });
  }

  // Determine display mode
  const hasExitAgents = exitAgentsList.length > 0;
  const hasRelays = relayAgents.length > 0;
  const firstRelay = relayAgents[0];
  const remainingRelays = relayAgents.slice(1);

  return (
    <div className="flex items-center gap-1 min-w-0 py-1">
      {/* Entry node */}
      <FlowNode type="entry" name={entryName} address={entryAddress} tunnelAddress={entryTunnelAddress} isFirst t={t} />

      {/* Arrow to exit/relay or target */}
      <FlowArrow color={hasExitAgents ? 'green' : hasRelays ? 'purple' : 'blue'} />

      {/* Exit agents for entry type (load balancing - displayed as single node with LB indicator) */}
      {hasExitAgents && (
        <>
          <LoadBalancedExitNodes agents={exitAgentsList} t={t} />
          <FlowArrow color="blue" />
        </>
      )}

      {/* Relay nodes for chain types (serial chain) */}
      {hasRelays && (
        <>
          <FlowNode
            type="relay"
            name={firstRelay.name}
            address={firstRelay.address}
            tunnelAddress={firstRelay.tunnelAddress}
            t={t}
          />
          {remainingRelays.length > 0 && (
            <>
              <FlowArrow color="purple" />
              <CollapsedRelays count={remainingRelays.length} agents={remainingRelays} t={t} />
            </>
          )}
          <FlowArrow color="blue" />
        </>
      )}

      {/* Target node */}
      {target ? (
        <FlowNode type="target" name={target.name} address={target.address} t={t} />
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      )}
    </div>
  );
};

export const ForwardRuleListTable: React.FC<ForwardRuleListTableProps> = ({
  rules,
  agentsMap = {},
  resourceGroupsMap = {},
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
  enableDragSort = false,
  onDragEnd,
  rowSelection,
  onRowSelectionChange,
  enableSelection = true,
}) => {
  const { t } = useTranslation();
  // Detect mobile screen
  const { isMobile } = useBreakpoint();
  // Forward rule context menu content
  const renderContextMenuActions = useCallback((rule: ForwardRule) => {
    const isProbing = probingRuleId === rule.id;
    const canProbe = rule.status === 'enabled' && !isProbing;
    return (
      <>
        <ContextMenuItem onClick={() => onViewDetail(rule)}>
          <Eye className="mr-2 size-4" />
          {t('admin.forwardRules.actions.viewDetail')}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onEdit(rule)}>
          <Edit className="mr-2 size-4" />
          {t('common.actions.edit')}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => canProbe && onProbe(rule)}
          disabled={!canProbe}
        >
          {isProbing ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Activity className="mr-2 size-4" />
          )}
          {isProbing ? t('admin.forwardRules.actions.probing') : t('admin.forwardRules.actions.probe')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onCopy(rule)}>
          <Files className="mr-2 size-4" />
          {t('admin.forwardRules.actions.copyRule')}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onResetTraffic(rule)}>
          <RotateCcw className="mr-2 size-4" />
          {t('admin.forwardRules.actions.resetTraffic')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        {rule.status === 'enabled' ? (
          <ContextMenuItem onClick={() => onDisable(rule)}>
            <PowerOff className="mr-2 size-4" />
            {t('common.actions.disable')}
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={() => onEnable(rule)}>
            <Power className="mr-2 size-4" />
            {t('common.actions.enable')}
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={() => onDelete(rule)} className="text-destructive">
          <Trash2 className="mr-2 size-4" />
          {t('common.actions.delete')}
        </ContextMenuItem>
      </>
    );
  }, [onViewDetail, onEdit, onProbe, probingRuleId, onCopy, onResetTraffic, onEnable, onDisable, onDelete, t]);

  // Forward rule dropdown menu content
  const renderDropdownMenuActions = useCallback((rule: ForwardRule) => (
    <>
      <DropdownMenuItem onSelect={() => onCopy(rule)}>
        <Files className="mr-2 size-4" />
        {t('admin.forwardRules.actions.copyRule')}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onResetTraffic(rule)}>
        <RotateCcw className="mr-2 size-4" />
        {t('admin.forwardRules.actions.resetTraffic')}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      {rule.status === 'enabled' ? (
        <DropdownMenuItem onSelect={() => onDisable(rule)}>
          <PowerOff className="mr-2 size-4" />
          {t('common.actions.disable')}
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onSelect={() => onEnable(rule)}>
          <Power className="mr-2 size-4" />
          {t('common.actions.enable')}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onSelect={() => onDelete(rule)} className="text-destructive">
        <Trash2 className="mr-2 size-4" />
        {t('common.actions.delete')}
      </DropdownMenuItem>
    </>
  ), [onCopy, onResetTraffic, onEnable, onDisable, onDelete, t]);

  // Selection column definition - fixed width to prevent layout issues
  const selectColumn: ColumnDef<ForwardRule, unknown> = useMemo(() => ({
    id: 'select',
    size: 40,
    minSize: 40,
    maxSize: 40,
    meta: { priority: 1 } as ResponsiveColumnMeta,
    header: ({ table }) => {
      const isAllSelected = table.getIsAllPageRowsSelected();
      const isSomeSelected = table.getIsSomePageRowsSelected();
      return (
        // Enlarge hit area to fill the whole header cell
        <div
          className="flex items-center justify-center -mx-3 -my-2.5 px-3 py-2.5 cursor-pointer"
          onClick={() => table.toggleAllPageRowsSelected(!isAllSelected)}
        >
          <Checkbox
            checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="pointer-events-none"
          />
        </div>
      );
    },
    cell: ({ row }) => (
      // Enlarge hit area to fill the whole cell so clicking anywhere in the column toggles
      <div
        className="flex items-center justify-center -mx-3 -my-2.5 px-3 py-2.5 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          row.toggleSelected(!row.getIsSelected());
        }}
      >
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="pointer-events-none"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  }), []);

  const columns = useMemo<ColumnDef<ForwardRule, unknown>[]>(() => [
    // Conditionally add select column at the beginning
    ...(enableSelection && rowSelection !== undefined && onRowSelectionChange ? [selectColumn] : []),
    {
      accessorKey: 'name',
      header: t('admin.forwardRules.columns.ruleName'),
      size: 200,
      meta: { priority: 1, sticky: 'left' } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const rule = row.original;
        const ruleTypeConfig = RULE_TYPE_CONFIG[rule.ruleType] || RULE_TYPE_CONFIG.direct;
        const protocolConfig = PROTOCOL_CONFIG[rule.protocol] || PROTOCOL_CONFIG.tcp;
        const tunnelTypeConfig = rule.tunnelType ? TUNNEL_TYPE_CONFIG[rule.tunnelType] : null;
        const isChainType = rule.ruleType === 'chain' || rule.ruleType === 'direct_chain' || rule.ruleType === 'entry';

        // Build hover items including ID and protocol details
        const hoverItems = [
          { label: 'ID', value: rule.id },
          { label: t('admin.forwardRules.columns.ruleType'), value: t(ruleTypeConfig.labelKey) },
          { label: t('common.protocol'), value: protocolConfig.label },
          ...(tunnelTypeConfig ? [{ label: t('admin.forwardRules.tunnel'), value: tunnelTypeConfig.label }] : []),
          ...(rule.remark ? [{ label: t('common.fields.remark'), value: rule.remark }] : []),
        ];

        return (
          <TableHoverCardList
            columnKey="name"
            items={hoverItems}
            contentClassName="w-72"
          >
            <div className="flex flex-col gap-0.5 min-w-0 cursor-default">
              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold rounded shrink-0 ${ruleTypeConfig.bgColor} ${ruleTypeConfig.color}`}>
                      {t(ruleTypeConfig.shortLabelKey)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{t(ruleTypeConfig.labelKey)}{t('admin.forwardRules.mode')}</TooltipContent>
                </Tooltip>
                {/* Show tunnel type for chain/entry types */}
                {isChainType && tunnelTypeConfig && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={`inline-flex items-center justify-center px-1 py-0.5 text-[9px] font-semibold rounded shrink-0 ${tunnelTypeConfig.bgColor} ${tunnelTypeConfig.color}`}>
                        {tunnelTypeConfig.label}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{tunnelTypeConfig.label} {t('admin.forwardRules.tunnel')}</TooltipContent>
                  </Tooltip>
                )}
                <SmartTruncate text={rule.name} className="font-semibold text-foreground" />
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className={`font-mono ${protocolConfig.color}`}>{protocolConfig.label}</span>
                <code className="font-mono text-[11px] text-muted-foreground bg-muted/50 px-1 py-0.5 rounded">
                  {rule.id.slice(0, 8)}
                </code>
              </div>
            </div>
          </TableHoverCardList>
        );
      },
    },
    {
      id: 'path',
      header: t('admin.forwardRules.columns.path'),
      size: 270,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <FlowPathDisplay rule={row.original} agentsMap={agentsMap} nodes={nodes} t={t} />
      ),
    },
    {
      id: 'resourceGroups',
      header: t('admin.forwardRules.columns.resourceGroup'),
      size: 90,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const rule = row.original;
        const groupSids = rule.groupSids;
        if (!groupSids || groupSids.length === 0) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }
        const groups = groupSids
          .map((sid) => resourceGroupsMap[sid])
          .filter((g): g is ResourceGroup => !!g);
        if (groups.length === 0) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }
        if (groups.length === 1) {
          return (
            <SmartTruncate text={groups[0].name} className="text-xs font-medium text-foreground max-w-[120px]" />
          );
        }
        return (
          <TableHoverCardList
            columnKey="resourceGroups"
            items={groups.map((g) => ({ label: g.name, value: g.sid }))}
            title={t('admin.forwardRules.columns.resourceGroups')}
            contentClassName="w-56"
          >
            <span className="text-xs font-medium text-foreground">
              {groups[0].name}
              <span className="ml-1 text-muted-foreground">+{groups.length - 1}</span>
            </span>
          </TableHoverCardList>
        );
      },
    },
    {
      id: 'traffic',
      header: t('admin.forwardRules.columns.traffic'),
      size: 100,
      minSize: 85,
      meta: { priority: 1, numeric: true } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const rule = row.original;

        // External rules: traffic is tracked externally
        if (rule.ruleType === 'external') {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-info cursor-default whitespace-nowrap">
                  {t('admin.forwardRules.traffic.external')}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {t('admin.forwardRules.traffic.externalHint')}
              </TooltipContent>
            </Tooltip>
          );
        }

        const uploadBytes = rule.uploadBytes || 0;
        const downloadBytes = rule.downloadBytes || 0;
        const totalBytes = uploadBytes + downloadBytes;
        const multiplier = rule.effectiveTrafficMultiplier;
        const isAuto = rule.isAutoMultiplier;

        return (
          <TableHoverCardList
            columnKey="traffic"
            items={[
              { label: t('admin.forwardRules.traffic.total'), value: formatBytesGB(totalBytes) },
              { label: t('common.actions.upload'), value: formatBytesGB(uploadBytes) },
              { label: t('common.actions.download'), value: formatBytesGB(downloadBytes) },
              { label: t('admin.forwardRules.traffic.multiplier'), value: `${multiplier?.toFixed(2) || '1.00'}x (${isAuto ? t('common.auto') : t('admin.forwardRules.traffic.custom')})` },
            ]}
            title={t('admin.forwardRules.columns.traffic')}
            contentClassName="w-48"
          >
            <div className="grid grid-cols-[10px_1fr] gap-x-1 gap-y-0.5 text-xs font-mono whitespace-nowrap">
              <span className="text-success">↑</span>
              <span className="text-foreground tabular-nums">{formatBytesGB(uploadBytes)}</span>
              <span className="text-info">↓</span>
              <span className="text-foreground tabular-nums">{formatBytesGB(downloadBytes)}</span>
            </div>
          </TableHoverCardList>
        );
      },
    },
    {
      id: 'health',
      header: t('common.status.label'),
      size: 100,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const rule = row.original;
        const isPolling = pollingRuleIds.includes(rule.id);
        const polledStatus = polledStatusMap[rule.id];

        // Rule not enabled, show stopped state
        if (rule.status !== 'enabled') {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onEnable(rule)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium cursor-pointer active:scale-95 transition-all whitespace-nowrap bg-muted text-muted-foreground"
                >
                  <span className="relative flex">
                    <Square className="relative size-3 fill-current opacity-40" strokeWidth={1.5} />
                  </span>
                  {t('common.status.stopped')}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" align="start">
                <div>{t('common.status.stopped')}</div>
                <div className="text-xs opacity-80 mt-0.5">{t('admin.forwardRules.actions.clickToEnable')}</div>
              </TooltipContent>
            </Tooltip>
          );
        }

        // Determine status source: polled status (if polling) > inline status from list API
        let syncStatus: RuleSyncStatus | undefined;
        let runStatus: RuleRunStatus | 'unknown' | undefined;
        let totalAgents: number | undefined;
        let healthyAgents: number | undefined;

        if (polledStatus) {
          syncStatus = polledStatus.overallSyncStatus;
          runStatus = polledStatus.overallRunStatus;
          totalAgents = polledStatus.totalAgents;
          healthyAgents = polledStatus.healthyAgents;
        } else if (rule.syncStatus) {
          syncStatus = rule.syncStatus;
          runStatus = rule.runStatus;
          totalAgents = rule.totalAgents;
          healthyAgents = rule.healthyAgents;
        }

        // Determine overall health status
        const getHealthConfig = () => {
          if (isPolling && !polledStatus && !rule.syncStatus) {
            return { labelKey: 'common.status.syncing', colorClass: 'text-info', bgClass: 'bg-info/10' };
          }
          if (!syncStatus) {
            return { labelKey: 'common.status.enabled', colorClass: 'text-success', bgClass: 'bg-success/10' };
          }
          if (syncStatus === 'failed') {
            return { labelKey: 'common.status.syncFailed', colorClass: 'text-destructive', bgClass: 'bg-destructive/10' };
          }
          if (syncStatus === 'pending') {
            return { labelKey: 'common.status.syncing', colorClass: 'text-warning', bgClass: 'bg-warning/10' };
          }
          // synced
          if (runStatus === 'running') {
            return { labelKey: 'common.status.running', colorClass: 'text-success', bgClass: 'bg-success/10' };
          }
          if (runStatus === 'error') {
            return { labelKey: 'common.status.error', colorClass: 'text-destructive', bgClass: 'bg-destructive/10' };
          }
          return { labelKey: 'common.status.enabled', colorClass: 'text-success', bgClass: 'bg-success/10' };
        };

        const healthConfig = getHealthConfig();
        const syncConfig = syncStatus ? SYNC_STATUS_CONFIG[syncStatus] : null;
        const runConfig = RUN_STATUS_CONFIG[runStatus || 'unknown'];
        const RunIcon = runConfig.icon;

        // Build tooltip content
        const getTooltipContent = () => {
          const lines: string[] = [t(healthConfig.labelKey)];
          if (syncConfig) {
            lines.push(`${t('admin.forwardRules.status.syncLabel')}: ${t(syncConfig.labelKey)}`);
          }
          if (runStatus && runStatus !== 'unknown') {
            lines.push(`${t('admin.forwardRules.status.runLabel')}: ${t(runConfig.labelKey)}`);
          }
          if ((totalAgents ?? 0) > 0) {
            lines.push(`${t('admin.forwardRules.status.agents')}: ${healthyAgents ?? 0}/${totalAgents ?? 0}`);
          }
          lines.push(t('admin.forwardRules.actions.clickToDisable'));
          return lines;
        };

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onDisable(rule)}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium cursor-pointer active:scale-95 transition-all whitespace-nowrap ${healthConfig.bgClass} ${healthConfig.colorClass}`}
              >
                {isPolling && !polledStatus && !rule.syncStatus ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RunIcon className={`size-3 ${runStatus === 'running' ? 'fill-current' : ''}`} strokeWidth={runStatus === 'stopped' ? 1.5 : 2} />
                )}
                {t(healthConfig.labelKey)}
                {(totalAgents ?? 0) > 1 && (
                  <span className="text-[10px] opacity-70">
                    {healthyAgents ?? 0}/{totalAgents ?? 0}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="start">
              {getTooltipContent().map((line, i) => (
                <div key={i} className={i > 0 ? 'text-xs opacity-80 mt-0.5' : ''}>{line}</div>
              ))}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'actions',
      header: t('common.table.actions'),
      size: 120,
      meta: { priority: 1, sticky: 'right' } as ResponsiveColumnMeta,
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
                  className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-all duration-150"
                  aria-label={t('admin.forwardRules.actions.viewDetail')}
                >
                  <Eye className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('admin.forwardRules.actions.viewDetail')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onEdit(rule)}
                  className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-all duration-150"
                  aria-label={t('common.actions.edit')}
                >
                  <Edit className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('common.actions.edit')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => canProbe && onProbe(rule)}
                  disabled={!canProbe}
                  className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground/70 hover:text-info hover:bg-info/10 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={isProbing ? t('admin.forwardRules.actions.probing') : t('admin.forwardRules.actions.probe')}
                >
                  {isProbing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Activity className="size-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isProbing ? t('admin.forwardRules.actions.probing') : rule.status !== 'enabled' ? t('admin.forwardRules.actions.probeDisabledHint') : t('admin.forwardRules.actions.probe')}
              </TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-all duration-150"
                  aria-label={t('common.actions.more')}
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent align="end" collisionPadding={16}>
                  {renderDropdownMenuActions(rule)}
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [agentsMap, resourceGroupsMap, nodes, polledStatusMap, pollingRuleIds, onDisable, onEnable, onViewDetail, onEdit, onProbe, probingRuleId, renderDropdownMenuActions, enableSelection, rowSelection, onRowSelectionChange, selectColumn, t]);

  // Render mobile card list on small screens
  if (isMobile) {
    return (
      <ForwardRuleMobileList
        rules={rules}
        agentsMap={agentsMap}
        resourceGroupsMap={resourceGroupsMap}
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
        enableDragSort={enableDragSort}
        onDragEnd={onDragEnd}
      />
    );
  }

  // Use DraggableDataTable when drag sort is enabled
  if (enableDragSort && onDragEnd) {
    return (
      <TableHoverCardProvider>
        <DraggableDataTable
          elevated
          columns={columns}
          data={rules}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          emptyMessage={t('admin.forwardRules.noData')}
          getRowId={(row) => String(row.id)}
          enableDragSort={true}
          onDragEnd={onDragEnd}
          enableContextMenu={true}
          contextMenuContent={renderContextMenuActions}
          rowSelection={rowSelection}
          onRowSelectionChange={onRowSelectionChange}
        />
      </TableHoverCardProvider>
    );
  }

  return (
    <TableHoverCardProvider>
      <DataTable
        elevated
        columns={columns}
        data={rules}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        emptyMessage={t('admin.forwardRules.noData')}
        getRowId={(row) => String(row.id)}
        enableContextMenu={true}
        contextMenuContent={renderContextMenuActions}
        rowSelection={rowSelection}
        onRowSelectionChange={onRowSelectionChange}
      />
    </TableHoverCardProvider>
  );
};
