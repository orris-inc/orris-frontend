/**
 * Forward Rule Detail View Dialog
 * UI/UX Pro Max Design: Modern Admin Dashboard Style
 * - Dark Mode (OLED) + Minimalism
 * - Data visualization focused
 * - WCAG AA+ accessibility
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/Dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/common/Popover';
import { TruncatedId } from '@/components/admin';
import {
  Loader2,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
  Play,
  Square,
  AlertTriangle,
  RotateCw,
  HelpCircle,
  Bot,
  Server,
  ArrowRight,
  Activity,
  Clock,
  Settings2,
  FolderOpen,
  Zap,
  Upload,
  Download,
  Shield,
  Globe,
} from 'lucide-react';
import { useRuleOverallStatus } from '../hooks/useForwardRules';
import type { ForwardRule, ForwardAgent, RuleSyncStatus, RuleRunStatus, AgentRuleSyncStatus } from '@/api/forward';
import type { Node } from '@/api/node';
import type { ResourceGroup } from '@/api/resource';

interface ForwardRuleDetailDialogProps {
  open: boolean;
  rule: ForwardRule | null;
  onClose: () => void;
  agents?: ForwardAgent[];
  nodes?: Node[];
  resourceGroups?: ResourceGroup[];
}

// Status configuration
const STATUS_CONFIG = {
  enabled: { labelKey: 'common.status.enabled', color: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
  disabled: { labelKey: 'common.status.disabled', color: 'text-slate-400', bg: 'bg-slate-500/10', ring: 'ring-slate-500/20' },
};

// Rule type configuration
const RULE_TYPE_CONFIG: Record<string, { labelKey: string; icon: React.ElementType; gradient: string }> = {
  direct: { labelKey: 'admin.forwardRules.ruleType.direct', icon: Zap, gradient: 'from-blue-500 to-cyan-500' },
  entry: { labelKey: 'admin.forwardRules.ruleType.entry', icon: Shield, gradient: 'from-emerald-500 to-teal-500' },
  chain: { labelKey: 'admin.forwardRules.ruleType.chain', icon: Activity, gradient: 'from-purple-500 to-pink-500' },
  direct_chain: { labelKey: 'admin.forwardRules.ruleType.directChain', icon: Globe, gradient: 'from-amber-500 to-orange-500' },
  external: { labelKey: 'admin.forwardRules.ruleType.external', icon: Globe, gradient: 'from-cyan-500 to-teal-500' },
};

// Protocol labels
const PROTOCOL_LABELS: Record<string, string> = { tcp: 'TCP', udp: 'UDP', both: 'TCP/UDP' };
const IP_VERSION_LABEL_KEYS: Record<string, string> = { auto: 'common.auto', ipv4: 'admin.forwardRules.detail.ipVersionIpv4', ipv6: 'admin.forwardRules.detail.ipVersionIpv6' };
const TUNNEL_TYPE_LABEL_KEYS: Record<string, string> = { ws: 'admin.forwardRules.detail.tunnelTypeWs', tls: 'admin.forwardRules.detail.tunnelTypeTls' };

// Sync status config
const SYNC_STATUS_CONFIG: Record<RuleSyncStatus, { labelKey: string; icon: React.ElementType; color: string }> = {
  synced: { labelKey: 'common.status.synced', icon: CheckCircle2, color: 'text-emerald-500' },
  pending: { labelKey: 'common.status.pending', icon: CircleDashed, color: 'text-amber-500' },
  failed: { labelKey: 'common.status.failed', icon: AlertCircle, color: 'text-red-500' },
};

// Run status config
const RUN_STATUS_CONFIG: Record<RuleRunStatus | 'unknown', { labelKey: string; icon: React.ElementType; color: string }> = {
  running: { labelKey: 'common.status.running', icon: Play, color: 'text-emerald-500' },
  stopped: { labelKey: 'common.status.stopped', icon: Square, color: 'text-slate-400' },
  error: { labelKey: 'common.status.error', icon: AlertTriangle, color: 'text-red-500' },
  starting: { labelKey: 'admin.forwardRules.runStatus.starting', icon: RotateCw, color: 'text-blue-500' },
  unknown: { labelKey: 'common.status.unknown', icon: HelpCircle, color: 'text-slate-400' },
};

// Format helpers
const formatBytes = (bytes?: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(unitIndex > 1 ? 2 : 0)} ${units[unitIndex]}`;
};

import { formatRelativeTime } from '@/shared/utils/date-utils';

const formatTimestamp = (timestamp?: number) => {
  if (!timestamp) return '-';
  return formatRelativeTime(new Date(timestamp * 1000).toISOString());
};

// Stat Card Component
const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  subValue?: string;
  color?: string;
}> = ({ icon: Icon, label, value, subValue, color = 'text-slate-400' }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
    <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 ${color}`}>
      <Icon className="size-4" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p className="text-sm font-semibold truncate">{value}</p>
      {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
    </div>
  </div>
);

// Exit agent info for load balancing display
interface ExitAgentInfo {
  id: string;
  name: string;
  address?: string;
  weight: number;
}

// Compact Flow Path Component - Linear style with flex layout
const FlowPath: React.FC<{
  nodes: Array<{
    type: 'entry' | 'relay' | 'exit' | 'target';
    name: string;
    address?: string;
    port?: number;
    badge?: string;
  }>;
  exitAgents?: ExitAgentInfo[];
}> = ({ nodes, exitAgents }) => {
  const { t } = useTranslation();
  const config = {
    entry: { icon: Bot, color: 'text-emerald-500', bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', borderColor: 'border-emerald-500', labelKey: 'admin.forwardRules.flowNode.entry' },
    relay: { icon: Bot, color: 'text-purple-500', bg: 'bg-purple-500', bgLight: 'bg-purple-500/10', borderColor: 'border-purple-500', labelKey: 'admin.forwardRules.flowNode.relay' },
    exit: { icon: Bot, color: 'text-orange-500', bg: 'bg-orange-500', bgLight: 'bg-orange-500/10', borderColor: 'border-orange-500', labelKey: 'admin.forwardRules.flowNode.exit' },
    target: { icon: Server, color: 'text-blue-500', bg: 'bg-blue-500', bgLight: 'bg-blue-500/10', borderColor: 'border-blue-500', labelKey: 'admin.forwardRules.flowNode.target' },
  };

  // Format address for display (truncate long addresses)
  const formatAddress = (address?: string, port?: number) => {
    if (!address && !port) return null;
    if (!address) return `:${port}`;
    // Truncate long addresses
    const displayAddr = address.length > 15 ? `${address.slice(0, 12)}...` : address;
    return port ? `${displayAddr}:${port}` : displayAddr;
  };

  // Calculate weight percentages for exit agents
  const totalWeight = exitAgents?.reduce((sum, a) => sum + a.weight, 0) || 0;
  const exitAgentsWithPercent = exitAgents?.map(a => ({
    ...a,
    percent: totalWeight > 0 ? Math.round((a.weight / totalWeight) * 100) : 100,
  }));

  // Check if this is a load balancing exit node
  const hasLoadBalancing = exitAgents && exitAgents.length > 1;

  return (
    <div className="flex items-center gap-3 py-2 overflow-x-auto">
      {nodes.map((node, index) => {
        const nodeConfig = config[node.type];
        const Icon = nodeConfig.icon;
        const fullAddress = node.address
          ? (node.port ? `${node.address}:${node.port}` : node.address)
          : (node.port ? `:${node.port}` : '');
        const displayAddress = formatAddress(node.address, node.port);
        const isLast = index === nodes.length - 1;
        const isExitWithLB = node.type === 'exit' && hasLoadBalancing;

        // Node content (reusable for both with and without Popover)
        const nodeContent = (
          <div
            className={`flex flex-col items-center gap-1 group ${isExitWithLB ? 'cursor-pointer' : 'cursor-default'}`}
            title={!isExitWithLB && fullAddress ? `${node.name}\n${fullAddress}` : undefined}
          >
            {/* Node circle with badge */}
            <div className="relative">
              <div className={`size-9 rounded-full ${nodeConfig.bgLight} border-2 ${nodeConfig.borderColor}/40 flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:border-opacity-70`}>
                <Icon className={`size-4 ${nodeConfig.color}`} />
              </div>
              {/* Type label badge */}
              <span className={`absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${nodeConfig.bg} text-white shadow-sm whitespace-nowrap`}>
                {t(nodeConfig.labelKey)}
              </span>
            </div>

            {/* Node info */}
            <div className="flex flex-col items-center min-w-[60px] max-w-[100px]">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-medium text-center truncate leading-tight">{node.name}</span>
                {node.badge && (
                  <span className="px-1 py-0 text-[9px] font-semibold rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 shrink-0">
                    {node.badge}
                  </span>
                )}
              </div>
              {displayAddress && (
                <span className="text-[10px] text-muted-foreground font-mono truncate w-full text-center" title={fullAddress}>
                  {displayAddress}
                </span>
              )}
            </div>
          </div>
        );

        return (
          <div key={index} className="flex items-center gap-3 flex-shrink-0">
            {/* Node - wrap with Popover if exit with load balancing */}
            {isExitWithLB ? (
              <Popover>
                <PopoverTrigger asChild>
                  {nodeContent}
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="center">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-muted-foreground">{t('admin.forwardRules.flowNode.exit')}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium">
                        {t('admin.forwardRules.exitAgents.loadBalancing')}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {exitAgentsWithPercent?.map((agent, idx) => (
                        <div key={agent.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{agent.name}</div>
                              {agent.address && (
                                <div className="text-[10px] text-muted-foreground font-mono truncate">{agent.address}</div>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground font-mono shrink-0">{agent.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              nodeContent
            )}

            {/* Arrow connector */}
            {!isLast && (
              <div className="flex items-center -mt-5">
                <div className="w-6 h-px bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500" />
                <ArrowRight className="size-3.5 -ml-1 text-slate-400 dark:text-slate-500" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Traffic Bar Component
const TrafficBar: React.FC<{
  upload: number;
  download: number;
  total: number;
}> = ({ upload, download, total }) => {
  const { t } = useTranslation();
  const uploadPercent = total > 0 ? (upload / total) * 100 : 50;
  const downloadPercent = 100 - uploadPercent;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${uploadPercent}%` }}
        />
        <div
          className="absolute right-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out"
          style={{ width: `${downloadPercent}%` }}
        />
        {/* Center divider */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white dark:bg-slate-900 transition-all duration-500"
          style={{ left: `${uploadPercent}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Upload className="size-3.5 text-emerald-500" />
            <span className="text-muted-foreground">{t('common.actions.upload')}</span>
            <span className="font-semibold tabular-nums">{formatBytes(upload)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Download className="size-3.5 text-blue-500" />
            <span className="text-muted-foreground">{t('common.actions.download')}</span>
            <span className="font-semibold tabular-nums">{formatBytes(download)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{t('admin.forwardRules.detail.total')}</span>
          <span className="font-bold tabular-nums">{formatBytes(total)}</span>
        </div>
      </div>
    </div>
  );
};

// Agent Status Row Component
const AgentStatusRow: React.FC<{ status: AgentRuleSyncStatus }> = ({ status }) => {
  const { t } = useTranslation();
  const syncConfig = SYNC_STATUS_CONFIG[status.syncStatus];
  const runConfig = RUN_STATUS_CONFIG[status.runStatus];
  const SyncIcon = syncConfig.icon;
  const RunIcon = runConfig.icon;

  return (
    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-default overflow-hidden">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/50 flex-shrink-0">
          <Bot className="size-3.5 text-slate-500" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium truncate">{status.agentName}</span>
          {status.position === 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {t('admin.forwardRules.flowNode.entry')}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs flex-shrink-0">
        <span className={`flex items-center gap-1 ${syncConfig.color}`}>
          <SyncIcon className="size-3.5" />
        </span>
        <span className={`flex items-center gap-1 ${runConfig.color}`}>
          <RunIcon className="size-3.5" />
        </span>
        <span className="text-muted-foreground tabular-nums font-mono whitespace-nowrap">
          :{status.listenPort}
        </span>
      </div>
    </div>
  );
};

export const ForwardRuleDetailDialog: React.FC<ForwardRuleDetailDialogProps> = ({
  open,
  rule,
  onClose,
  agents = [],
  nodes = [],
  resourceGroups = [],
}) => {
  const { t } = useTranslation();

  // Get rule overall status
  const { ruleOverallStatus, isLoading: isLoadingStatus } = useRuleOverallStatus(
    open && rule?.status === 'enabled' ? rule.id : null
  );

  // Memoized helpers
  const agentsMap = useMemo(() => {
    const map: Record<string, ForwardAgent> = {};
    agents.forEach((a) => { map[a.id] = a; });
    return map;
  }, [agents]);

  const getAgentName = (id?: string) => {
    if (!id) return '-';
    return agentsMap[id]?.name || `${id.slice(0, 10)}...`;
  };

  const getAgentAddress = (id?: string) => {
    if (!id) return undefined;
    return agentsMap[id]?.publicAddress;
  };

  const getNodeName = (id?: string) => {
    if (!id) return '-';
    const node = nodes.find((n) => n.id === id);
    return node?.name || `${id.slice(0, 10)}...`;
  };

  // Get resource groups for this rule
  const ruleGroups = useMemo(() => {
    return rule?.groupSids
      ?.map((sid) => resourceGroups.find((g) => g.sid === sid))
      .filter((g): g is ResourceGroup => !!g) || [];
  }, [rule?.groupSids, resourceGroups]);

  if (!rule) return null;

  const ruleTypeConfig = RULE_TYPE_CONFIG[rule.ruleType] || RULE_TYPE_CONFIG.direct;
  const statusConfig = STATUS_CONFIG[rule.status] || STATUS_CONFIG.disabled;
  const TypeIcon = ruleTypeConfig.icon;

  const totalBytes = (rule.uploadBytes || 0) + (rule.downloadBytes || 0);

  // Build flow path nodes (not used for external type)
  const flowNodes: Array<{ type: 'entry' | 'relay' | 'exit' | 'target'; name: string; address?: string; port?: number; badge?: string }> = [];

  // External type doesn't have flow path
  if (rule.ruleType !== 'external') {
    // Entry node
    flowNodes.push({
      type: 'entry',
      name: getAgentName(rule.agentId),
      address: getAgentAddress(rule.agentId),
      port: rule.listenPort,
    });

    // Exit/Relay nodes - support load balancing
    if (rule.ruleType === 'entry') {
      if (rule.exitAgents && rule.exitAgents.length > 0) {
        // Load balancing: multiple exit agents
        const firstExitAgent = rule.exitAgents[0];
        const exitCount = rule.exitAgents.length;
        flowNodes.push({
          type: 'exit',
          name: getAgentName(firstExitAgent.agentId),
          address: getAgentAddress(firstExitAgent.agentId),
          badge: exitCount > 1 ? `LB ${exitCount}` : undefined,
        });
      } else if (rule.exitAgentId) {
        // Single exit agent (legacy)
        flowNodes.push({
          type: 'exit',
          name: getAgentName(rule.exitAgentId),
          address: getAgentAddress(rule.exitAgentId),
        });
      }
    }

    if ((rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && rule.chainAgentIds) {
      rule.chainAgentIds
        .filter((id) => id !== rule.agentId)
        .forEach((id) => {
          flowNodes.push({
            type: 'relay',
            name: getAgentName(id),
            address: getAgentAddress(id),
            port: rule.chainPortConfig?.[id],
          });
        });
    }

    // Target node
    if (rule.targetNodeId || rule.targetAddress) {
      flowNodes.push({
        type: 'target',
        name: rule.targetNodeId ? getNodeName(rule.targetNodeId) : (rule.targetAddress || '-'),
        address: rule.targetNodeId ? (rule.targetNodeServerAddress || rule.targetNodePublicIpv4) : rule.targetAddress,
        port: rule.targetPort,
      });
    }
  }

  // Build exit agents info for load balancing popover
  const exitAgentsInfo: ExitAgentInfo[] = rule.exitAgents?.map(ea => ({
    id: ea.agentId,
    name: getAgentName(ea.agentId),
    address: getAgentAddress(ea.agentId),
    weight: ea.weight,
  })) || [];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="@container sm:max-w-[680px] p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 p-5 pb-4 border-b border-slate-200 dark:border-slate-700/50 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Type Icon */}
              <div className={`p-3 rounded-xl bg-gradient-to-br ${ruleTypeConfig.gradient} shadow-lg`}>
                <TypeIcon className="size-6 text-white" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${statusConfig.bg} ${statusConfig.color} ring-1 ${statusConfig.ring}`}>
                    {t(statusConfig.labelKey)}
                  </span>
                  {rule.ruleType !== 'external' && (
                    <span className="text-xs text-muted-foreground">
                      {PROTOCOL_LABELS[rule.protocol]} · {t(IP_VERSION_LABEL_KEYS[rule.ipVersion])}
                    </span>
                  )}
                </div>
                <DialogTitle className="text-lg font-bold">{rule.name}</DialogTitle>
                <div className="flex items-center gap-2">
                  <TruncatedId id={rule.id} />
                  {rule.remark && (
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      · {rule.remark}
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-5 space-y-6">
            {/* Flow Path Visualization - hidden for external type */}
            {rule.ruleType !== 'external' && (
              <section>
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{t('admin.forwardRules.detail.forwardPath')}</h3>
                  {(rule.ruleType === 'entry' || rule.ruleType === 'chain') && rule.tunnelType && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      {t(TUNNEL_TYPE_LABEL_KEYS[rule.tunnelType])}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">{t('admin.forwardRules.detail.nodesCount', { count: flowNodes.length })}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30">
                  <FlowPath nodes={flowNodes} exitAgents={exitAgentsInfo} />
                </div>
              </section>
            )}

            {/* External type: Server Info */}
            {rule.ruleType === 'external' && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Server className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{t('admin.forwardRules.detail.serverInfo')}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard
                    icon={Globe}
                    label={t('admin.forwardRules.detail.serverAddress')}
                    value={rule.serverAddress || '-'}
                    color="text-cyan-500"
                  />
                  <StatCard
                    icon={Zap}
                    label={t('admin.forwardRules.detail.listenPort')}
                    value={rule.listenPort}
                    color="text-blue-500"
                  />
                  {rule.targetNodeId && (
                    <StatCard
                      icon={Server}
                      label={t('admin.forwardRules.detail.targetNode')}
                      value={getNodeName(rule.targetNodeId)}
                      color="text-emerald-500"
                    />
                  )}
                  {rule.externalSource && (
                    <StatCard
                      icon={FolderOpen}
                      label={t('admin.forwardRules.detail.externalSourceLabel')}
                      value={rule.externalSource}
                      color="text-purple-500"
                    />
                  )}
                  {rule.externalRuleId && (
                    <StatCard
                      icon={Settings2}
                      label={t('admin.forwardRules.detail.externalRuleIdLabel')}
                      value={rule.externalRuleId}
                      color="text-slate-400"
                    />
                  )}
                </div>
              </section>
            )}

            {/* Stats Grid - different for external type */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Settings2 className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">{t('admin.forwardRules.detail.configOverview')}</h3>
              </div>
              {rule.ruleType === 'external' ? (
                <div className="grid grid-cols-2 @sm:grid-cols-3 gap-2">
                  <StatCard
                    icon={Zap}
                    label={t('admin.forwardRules.detail.ruleType')}
                    value={t(ruleTypeConfig.labelKey)}
                    color={`bg-gradient-to-br ${ruleTypeConfig.gradient} text-white`}
                  />
                  <StatCard
                    icon={Activity}
                    label={t('common.fields.sortOrder')}
                    value={rule.sortOrder ?? 0}
                    color="text-amber-500"
                  />
                  <StatCard
                    icon={Clock}
                    label={t('admin.forwardRules.detail.createdTime')}
                    value={formatRelativeTime(rule.createdAt)}
                    color="text-slate-400"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 @sm:grid-cols-4 gap-2">
                  <StatCard
                    icon={Zap}
                    label={t('admin.forwardRules.detail.ruleType')}
                    value={t(ruleTypeConfig.labelKey)}
                    color={`bg-gradient-to-br ${ruleTypeConfig.gradient} text-white`}
                  />
                  <StatCard
                    icon={Globe}
                    label={t('admin.forwardRules.detail.listenPort')}
                    value={rule.listenPort}
                    color="text-blue-500"
                  />
                  <StatCard
                    icon={Activity}
                    label={t('admin.forwardRules.detail.trafficMultiplier')}
                    value={`${rule.effectiveTrafficMultiplier?.toFixed(1) || '1.0'}x`}
                    subValue={rule.isAutoMultiplier ? t('common.auto') : t('admin.forwardRules.traffic.custom')}
                    color="text-amber-500"
                  />
                  <StatCard
                    icon={Clock}
                    label={t('admin.forwardRules.detail.createdTime')}
                    value={formatRelativeTime(rule.createdAt)}
                    color="text-slate-400"
                  />
                </div>
              )}
            </section>

            {/* Resource Groups */}
            {ruleGroups.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpen className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{t('admin.forwardRules.detail.resourceGroups')}</h3>
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                    {ruleGroups.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ruleGroups.map((group) => (
                    <div
                      key={group.sid}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-default"
                    >
                      <FolderOpen className="size-3.5 text-blue-500" />
                      <span className="text-sm font-medium">{group.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Traffic Statistics */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">{t('admin.forwardRules.detail.trafficStats')}</h3>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30">
                <TrafficBar
                  upload={rule.uploadBytes || 0}
                  download={rule.downloadBytes || 0}
                  total={totalBytes}
                />
              </div>
            </section>

            {/* Sync Status - hidden for external type */}
            {rule.status === 'enabled' && rule.ruleType !== 'external' && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <RotateCw className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{t('admin.forwardRules.detail.syncStatus')}</h3>
                  {ruleOverallStatus && (
                    <span className="text-xs text-muted-foreground">
                      · {t('admin.forwardRules.detail.updatedAt', { time: formatTimestamp(ruleOverallStatus.updatedAt) })}
                    </span>
                  )}
                </div>

                {isLoadingStatus ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : ruleOverallStatus ? (
                  <div className="space-y-3">
                    {/* Status summary cards */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 text-center">
                        {(() => {
                          const config = SYNC_STATUS_CONFIG[ruleOverallStatus.overallSyncStatus];
                          const Icon = config.icon;
                          return (
                            <>
                              <Icon className={`size-5 mx-auto mb-1 ${config.color}`} />
                              <p className="text-xs text-muted-foreground">{t('admin.forwardRules.detail.sync')}</p>
                              <p className="text-sm font-semibold">{t(config.labelKey)}</p>
                            </>
                          );
                        })()}
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 text-center">
                        {(() => {
                          const config = RUN_STATUS_CONFIG[ruleOverallStatus.overallRunStatus];
                          const Icon = config.icon;
                          return (
                            <>
                              <Icon className={`size-5 mx-auto mb-1 ${config.color}`} />
                              <p className="text-xs text-muted-foreground">{t('admin.forwardRules.detail.run')}</p>
                              <p className="text-sm font-semibold">{t(config.labelKey)}</p>
                            </>
                          );
                        })()}
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 text-center">
                        <p className="text-xl font-bold text-emerald-500 mb-0.5">
                          {ruleOverallStatus.healthyAgents}/{ruleOverallStatus.totalAgents}
                        </p>
                        <p className="text-xs text-muted-foreground">{t('admin.forwardRules.detail.healthyAgents')}</p>
                      </div>
                    </div>

                    {/* Agent list */}
                    {ruleOverallStatus.agentStatuses.length > 0 && (
                      <div className="space-y-1.5">
                        {ruleOverallStatus.agentStatuses.map((agentStatus) => (
                          <AgentStatusRow key={agentStatus.agentId} status={agentStatus} />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {t('admin.forwardRules.detail.noSyncStatus')}
                  </div>
                )}
              </section>
            )}

            {/* Timestamps */}
            <section className="pt-4 border-t border-slate-200/50 dark:border-slate-700/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span>{t('admin.forwardRules.detail.createdAt', { time: formatRelativeTime(rule.createdAt) })}</span>
                </div>
                {rule.updatedAt && (
                  <div className="flex items-center gap-1.5">
                    <RotateCw className="size-3.5" />
                    <span>{t('admin.forwardRules.detail.updatedAt', { time: formatRelativeTime(rule.updatedAt) })}</span>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
