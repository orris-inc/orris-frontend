/**
 * ForwardAgentDetailSheet - Mobile forward agent details with actions
 *
 * Features:
 * - Full agent details in a bottom sheet
 * - System status metrics (CPU, Memory, Network)
 * - Real-time status via SSE
 * - Primary actions in footer
 * - ActionSheet for secondary actions
 * - iOS-style design
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Router,
  Hash,
  Globe,
  Activity,
  Calendar,
  Edit,
  MoreHorizontal,
  Power,
  PowerOff,
  Trash2,
  Gauge,
  HardDrive,
  Network,
  ArrowUpCircle,
  Clock,
  Wifi,
  WifiOff,
  Loader2,
  FileText,
  Key,
  Terminal,
  Ban,
  BellOff,
  Shield,
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
import { AdminBadge } from '@/components/admin';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/lib/utils';
import { formatDate } from '@/shared/utils/date-utils';
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
}

// ============================================================================
// Constants
// ============================================================================

const BLOCKED_PROTOCOL_LABELS: Record<BlockedProtocol, string> = {
  http_connect: 'HTTP CONNECT',
  socks4: 'SOCKS4',
  socks5: 'SOCKS5',
  http: 'HTTP',
  tls: 'TLS',
  ssh: 'SSH',
  ftp: 'FTP',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format bytes to human readable string
 */
