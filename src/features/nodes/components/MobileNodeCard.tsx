/**
 * MobileNodeCard - iOS 26 Liquid Glass styled node card for mobile
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
  Trash2,
  Power,
  PowerOff,
  Server,
  Hash,
  Globe,
  Activity,
  ArrowUpCircle,
  Gauge,
  HardDrive,
  Network,
  Calendar,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/common/Collapsible';
import { AdminBadge } from '@/components/admin';
import { Badge } from '@/components/common/Badge';
import { MobileActionButton } from '@/components/mobile';
import { cn } from '@/lib/utils';
import { formatDate } from '@/shared/utils/date-utils';
import type { Node, NodeStatus, NodeProtocol } from '@/api/node';
import type { ResourceGroup } from '@/api/resource/types';

// ============================================================================
// Types
// ============================================================================

export interface MobileNodeCardProps {
  node: Node;
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
  shadowsocks: { label: 'SS', color: 'bg-info/10 text-info' },
  trojan: { label: 'Trojan', color: 'bg-primary/10 text-primary' },
  vless: { label: 'VLESS', color: 'bg-success/10 text-success' },
  vmess: { label: 'VMess', color: 'bg-warning/10 text-warning' },
  // Hysteria2 - uses info variant (blue family) for consistency with theme
  hysteria2: { label: 'Hy2', color: 'bg-info/10 text-info' },
  // TUIC - uses warning variant (amber/orange family) for consistency with theme
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
// Online Status Indicator
// ============================================================================

const OnlineIndicator = ({ isOnline }: { isOnline: boolean }) => {
  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1 text-success">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75 motion-reduce:hidden"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
        </span>
        <span className="text-[10px] font-medium">在线</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30"></span>
      <span className="text-[10px]">离线</span>
    </span>
  );
};


// ============================================================================
// System Status Display
// ============================================================================

interface SystemStatusProps {
  node: Node;
}

const SystemStatus = ({ node }: SystemStatusProps) => {
  const status = node.systemStatus;
  if (!status) return null;

  return (
    <div className="space-y-2">
      {/* Resource usage bars */}
      <div className="flex items-center gap-3">
        {/* CPU */}
        <div className="flex items-center gap-1.5 flex-1">
          <Gauge className="size-3 text-muted-foreground shrink-0" />
          <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
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
          <span className="text-[10px] tabular-nums text-muted-foreground w-8">
            {Math.round(status.cpuPercent)}%
          </span>
        </div>

        {/* Memory */}
        <div className="flex items-center gap-1.5 flex-1">
          <HardDrive className="size-3 text-muted-foreground shrink-0" />
          <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
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
          <span className="text-[10px] tabular-nums text-muted-foreground w-8">
            {Math.round(status.memoryPercent)}%
          </span>
        </div>
      </div>

      {/* Network rates */}
      <div className="flex items-center gap-3 text-[10px] font-mono">
        <Network className="size-3 text-muted-foreground shrink-0" />
        <span className="text-success">↓{formatBytesRate(status.networkRxRate)}/s</span>
        <span className="text-info">↑{formatBytesRate(status.networkTxRate)}/s</span>
        <span className="text-muted-foreground ml-auto">
          累计: {formatBytes(status.networkRxBytes)} / {formatBytes(status.networkTxBytes)}
        </span>
      </div>

      {/* Uptime and connections */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>运行: {formatUptime(status.uptimeSeconds)}</span>
        <span className="text-border">·</span>
        <span>连接: {(status.tcpConnections || 0) + (status.udpConnections || 0)}</span>
        {status.loadAvg1 !== undefined && (
          <>
            <span className="text-border">·</span>
            <span>负载: {status.loadAvg1.toFixed(2)}</span>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const MobileNodeCard = ({
  node,
  resourceGroupsMap = {},
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
}: MobileNodeCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = STATUS_CONFIG[node.status] || {
    label: node.status,
    variant: 'default' as const,
  };
  const protocolConfig = PROTOCOL_CONFIG[node.protocol] || {
    label: node.protocol,
    color: 'bg-muted text-muted-foreground',
  };

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
          // Active feedback
          'motion-safe:active:bg-foreground/5'
        )}
      >
        {/* Node Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-foreground truncate">{node.name}</span>
            <AdminBadge
              variant={statusConfig.variant}
              className="text-[10px] px-1.5 py-0 shrink-0"
            >
              {statusConfig.label}
            </AdminBadge>
            <OnlineIndicator isOnline={node.isOnline} />
            {node.hasUpdate && node.isOnline && (
              <ArrowUpCircle className="size-3.5 text-warning shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-mono truncate">
              {node.serverAddress}:{node.agentPort}
            </span>
            <span className="text-border">·</span>
            <span className={cn('px-1.5 py-0 text-[10px] font-medium rounded', protocolConfig.color)}>
              {protocolConfig.label}
            </span>
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
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                ID
              </div>
              <div className="text-xs font-mono text-foreground truncate">{node.id}</div>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-center gap-3">
            <Server className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                地址
              </div>
              <div className="text-xs font-mono text-foreground">
                {node.serverAddress}:{node.agentPort}
                {node.subscriptionPort && node.subscriptionPort !== node.agentPort && (
                  <span className="text-primary ml-1">(订阅: {node.subscriptionPort})</span>
                )}
              </div>
            </div>
          </div>

          {/* Protocol */}
          <div className="flex items-center gap-3">
            <Globe className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                协议
              </div>
              <div className="text-xs text-foreground flex items-center gap-2">
                <span className={cn('px-1.5 py-0.5 text-[10px] font-medium rounded', protocolConfig.color)}>
                  {protocolConfig.label}
                </span>
                {node.protocol === 'shadowsocks' && node.encryptionMethod && (
                  <span className="font-mono text-muted-foreground">{node.encryptionMethod}</span>
                )}
                {node.protocol === 'trojan' && node.transportProtocol && (
                  <span className="font-mono text-muted-foreground">
                    {node.transportProtocol.toUpperCase()} + TLS
                  </span>
                )}
                {node.protocol === 'vless' && node.vlessSecurity && (
                  <span className="font-mono text-muted-foreground">
                    {node.vlessTransportType?.toUpperCase() || 'TCP'} + {node.vlessSecurity.toUpperCase()}
                  </span>
                )}
                {node.protocol === 'vmess' && (
                  <span className="font-mono text-muted-foreground">
                    {node.vmessTransportType?.toUpperCase() || 'TCP'}
                    {node.vmessTls && ' + TLS'}
                  </span>
                )}
                {node.protocol === 'hysteria2' && (
                  <span className="font-mono text-muted-foreground">
                    QUIC {node.hysteria2CongestionControl && `(${node.hysteria2CongestionControl})`}
                  </span>
                )}
                {node.protocol === 'tuic' && (
                  <span className="font-mono text-muted-foreground">
                    QUIC {node.tuicCongestionControl && `(${node.tuicCongestionControl})`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Region */}
          {node.region && (
            <div className="flex items-center gap-3">
              <Globe className="size-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                  地区
                </div>
                <div className="text-xs text-foreground">{node.region}</div>
              </div>
            </div>
          )}

          {/* System Status */}
          {node.isOnline && node.systemStatus && (
            <div className="flex items-start gap-3">
              <Activity className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
                  系统状态
                </div>
                <SystemStatus node={node} />
              </div>
            </div>
          )}

          {/* Version */}
          {(node.agentVersion || node.systemStatus?.agentVersion) && (
            <div className="flex items-center gap-3">
              <ArrowUpCircle className="size-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                  版本
                </div>
                <div className={cn('text-xs font-mono', node.hasUpdate ? 'text-warning' : 'text-foreground')}>
                  v{node.agentVersion || node.systemStatus?.agentVersion}
                  {(node.platform || node.systemStatus?.platform) && (
                    <span className="text-muted-foreground ml-1">
                      ({node.platform || node.systemStatus?.platform}/{node.arch || node.systemStatus?.arch})
                    </span>
                  )}
                  {node.hasUpdate && <span className="text-warning ml-2">可更新</span>}
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {node.tags && node.tags.length > 0 && (
            <div className="flex items-start gap-3">
              <Hash className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  标签
                </div>
                <div className="flex flex-wrap gap-1">
                  {node.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Resource Groups */}
          {node.groupIds && node.groupIds.length > 0 && (
            <div className="flex items-start gap-3">
              <Server className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  资源组
                </div>
                <div className="flex flex-wrap gap-1">
                  {node.groupIds.map((gid) => {
                    const group = resourceGroupsMap[gid];
                    return (
                      <Badge key={gid} variant="outline" className="text-[10px] px-1.5 py-0">
                        {group?.name || gid}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Created At */}
          <div className="flex items-center gap-3">
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                创建时间
              </div>
              <div className="text-xs text-foreground">{formatDate(node.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="border-t border-border/30 px-4 py-3">
          <div className="flex gap-1.5 flex-wrap">
            <MobileActionButton
              icon={<Edit className="size-3.5" />}
              label="编辑"
              onClick={() => onEdit(node)}
              variant="primary"
            />
            {node.status === 'active' ? (
              <MobileActionButton
                icon={<PowerOff className="size-3.5" />}
                label="停用"
                onClick={() => onDeactivate(node)}
                variant="destructive"
              />
            ) : (
              <MobileActionButton
                icon={<Power className="size-3.5" />}
                label="激活"
                onClick={() => onActivate(node)}
                variant="success"
              />
            )}
            <MobileActionButton
              icon={<Trash2 className="size-3.5" />}
              label="删除"
              onClick={() => onDelete(node)}
              variant="destructive"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

MobileNodeCard.displayName = 'MobileNodeCard';
