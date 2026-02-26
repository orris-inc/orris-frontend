/**
 * NodeDetailSheet - Mobile node details with actions
 *
 * Design: Tailwind Application UI style
 * - Stacked layout with description lists
 * - Card sections with dividers
 * - Hero header with status indicator
 * - Stats cards for system metrics
 *
 * Features:
 * - Full node details in a bottom sheet
 * - System status metrics (CPU, Memory, Network)
 * - Real-time status via SSE
 * - Primary actions in footer
 * - ActionSheet for secondary actions
 */

import { useState, memo } from 'react';
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
  Tag,
  Clock,
  Wifi,
  WifiOff,
  Copy,
  Check,
} from 'lucide-react';
import { useNodeDetailEvents } from '../hooks/useNodeEvents';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
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
import { cardStyles } from '@/lib/ui-styles';
import { formatDateTime, isNeverExpiresDate } from '@/shared/utils/date-utils';
import type { Node, NodeStatus, NodeProtocol, NodeSystemStatus } from '@/api/node';
import type { ResourceGroup } from '@/api/resource/types';

// ============================================================================
// Types
// ============================================================================

export interface NodeDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: Node | null;
  resourceGroupsMap?: Record<string, ResourceGroup>;
  onEdit: (node: Node) => void;
  onDelete: (node: Node) => void;
  onActivate: (node: Node) => void;
  onDeactivate: (node: Node) => void;
}

// ============================================================================
// Constants
// ============================================================================

// Status config - labels will be translated at render time
const STATUS_CONFIG: Record<
  NodeStatus,
  { labelKey: string }
> = {
  active: { labelKey: 'common.status.enabled' },
  inactive: { labelKey: 'common.status.disabled' },
  maintenance: { labelKey: 'common.status.maintenance' },
};

const PROTOCOL_CONFIG: Record<NodeProtocol, { label: string; color: string }> = {
  shadowsocks: { label: 'Shadowsocks', color: 'bg-info/10 text-info' },
  trojan: { label: 'Trojan', color: 'bg-destructive/10 text-destructive' },
  vless: { label: 'VLESS', color: 'bg-relay/10 text-relay' },
  vmess: { label: 'VMess', color: 'bg-primary/10 text-primary' },
  hysteria2: { label: 'Hysteria2', color: 'bg-warning/10 text-warning' },
  tuic: { label: 'TUIC', color: 'bg-chart-3/10 text-chart-3' },
  anytls: { label: 'AnyTLS', color: 'bg-success/10 text-success' },
};

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
    return t('admin.nodes.detail.uptimeFormat.daysHours', { days, hours });
  }
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return t('admin.nodes.detail.uptimeFormat.hoursMins', { hours, mins });
  }
  return t('admin.nodes.detail.uptimeFormat.mins', { mins });
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

// ============================================================================
// Helper Components - Compact Mobile Layout
// ============================================================================

/**
 * Section container - minimal spacing
 */
