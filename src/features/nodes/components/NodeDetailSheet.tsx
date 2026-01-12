/**
 * NodeDetailSheet - Mobile node details with actions
 *
 * Features:
 * - Full node details in a bottom sheet
 * - System status metrics (CPU, Memory, Network)
 * - Primary actions in footer
 * - ActionSheet for secondary actions
 * - iOS-style design
 */

import { useState } from 'react';
import {
  Server,
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
  Tag,
  Clock,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { useNodeDetailEvents } from '../hooks/useNodeEvents';
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

const STATUS_CONFIG: Record<
  NodeStatus,
  { label: string; variant: 'success' | 'default' | 'warning' }
> = {
  active: { label: '激活', variant: 'success' },
  inactive: { label: '未激活', variant: 'default' },
  maintenance: { label: '维护中', variant: 'warning' },
};

const PROTOCOL_CONFIG: Record<NodeProtocol, { label: string; color: string }> = {
  shadowsocks: { label: 'Shadowsocks', color: 'bg-info/10 text-info' },
  trojan: { label: 'Trojan', color: 'bg-primary/10 text-primary' },
  vless: { label: 'VLESS', color: 'bg-success/10 text-success' },
  vmess: { label: 'VMess', color: 'bg-warning/10 text-warning' },
  hysteria2: { label: 'Hysteria2', color: 'bg-info/10 text-info' },
  tuic: { label: 'TUIC', color: 'bg-warning/10 text-warning' },
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
  nodeStatus,
}: {
  isOnline: boolean;
  isConnected: boolean;
  nodeStatus: string;
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
      ) : nodeStatus === 'active' || isConnected ? (
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
const SystemStatusSection = ({ status }: { status: NodeSystemStatus }) => {
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

  const statusConfig = STATUS_CONFIG[node.status] || { label: '未知', variant: 'default' as const };
  const protocolConfig = PROTOCOL_CONFIG[node.protocol] || { label: node.protocol, color: 'bg-muted text-muted-foreground' };

  // Action Sheet actions
  const moreActions = [
    {
      label: '删除节点',
      icon: <Trash2 className="size-5" />,
      onPress: async () => {
        onDelete(node);
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
                <Server className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <SheetTitle className="truncate">{node.name}</SheetTitle>
                  <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                    {statusConfig.label}
                  </AdminBadge>
                </div>
                <SheetDescription className="flex items-center gap-2">
                  <OnlineIndicator
                    isOnline={isOnline || node.isOnline}
                    isConnected={isConnected}
                    nodeStatus={node.status}
                  />
                  {node.hasUpdate && (isOnline || node.isOnline) && (
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
                label="节点 ID"
                value={<span className="font-mono text-xs">{node.id}</span>}
              />
              <DetailRow
                icon={<Server className="size-4" />}
                label="服务器地址"
                value={
                  <span className="font-mono text-xs">
                    {node.serverAddress || systemStatus?.publicIpv4 || '-'}:{node.agentPort}
                    {node.subscriptionPort && node.subscriptionPort !== node.agentPort && (
                      <span className="text-primary ml-2">(订阅: {node.subscriptionPort})</span>
                    )}
                    {!node.serverAddress && systemStatus?.publicIpv4 && (
                      <span className="text-muted-foreground ml-2">(自动)</span>
                    )}
                  </span>
                }
              />
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
              <DetailRow
                icon={<Globe className="size-4" />}
                label="协议"
                value={
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2 py-0.5 text-xs font-medium rounded', protocolConfig.color)}>
                      {protocolConfig.label}
                    </span>
                    {node.protocol === 'shadowsocks' && node.encryptionMethod && (
                      <span className="font-mono text-xs text-muted-foreground">{node.encryptionMethod}</span>
                    )}
                    {node.protocol === 'trojan' && node.transportProtocol && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {node.transportProtocol.toUpperCase()} + TLS
                      </span>
                    )}
                    {node.protocol === 'vless' && node.vlessSecurity && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {node.vlessTransportType?.toUpperCase() || 'TCP'} + {node.vlessSecurity.toUpperCase()}
                      </span>
                    )}
                    {node.protocol === 'vmess' && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {node.vmessTransportType?.toUpperCase() || 'TCP'}
                        {node.vmessTls && ' + TLS'}
                      </span>
                    )}
                    {node.protocol === 'hysteria2' && (
                      <span className="font-mono text-xs text-muted-foreground">
                        QUIC {node.hysteria2CongestionControl && `(${node.hysteria2CongestionControl})`}
                      </span>
                    )}
                    {node.protocol === 'tuic' && (
                      <span className="font-mono text-xs text-muted-foreground">
                        QUIC {node.tuicCongestionControl && `(${node.tuicCongestionControl})`}
                      </span>
                    )}
                  </div>
                }
              />
              {node.region && (
                <DetailRow
                  icon={<Globe className="size-4" />}
                  label="地区"
                  value={node.region}
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

            {/* Version Info */}
            {(node.agentVersion || node.systemStatus?.agentVersion) && (
              <DetailSection title="版本信息">
                <DetailRow
                  icon={<ArrowUpCircle className="size-4" />}
                  label="Agent 版本"
                  value={
                    <span className={cn('font-mono text-xs', node.hasUpdate ? 'text-warning' : '')}>
                      v{node.agentVersion || node.systemStatus?.agentVersion}
                      {(node.platform || node.systemStatus?.platform) && (
                        <span className="text-muted-foreground ml-2">
                          ({node.platform || node.systemStatus?.platform}/{node.arch || node.systemStatus?.arch})
                        </span>
                      )}
                      {node.hasUpdate && <span className="text-warning ml-2 font-normal">(可更新)</span>}
                    </span>
                  }
                />
              </DetailSection>
            )}

            {/* Tags */}
            {node.tags && node.tags.length > 0 && (
              <DetailSection title="标签">
                <div className="px-3 py-2.5">
                  <div className="flex items-start gap-3">
                    <Tag className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1.5">
                      {node.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </DetailSection>
            )}

            {/* Resource Groups */}
            {node.groupIds && node.groupIds.length > 0 && (
              <DetailSection title="资源组">
                <div className="px-3 py-2.5">
                  <div className="flex items-start gap-3">
                    <Server className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1.5">
                      {node.groupIds.map((gid) => {
                        const group = resourceGroupsMap[gid];
                        return (
                          <Badge key={gid} variant="outline" className="text-xs">
                            {group?.name || gid}
                          </Badge>
                        );
                      })}
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
                value={formatDate(node.createdAt)}
              />
              <DetailRow
                icon={<Activity className="size-4" />}
                label="最后在线"
                value={node.lastSeenAt ? formatDate(node.lastSeenAt) : '-'}
              />
            </DetailSection>
          </SheetBody>

          <SheetFooter>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onEdit(node);
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
                  if (node.status === 'active') {
                    onDeactivate(node);
                  } else {
                    onActivate(node);
                  }
                  onOpenChange(false);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2',
                  'h-11 rounded-xl',
                  'text-sm font-medium',
                  'active:scale-[0.97] transition-transform',
                  node.status === 'active'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success'
                )}
              >
                {node.status === 'active' ? (
                  <>
                    <PowerOff className="size-4" />
                    停用
                  </>
                ) : (
                  <>
                    <Power className="size-4" />
                    激活
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

NodeDetailSheet.displayName = 'NodeDetailSheet';
