/**
 * ForwardAgentDetailSheet - Mobile forward agent details with actions
 *
 * Design: Tailwind Application UI style
 * - Stacked layout with description lists
 * - Card sections with dividers
 * - Hero header with status indicator
 * - Stats cards for system metrics
 *
 * Features:
 * - Full agent details in a bottom sheet
 * - System status metrics (CPU, Memory, Network)
 * - Real-time status via SSE
 * - Primary actions in footer
 * - ActionSheet for secondary actions
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Server,
  Hash,
  Globe,
  Edit,
  MoreHorizontal,
  Power,
  PowerOff,
  Trash2,
  Network,
  ArrowUpCircle,
  Clock,
  Wifi,
  WifiOff,
  Key,
  Terminal,
  Ban,
  BellOff,
  Shield,
  Copy,
  Check,
  Download,
  Loader2,
} from 'lucide-react';
import { useForwardAgentDetailEvents } from '../hooks/useForwardAgentEvents';
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
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/shared/utils/date-utils';
import { ENABLED_STATUS_CONFIG_SHORT } from '@/shared/constants/status-config';
import type { ForwardAgent, AgentSystemStatus, BlockedProtocol } from '@/api/forward';

// ============================================================================
// Types
// ============================================================================

export interface ForwardAgentDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: ForwardAgent | null;
  onEdit: (agent: ForwardAgent) => void;
  onDelete: (agent: ForwardAgent) => void;
  onEnable: (agent: ForwardAgent) => void;
  onDisable: (agent: ForwardAgent) => void;
  onRegenerateToken?: (agent: ForwardAgent) => void;
  onGetInstallScript?: (agent: ForwardAgent) => void;
  onTriggerUpdate?: (agent: ForwardAgent) => void;
  isUpdating?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

// Protocol groups for display (consistent with desktop)
const getProtocolGroups = (t: (key: string) => string): {
  label: string;
  protocols: { value: BlockedProtocol; label: string }[];
}[] => [
  {
    label: t('admin.forwardAgents.detail.proxyProtocols'),
    protocols: [
      { value: 'http_connect', label: 'HTTP CONNECT' },
      { value: 'socks4', label: 'SOCKS4' },
      { value: 'socks5', label: 'SOCKS5' },
    ],
  },
  {
    label: t('admin.forwardAgents.detail.appProtocols'),
    protocols: [
      { value: 'http', label: 'HTTP' },
      { value: 'tls', label: 'TLS' },
      { value: 'ssh', label: 'SSH' },
      { value: 'ftp', label: 'FTP' },
    ],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format bytes rate to human readable (per second)
 */
const formatBytesRate = (bytesPerSec: number): string => {
  if (!bytesPerSec || bytesPerSec <= 0) return '0';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(1024));
  const value = bytesPerSec / Math.pow(1024, i);
  return `${value < 10 ? value.toFixed(1) : Math.round(value)}${units[i]}`;
};

/**
 * Format uptime seconds to human readable string
 */
const formatUptime = (
  seconds: number,
  t: (key: string, options?: Record<string, unknown>) => string
): string => {
  if (!seconds || seconds <= 0) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) {
    return t('admin.forwardAgents.detail.uptimeFormat.daysHours', { days, hours });
  }
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return t('admin.forwardAgents.detail.uptimeFormat.hoursMins', { hours, mins });
  }
  return t('admin.forwardAgents.detail.uptimeFormat.mins', { mins });
};

// ============================================================================
// Helper Components - Compact Mobile Layout
// ============================================================================

/**
 * Section container - minimal spacing
 */
const DetailSection = ({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('', className)}>
    <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
      {title}
    </h3>
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
      <dl className="divide-y divide-border">{children}</dl>
    </div>
  </div>
);

/**
 * Compact row - inline label and value
 */
