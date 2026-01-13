/**
 * Forward Rule Detail View Dialog
 * UI/UX Pro Max Design: Modern Admin Dashboard Style
 * - Dark Mode (OLED) + Minimalism
 * - Data visualization focused
 * - WCAG AA+ accessibility
 */

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/Dialog';
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
  enabled: { label: '运行中', color: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
  disabled: { label: '已停止', color: 'text-slate-400', bg: 'bg-slate-500/10', ring: 'ring-slate-500/20' },
};

// Rule type configuration
const RULE_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; gradient: string }> = {
  direct: { label: '直连', icon: Zap, gradient: 'from-blue-500 to-cyan-500' },
  entry: { label: '入口', icon: Shield, gradient: 'from-emerald-500 to-teal-500' },
  chain: { label: '链式', icon: Activity, gradient: 'from-purple-500 to-pink-500' },
  direct_chain: { label: '直链', icon: Globe, gradient: 'from-amber-500 to-orange-500' },
};

// Protocol labels
const PROTOCOL_LABELS: Record<string, string> = { tcp: 'TCP', udp: 'UDP', both: 'TCP/UDP' };
const IP_VERSION_LABELS: Record<string, string> = { auto: '自动', ipv4: 'IPv4', ipv6: 'IPv6' };
const TUNNEL_TYPE_LABELS: Record<string, string> = { ws: 'WebSocket', tls: 'TLS' };

// Sync status config
const SYNC_STATUS_CONFIG: Record<RuleSyncStatus, { label: string; icon: React.ElementType; color: string }> = {
  synced: { label: '已同步', icon: CheckCircle2, color: 'text-emerald-500' },
  pending: { label: '同步中', icon: CircleDashed, color: 'text-amber-500' },
  failed: { label: '失败', icon: AlertCircle, color: 'text-red-500' },
};