const DetailSection = memo(({
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
    <div className={cn(cardStyles, 'overflow-hidden')}>
      <dl className="divide-y divide-border">{children}</dl>
    </div>
  </div>
));

DetailSection.displayName = 'DetailSection';

/**
 * Compact row - inline label and value
 */
const DetailRow = memo(({
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
  const { copied, copyToClipboard } = useCopyToClipboard();

  const handleCopy = () => {
    if (typeof value === 'string') {
      copyToClipboard(value);
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
});

DetailRow.displayName = 'DetailRow';

/**
 * Inline stat item - ultra compact
 */
const StatItem = memo(({
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
});

StatItem.displayName = 'StatItem';

/**
 * System Status Display - Compact single card with connection info
 */
const SystemStatusSection = memo(({
  status,
  isConnected,
  agentVersion,
  hasUpdate,
  platform,
  arch,
  t,
}: {
  status: NodeSystemStatus | null;
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
        {t('admin.nodes.detail.systemStatus')}
      </h3>

      <div className={cn(cardStyles, 'overflow-hidden divide-y divide-border')}>
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
                  {t('admin.nodes.updatable')}
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
                label={t('admin.nodes.detail.cpu')}
                value={`${Math.round(status.cpuPercent)}%`}
                progress={status.cpuPercent}
                color={cpuColor}
              />
              <StatItem
                label={t('admin.nodes.detail.memory')}
                value={`${Math.round(status.memoryPercent)}%`}
                progress={status.memoryPercent}
                color={memColor}
              />
              {status.diskPercent !== undefined ? (
                <StatItem
                  label={t('admin.nodes.detail.disk')}
                  value={`${Math.round(status.diskPercent)}%`}
                  progress={status.diskPercent}
                  color={diskColor}
                />
              ) : (
                <StatItem
                  label={t('admin.nodes.detail.uptime')}
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
});

SystemStatusSection.displayName = 'SystemStatusSection';

// ============================================================================
// Main Component
// ============================================================================

export const NodeDetailSheet = ({
  open,
  onOpenChange,
  node,
  resourceGroupsMap = {},
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
}: NodeDetailSheetProps) => {
  const { t } = useTranslation();
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  // Subscribe to real-time status via SSE - always enable when sheet is open
  // This allows us to get real-time status for any node, regardless of its current status
  const { status: runtimeStatus, isOnline, isConnected } = useNodeDetailEvents({
    nodeId: open && node ? node.id : null,
    enabled: open && !!node,
  });

  // Use SSE status if available, fallback to node's static systemStatus
  const systemStatus = runtimeStatus ?? node?.systemStatus;

  if (!node) return null;

  const statusConfig = STATUS_CONFIG[node.status] || { labelKey: 'admin.nodes.statusLabel.inactive' };
  const protocolConfig = PROTOCOL_CONFIG[node.protocol] || { label: node.protocol, color: 'bg-muted text-muted-foreground' };

  // Action Sheet actions
  const moreActions = [
    {
      label: t('admin.nodes.actions.delete'),
      icon: <Trash2 className="size-5" />,
      onPress: async () => {
        onDelete(node);
        onOpenChange(false);
      },
      variant: 'destructive' as const,
    },
  ];

  // Get protocol detail string
  const getProtocolDetail = (): string | null => {
    if (node.protocol === 'shadowsocks' && node.encryptionMethod) {
      return node.encryptionMethod;
    }
    if (node.protocol === 'trojan' && node.transportProtocol) {
      return `${node.transportProtocol.toUpperCase()} + TLS`;
    }
    if (node.protocol === 'vless' && node.vlessSecurity) {
      return `${node.vlessTransportType?.toUpperCase() || 'TCP'} + ${node.vlessSecurity.toUpperCase()}`;
    }
    if (node.protocol === 'vmess') {
      return `${node.vmessTransportType?.toUpperCase() || 'TCP'}${node.vmessTls ? ' + TLS' : ''}`;
    }
    if (node.protocol === 'hysteria2') {
      return `QUIC${node.hysteria2CongestionControl ? ` (${node.hysteria2CongestionControl})` : ''}`;
    }
    if (node.protocol === 'tuic') {
      return `QUIC${node.tuicCongestionControl ? ` (${node.tuicCongestionControl})` : ''}`;
    }
    return null;
  };

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
                    (isOnline || node.isOnline) ? 'bg-success' : 'bg-muted-foreground/30'
                  )}
                >
                </span>
              </div>

              {/* Title and config status */}
              <div className="flex-1 min-w-0">
                <SheetTitle className="truncate">{node.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-0.5">
                  <span
                    className={cn(
                      'text-xs',
                      node.status === 'active' ? 'text-success' : 'text-muted-foreground'
                    )}
                  >
                    {t(statusConfig.labelKey)}
                  </span>
                  <span className="text-border">·</span>
                  <span className="text-xs text-muted-foreground">
                    {(isOnline || node.isOnline)
                      ? t('common.status.online')
                      : t('common.status.offline')}
                  </span>
                  {node.onlineSubscriptionCount > 0 && (
                    <>
                      <span className="text-border">·</span>
                      <span className="text-xs text-success font-medium">
                        {node.onlineSubscriptionCount} {t('admin.nodes.detail.onlineSubscriptions')}
                      </span>
                    </>
                  )}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <SheetBody className="space-y-4 pb-4">
            {/* System Status - Connection, Version, Resources */}
            <SystemStatusSection
              status={systemStatus ?? null}
              isConnected={isConnected}
              agentVersion={node.agentVersion || systemStatus?.agentVersion}
              hasUpdate={node.hasUpdate}
              platform={systemStatus?.platform}
              arch={systemStatus?.arch}
              t={t}
            />

            {/* Basic Info */}
            <DetailSection title={t('common.sections.basicInfo')}>
              <DetailRow
                icon={<Hash className="size-3.5" />}
                label={t('common.labels.id')}
                value={node.id}
                mono
                copyable
              />
              <DetailRow
                icon={<Server className="size-3.5" />}
                label={t('admin.nodes.detail.serverAddress')}
                value={`${node.serverAddress || systemStatus?.publicIpv4 || '-'}:${node.agentPort}`}
                mono
                copyable={!!(node.serverAddress || systemStatus?.publicIpv4)}
              />
              {/* Public IP addresses from agent report */}
              {(systemStatus?.publicIpv4 || systemStatus?.publicIpv6) && (
                <DetailRow
                  icon={<Globe className="size-3.5" />}
                  label={t('admin.nodes.detail.publicIp')}
                  value={systemStatus.publicIpv4 || systemStatus.publicIpv6 || '-'}
                  mono
                  copyable
                />
              )}
            </DetailSection>

            {/* Protocol Info */}
            <DetailSection title={t('common.protocol')}>
              <div className="px-3 py-2.5 flex items-center justify-between min-h-[44px]">
                <span className={cn('px-2 py-0.5 text-xs font-medium rounded', protocolConfig.color)}>
                  {protocolConfig.label}
                </span>
                {getProtocolDetail() && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {getProtocolDetail()}
                  </span>
                )}
              </div>
              {node.region && (
                <DetailRow
                  icon={<Globe className="size-3.5" />}
                  label={t('admin.nodes.detail.region')}
                  value={node.region}
                />
              )}
              {node.subscriptionPort && node.subscriptionPort !== node.agentPort && (
                <DetailRow
                  icon={<Network className="size-3.5" />}
                  label={t('admin.nodes.detail.subscriptionPort')}
                  value={node.subscriptionPort.toString()}
                  mono
                />
              )}
            </DetailSection>

            {/* Tags - if exists */}
            {node.tags && node.tags.length > 0 && (
              <DetailSection title={t('admin.nodes.detail.tags')}>
                <div className="px-3 py-2.5">
                  <div className="flex items-start gap-3">
                    <Tag className="size-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1.5">
                      {node.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </DetailSection>
            )}

            {/* Resource Groups - if exists */}
            {node.groupSids && node.groupSids.length > 0 && (
              <DetailSection title={t('admin.resourceGroups.title')}>
                <div className="px-3 py-2.5">
                  <div className="flex items-start gap-3">
                    <Server className="size-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1.5">
                      {node.groupSids.map((gid) => {
                        const group = resourceGroupsMap[gid];
                        return (
                          <span
                            key={gid}
                            className="px-2 py-0.5 rounded border border-border text-xs"
                          >
                            {group?.name || gid}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </DetailSection>
            )}

            {/* Expiration info */}
            <DetailSection title={t('admin.nodes.detail.expirationInfo')}>
              <div className="px-3 py-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">{t('admin.nodes.detail.expiresAt')}</span>
                  <p className={cn('text-foreground', node.isExpired && 'text-destructive font-medium')}>
                    {node.expiresAt && !isNeverExpiresDate(node.expiresAt) ? formatDateTime(node.expiresAt) : t('admin.nodes.detail.neverExpires')}
                    {node.isExpired && ` (${t('common.status.expired')})`}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">{t('common.fields.costLabel')}</span>
                  <p className="text-foreground">{node.costLabel || '-'}</p>
                </div>
              </div>
            </DetailSection>

            {/* Meta info - compact row */}
            <DetailSection title={t('admin.nodes.detail.timeInfo')}>
              <div className="px-3 py-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">{t('common.fields.createdAt')}</span>
                  <p className="text-foreground">{formatDateTime(node.createdAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('admin.nodes.detail.lastOnline')}</span>
                  <p className="text-foreground">{node.lastSeenAt ? formatDateTime(node.lastSeenAt) : '-'}</p>
                </div>
              </div>
            </DetailSection>
          </SheetBody>

          {/* Footer Actions - Compact button group */}
          <SheetFooter>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onEdit(node);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5',
                  'h-11 rounded-xl',
                  'bg-primary text-primary-foreground',
                  'text-sm font-medium',
                  'active:scale-[0.98] active:opacity-80 transition-all'
                )}
              >
                <Edit className="size-4" />
                {t('common.actions.edit')}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (node.status === 'active') {
                    onDeactivate(node);
                  } else {
                    onActivate(node);
                  }
                  onOpenChange(false);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5',
                  'h-11 rounded-xl',
                  'text-sm font-medium',
                  'border',
                  'active:scale-[0.98] active:opacity-80 transition-all',
                  node.status === 'active'
                    ? 'border-warning/50 bg-warning/10 text-warning'
                    : 'border-success/50 bg-success/10 text-success'
                )}
              >
                {node.status === 'active' ? (
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
                  'size-11 rounded-xl shrink-0',
                  'flex items-center justify-center',
                  'bg-muted text-muted-foreground',
                  'active:scale-[0.98] active:opacity-80 transition-all'
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

NodeDetailSheet.displayName = 'NodeDetailSheet';
