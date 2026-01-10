/**
 * Forward Rule List Table Component (Admin)
 * Implemented using TanStack Table with responsive column hiding support
 * Switches to mobile card list on small screens
 */

import { useMemo, useCallback } from 'react';
import { Edit, Trash2, Eye, Power, PowerOff, MoreHorizontal, RotateCcw, Activity, Loader2, Server, Bot, ArrowRight, Files, CheckCircle2, CircleDashed, AlertCircle, Play, Square, AlertTriangle, RotateCw } from 'lucide-react';
import { DataTable, DraggableDataTable, AdminBadge, TruncatedId, type ColumnDef, type ResponsiveColumnMeta, type RowSelectionState, type OnChangeFn } from '@/components/admin';
import { Checkbox } from '@/components/common/Checkbox';
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
import { CopyableAddressRow } from '@/components/common/CopyableAddress';
import { formatBytesGB } from '@/shared/utils/format-utils';
import { ENABLED_STATUS_CONFIG } from '@/shared/constants/status-config';
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

// Flow arrow component for chain visualization
const FlowArrow: React.FC<{ className?: string; color?: 'purple' | 'blue' | 'green' }> = ({ className = '', color = 'purple' }) => {
  const colorClasses = {
    purple: 'from-purple-300 to-purple-400 dark:from-purple-600 dark:to-purple-400',
    blue: 'from-blue-300 to-blue-400 dark:from-blue-600 dark:to-blue-400',
    green: 'from-green-300 to-green-400 dark:from-green-600 dark:to-green-400',
  };
  const arrowColor = {
    purple: 'text-purple-400 dark:text-purple-400',
    blue: 'text-blue-400 dark:text-blue-400',
    green: 'text-green-400 dark:text-green-400',
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
}

const FlowNode: React.FC<FlowNodeProps> = ({ type, name, address, tunnelAddress }) => {
  const config = {
    entry: {
      icon: Bot,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      borderColor: 'border-green-300 dark:border-green-700',
      label: '入口',
    },
    relay: {
      icon: Bot,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      borderColor: 'border-purple-300 dark:border-purple-700',
      label: '中转',
    },
    exit: {
      icon: Bot,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30',
      borderColor: 'border-orange-300 dark:border-orange-700',
      label: '出口',
    },
    target: {
      icon: Server,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      borderColor: 'border-blue-300 dark:border-blue-700',
      label: '目标',
    },
  };

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
            <span className="text-xs font-medium text-foreground truncate max-w-[80px]">{name}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] px-1 py-0.5 rounded ${nodeConfig.bgColor} ${nodeConfig.color} font-medium`}>
                {nodeConfig.label}
              </span>
              <span className="text-sm font-medium">{name}</span>
            </div>
            {address && address !== '-' && (
              <CopyableAddressRow label="公网" address={address} />
            )}
            {tunnelAddress && (
              <CopyableAddressRow label="隧道" address={tunnelAddress} />
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
          <span className="text-xs font-medium text-foreground truncate max-w-[80px]">{name}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-1 py-0.5 rounded ${nodeConfig.bgColor} ${nodeConfig.color} font-medium`}>
            {nodeConfig.label}
          </span>
          <span className="text-sm font-medium">{name}</span>
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
}

interface CollapsedRelaysProps {
  count: number;
  agents: RelayAgentInfo[];
}

// Single relay item with copy functionality
const RelayItem: React.FC<{ agent: RelayAgentInfo; index: number }> = ({ agent, index }) => {
  return (
    <div className="flex items-start gap-2 text-sm py-1.5">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center justify-center mt-0.5">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Bot className="size-3 text-purple-500 flex-shrink-0" />
          <span className="truncate font-medium text-foreground">{agent.name}</span>
        </div>
        {agent.address && (
          <div className="mt-0.5 pl-4">
            <CopyableAddressRow label="公网" address={agent.address} showTooltip={false} />
          </div>
        )}
        {agent.tunnelAddress && (
          <div className="mt-0.5 pl-4">
            <CopyableAddressRow label="隧道" address={agent.tunnelAddress} showTooltip={false} />
          </div>
        )}
      </div>
    </div>
  );
};