// Run status config
const RUN_STATUS_CONFIG: Record<RuleRunStatus | 'unknown', { label: string; icon: React.ElementType; color: string }> = {
  running: { label: '运行中', icon: Play, color: 'text-emerald-500' },
  stopped: { label: '已停止', icon: Square, color: 'text-slate-400' },
  error: { label: '错误', icon: AlertTriangle, color: 'text-red-500' },
  starting: { label: '启动中', icon: RotateCw, color: 'text-blue-500' },
  unknown: { label: '未知', icon: HelpCircle, color: 'text-slate-400' },
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

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

const formatTimestamp = (timestamp?: number) => {
  if (!timestamp) return '-';
  return formatDate(new Date(timestamp * 1000).toISOString());
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

// Compact Flow Path Component - Linear style with flex layout
const FlowPath: React.FC<{
  nodes: Array<{
    type: 'entry' | 'relay' | 'exit' | 'target';
    name: string;
    address?: string;
    port?: number;
  }>;
}> = ({ nodes }) => {
  const config = {
    entry: { icon: Bot, color: 'text-emerald-500', bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', borderColor: 'border-emerald-500', label: '入口' },
    relay: { icon: Bot, color: 'text-purple-500', bg: 'bg-purple-500', bgLight: 'bg-purple-500/10', borderColor: 'border-purple-500', label: '中继' },
    exit: { icon: Bot, color: 'text-orange-500', bg: 'bg-orange-500', bgLight: 'bg-orange-500/10', borderColor: 'border-orange-500', label: '出口' },
    target: { icon: Server, color: 'text-blue-500', bg: 'bg-blue-500', bgLight: 'bg-blue-500/10', borderColor: 'border-blue-500', label: '目标' },
  };

  // Format address for display (truncate long addresses)
  const formatAddress = (address?: string, port?: number) => {
    if (!address && !port) return null;
    if (!address) return `:${port}`;
    // Truncate long addresses
    const displayAddr = address.length > 15 ? `${address.slice(0, 12)}...` : address;
    return port ? `${displayAddr}:${port}` : displayAddr;
  };

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

        return (
          <div key={index} className="flex items-center gap-3 flex-shrink-0">
            {/* Node */}
            <div
              className="flex flex-col items-center gap-1 group cursor-default"
              title={fullAddress ? `${node.name}\n${fullAddress}` : node.name}
            >
              {/* Node circle with badge */}
              <div className="relative">
                <div className={`size-9 rounded-full ${nodeConfig.bgLight} border-2 ${nodeConfig.borderColor}/40 flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:border-opacity-70`}>
                  <Icon className={`size-4 ${nodeConfig.color}`} />
                </div>
                {/* Type label badge */}
                <span className={`absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${nodeConfig.bg} text-white shadow-sm whitespace-nowrap`}>
                  {nodeConfig.label}
                </span>
              </div>

              {/* Node info */}
              <div className="flex flex-col items-center min-w-[60px] max-w-[100px]">
                <span className="text-[11px] font-medium text-center truncate w-full leading-tight">{node.name}</span>
                {displayAddress && (
                  <span className="text-[10px] text-muted-foreground font-mono truncate w-full text-center" title={fullAddress}>
                    {displayAddress}
                  </span>
                )}
              </div>
            </div>

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
            <span className="text-muted-foreground">上传</span>
            <span className="font-semibold tabular-nums">{formatBytes(upload)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Download className="size-3.5 text-blue-500" />
            <span className="text-muted-foreground">下载</span>
            <span className="font-semibold tabular-nums">{formatBytes(download)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">总计</span>
          <span className="font-bold tabular-nums">{formatBytes(total)}</span>
        </div>
      </div>
    </div>
  );
};

// Agent Status Row Component
const AgentStatusRow: React.FC<{ status: AgentRuleSyncStatus }> = ({ status }) => {
  const syncConfig = SYNC_STATUS_CONFIG[status.syncStatus];
  const runConfig = RUN_STATUS_CONFIG[status.runStatus];
  const SyncIcon = syncConfig.icon;
  const RunIcon = runConfig.icon;

  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-default">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/50">
          <Bot className="size-3.5 text-slate-500" />
        </div>
        <div>
          <span className="text-sm font-medium">{status.agentName}</span>
          {status.position === 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              入口
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className={`flex items-center gap-1 ${syncConfig.color}`}>
          <SyncIcon className="size-3.5" />
          <span className="hidden sm:inline">{syncConfig.label}</span>
        </span>
        <span className={`flex items-center gap-1 ${runConfig.color}`}>
          <RunIcon className="size-3.5" />
          <span className="hidden sm:inline">{runConfig.label}</span>
        </span>
        <span className="text-muted-foreground tabular-nums font-mono">
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

  // Build flow path nodes
  const flowNodes: Array<{ type: 'entry' | 'relay' | 'exit' | 'target'; name: string; address?: string; port?: number }> = [];

  // Entry node
  flowNodes.push({
    type: 'entry',
    name: getAgentName(rule.agentId),
    address: getAgentAddress(rule.agentId),
    port: rule.listenPort,
  });

  // Exit/Relay nodes
  if (rule.ruleType === 'entry' && rule.exitAgentId) {
    flowNodes.push({
      type: 'exit',
      name: getAgentName(rule.exitAgentId),
      address: getAgentAddress(rule.exitAgentId),
    });
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[680px] p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
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
                    {statusConfig.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {PROTOCOL_LABELS[rule.protocol]} · {IP_VERSION_LABELS[rule.ipVersion]}
                  </span>
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
            {/* Flow Path Visualization */}
            <section>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">转发链路</h3>
                {(rule.ruleType === 'entry' || rule.ruleType === 'chain') && rule.tunnelType && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    {TUNNEL_TYPE_LABELS[rule.tunnelType]}
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">{flowNodes.length} 个节点</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30">
                <FlowPath nodes={flowNodes} />
              </div>
            </section>

            {/* Stats Grid */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Settings2 className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">配置概览</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatCard
                  icon={Zap}
                  label="规则类型"
                  value={ruleTypeConfig.label}
                  color={`bg-gradient-to-br ${ruleTypeConfig.gradient} text-white`}
                />
                <StatCard
                  icon={Globe}
                  label="监听端口"
                  value={rule.listenPort}
                  color="text-blue-500"
                />
                <StatCard
                  icon={Activity}
                  label="流量倍率"
                  value={`${rule.effectiveTrafficMultiplier?.toFixed(1) || '1.0'}x`}
                  subValue={rule.isAutoMultiplier ? '自动' : '自定义'}
                  color="text-amber-500"
                />
                <StatCard
                  icon={Clock}
                  label="创建时间"
                  value={formatDate(rule.createdAt)}
                  color="text-slate-400"
                />
              </div>
            </section>

            {/* Resource Groups */}
            {ruleGroups.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpen className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">资源组</h3>
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
                <h3 className="text-sm font-semibold">流量统计</h3>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30">
                <TrafficBar
                  upload={rule.uploadBytes || 0}
                  download={rule.downloadBytes || 0}
                  total={totalBytes}
                />
              </div>
            </section>

            {/* Sync Status */}
            {rule.status === 'enabled' && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <RotateCw className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">同步状态</h3>
                  {ruleOverallStatus && (
                    <span className="text-xs text-muted-foreground">
                      · 更新于 {formatTimestamp(ruleOverallStatus.updatedAt)}
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
                              <p className="text-xs text-muted-foreground">同步</p>
                              <p className="text-sm font-semibold">{config.label}</p>
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
                              <p className="text-xs text-muted-foreground">运行</p>
                              <p className="text-sm font-semibold">{config.label}</p>
                            </>
                          );
                        })()}
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 text-center">
                        <p className="text-xl font-bold text-emerald-500 mb-0.5">
                          {ruleOverallStatus.healthyAgents}/{ruleOverallStatus.totalAgents}
                        </p>
                        <p className="text-xs text-muted-foreground">节点正常</p>
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
                    暂无同步状态数据
                  </div>
                )}
              </section>
            )}

            {/* Timestamps */}
            <section className="pt-4 border-t border-slate-200/50 dark:border-slate-700/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span>创建于 {formatDate(rule.createdAt)}</span>
                </div>
                {rule.updatedAt && (
                  <div className="flex items-center gap-1.5">
                    <RotateCw className="size-3.5" />
                    <span>更新于 {formatDate(rule.updatedAt)}</span>
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
