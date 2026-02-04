/**
 * ForwardRuleDetailSheet - Mobile forward rule details
 *
 * Design: Tailwind Application UI style
 * - Compact description list layout
 * - Visual forward path (simplified)
 * - Traffic statistics
 * - Sync status display
 * - Primary actions in footer with ActionSheet for more
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Bot,
  Globe,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/common/Popover';
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

const RULE_TYPE_CONFIG: Record<ForwardRuleType, { labelKey: string; icon: React.ElementType; colorClass: string }> = {
  direct: { labelKey: 'admin.forwardRules.ruleType.direct', icon: Zap, colorClass: 'bg-info/10 text-info border-info/20' },
  entry: { labelKey: 'admin.forwardRules.ruleType.entry', icon: Shield, colorClass: 'bg-success/10 text-success border-success/20' },
  chain: { labelKey: 'admin.forwardRules.ruleType.chain', icon: Link2, colorClass: 'bg-warning/10 text-warning border-warning/20' },
  direct_chain: { labelKey: 'admin.forwardRules.ruleType.directChain', icon: Globe, colorClass: 'bg-muted text-muted-foreground border-border' },
  external: { labelKey: 'admin.forwardRules.ruleType.external', icon: Globe, colorClass: 'bg-muted text-muted-foreground border-border' },
};

const PROTOCOL_LABELS: Record<ForwardProtocol, string> = {
  tcp: 'TCP',
  udp: 'UDP',
  both: 'TCP/UDP',
};

const IP_VERSION_LABELS: Record<IPVersion, string> = {
  auto: 'Auto',
  ipv4: 'IPv4',
  ipv6: 'IPv6',
};

const TUNNEL_TYPE_LABELS: Record<TunnelType, string> = {
  ws: 'WebSocket',
  tls: 'TLS',
  ws_smux: 'WebSocket + SMUX',
  tls_smux: 'TLS + SMUX',
};

const SYNC_STATUS_CONFIG: Record<RuleSyncStatus, { labelKey: string; icon: React.ElementType; colorClass: string }> = {
  synced: { labelKey: 'common.status.synced', icon: CheckCircle2, colorClass: 'text-success' },
  pending: { labelKey: 'common.status.pending', icon: CircleDashed, colorClass: 'text-warning' },
  failed: { labelKey: 'common.status.failed', icon: AlertCircle, colorClass: 'text-destructive' },
};

const RUN_STATUS_CONFIG: Record<RuleRunStatus | 'unknown', { labelKey: string; icon: React.ElementType; colorClass: string }> = {
  running: { labelKey: 'common.status.running', icon: Play, colorClass: 'text-success' },
  stopped: { labelKey: 'common.status.stopped', icon: Square, colorClass: 'text-muted-foreground' },
  error: { labelKey: 'common.status.error', icon: AlertTriangle, colorClass: 'text-destructive' },
  starting: { labelKey: 'admin.forwardRules.runStatus.starting', icon: RotateCw, colorClass: 'text-info' },
  unknown: { labelKey: 'common.status.unknown', icon: HelpCircle, colorClass: 'text-muted-foreground' },
};

// ============================================================================
// Helpers
// ============================================================================

const formatBytes = (bytes?: number): string => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// ============================================================================
// Sub Components
// ============================================================================

// Section container
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 px-0.5">
      {title}
    </h3>
    <div className="rounded-xl ring-1 ring-border bg-card overflow-hidden">
      <dl className="divide-y divide-border">{children}</dl>
    </div>
  </div>
);

// Description list row
const Row = ({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2.5 min-h-[44px]">
    <dt className="text-sm text-muted-foreground shrink-0">{label}</dt>
    <dd className={cn('text-sm text-foreground text-right min-w-0 truncate', mono && 'font-mono text-xs')}>
      {value}
    </dd>
  </div>
);

// Forward path visualization - simplified horizontal flow
const ForwardPath = ({
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
  const { t } = useTranslation();

  if (rule.ruleType === 'external') return null;

  const getAgentName = (id?: string) => (id ? agentsMap[id]?.name || id.slice(0, 8) : '-');
  const getNodeName = (id?: string) => {
    if (!id) return '-';
    const node = nodes.find((n) => n.id === id);
    return node?.name || id.slice(0, 8);
  };

  // Build path nodes
  const pathNodes: { type: string; name: string; port?: number; badge?: string; isExit?: boolean }[] = [];

  // Entry
  pathNodes.push({
    type: t('admin.forwardRules.flowNode.entry'),
    name: getAgentName(rule.agentId),
    port: rule.listenPort,
  });

  // Exit/Chain - support load balancing
  const hasLoadBalancing = rule.ruleType === 'entry' && rule.exitAgents && rule.exitAgents.length > 1;

  if (rule.ruleType === 'entry') {
    if (rule.exitAgents && rule.exitAgents.length > 0) {
      // Load balancing: multiple exit agents
      const firstExitAgent = rule.exitAgents[0];
      const exitCount = rule.exitAgents.length;
      pathNodes.push({
        type: t('admin.forwardRules.flowNode.exit'),
        name: getAgentName(firstExitAgent.agentId),
        badge: exitCount > 1 ? `LB ${exitCount}` : undefined,
        isExit: true,
      });
    } else if (rule.exitAgentId) {
      // Single exit agent (legacy)
      pathNodes.push({
        type: t('admin.forwardRules.flowNode.exit'),
        name: getAgentName(rule.exitAgentId),
      });
    }
  }

  if ((rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && rule.chainAgentIds) {
    rule.chainAgentIds
      .filter((id) => id !== rule.agentId)
      .forEach((id) => {
        pathNodes.push({
          type: t('admin.forwardRules.flowNode.relay'),
          name: getAgentName(id),
          port: rule.chainPortConfig?.[id],
        });
      });
  }

  // Target
  if (rule.targetNodeId || rule.targetAddress) {
    pathNodes.push({
      type: t('admin.forwardRules.flowNode.target'),
      name: rule.targetNodeId ? getNodeName(rule.targetNodeId) : rule.targetAddress || '-',
      port: rule.targetPort,
    });
  }

  // Build exit agents info for load balancing popover
  const exitAgentsInfo = rule.exitAgents?.map(ea => ({
    id: ea.agentId,
    name: getAgentName(ea.agentId),
    weight: ea.weight,
  })) || [];
  const totalWeight = exitAgentsInfo.reduce((sum, a) => sum + a.weight, 0);
  const exitAgentsWithPercent = exitAgentsInfo.map(a => ({
    ...a,
    percent: totalWeight > 0 ? Math.round((a.weight / totalWeight) * 100) : 100,
  }));

  return (
    <div className="px-3 py-3">
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {pathNodes.map((node, index) => {
          const isExitWithLB = node.isExit && hasLoadBalancing;

          const nodeContent = (
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-muted-foreground uppercase mb-0.5">{node.type}</span>
              <div className={cn(
                "px-2 py-1 rounded bg-muted text-xs font-medium flex items-center gap-1",
                isExitWithLB && "cursor-pointer hover:bg-muted/80 transition-colors"
              )}>
                {node.name}
                {node.port ? <span className="text-muted-foreground">:{node.port}</span> : null}
                {node.badge && (
                  <span className="px-1 py-0 text-[9px] font-semibold rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    {node.badge}
                  </span>
                )}
              </div>
            </div>
          );

          return (
            <div key={index} className="flex items-center shrink-0">
              {isExitWithLB ? (
                <Popover>
                  <PopoverTrigger asChild>
                    {nodeContent}
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3" align="center">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-muted-foreground">{t('admin.forwardRules.flowNode.exit')}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium">
                          {t('admin.forwardRules.exitAgents.loadBalancing')}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {exitAgentsWithPercent.map((agent, idx) => (
                          <div key={agent.id} className="flex items-center justify-between gap-2 p-1.5 rounded bg-muted/50">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/30 text-[9px] font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-medium truncate">{agent.name}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono shrink-0">{agent.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                nodeContent
              )}
              {index < pathNodes.length - 1 && (
                <ArrowRight className={cn('size-3 mx-1 text-muted-foreground/50', isRunning && 'animate-pulse')} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Traffic statistics
const TrafficStats = ({ rule }: { rule: ForwardRule }) => {
  const uploadBytes = rule.uploadBytes || 0;
  const downloadBytes = rule.downloadBytes || 0;
  const totalBytes = uploadBytes + downloadBytes;
  const uploadPercent = totalBytes > 0 ? (uploadBytes / totalBytes) * 100 : 50;

  return (
    <div className="px-3 py-3 space-y-2">
      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
        <div className="h-full bg-success transition-all" style={{ width: `${uploadPercent}%` }} />
        <div className="h-full bg-info transition-all" style={{ width: `${100 - uploadPercent}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-success">
          <Upload className="size-3" />
          <span className="font-mono">{formatBytes(uploadBytes)}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Activity className="size-3" />
          <span className="font-mono">{formatBytes(totalBytes)}</span>
        </div>
        <div className="flex items-center gap-1 text-info">
          <span className="font-mono">{formatBytes(downloadBytes)}</span>
          <Download className="size-3" />
        </div>
      </div>
    </div>
  );
};

// Sync status display
const SyncStatus = ({
  polledStatus,
  rule,
}: {
  polledStatus?: RuleOverallStatusResponse | null;
  rule: ForwardRule;
}) => {
  const { t } = useTranslation();
  const agentStatuses = polledStatus?.agentStatuses;

  if (!agentStatuses || agentStatuses.length === 0) {
    const syncStatus = rule.syncStatus;
    const runStatus = rule.runStatus || 'unknown';
    if (!syncStatus) return null;

    const syncConfig = SYNC_STATUS_CONFIG[syncStatus];
    const runConfig = RUN_STATUS_CONFIG[runStatus];
    const SyncIcon = syncConfig.icon;
    const RunIcon = runConfig.icon;

    return (
      <div className="px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SyncIcon className={cn('size-4', syncConfig.colorClass)} />
          <span className={cn('text-xs font-medium', syncConfig.colorClass)}>{t(syncConfig.labelKey)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <RunIcon className={cn('size-4', runConfig.colorClass)} />
          <span className={cn('text-xs font-medium', runConfig.colorClass)}>{t(runConfig.labelKey)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {agentStatuses.map((agent) => {
        const syncConfig = SYNC_STATUS_CONFIG[agent.syncStatus];
        const runConfig = RUN_STATUS_CONFIG[agent.runStatus || 'unknown'];
        const SyncIcon = syncConfig.icon;
        const RunIcon = runConfig.icon;

        return (
          <div key={agent.agentId} className="px-3 py-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Bot className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-medium truncate max-w-[120px]">{agent.agentName}</span>
                {agent.listenPort > 0 && (
                  <span className="text-xs text-muted-foreground font-mono">:{agent.listenPort}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <SyncIcon className={cn('size-3', syncConfig.colorClass)} />
                <span className={syncConfig.colorClass}>{t(syncConfig.labelKey)}</span>
              </div>
              <div className="flex items-center gap-1">
                <RunIcon className={cn('size-3', runConfig.colorClass)} />
                <span className={runConfig.colorClass}>{t(runConfig.labelKey)}</span>
              </div>
              {agent.connections > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Activity className="size-3" />
                  <span className="font-mono">{agent.connections}</span>
                </div>
              )}
            </div>
            {agent.errorMessage && (
              <div className="mt-1.5 px-2 py-1 bg-destructive/10 rounded-xl text-xs text-destructive">
                {agent.errorMessage}
              </div>
            )}
          </div>
        );
      })}
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
  const { t } = useTranslation();
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  if (!rule) return null;

  const statusConfig = ENABLED_STATUS_CONFIG[rule.status] || { labelKey: 'common.status.unknown', variant: 'default' as const };
  const ruleTypeConfig = RULE_TYPE_CONFIG[rule.ruleType] || RULE_TYPE_CONFIG.direct;
  const RuleTypeIcon = ruleTypeConfig.icon;

  const entryAgent = agentsMap[rule.agentId];
  const entryAddress = entryAgent?.publicAddress
    ? `${entryAgent.publicAddress}:${rule.listenPort}`
    : `:${rule.listenPort}`;

  const isRunning = rule.status === 'enabled' && (polledStatus?.overallRunStatus || rule.runStatus) === 'running';
  const isExternal = rule.ruleType === 'external';

  // ActionSheet actions
  const moreActions = [
    {
      label: t('admin.forwardRules.form.copyRuleAction'),
      icon: <Copy className="size-5" />,
      onPress: async () => {
        onCopy(rule);
        onOpenChange(false);
      },
    },
    {
      label: rule.status === 'enabled' ? t('admin.forwardRules.form.disableRule') : t('admin.forwardRules.form.enableRule'),
      icon: <Power className="size-5" />,
      onPress: async () => {
        onToggleStatus(rule);
        onOpenChange(false);
      },
    },
    {
      label: t('admin.forwardRules.form.deleteRule'),
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
              <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <RuleTypeIcon className="size-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <SheetTitle className="truncate">{rule.name}</SheetTitle>
                  <AdminBadge variant={statusConfig.variant} size="sm" className="shrink-0">
                    {t(statusConfig.labelKey)}
                  </AdminBadge>
                </div>
                <SheetDescription className="font-mono text-xs truncate">{rule.id}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <SheetBody className="space-y-3 pb-3">
            {/* Basic Info */}
            <Section title={t('admin.forwardRules.detail.basicInfo')}>
              <Row
                label={t('admin.forwardRules.detail.ruleType')}
                value={
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', ruleTypeConfig.colorClass)}>
                    {t(ruleTypeConfig.labelKey)}
                  </span>
                }
              />
              {!isExternal && (
                <>
                  <Row label={t('common.protocol')} value={PROTOCOL_LABELS[rule.protocol]} />
                  <Row label={t('admin.forwardRules.detail.ipVersion')} value={IP_VERSION_LABELS[rule.ipVersion]} />
                </>
              )}
              {(rule.ruleType === 'entry' || rule.ruleType === 'chain') && rule.tunnelType && (
                <Row label={t('admin.forwardRules.detail.tunnelType')} value={TUNNEL_TYPE_LABELS[rule.tunnelType]} />
              )}
            </Section>

            {/* External Type: Server Info */}
            {isExternal && (
              <Section title={t('admin.forwardRules.detail.serverInfo')}>
                <Row label={t('admin.forwardRules.detail.serverAddress')} value={rule.serverAddress || '-'} mono />
                <Row label={t('admin.forwardRules.detail.listenPort')} value={rule.listenPort} mono />
                {rule.targetNodeId && (
                  <Row
                    label={t('admin.forwardRules.detail.targetNode')}
                    value={nodes.find((n) => n.id === rule.targetNodeId)?.name || rule.targetNodeId.slice(0, 10)}
                  />
                )}
              </Section>
            )}

            {/* Listen/Target Info */}
            {!isExternal && (
              <Section title={t('admin.forwardRules.detail.connectionInfo')}>
                <Row
                  label={t('admin.forwardRules.detail.entryAgent')}
                  value={entryAgent?.name || rule.agentId.slice(0, 10)}
                />
                <Row label={t('admin.forwardRules.detail.listenAddress')} value={entryAddress} mono />
                {rule.targetNodeId ? (
                  <Row
                    label={t('admin.forwardRules.detail.targetNode')}
                    value={nodes.find((n) => n.id === rule.targetNodeId)?.name || rule.targetNodeId.slice(0, 10)}
                  />
                ) : (
                  <Row
                    label={t('admin.forwardRules.detail.targetAddress')}
                    value={`${rule.targetAddress}:${rule.targetPort}`}
                    mono
                  />
                )}
              </Section>
            )}

            {/* Forward Path */}
            {!isExternal && (
              <Section title={t('admin.forwardRules.detail.forwardPathTitle')}>
                <ForwardPath rule={rule} agentsMap={agentsMap} nodes={nodes} isRunning={isRunning} />
              </Section>
            )}

            {/* Traffic */}
            <Section title={t('admin.forwardRules.detail.trafficStats')}>
              <TrafficStats rule={rule} />
              {!isExternal && (
                <Row
                  label={t('admin.forwardRules.detail.trafficMultiplier')}
                  value={
                    <span className="flex items-center gap-1.5">
                      <span className="font-mono">{rule.effectiveTrafficMultiplier?.toFixed(1) || '1.0'}x</span>
                      {rule.isAutoMultiplier && (
                        <AdminBadge variant="outline" size="sm">
                          {t('common.auto')}
                        </AdminBadge>
                      )}
                    </span>
                  }
                />
              )}
            </Section>

            {/* Sync Status */}
            {rule.status === 'enabled' && !isExternal && (
              <Section title={t('admin.forwardRules.detail.syncStatus')}>
                <SyncStatus polledStatus={polledStatus} rule={rule} />
              </Section>
            )}

            {/* Remark */}
            {rule.remark && (
              <Section title={t('common.fields.remark')}>
                <div className="px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{rule.remark}</p>
                  </div>
                </div>
              </Section>
            )}
          </SheetBody>

          <SheetFooter>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(rule)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2',
                  'h-11 rounded-xl',
                  'bg-primary text-primary-foreground',
                  'text-sm font-medium',
                  'active:scale-[0.98] transition-transform'
                )}
              >
                <Edit className="size-4" />
                {t('common.actions.edit')}
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
                  'active:scale-[0.98] transition-transform',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isProbingThis ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
                {isProbingThis ? t('admin.forwardRules.form.probing') : t('admin.forwardRules.form.probe')}
              </button>
              <button
                type="button"
                onClick={() => setActionSheetOpen(true)}
                className={cn(
                  'size-11 rounded-xl shrink-0',
                  'flex items-center justify-center',
                  'bg-muted text-foreground',
                  'active:scale-[0.98] transition-transform'
                )}
              >
                <MoreHorizontal className="size-5" />
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ActionSheet
        open={actionSheetOpen}
        onOpenChange={setActionSheetOpen}
        actions={moreActions}
        title={t('common.moreActions')}
      />
    </>
  );
};

ForwardRuleDetailSheet.displayName = 'ForwardRuleDetailSheet';