const CollapsedRelays: React.FC<CollapsedRelaysProps> = ({ count, agents }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors cursor-pointer">
          +{count}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">中转节点</h4>
          <div className="divide-y divide-border">
            {agents.map((agent, idx) => (
              <RelayItem key={agent.id} agent={agent} index={idx} />
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
}

const FlowPathDisplay: React.FC<FlowPathDisplayProps> = ({ rule, agentsMap, nodes }) => {
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
      return { name: '手动配置', address: `${rule.targetAddress}:${rule.targetPort}` };
    }
    return null;
  };

  const target = getTargetDisplay();

  // Build relay chain
  const relayAgents: RelayAgentInfo[] = [];

  // For entry type, exit agent is the relay
  if (rule.ruleType === 'entry' && rule.exitAgentId) {
    const exitAgent = agentsMap[rule.exitAgentId];
    relayAgents.push({
      id: rule.exitAgentId,
      name: exitAgent?.name || `ID: ${rule.exitAgentId.slice(0, 8)}`,
      address: exitAgent?.publicAddress,
      tunnelAddress: exitAgent?.tunnelAddress,
    });
  }

  // For chain types, add chain agents (excluding entry agent to avoid duplication)
  if ((rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && rule.chainAgentIds?.length) {
    rule.chainAgentIds
      .filter((id) => id !== rule.agentId) // Filter out entry agent
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

  // Determine what to show for relay section
  const showRelays = relayAgents.length > 0;
  const firstRelay = relayAgents[0];
  const remainingRelays = relayAgents.slice(1);

  return (
    <div className="flex items-center gap-1 min-w-0 py-1">
      {/* Entry node */}
      <FlowNode type="entry" name={entryName} address={entryAddress} tunnelAddress={entryTunnelAddress} isFirst />

      {/* Arrow to relay or target */}
      <FlowArrow color={showRelays ? 'purple' : 'blue'} />

      {/* Relay nodes */}
      {showRelays && (
        <>
          <FlowNode
            type={rule.ruleType === 'entry' ? 'exit' : 'relay'}
            name={firstRelay.name}
            address={firstRelay.address}
            tunnelAddress={firstRelay.tunnelAddress}
          />
          {remainingRelays.length > 0 && (
            <>
              <FlowArrow color="purple" />
              <CollapsedRelays count={remainingRelays.length} agents={remainingRelays} />
            </>
          )}
          <FlowArrow color="blue" />
        </>
      )}

      {/* Target node */}
      {target ? (
        <FlowNode type="target" name={target.name} address={target.address} />
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
          查看详情
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onEdit(rule)}>
          <Edit className="mr-2 size-4" />
          编辑
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
          {isProbing ? '拨测中...' : '拨测'}
        </ContextMenuItem>
        <ContextMenuSeparator />
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
    );
  }, [onViewDetail, onEdit, onProbe, probingRuleId, onCopy, onResetTraffic, onEnable, onDisable, onDelete]);

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

  // Selection column definition - fixed width to prevent layout issues
  const selectColumn: ColumnDef<ForwardRule, unknown> = useMemo(() => ({
    id: 'select',
    size: 40,
    minSize: 40,
    maxSize: 40,
    meta: { priority: 1 } as ResponsiveColumnMeta,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }), []);

  const columns = useMemo<ColumnDef<ForwardRule, unknown>[]>(() => [
    // Conditionally add select column at the beginning
    ...(enableSelection && rowSelection !== undefined && onRowSelectionChange ? [selectColumn] : []),
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
      id: 'path',
      header: '链路',
      size: 400,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <FlowPathDisplay rule={row.original} agentsMap={agentsMap} nodes={nodes} />
      ),
    },
    {
      id: 'resourceGroups',
      header: '资源组',
      size: 140,
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
            <span className="text-xs font-medium text-foreground truncate max-w-[120px] inline-block">
              {groups[0].name}
            </span>
          );
        }
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs font-medium text-foreground cursor-default">
                {groups[0].name}
                <span className="ml-1 text-muted-foreground">+{groups.length - 1}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {groups.map((g) => (
                  <div key={g.sid} className="text-xs">{g.name}</div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'traffic',
      header: '流量',
      size: 130,
      meta: { priority: 1, numeric: true } as ResponsiveColumnMeta,
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
                    {formatBytesGB(totalBytes)}
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
                  <span>上传: {formatBytesGB(uploadBytes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                  <span>下载: {formatBytesGB(downloadBytes)}</span>
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
        const statusConfig = ENABLED_STATUS_CONFIG[rule.status] || { label: rule.status, variant: 'default' as const };
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
  ], [agentsMap, resourceGroupsMap, nodes, polledStatusMap, pollingRuleIds, onDisable, onEnable, onViewDetail, onEdit, onProbe, probingRuleId, renderDropdownMenuActions, enableSelection, rowSelection, onRowSelectionChange, selectColumn]);

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
      <DraggableDataTable
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
        enableDragSort={true}
        onDragEnd={onDragEnd}
        enableContextMenu={true}
        contextMenuContent={renderContextMenuActions}
        rowSelection={rowSelection}
        onRowSelectionChange={onRowSelectionChange}
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
      rowSelection={rowSelection}
      onRowSelectionChange={onRowSelectionChange}
    />
  );
};