const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 ? value.toFixed(2) : value.toFixed(1)} ${units[i]}`;
};

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
const formatUptime = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}天${hours}时`;
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}时${mins}分`;
  return `${mins}分`;
};

// ============================================================================
// Helper Components
// ============================================================================

const DetailSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
      {title}
    </h4>
    <div className="rounded-xl bg-muted/30 border border-border/50 divide-y divide-border/30">
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
  <div className="flex items-center gap-3 px-3 py-2.5">
    <div className="text-muted-foreground">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  </div>
);

/**
 * Online Status Indicator with SSE connection status
 * Uses span elements to be valid inside p tags
 */
const OnlineIndicator = ({
  isOnline,
  isConnected,
  agentStatus,
}: {
  isOnline: boolean;
  isConnected: boolean;
  agentStatus: string;
}) => {
  return (
    <span className="inline-flex items-center gap-2">
      {/* SSE Connection Status */}
      <span className="text-muted-foreground">
        {isConnected ? (
          <Wifi className="size-3.5 text-success" />
        ) : (
          <WifiOff className="size-3.5" />
        )}
      </span>

      {/* Online Status */}
      {isOnline ? (
        <span className="inline-flex items-center gap-1.5 text-success">
          <span className="relative inline-flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75 motion-reduce:hidden"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          <span className="text-sm font-medium">在线</span>
        </span>
      ) : agentStatus === 'enabled' || isConnected ? (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/30"></span>
          <span className="text-sm">{isConnected ? '等待状态' : '连接中...'}</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/30"></span>
          <span className="text-sm">离线</span>
        </span>
      )}
    </span>
  );
};

/**
 * System Status Display - uses real-time SSE status if available
 */
const SystemStatusSection = ({ status }: { status: AgentSystemStatus }) => {
  if (!status) return null;

  return (
    <DetailSection title="系统状态">
      {/* CPU */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-3">
          <Gauge className="size-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">CPU</span>
              <span className="text-xs font-medium tabular-nums">
                {Math.round(status.cpuPercent)}%
              </span>
            </div>
            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  status.cpuPercent > 80
                    ? 'bg-destructive'
                    : status.cpuPercent > 60
                      ? 'bg-warning'
                      : 'bg-success'
                )}
                style={{ width: `${Math.min(status.cpuPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Memory */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-3">
          <HardDrive className="size-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">内存</span>
              <span className="text-xs font-medium tabular-nums">
                {Math.round(status.memoryPercent)}% ({formatBytes(status.memoryUsed)} / {formatBytes(status.memoryTotal)})
              </span>
            </div>
            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  status.memoryPercent > 80
                    ? 'bg-destructive'
                    : status.memoryPercent > 60
                      ? 'bg-warning'
                      : 'bg-info'
                )}
                style={{ width: `${Math.min(status.memoryPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Disk */}
      {status.diskPercent !== undefined && (
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-3">
            <HardDrive className="size-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">磁盘</span>
                <span className="text-xs font-medium tabular-nums">
                  {Math.round(status.diskPercent)}% ({formatBytes(status.diskUsed)} / {formatBytes(status.diskTotal)})
                </span>
              </div>
              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    status.diskPercent > 90
                      ? 'bg-destructive'
                      : status.diskPercent > 75
                        ? 'bg-warning'
                        : 'bg-primary'
                  )}
                  style={{ width: `${Math.min(status.diskPercent, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Network */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-3">
          <Network className="size-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-1">网络</div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-success">↓ {formatBytesRate(status.networkRxRate)}/s</span>
              <span className="text-info">↑ {formatBytesRate(status.networkTxRate)}/s</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              累计: {formatBytes(status.networkRxBytes)} / {formatBytes(status.networkTxBytes)}
            </div>
          </div>
        </div>
      </div>

      {/* Uptime and connections */}
      <DetailRow
        icon={<Clock className="size-4" />}
        label="运行时间"
        value={
          <span className="flex items-center gap-3 text-sm">
            <span>{formatUptime(status.uptimeSeconds)}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              连接: {(status.tcpConnections || 0) + (status.udpConnections || 0)}
            </span>
            {status.loadAvg1 !== undefined && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">负载: {status.loadAvg1.toFixed(2)}</span>
              </>
            )}
          </span>
        }
      />
    </DetailSection>
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

  // Action Sheet actions
  const moreActions = [
    ...(onRegenerateToken
      ? [
          {
            label: '重新生成 Token',
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
            label: '获取安装脚本',
            icon: <Terminal className="size-5" />,
            onPress: async () => {
              onGetInstallScript(agent);
            },
          },
        ]
      : []),
    {
      label: '删除 Agent',
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
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'size-12 rounded-xl flex items-center justify-center',
                  'bg-primary/10 text-primary'
                )}
              >
                <Router className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <SheetTitle className="truncate">{agent.name}</SheetTitle>
                  <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                    {t(statusConfig.labelKey)}
                  </AdminBadge>
                </div>
                <SheetDescription className="flex items-center gap-2">
                  <OnlineIndicator
                    isOnline={isOnline || agent.isOnline}
                    isConnected={isConnected}
                    agentStatus={agent.status}
                  />
                  {agent.hasUpdate && (isOnline || agent.isOnline) && (
                    <span className="inline-flex items-center gap-1 text-warning text-xs">
                      <ArrowUpCircle className="size-3.5" />
                      可更新
                    </span>
                  )}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <SheetBody className="space-y-4 pb-4">
            {/* Basic Info */}
            <DetailSection title="基本信息">
              <DetailRow
                icon={<Hash className="size-4" />}
                label="Agent ID"
                value={<span className="font-mono text-xs">{agent.id}</span>}
              />
              <DetailRow
                icon={<Globe className="size-4" />}
                label="公网地址"
                value={
                  <span className="font-mono text-xs">
                    {agent.publicAddress || systemStatus?.publicIpv4 || '-'}
                    {!agent.publicAddress && systemStatus?.publicIpv4 && (
                      <span className="text-muted-foreground ml-2">(自动)</span>
                    )}
                  </span>
                }
              />
              {agent.tunnelAddress && (
                <DetailRow
                  icon={<Network className="size-4" />}
                  label="隧道地址"
                  value={<span className="font-mono text-xs">{agent.tunnelAddress}</span>}
                />
              )}
              {/* Public IP addresses from agent report */}
              {(systemStatus?.publicIpv4 || systemStatus?.publicIpv6) && (
                <DetailRow
                  icon={<Globe className="size-4" />}
                  label="公网 IP"
                  value={
                    <div className="space-y-0.5">
                      {systemStatus.publicIpv4 && (
                        <div className="font-mono text-xs">{systemStatus.publicIpv4}</div>
                      )}
                      {systemStatus.publicIpv6 && (
                        <div className="font-mono text-xs text-muted-foreground truncate" title={systemStatus.publicIpv6}>
                          {systemStatus.publicIpv6}
                        </div>
                      )}
                    </div>
                  }
                />
              )}
            </DetailSection>

            {/* System Status - real-time via SSE */}
            {!isConnected ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">正在建立实时连接...</span>
              </div>
            ) : systemStatus ? (
              <SystemStatusSection status={systemStatus} />
            ) : (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                暂无系统状态数据
              </div>
            )}

            {/* Configuration Info */}
            {(agent.allowedPortRange || (agent.blockedProtocols && agent.blockedProtocols.length > 0) || agent.muteNotification) && (
              <DetailSection title="配置信息">
                {agent.allowedPortRange && (
                  <DetailRow
                    icon={<Shield className="size-4" />}
                    label="允许端口范围"
                    value={<span className="font-mono text-xs">{agent.allowedPortRange}</span>}
                  />
                )}
                {agent.blockedProtocols && agent.blockedProtocols.length > 0 && (
                  <div className="px-3 py-2.5">
                    <div className="flex items-start gap-3">
                      <Ban className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground mb-1">阻止协议</div>
                        <div className="flex flex-wrap gap-1.5">
                          {agent.blockedProtocols.map((protocol) => (
                            <Badge key={protocol} variant="secondary" className="text-xs">
                              {BLOCKED_PROTOCOL_LABELS[protocol] || protocol}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {agent.muteNotification && (
                  <DetailRow
                    icon={<BellOff className="size-4" />}
                    label="通知"
                    value={<span className="text-warning">已静音</span>}
                  />
                )}
              </DetailSection>
            )}

            {/* Version Info */}
            {(agent.agentVersion || systemStatus?.agentVersion) && (
              <DetailSection title="版本信息">
                <DetailRow
                  icon={<ArrowUpCircle className="size-4" />}
                  label="Agent 版本"
                  value={
                    <span className={cn('font-mono text-xs', agent.hasUpdate ? 'text-warning' : '')}>
                      v{agent.agentVersion || systemStatus?.agentVersion}
                      {(systemStatus?.platform || systemStatus?.arch) && (
                        <span className="text-muted-foreground ml-2">
                          ({systemStatus?.platform}/{systemStatus?.arch})
                        </span>
                      )}
                      {agent.hasUpdate && <span className="text-warning ml-2 font-normal">(可更新)</span>}
                    </span>
                  }
                />
              </DetailSection>
            )}

            {/* Remark */}
            {agent.remark && (
              <DetailSection title="备注">
                <div className="px-3 py-2.5">
                  <div className="flex items-start gap-3">
                    <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {agent.remark}
                    </div>
                  </div>
                </div>
              </DetailSection>
            )}

            {/* Timestamps */}
            <DetailSection title="时间信息">
              <DetailRow
                icon={<Calendar className="size-4" />}
                label="创建时间"
                value={formatDate(agent.createdAt)}
              />
              <DetailRow
                icon={<Calendar className="size-4" />}
                label="更新时间"
                value={formatDate(agent.updatedAt)}
              />
              <DetailRow
                icon={<Activity className="size-4" />}
                label="最后在线"
                value={agent.lastSeenAt ? formatDate(agent.lastSeenAt) : '-'}
              />
            </DetailSection>
          </SheetBody>

          <SheetFooter>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onEdit(agent);
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
                  if (agent.status === 'enabled') {
                    onDisable(agent);
                  } else {
                    onEnable(agent);
                  }
                  onOpenChange(false);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2',
                  'h-11 rounded-xl',
                  'text-sm font-medium',
                  'active:scale-[0.97] transition-transform',
                  agent.status === 'enabled'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success'
                )}
              >
                {agent.status === 'enabled' ? (
                  <>
                    <PowerOff className="size-4" />
                    禁用
                  </>
                ) : (
                  <>
                    <Power className="size-4" />
                    启用
                  </>
                )}
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

ForwardAgentDetailSheet.displayName = 'ForwardAgentDetailSheet';
