/**
 * MobileForwardRuleCard - iOS 26 Liquid Glass styled forward rule card for mobile
 *
 * Designed following iOS Human Interface Guidelines:
 * - Minimum 44px touch targets for all interactive elements
 * - Clear visual hierarchy with primary/secondary information
 * - Expandable details section with smooth animation
 * - Quick action buttons for common operations
 * - Respects prefers-reduced-motion
 */

import { useState } from 'react';
import {
  ChevronDown,
  Edit,
  Power,
  PowerOff,
  Trash2,
  Hash,
  Globe,
  ArrowRight,
  FileText,
  Activity,
  Loader2,
  Bot,
  Server,
  Copy,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/common/Collapsible';
import { AdminBadge } from '@/components/admin';
import { MobileActionButton } from '@/components/mobile';
import { cn } from '@/lib/utils';
import { ENABLED_STATUS_CONFIG_SHORT } from '@/shared/constants/status-config';
import type { ForwardRule, ForwardAgent, RuleOverallStatusResponse } from '@/api/forward';
import type { Node } from '@/api/node';

// ============================================================================
// Types
// ============================================================================

export interface MobileForwardRuleCardProps {
  rule: ForwardRule;
  agentsMap?: Record<string, ForwardAgent>;
  nodes?: Node[];
  polledStatus?: RuleOverallStatusResponse;
  isPolling?: boolean;
  onEdit: (rule: ForwardRule) => void;
  onEnable: (rule: ForwardRule) => void;
  onDisable: (rule: ForwardRule) => void;
  onDelete: (rule: ForwardRule) => void;
  onCopy?: (rule: ForwardRule) => void;
  onProbe?: (rule: ForwardRule) => void;
  isProbingThis?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const RULE_TYPE_CONFIG: Record<string, { label: string; shortLabel: string; variant: 'info' | 'success' | 'warning' | 'default' }> = {
  direct: { label: '直连', shortLabel: '直', variant: 'info' },
  entry: { label: '入口', shortLabel: '入', variant: 'success' },
  chain: { label: '链式', shortLabel: '链', variant: 'warning' },
  direct_chain: { label: '直连链', shortLabel: '直链', variant: 'default' },
};

const PROTOCOL_CONFIG: Record<string, { label: string; variant: 'info' | 'warning' | 'default' }> = {
  tcp: { label: 'TCP', variant: 'info' },
  udp: { label: 'UDP', variant: 'warning' },
  both: { label: 'TCP/UDP', variant: 'default' },
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
// Path Display Component
// ============================================================================

interface PathDisplayProps {
  rule: ForwardRule;
  agentsMap: Record<string, ForwardAgent>;
  nodes: Node[];
}

const PathDisplay = ({ rule, agentsMap, nodes }: PathDisplayProps) => {
  // Get entry agent info
  const entryAgent = agentsMap[rule.agentId];
  const entryName = entryAgent?.name || `ID: ${rule.agentId.slice(0, 8)}`;

  // Get target display info
  const getTargetDisplay = (): string => {
    if (rule.targetNodeId) {
      const targetNode = nodes.find((n) => n.id === rule.targetNodeId);
      return targetNode?.name || `ID: ${rule.targetNodeId.slice(0, 8)}`;
    }
    if (rule.targetAddress) {
      return `${rule.targetAddress}:${rule.targetPort}`;
    }
    return '-';
  };

  // Get relay info for chain types
  const getRelayInfo = (): string | null => {
    if (rule.ruleType === 'entry' && rule.exitAgentId) {
      const exitAgent = agentsMap[rule.exitAgentId];
      return exitAgent?.name || `ID: ${rule.exitAgentId.slice(0, 8)}`;
    }
    if ((rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && rule.chainAgentIds?.length) {
      const chainAgents = rule.chainAgentIds
        .filter((id) => id !== rule.agentId)
        .map((id) => agentsMap[id]?.name || `ID: ${id.slice(0, 8)}`);
      if (chainAgents.length === 1) return chainAgents[0];
      if (chainAgents.length > 1) return `${chainAgents[0]} +${chainAgents.length - 1}`;
    }
    return null;
  };

  const target = getTargetDisplay();
  const relay = getRelayInfo();

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
      <Bot className="size-3 text-success shrink-0" />
      <span className="truncate max-w-[60px]">{entryName}</span>
      {relay && (
        <>
          <ArrowRight className="size-3 shrink-0" />
          <Bot className="size-3 text-primary shrink-0" />
          <span className="truncate max-w-[60px]">{relay}</span>
        </>
      )}
      <ArrowRight className="size-3 shrink-0" />
      <Server className="size-3 text-info shrink-0" />
      <span className="truncate max-w-[80px]">{target}</span>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const MobileForwardRuleCard = ({
  rule,
  agentsMap = {},
  nodes = [],
  polledStatus,
  isPolling = false,
  onEdit,
  onEnable,
  onDisable,
  onDelete,
  onCopy,
  onProbe,
  isProbingThis = false,
}: MobileForwardRuleCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = ENABLED_STATUS_CONFIG_SHORT[rule.status] || { label: rule.status, variant: 'default' as const };
  const ruleTypeConfig = RULE_TYPE_CONFIG[rule.ruleType] || { label: rule.ruleType, shortLabel: '?', variant: 'default' as const };
  const protocolConfig = PROTOCOL_CONFIG[rule.protocol] || { label: rule.protocol, variant: 'default' as const };

  // Get entry agent for header display
  const entryAgent = agentsMap[rule.agentId];
  const entryAddress = entryAgent?.publicAddress
    ? `${entryAgent.publicAddress}:${rule.listenPort}`
    : `:${rule.listenPort}`;

  // Calculate total traffic
  const totalBytes = (rule.uploadBytes || 0) + (rule.downloadBytes || 0);

  // Determine sync/run status
  const getSyncRunStatus = () => {
    if (rule.status !== 'enabled') return null;

    const status = polledStatus || {
      overallSyncStatus: rule.syncStatus,
      overallRunStatus: rule.runStatus,
      healthyAgents: rule.healthyAgents,
      totalAgents: rule.totalAgents,
    };

    if (!status.overallSyncStatus) return null;

    return {
      sync: status.overallSyncStatus,
      run: status.overallRunStatus || 'unknown',
      healthy: status.healthyAgents || 0,
      total: status.totalAgents || 0,
    };
  };

  const syncRunStatus = getSyncRunStatus();

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className={cn(
        'bg-card/60 backdrop-blur-sm',
        'rounded-2xl',
        'border border-border/50',
        'overflow-hidden'
      )}
    >
      {/* Header - Always visible */}
      <CollapsibleTrigger
        className={cn(
          'w-full px-4 py-3 min-h-[60px]',
          'flex items-center justify-between gap-3',
          'text-left cursor-pointer',
          'motion-safe:active:bg-foreground/5'
        )}
      >
        {/* Rule Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <AdminBadge variant={ruleTypeConfig.variant} className="text-[10px] px-1.5 py-0 shrink-0">
              {ruleTypeConfig.shortLabel}
            </AdminBadge>
            <span className="font-medium text-foreground truncate">
              {rule.name}
            </span>
            <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 shrink-0">
              {statusConfig.label}
            </AdminBadge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-mono">{entryAddress}</span>
            <span className="text-border">·</span>
            <AdminBadge variant={protocolConfig.variant} className="text-[10px] px-1.5 py-0">
              {protocolConfig.label}
            </AdminBadge>
            {/* Show sync status indicator */}
            {isPolling && (
              <Loader2 className="size-3 animate-spin text-info" />
            )}
            {syncRunStatus && !isPolling && (
              <span className={cn(
                'size-2 rounded-full',
                syncRunStatus.run === 'running' && 'bg-success',
                syncRunStatus.run === 'stopped' && 'bg-muted-foreground',
                syncRunStatus.run === 'error' && 'bg-destructive',
                syncRunStatus.run === 'starting' && 'bg-info',
                syncRunStatus.run === 'unknown' && 'bg-muted-foreground/60'
              )} />
            )}
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            'size-5 text-muted-foreground shrink-0',
            'transition-transform duration-200',
            'motion-reduce:transition-none',
            isExpanded && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>

      {/* Expandable Details */}
      <CollapsibleContent>
        {/* Details Section */}
        <div className="border-t border-border/30 px-4 py-3 space-y-2.5">
          {/* ID */}
          <div className="flex items-center gap-3">
            <Hash className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">ID</div>
              <div className="text-xs font-mono text-foreground truncate">{rule.id}</div>
            </div>
          </div>

          {/* Source Port */}
          <div className="flex items-center gap-3">
            <Globe className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">监听端口</div>
              <div className="text-xs text-foreground">{entryAddress}</div>
            </div>
          </div>

          {/* Path */}
          <div className="flex items-start gap-3">
            <ArrowRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">转发路径</div>
              <PathDisplay rule={rule} agentsMap={agentsMap} nodes={nodes} />
            </div>
          </div>

          {/* Traffic */}
          <div className="flex items-center gap-3">
            <Activity className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">流量统计</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-foreground font-medium">{formatBytes(totalBytes)}</span>
                {rule.effectiveTrafficMultiplier && rule.effectiveTrafficMultiplier !== 1 && (
                  <span className={cn(
                    'text-[10px] px-1 py-0.5 rounded',
                    rule.isAutoMultiplier
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-warning-muted text-warning'
                  )}>
                    x{rule.effectiveTrafficMultiplier.toFixed(1)}
                  </span>
                )}
              </div>
              {/* Traffic breakdown */}
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-chart-upload" />
                  上传: {formatBytes(rule.uploadBytes)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-chart-download" />
                  下载: {formatBytes(rule.downloadBytes)}
                </span>
              </div>
            </div>
          </div>

          {/* Sync Status (if enabled) */}
          {syncRunStatus && (
            <div className="flex items-center gap-3">
              <Activity className="size-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">同步状态</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={cn(
                    'font-medium',
                    syncRunStatus.sync === 'synced' && 'text-success',
                    syncRunStatus.sync === 'pending' && 'text-warning',
                    syncRunStatus.sync === 'failed' && 'text-destructive'
                  )}>
                    {syncRunStatus.sync === 'synced' && '已同步'}
                    {syncRunStatus.sync === 'pending' && '同步中'}
                    {syncRunStatus.sync === 'failed' && '同步失败'}
                  </span>
                  <span className="text-border">·</span>
                  <span className={cn(
                    syncRunStatus.run === 'running' && 'text-success',
                    syncRunStatus.run === 'stopped' && 'text-muted-foreground',
                    syncRunStatus.run === 'error' && 'text-destructive',
                    syncRunStatus.run === 'starting' && 'text-info',
                    syncRunStatus.run === 'unknown' && 'text-muted-foreground/60'
                  )}>
                    {syncRunStatus.run === 'running' && '运行中'}
                    {syncRunStatus.run === 'stopped' && '已停止'}
                    {syncRunStatus.run === 'error' && '错误'}
                    {syncRunStatus.run === 'starting' && '启动中'}
                    {syncRunStatus.run === 'unknown' && '未知'}
                  </span>
                  {syncRunStatus.total > 1 && (
                    <>
                      <span className="text-border">·</span>
                      <span className="text-muted-foreground">
                        {syncRunStatus.healthy}/{syncRunStatus.total} 正常
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Remark */}
          {rule.remark && (
            <div className="flex items-start gap-3">
              <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">备注</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{rule.remark}</div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="border-t border-border/30 px-4 py-3">
          <div className="flex gap-1.5 flex-wrap">
            <MobileActionButton
              icon={<Edit className="size-3.5" />}
              label="编辑"
              onClick={() => onEdit(rule)}
              variant="primary"
            />
            {onCopy && (
              <MobileActionButton
                icon={<Copy className="size-3.5" />}
                label="复制"
                onClick={() => onCopy(rule)}
              />
            )}
            {onProbe && (
              <MobileActionButton
                icon={isProbingThis ? <Loader2 className="size-3.5 animate-spin" /> : <Activity className="size-3.5" />}
                label={isProbingThis ? '拨测中' : '拨测'}
                onClick={() => onProbe(rule)}
                disabled={rule.status !== 'enabled' || isProbingThis}
              />
            )}
            <MobileActionButton
              icon={rule.status === 'enabled' ? <PowerOff className="size-3.5" /> : <Power className="size-3.5" />}
              label={rule.status === 'enabled' ? '禁用' : '启用'}
              onClick={() => (rule.status === 'enabled' ? onDisable(rule) : onEnable(rule))}
            />
            <MobileActionButton
              icon={<Trash2 className="size-3.5" />}
              label="删除"
              onClick={() => onDelete(rule)}
              variant="destructive"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

MobileForwardRuleCard.displayName = 'MobileForwardRuleCard';
