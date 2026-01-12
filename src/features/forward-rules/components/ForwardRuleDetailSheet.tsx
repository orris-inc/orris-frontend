/**
 * ForwardRuleDetailSheet - Mobile forward rule details with actions
 *
 * Features:
 * - Full rule details in a bottom sheet
 * - Forward path visualization
 * - Traffic statistics
 * - Sync status display (for enabled rules)
 * - Primary actions in footer
 * - ActionSheet for secondary actions
 * - iOS-style design
 */

import { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Server,
  Globe,
  Hash,
  FileText,
  Edit,
  Activity,
  MoreHorizontal,
  Copy,
  Power,
  Trash2,
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
  Play,
  Square,
  AlertTriangle,
  RotateCw,
  HelpCircle,
  Zap,
  Shield,
  Link2,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/common/sheet/Sheet';
import { ActionSheet } from '@/components/common/sheet/ActionSheet';
import { AdminBadge } from '@/components/admin';
import { cn } from '@/lib/utils';
import { ENABLED_STATUS_CONFIG } from '@/shared/constants/status-config';
import type {
  ForwardRule,
  ForwardAgent,
  ForwardRuleType,
  ForwardProtocol,
  IPVersion,
  TunnelType,
  RuleSyncStatus,
  RuleRunStatus,
  RuleOverallStatusResponse,
} from '@/api/forward';
import type { Node } from '@/api/node';

// ============================================================================
// Types
// ============================================================================

export interface ForwardRuleDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: ForwardRule | null;
  agentsMap: Record<string, ForwardAgent>;
  nodes: Node[];
  polledStatus?: RuleOverallStatusResponse | null;
  onEdit: (rule: ForwardRule) => void;
  onProbe: (rule: ForwardRule) => void;
  onCopy: (rule: ForwardRule) => void;
  onToggleStatus: (rule: ForwardRule) => void;
  onDelete: (rule: ForwardRule) => void;
  isProbingThis?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const RULE_TYPE_CONFIG: Record<ForwardRuleType, { label: string; icon: React.ReactNode; variant: 'info' | 'success' | 'warning' | 'default' }> = {
  direct: { label: '直连', icon: <Zap className="size-4" />, variant: 'info' },
  entry: { label: '入口', icon: <Shield className="size-4" />, variant: 'success' },
  chain: { label: '链式', icon: <Link2 className="size-4" />, variant: 'warning' },
  direct_chain: { label: '直连链', icon: <Globe className="size-4" />, variant: 'default' },
};

const PROTOCOL_LABELS: Record<ForwardProtocol, string> = {
  tcp: 'TCP',
  udp: 'UDP',
  both: 'TCP/UDP',
};

const IP_VERSION_LABELS: Record<IPVersion, string> = {
  auto: '自动',
  ipv4: 'IPv4',
  ipv6: 'IPv6',
};

const TUNNEL_TYPE_LABELS: Record<TunnelType, string> = {
  ws: 'WebSocket',
  tls: 'TLS',
};

const TARGET_TYPE_LABELS: Record<'node' | 'manual', string> = {
  node: '节点',
  manual: '手动',
};

// Sync status config with explicit color classes for Tailwind scanning
const SYNC_STATUS_CONFIG: Record<RuleSyncStatus, { label: string; icon: React.ElementType; colorClass: string }> = {
  synced: { label: '已同步', icon: CheckCircle2, colorClass: 'text-success' },
  pending: { label: '同步中', icon: CircleDashed, colorClass: 'text-warning' },
  failed: { label: '同步失败', icon: AlertCircle, colorClass: 'text-danger' },
};

// Run status config with explicit color classes for Tailwind scanning
const RUN_STATUS_CONFIG: Record<RuleRunStatus | 'unknown', { label: string; icon: React.ElementType; colorClass: string }> = {
  running: { label: '运行中', icon: Play, colorClass: 'text-success' },
  stopped: { label: '已停止', icon: Square, colorClass: 'text-muted-foreground' },
  error: { label: '错误', icon: AlertTriangle, colorClass: 'text-danger' },
  starting: { label: '启动中', icon: RotateCw, colorClass: 'text-info' },
  unknown: { label: '未知', icon: HelpCircle, colorClass: 'text-muted-foreground' },
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatBytes = (bytes?: number): string => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// ============================================================================
// Helper Components
// ============================================================================

const DetailSection = ({
  title,
  children,
  noPadding,
  allowOverflow,
}: {
  title: string;
  children: React.ReactNode;
  noPadding?: boolean;
  allowOverflow?: boolean;
}) => (
  <div className="space-y-1.5">
    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
      {title}
    </h4>
    <div className={cn(
      'rounded-lg bg-muted/20 border border-border/40',
      !noPadding && 'divide-y divide-border/20',
      // Allow horizontal scroll while keeping vertical overflow visible for badges/indicators
      allowOverflow ? 'overflow-x-auto overflow-y-visible' : 'overflow-hidden'
    )}>
      {children}
    </div>
  </div>
);

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center gap-2 px-2.5 py-1.5">
    <div className="text-muted-foreground shrink-0">{icon}</div>
    <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
    <div className="flex-1 min-w-0 text-right">
      <span className="text-[13px] font-medium">{value}</span>
    </div>
  </div>
);

// Forward path visualization component - Compact version
interface PathNodeProps {
  type: 'entry' | 'relay' | 'exit' | 'target';
  name: string;
  address?: string;
  port?: number;
  isRunning?: boolean;
}

const PathNode = ({ type, name, address, port, isRunning }: PathNodeProps) => {
  const config = {
    entry: { icon: Bot, color: 'text-success', bg: 'bg-success/10', label: '入口' },
    relay: { icon: Bot, color: 'text-primary', bg: 'bg-primary/10', label: '中继' },
    exit: { icon: Bot, color: 'text-warning', bg: 'bg-warning/10', label: '出口' },
    target: { icon: Server, color: 'text-info', bg: 'bg-info/10', label: '目标' },
  };

  const nodeConfig = config[type];
  const Icon = nodeConfig.icon;

  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[56px]">
      {/* Node icon */}
      <div className="relative">
        <div className={cn('size-9 rounded-lg flex items-center justify-center', nodeConfig.bg)}>
          <Icon className={cn('size-4', nodeConfig.color)} />
        </div>
        {isRunning && (
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-success ring-2 ring-background" />
        )}
      </div>
      {/* Label + Name */}
      <span className={cn('text-[9px] font-semibold uppercase', nodeConfig.color)}>
        {nodeConfig.label}
      </span>
      <span className="text-[10px] font-medium text-center truncate max-w-[60px] leading-tight">
        {name}
      </span>
      {(address || port) && (
        <span className="text-[9px] font-mono text-muted-foreground/70 truncate max-w-[60px]">
          {port ? `:${port}` : ''}
        </span>
      )}
    </div>
  );
};