const DetailRow = ({
  icon,
  label,
  value,
  mono = false,
  copyable = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  copyable?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof value === 'string') {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 min-h-[44px]">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
        {icon && <span className="text-muted-foreground/60">{icon}</span>}
        {label}
      </dt>
      <dd className="flex items-center gap-1.5 text-sm text-foreground min-w-0">
        <span className={cn('truncate', mono && 'font-mono text-xs')}>
          {value}
        </span>
        {copyable && typeof value === 'string' && (
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 p-1 -mr-1 rounded hover:bg-muted transition-colors touch-target"
          >
            {copied ? (
              <Check className="size-3.5 text-success" />
            ) : (
              <Copy className="size-3.5 text-muted-foreground/50" />
            )}
          </button>
        )}
      </dd>
    </div>
  );
};

/**
 * Inline stat item - ultra compact
 */
const StatItem = ({
  label,
  value,
  subValue,
  progress,
  color = 'primary',
}: {
  label: string;
  value: string;
  subValue?: string;
  progress?: number;
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
}) => {
  const colorClasses = {
    primary: 'text-primary bg-primary',
    success: 'text-success bg-success',
    warning: 'text-warning bg-warning',
    destructive: 'text-destructive bg-destructive',
    info: 'text-info bg-info',
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between gap-1 mb-1">
        <span className="text-[11px] text-muted-foreground truncate">{label}</span>
        <span className={cn('text-sm font-semibold tabular-nums', colorClasses[color].split(' ')[0])}>
          {value}
        </span>
      </div>
      {progress !== undefined && (
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', colorClasses[color].split(' ')[1])}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
      {subValue && (
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{subValue}</p>
      )}
    </div>
  );
};

/**
 * Get color based on percentage threshold
 */
const getProgressColor = (
  percent: number,
  thresholds: { warning: number; danger: number }
): 'success' | 'warning' | 'destructive' => {
  if (percent >= thresholds.danger) return 'destructive';
  if (percent >= thresholds.warning) return 'warning';
  return 'success';
};

/**
 * System Status Display - Compact single card with connection info
 */
const SystemStatusSection = ({
  status,
  isConnected,
  agentVersion,
  hasUpdate,
  platform,
  arch,
  t,
}: {
  status: AgentSystemStatus | null;
  isConnected: boolean;
  agentVersion?: string;
  hasUpdate?: boolean;
  platform?: string;
  arch?: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}) => {
  const cpuColor = status ? getProgressColor(status.cpuPercent, { warning: 60, danger: 80 }) : 'primary';
  const memColor = status ? getProgressColor(status.memoryPercent, { warning: 60, danger: 80 }) : 'primary';
  const diskColor = status?.diskPercent !== undefined
    ? getProgressColor(status.diskPercent, { warning: 75, danger: 90 })
    : 'primary';

  return (
    <div>
      <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
        {t('admin.forwardAgents.detail.systemStatus')}
      </h3>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border divide-y divide-border">
        {/* Connection & Version row */}
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="size-3.5 text-success" />
            ) : (
              <WifiOff className="size-3.5 text-muted-foreground" />
            )}
            <span className={cn('text-xs font-medium', isConnected ? 'text-success' : 'text-muted-foreground')}>
              {isConnected ? 'SSE Connected' : 'SSE Disconnected'}
            </span>
          </div>
          {agentVersion && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-mono">v{agentVersion}</span>
              {platform && arch && (
                <span className="text-[10px] text-muted-foreground/70">{platform}/{arch}</span>
              )}
              {hasUpdate && (
                <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-warning/10 text-warning text-[10px] font-medium">
                  <ArrowUpCircle className="size-2.5" />
                  {t('admin.forwardAgents.detail.updatableLabel')}
                </span>
              )}
            </div>
          )}
        </div>

        {status ? (
          <>
            {/* Resource usage row */}
            <div className="p-3 grid grid-cols-3 gap-3">
              <StatItem
                label={t('admin.forwardAgents.detail.cpu')}
                value={`${Math.round(status.cpuPercent)}%`}
                progress={status.cpuPercent}
                color={cpuColor}
              />
              <StatItem
                label={t('admin.forwardAgents.detail.memory')}
                value={`${Math.round(status.memoryPercent)}%`}
                progress={status.memoryPercent}
                color={memColor}
              />
              {status.diskPercent !== undefined ? (
                <StatItem
                  label={t('admin.forwardAgents.detail.disk')}
                  value={`${Math.round(status.diskPercent)}%`}
                  progress={status.diskPercent}
                  color={diskColor}
                />
              ) : (
                <StatItem
                  label={t('admin.forwardAgents.detail.uptime')}
                  value={formatUptime(status.uptimeSeconds, t)}
                  color="primary"
                />
              )}
            </div>

            {/* Network row */}
            <div className="px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Network className="size-4 text-muted-foreground/60" />
                <div className="flex items-center gap-3 text-sm tabular-nums">
                  <span className="text-success">↓ {formatBytesRate(status.networkRxRate)}/s</span>
                  <span className="text-info">↑ {formatBytesRate(status.networkTxRate)}/s</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                TCP {status.tcpConnections ?? 0} · UDP {status.udpConnections ?? 0}
              </span>
            </div>

            {/* Uptime row - only if disk exists */}
            {status.diskPercent !== undefined && (
              <div className="px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3" />
                  {formatUptime(status.uptimeSeconds, t)}
                </span>
                {status.loadAvg1 !== undefined && (
                  <span>Load: {status.loadAvg1.toFixed(2)}</span>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            {t('admin.forwardAgents.detail.noSystemStatusData')}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ForwardAgentDetailSheet = ({
  open,
  onOpenChange,
  agent,
  onEdit,
  onDelete,
  onEnable,
  onDisable,
  onRegenerateToken,
  onGetInstallScript,
  onTriggerUpdate,
  isUpdating = false,
}: ForwardAgentDetailSheetProps) => {
  const { t } = useTranslation();
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  // Subscribe to real-time status via SSE - always enable when sheet is open
  const { status: runtimeStatus, isOnline, isConnected } = useForwardAgentDetailEvents({
    agentId: open && agent ? agent.id : null,
    enabled: open && !!agent,
  });

  // Use SSE status if available, fallback to agent's static systemStatus
  const systemStatus = runtimeStatus ?? agent?.systemStatus;

  if (!agent) return null;

  const statusConfig = ENABLED_STATUS_CONFIG_SHORT[agent.status] || {
    labelKey: 'common.status.unknown',
    variant: 'default' as const,
  };

  // Check if agent can be updated (online, enabled, and has update available)
  const canUpdate = agent.hasUpdate && (isOnline || agent.isOnline) && agent.status === 'enabled';

  // Action Sheet actions
  const moreActions = [
    // Update action - only show when update available and agent is online
    ...(onTriggerUpdate && canUpdate
      ? [
          {
            label: isUpdating
              ? t('common.loading.updating')
              : t('admin.forwardAgents.detail.triggerUpdate'),
            icon: isUpdating ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Download className="size-5" />
            ),
            onPress: async () => {
              if (!isUpdating) {
                onTriggerUpdate(agent);
              }
            },
            disabled: isUpdating,
          },
        ]
      : []),
    ...(onRegenerateToken
      ? [
          {
            label: t('admin.forwardAgents.detail.regenerateToken'),
            icon: <Key className="size-5" />,
            onPress: async () => {
              onRegenerateToken(agent);
            },
          },
        ]
      : []),
    ...(onGetInstallScript
      ? [
          {
            label: t('admin.forwardAgents.detail.getInstallScript'),
            icon: <Terminal className="size-5" />,
            onPress: async () => {
              onGetInstallScript(agent);
            },
          },
        ]
      : []),
    {
      label: t('admin.forwardAgents.detail.deleteAgent'),
      icon: <Trash2 className="size-5" />,
      onPress: async () => {
        onDelete(agent);
        onOpenChange(false);
      },
      variant: 'destructive' as const,
    },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent showClose>
          {/* Compact Header - Core status only */}
          <SheetHeader>
            <div className="flex items-center gap-3">
              {/* Icon with online indicator */}
              <div className="relative shrink-0">
                <div className="size-11 rounded-xl flex items-center justify-center bg-primary/10">
                  <Server className="size-5 text-primary" />
                </div>
                {/* Online status dot */}
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-background',
                    (isOnline || agent.isOnline) ? 'bg-success' : 'bg-muted-foreground/30'
                  )}
                >
                  {(isOnline || agent.isOnline) && (
                    <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75 motion-reduce:hidden" />
                  )}
                </span>
              </div>

              {/* Title and config status */}
              <div className="flex-1 min-w-0">
                <SheetTitle className="truncate">{agent.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-0.5">
                  <span
                    className={cn(
                      'text-xs',
                      agent.status === 'enabled' ? 'text-success' : 'text-muted-foreground'
                    )}
                  >
                    {t(statusConfig.labelKey)}
                  </span>
                  <span className="text-border">·</span>
                  <span className="text-xs text-muted-foreground">
                    {(isOnline || agent.isOnline)
                      ? t('common.status.online')
                      : t('common.status.offline')}
                  </span>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <SheetBody className="space-y-4 pb-4">
            {/* System Status - Connection, Version, Resources */}
            <SystemStatusSection
              status={systemStatus ?? null}
              isConnected={isConnected}
              agentVersion={agent.agentVersion || systemStatus?.agentVersion}
              hasUpdate={agent.hasUpdate}
              platform={systemStatus?.platform}
              arch={systemStatus?.arch}
              t={t}
            />

            {/* Basic Info */}
            <DetailSection title={t('common.sections.basicInfo')}>
              <DetailRow
                icon={<Hash className="size-3.5" />}
                label={t('common.labels.id')}
                value={agent.id}
                mono
                copyable
              />
              <DetailRow
                icon={<Globe className="size-3.5" />}
                label={t('admin.forwardAgents.detail.publicAddress')}
                value={agent.publicAddress || systemStatus?.publicIpv4 || '-'}
                mono
                copyable={!!(agent.publicAddress || systemStatus?.publicIpv4)}
              />
              {agent.tunnelAddress && (
                <DetailRow
                  icon={<Network className="size-3.5" />}
                  label={t('admin.forwardAgents.detail.tunnelAddress')}
                  value={agent.tunnelAddress}
                  mono
                  copyable
                />
              )}
            </DetailSection>

            {/* Configuration - only if has config */}
            {(agent.allowedPortRange ||
              (agent.blockedProtocols && agent.blockedProtocols.length > 0) ||
              agent.muteNotification) && (
              <DetailSection title={t('admin.forwardAgents.detail.configInfo')}>
                {agent.allowedPortRange && (
                  <DetailRow
                    icon={<Shield className="size-3.5" />}
                    label={t('admin.forwardAgents.detail.allowedPortRange')}
                    value={agent.allowedPortRange}
                    mono
                  />
                )}
                {agent.blockedProtocols && agent.blockedProtocols.length > 0 && (
                  <div className="px-3 py-2.5 space-y-2">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Ban className="size-3.5 text-muted-foreground/60" />
                      {t('admin.forwardAgents.detail.blockedProtocols')}
                    </span>
                    <div className="space-y-1.5 pl-5.5">
                      {getProtocolGroups(t).map((group) => {
                        const blockedInGroup = group.protocols.filter((p) =>
                          agent.blockedProtocols?.includes(p.value)
                        );
                        if (blockedInGroup.length === 0) return null;
                        return (
                          <div key={group.label} className="flex flex-wrap items-center gap-1">
                            <span className="text-[11px] text-muted-foreground/70 mr-0.5">
                              {group.label}:
                            </span>
                            {blockedInGroup.map((protocol) => (
                              <span
                                key={protocol.value}
                                className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-[10px] font-medium"
                              >
                                {protocol.label}
                              </span>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {agent.muteNotification && (
                  <DetailRow
                    icon={<BellOff className="size-3.5" />}
                    label={t('admin.forwardAgents.detail.notification')}
                    value={
                      <span className="text-warning text-xs">{t('admin.forwardAgents.detail.muted')}</span>
                    }
                  />
                )}
              </DetailSection>
            )}

            {/* Remark - if exists */}
            {agent.remark && (
              <DetailSection title={t('common.fields.remark')}>
                <div className="px-3 py-2.5">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                    {agent.remark}
                  </p>
                </div>
              </DetailSection>
            )}

            {/* Expiration info */}
            <DetailSection title={t('admin.forwardAgents.detail.expirationInfo')}>
              <div className="px-3 py-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">{t('admin.forwardAgents.detail.expiresAt')}</span>
                  <p className={cn('text-foreground', agent.isExpired && 'text-destructive font-medium')}>
                    {agent.expiresAt ? formatDateTime(agent.expiresAt) : t('admin.forwardAgents.detail.neverExpires')}
                    {agent.isExpired && ` (${t('common.status.expired')})`}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">{t('common.fields.costLabel')}</span>
                  <p className="text-foreground">{agent.costLabel || '-'}</p>
                </div>
              </div>
            </DetailSection>

            {/* Meta info - compact row */}
            <DetailSection title={t('admin.forwardAgents.detail.timeInfo')}>
              <div className="px-3 py-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">{t('common.fields.createdAt')}</span>
                  <p className="text-foreground">{formatDateTime(agent.createdAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('common.fields.updatedAt')}</span>
                  <p className="text-foreground">{formatDateTime(agent.updatedAt)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">{t('admin.forwardAgents.detail.lastOnline')}</span>
                  <p className="text-foreground">{agent.lastSeenAt ? formatDateTime(agent.lastSeenAt) : '-'}</p>
                </div>
              </div>
            </DetailSection>
          </SheetBody>

          {/* Footer Actions - Compact button group */}
          <SheetFooter>
            <div className="flex gap-2">
              {/* Update button - shown when update available */}
              {onTriggerUpdate && canUpdate && (
                <button
                  type="button"
                  onClick={() => {
                    if (!isUpdating) {
                      onTriggerUpdate(agent);
                    }
                  }}
                  disabled={isUpdating}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5',
                    'h-11 rounded-lg',
                    'bg-warning text-warning-foreground',
                    'text-sm font-medium',
                    'active:opacity-80 active:scale-[0.98] transition-all',
                    'disabled:opacity-50'
                  )}
                >
                  {isUpdating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  {isUpdating
                    ? t('common.loading.updating')
                    : t('admin.forwardAgents.detail.triggerUpdate')}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onEdit(agent);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5',
                  'h-11 rounded-lg',
                  'bg-primary text-primary-foreground',
                  'text-sm font-medium',
                  'active:opacity-80 active:scale-[0.98] transition-all'
                )}
              >
                <Edit className="size-4" />
                {t('common.actions.edit')}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (agent.status === 'enabled') {
                    onDisable(agent);
                  } else {
                    onEnable(agent);
                  }
                  onOpenChange(false);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5',
                  'h-11 rounded-lg',
                  'text-sm font-medium',
                  'border',
                  'active:opacity-80 active:scale-[0.98] transition-all',
                  agent.status === 'enabled'
                    ? 'border-warning/50 bg-warning/10 text-warning'
                    : 'border-success/50 bg-success/10 text-success'
                )}
              >
                {agent.status === 'enabled' ? (
                  <>
                    <PowerOff className="size-4" />
                    {t('common.actions.disable')}
                  </>
                ) : (
                  <>
                    <Power className="size-4" />
                    {t('common.actions.enable')}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActionSheetOpen(true)}
                className={cn(
                  'size-11 rounded-lg shrink-0',
                  'flex items-center justify-center',
                  'bg-muted text-muted-foreground',
                  'active:opacity-80 active:scale-[0.98] transition-all'
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
        title={t('common.moreActions')}
      />
    </>
  );
};

ForwardAgentDetailSheet.displayName = 'ForwardAgentDetailSheet';