// Connection arrow between nodes
const ConnectionArrow = ({ animated }: { animated?: boolean }) => (
  <div className={cn('px-0.5 pt-3', animated && 'animate-pulse')}>
    <ArrowRight className="size-3 text-muted-foreground/50" />
  </div>
);

const ForwardPathVisualization = ({
  rule,
  agentsMap,
  nodes,
  isRunning,
}: {
  rule: ForwardRule;
  agentsMap: Record<string, ForwardAgent>;
  nodes: Node[];
  isRunning?: boolean;
}) => {
  const getAgentName = (id?: string) => {
    if (!id) return '-';
    return agentsMap[id]?.name || id.slice(0, 10);
  };

  const getAgentAddress = (id?: string) => {
    if (!id) return undefined;
    return agentsMap[id]?.publicAddress;
  };

  const getNodeName = (id?: string) => {
    if (!id) return '-';
    const node = nodes.find((n) => n.id === id);
    return node?.name || id.slice(0, 10);
  };

  // Build path nodes
  const pathNodes: PathNodeProps[] = [];

  // Entry node
  pathNodes.push({
    type: 'entry',
    name: getAgentName(rule.agentId),
    address: getAgentAddress(rule.agentId),
    port: rule.listenPort,
    isRunning,
  });

  // Relay/Exit nodes based on rule type
  if (rule.ruleType === 'entry' && rule.exitAgentId) {
    pathNodes.push({
      type: 'exit',
      name: getAgentName(rule.exitAgentId),
      address: getAgentAddress(rule.exitAgentId),
      isRunning,
    });
  }

  if ((rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && rule.chainAgentIds) {
    rule.chainAgentIds
      .filter((id) => id !== rule.agentId)
      .forEach((id) => {
        pathNodes.push({
          type: 'relay',
          name: getAgentName(id),
          address: getAgentAddress(id),
          port: rule.chainPortConfig?.[id],
          isRunning,
        });
      });
  }

  // Target node
  if (rule.targetNodeId || rule.targetAddress) {
    pathNodes.push({
      type: 'target',
      name: rule.targetNodeId
        ? getNodeName(rule.targetNodeId)
        : rule.targetAddress || '-',
      address: rule.targetNodeId
        ? rule.targetNodeServerAddress || rule.targetNodePublicIpv4
        : rule.targetAddress,
      port: rule.targetPort,
    });
  }

  const nodeCount = pathNodes.length;
  const needsScroll = nodeCount > 4;

  return (
    <div className={cn('pt-1 pb-2', needsScroll && '-mx-2.5')}>
      <div className={cn(
        needsScroll ? 'overflow-x-auto overflow-y-visible scrollbar-hide' : 'overflow-visible'
      )}>
        <div
          className={cn(
            'flex items-start pt-1',
            needsScroll ? 'px-2.5' : 'justify-center'
          )}
          style={needsScroll ? {
            minWidth: 'max-content',
            paddingRight: '1rem',
          } : undefined}
        >
          {pathNodes.map((node, index) => (
            <div key={index} className="flex items-start shrink-0">
              <PathNode {...node} />
              {index < pathNodes.length - 1 && <ConnectionArrow animated={isRunning} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Traffic statistics component - Compact version
const TrafficStats = ({ rule }: { rule: ForwardRule }) => {
  const uploadBytes = rule.uploadBytes || 0;
  const downloadBytes = rule.downloadBytes || 0;
  const totalBytes = uploadBytes + downloadBytes;
  const uploadPercent = totalBytes > 0 ? (uploadBytes / totalBytes) * 100 : 50;

  return (
    <div className="px-2.5 py-2 space-y-2">
      {/* Progress bar */}
      <div className="h-2 bg-muted/40 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-success transition-all"
          style={{ width: `${uploadPercent}%` }}
        />
        <div
          className="h-full bg-info transition-all"
          style={{ width: `${100 - uploadPercent}%` }}
        />
      </div>
      {/* Stats row */}
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1 text-success">
          <Upload className="size-3" />
          <span className="font-mono font-semibold">{formatBytes(uploadBytes)}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Activity className="size-3" />
          <span className="font-mono font-semibold">{formatBytes(totalBytes)}</span>
        </div>
        <div className="flex items-center gap-1 text-info">
          <span className="font-mono font-semibold">{formatBytes(downloadBytes)}</span>
          <Download className="size-3" />
        </div>
      </div>
    </div>
  );
};

// Helper to get position label based on position and total agents
const getPositionLabel = (position: number, total: number): string => {
  if (position === 0) return '入口';
  if (position === total - 1 && total > 1) return '出口';
  return '中继';
};

// Single agent status row component
const AgentStatusRow = ({
  agentStatus,
  position,
  total,
}: {
  agentStatus: import('@/api/forward').AgentRuleSyncStatus;
  position: number;
  total: number;
}) => {
  const syncConfig = SYNC_STATUS_CONFIG[agentStatus.syncStatus];
  const runConfig = RUN_STATUS_CONFIG[agentStatus.runStatus || 'unknown'];
  const SyncIcon = syncConfig.icon;
  const RunIcon = runConfig.icon;
  const positionLabel = getPositionLabel(position, total);

  return (
    <div className="px-2.5 py-2 space-y-1.5">
      {/* Agent name and position */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="size-3.5 text-muted-foreground" />
          <span className="text-[12px] font-medium truncate max-w-[120px]">
            {agentStatus.agentName}
          </span>
          <AdminBadge variant="default" className="text-[9px] px-1 py-0">
            {positionLabel}
          </AdminBadge>
        </div>
        {agentStatus.listenPort > 0 && (
          <span className="text-[10px] font-mono text-muted-foreground">
            :{agentStatus.listenPort}
          </span>
        )}
      </div>
      {/* Status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SyncIcon
            className={cn(
              'size-3',
              syncConfig.colorClass,
              agentStatus.syncStatus === 'pending' && 'animate-pulse'
            )}
          />
          <span className={cn('text-[10px]', syncConfig.colorClass)}>
            {syncConfig.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <RunIcon
            className={cn(
              'size-3',
              runConfig.colorClass,
              agentStatus.runStatus === 'starting' && 'animate-spin'
            )}
          />
          <span className={cn('text-[10px]', runConfig.colorClass)}>
            {runConfig.label}
          </span>
          {agentStatus.runStatus === 'running' && (
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
          )}
        </div>
        {agentStatus.connections > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Activity className="size-3" />
            <span className="text-[10px] font-mono">{agentStatus.connections}</span>
          </div>
        )}
      </div>
      {/* Error message if any */}
      {agentStatus.errorMessage && (
        <div className="flex items-start gap-1.5 px-1 py-1 bg-danger/10 rounded text-danger">
          <AlertCircle className="size-3 shrink-0 mt-0.5" />
          <span className="text-[10px] leading-tight">{agentStatus.errorMessage}</span>
        </div>
      )}
    </div>
  );
};

// Sync status component - Per-agent detailed view
const SyncStatusDisplay = ({
  polledStatus,
  rule,
}: {
  polledStatus?: RuleOverallStatusResponse | null;
  rule: ForwardRule;
}) => {
  const agentStatuses = polledStatus?.agentStatuses;

  // If no detailed statuses available, show fallback
  if (!agentStatuses || agentStatuses.length === 0) {
    const syncStatus = rule.syncStatus;
    const runStatus = rule.runStatus || 'unknown';

    if (!syncStatus) return null;

    const syncConfig = SYNC_STATUS_CONFIG[syncStatus];
    const runConfig = RUN_STATUS_CONFIG[runStatus];
    const SyncIcon = syncConfig.icon;
    const RunIcon = runConfig.icon;

    return (
      <div className="px-2.5 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <SyncIcon className={cn('size-3.5', syncConfig.colorClass)} />
            <span className={cn('text-[11px] font-medium', syncConfig.colorClass)}>
              {syncConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <RunIcon className={cn('size-3.5', runConfig.colorClass)} />
            <span className={cn('text-[11px] font-medium', runConfig.colorClass)}>
              {runConfig.label}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Sort by position
  const sortedStatuses = [...agentStatuses].sort((a, b) => a.position - b.position);

  return (
    <div className="divide-y divide-border/20">
      {sortedStatuses.map((agentStatus) => (
        <AgentStatusRow
          key={agentStatus.agentId}
          agentStatus={agentStatus}
          position={agentStatus.position}
          total={sortedStatuses.length}
        />
      ))}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ForwardRuleDetailSheet = ({
  open,
  onOpenChange,
  rule,
  agentsMap,
  nodes,
  polledStatus,
  onEdit,
  onProbe,
  onCopy,
  onToggleStatus,
  onDelete,
  isProbingThis = false,
}: ForwardRuleDetailSheetProps) => {
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  if (!rule) return null;

  const statusConfig = ENABLED_STATUS_CONFIG[rule.status] || { label: '未知', variant: 'default' as const };
  const ruleTypeConfig = RULE_TYPE_CONFIG[rule.ruleType] || RULE_TYPE_CONFIG.direct;

  // Get entry agent info
  const entryAgent = agentsMap[rule.agentId];
  const entryAddress = entryAgent?.publicAddress
    ? `${entryAgent.publicAddress}:${rule.listenPort}`
    : `:${rule.listenPort}`;

  // Determine target type
  const targetType = rule.targetNodeId ? 'node' : 'manual';

  // ActionSheet actions
  const moreActions = [
    {
      label: '复制规则',
      icon: <Copy className="size-5" />,
      onPress: async () => {
        onCopy(rule);
        onOpenChange(false);
      },
    },
    {
      label: rule.status === 'enabled' ? '禁用规则' : '启用规则',
      icon: <Power className="size-5" />,
      onPress: async () => {
        onToggleStatus(rule);
        onOpenChange(false);
      },
    },
    {
      label: '删除规则',
      icon: <Trash2 className="size-5" />,
      onPress: async () => {
        onDelete(rule);
        onOpenChange(false);
      },
      variant: 'destructive' as const,
    },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent showClose>
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'size-12 rounded-xl flex items-center justify-center',
                  'bg-primary/10 text-primary'
                )}
              >
                {ruleTypeConfig.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <SheetTitle className="truncate">{rule.name}</SheetTitle>
                  <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                    {statusConfig.label}
                  </AdminBadge>
                </div>
                <SheetDescription className="truncate font-mono text-xs">
                  {rule.id}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <SheetBody className="space-y-3 pb-3">
            {/* Basic Info */}
            <DetailSection title="基本信息">
              <DetailRow
                icon={ruleTypeConfig.icon}
                label="规则类型"
                value={
                  <AdminBadge variant={ruleTypeConfig.variant} className="text-xs">
                    {ruleTypeConfig.label}
                  </AdminBadge>
                }
              />
              <DetailRow
                icon={<Activity className="size-4" />}
                label="协议"
                value={PROTOCOL_LABELS[rule.protocol]}
              />
              <DetailRow
                icon={<Globe className="size-4" />}
                label="IP版本"
                value={IP_VERSION_LABELS[rule.ipVersion]}
              />
              {(rule.ruleType === 'entry' || rule.ruleType === 'chain') && rule.tunnelType && (
                <DetailRow
                  icon={<Link2 className="size-4" />}
                  label="隧道类型"
                  value={TUNNEL_TYPE_LABELS[rule.tunnelType]}
                />
              )}
              <DetailRow
                icon={<Hash className="size-4" />}
                label="规则 ID"
                value={<span className="font-mono text-xs">{rule.id}</span>}
              />
            </DetailSection>

            {/* Listen Info */}
            <DetailSection title="监听信息">
              <DetailRow
                icon={<Bot className="size-4" />}
                label="入口代理"
                value={entryAgent?.name || rule.agentId.slice(0, 10)}
              />
              <DetailRow
                icon={<Globe className="size-4" />}
                label="监听端口"
                value={rule.listenPort}
              />
              <DetailRow
                icon={<Server className="size-4" />}
                label="入口地址"
                value={<span className="font-mono text-xs">{entryAddress}</span>}
              />
            </DetailSection>

            {/* Target Info */}
            <DetailSection title="目标信息">
              <DetailRow
                icon={<Server className="size-4" />}
                label="目标类型"
                value={TARGET_TYPE_LABELS[targetType]}
              />
              {rule.targetNodeId ? (
                <DetailRow
                  icon={<Server className="size-4" />}
                  label="目标节点"
                  value={nodes.find((n) => n.id === rule.targetNodeId)?.name || rule.targetNodeId.slice(0, 10)}
                />
              ) : (
                <DetailRow
                  icon={<Globe className="size-4" />}
                  label="目标地址"
                  value={
                    <span className="font-mono text-xs">
                      {rule.targetAddress}:{rule.targetPort}
                    </span>
                  }
                />
              )}
            </DetailSection>

            {/* Forward Path Visualization */}
            <DetailSection title="转发路径" allowOverflow>
              <ForwardPathVisualization
                rule={rule}
                agentsMap={agentsMap}
                nodes={nodes}
                isRunning={rule.status === 'enabled' && (polledStatus?.overallRunStatus || rule.runStatus) === 'running'}
              />
            </DetailSection>

            {/* Traffic Statistics */}
            <DetailSection title="流量统计">
              <TrafficStats rule={rule} />
              {/* Traffic multiplier */}
              <DetailRow
                icon={<Activity className="size-4" />}
                label="流量倍率"
                value={
                  <span className="flex items-center gap-2">
                    <span className="font-mono">{rule.effectiveTrafficMultiplier?.toFixed(1) || '1.0'}x</span>
                    {rule.isAutoMultiplier && (
                      <AdminBadge variant="default" className="text-[10px] px-1.5 py-0">
                        自动
                      </AdminBadge>
                    )}
                  </span>
                }
              />
            </DetailSection>

            {/* Sync Status (only for enabled rules) */}
            {rule.status === 'enabled' && (
              <DetailSection title="同步状态" noPadding>
                <SyncStatusDisplay polledStatus={polledStatus} rule={rule} />
              </DetailSection>
            )}

            {/* Remark */}
            {rule.remark && (
              <DetailSection title="备注">
                <div className="px-3 py-2.5">
                  <div className="flex items-start gap-3">
                    <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {rule.remark}
                    </p>
                  </div>
                </div>
              </DetailSection>
            )}
          </SheetBody>

          <SheetFooter>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onEdit(rule);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2',
                  'h-11 rounded-xl',
                  'bg-primary text-primary-foreground',
                  'text-sm font-medium',
                  'active:scale-[0.97] transition-transform'
                )}
              >
                <Edit className="size-4" />
                编辑
              </button>
              <button
                type="button"
                onClick={() => {
                  if (rule.status === 'enabled' && !isProbingThis) {
                    onProbe(rule);
                  }
                }}
                disabled={rule.status !== 'enabled' || isProbingThis}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2',
                  'h-11 rounded-xl',
                  'bg-muted text-foreground',
                  'text-sm font-medium',
                  'active:scale-[0.97] transition-transform',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isProbingThis ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Activity className="size-4" />
                )}
                {isProbingThis ? '拨测中' : '拨测'}
              </button>
              <button
                type="button"
                onClick={() => setActionSheetOpen(true)}
                className={cn(
                  'size-11 rounded-xl shrink-0',
                  'flex items-center justify-center',
                  'bg-muted text-foreground',
                  'active:scale-[0.97] transition-transform'
                )}
              >
                <MoreHorizontal className="size-5" />
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* More Actions ActionSheet */}
      <ActionSheet
        open={actionSheetOpen}
        onOpenChange={setActionSheetOpen}
        actions={moreActions}
        title="更多操作"
      />
    </>
  );
};

ForwardRuleDetailSheet.displayName = 'ForwardRuleDetailSheet';
