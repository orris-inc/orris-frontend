/**
 * Entity Detail Card - Compact Design
 * Modern card displaying detailed metrics for a single node or agent
 * Optimized for space efficiency while maintaining data density
 */

import { memo } from 'react';
import { Server, Cpu, HardDrive, Activity, ArrowDown, ArrowUp, Clock, Wifi, Globe, Network } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { formatBitRate, formatBytes, formatRelativeTime } from '@/shared/utils/format-utils';
import type { EntityStatus } from '../hooks/useMonitorData';
import type { NodeSystemStatus } from '@/api/node';
import type { AgentSystemStatus } from '@/api/forward';

interface EntityDetailCardProps {
  entity: EntityStatus;
  compact?: boolean;
}

// Compact inline progress bar with label
const InlineProgress = memo(({
  value,
  label,
}: {
  value: number;
  label: string;
}) => {
  const getColorClass = (v: number) => {
    if (v >= 80) return 'bg-destructive';
    if (v >= 60) return 'bg-warning';
    return 'bg-success';
  };
  const getTextColorClass = (v: number) => {
    if (v >= 80) return 'text-destructive';
    if (v >= 60) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className={`text-[10px] font-semibold tabular-nums ${getTextColorClass(value)}`}>
          {value.toFixed(0)}%
        </span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getColorClass(value)}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
});
InlineProgress.displayName = 'InlineProgress';

// Compact stat item
const CompactStat = memo(({
  icon,
  label,
  value,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}) => (
  <div className="flex items-center gap-1.5 min-w-0">
    <div className="text-muted-foreground shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] text-muted-foreground leading-tight">{label}</p>
      <p className="text-[11px] font-semibold tabular-nums text-foreground truncate leading-tight">{value}</p>
      {subValue && (
        <p className="text-[9px] text-muted-foreground/70 truncate leading-tight">{subValue}</p>
      )}
    </div>
  </div>
));
CompactStat.displayName = 'CompactStat';

// Mini progress bar for mobile compact view
const MiniProgressBar = memo(({
  value,
  label,
  colorClass,
}: {
  value: number;
  label: string;
  colorClass: string;
}) => (
  <div className="flex items-center gap-1.5">
    <span className="text-[10px] text-muted-foreground w-6">{label}</span>
    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${colorClass}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
    <span className="text-[10px] font-medium tabular-nums w-8 text-right">{value.toFixed(0)}%</span>
  </div>
));
MiniProgressBar.displayName = 'MiniProgressBar';

// Custom comparison for memo to avoid unnecessary re-renders
const arePropsEqual = (
  prev: EntityDetailCardProps,
  next: EntityDetailCardProps
): boolean => {
  // Quick reference check
  if (prev.entity === next.entity && prev.compact === next.compact) {
    return true;
  }
  // Deep comparison of entity
  if (prev.compact !== next.compact) return false;
  if (prev.entity.id !== next.entity.id) return false;
  if (prev.entity.isOnline !== next.entity.isOnline) return false;
  if (prev.entity.name !== next.entity.name) return false;
  if (prev.entity.lastSeenAt !== next.entity.lastSeenAt) return false;

  // Compare status (high-frequency data)
  const prevStatus = prev.entity.status;
  const nextStatus = next.entity.status;
  if (prevStatus === nextStatus) return true;
  if (!prevStatus || !nextStatus) return false;

  // Compare key metrics
  return (
    prevStatus.cpuPercent === nextStatus.cpuPercent &&
    prevStatus.memoryPercent === nextStatus.memoryPercent &&
    prevStatus.diskPercent === nextStatus.diskPercent &&
    prevStatus.networkRxRate === nextStatus.networkRxRate &&
    prevStatus.networkTxRate === nextStatus.networkTxRate
  );
};

export const EntityDetailCard = memo(({ entity, compact = false }: EntityDetailCardProps) => {
  const status = entity.status as (NodeSystemStatus | AgentSystemStatus) | null;
  const isOnline = entity.isOnline && status;

  const cpuPercent = status?.cpuPercent ?? 0;
  const memoryPercent = status?.memoryPercent ?? 0;
  const diskPercent = status?.diskPercent ?? 0;

  // Get color class based on value
  const getColorClass = (value: number) => {
    if (value >= 80) return 'bg-destructive';
    if (value >= 60) return 'bg-warning';
    return 'bg-success';
  };

  // Format uptime
  const formatUptime = (seconds?: number): string => {
    if (!seconds) return '-';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Compact mode - simplified horizontal card (responsive)
  if (compact) {
    return (
      <div className={`
        relative overflow-hidden rounded-xl border shadow-sm transition-all duration-200
        ${isOnline
          ? 'bg-card border-border hover:shadow-md hover:border-primary/30'
          : 'bg-muted/30 border-border/50'
        }
      `}>
        {/* Gradient accent for online entities */}
        {isOnline && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-success via-primary to-info" />
        )}

        <div className="p-3 pl-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className={`
              p-1.5 sm:p-2 rounded-lg shrink-0
              ${entity.type === 'node'
                ? isOnline ? 'bg-info-muted' : 'bg-muted'
                : isOnline ? 'bg-primary/10' : 'bg-muted'
              }
            `}>
              {entity.type === 'node'
                ? <Server className={`size-3.5 sm:size-4 ${isOnline ? 'text-info' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                : <Cpu className={`size-3.5 sm:size-4 ${isOnline ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={1.5} />
              }
            </div>

            {/* Name and ID */}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {entity.name || entity.id}
              </h3>
              {entity.name && (
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{entity.id}</p>
              )}
            </div>

            {/* Desktop: Resource meters */}
            {isOnline && status && (
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">CPU</span>
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getColorClass(cpuPercent)}`}
                      style={{ width: `${cpuPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums w-10">{cpuPercent.toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">MEM</span>
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getColorClass(memoryPercent)}`}
                      style={{ width: `${memoryPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums w-10">{memoryPercent.toFixed(0)}%</span>
                </div>
              </div>
            )}

            {/* Desktop: Network rates */}
            {isOnline && status && (
              <div className="hidden lg:flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <ArrowDown className="size-3 text-success" />
                  <span className="tabular-nums text-muted-foreground">{formatBitRate(status.networkRxRate ?? 0)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowUp className="size-3 text-info" />
                  <span className="tabular-nums text-muted-foreground">{formatBitRate(status.networkTxRate ?? 0)}</span>
                </div>
              </div>
            )}

            {/* Status badge */}
            <Badge
              variant={isOnline ? 'default' : 'secondary'}
              className={`shrink-0 text-[10px] sm:text-xs ${isOnline ? 'bg-success text-success-foreground' : ''}`}
            >
              {isOnline ? '在线' : '离线'}
            </Badge>
          </div>

          {/* Mobile: Resource meters below */}
          {isOnline && status && (
            <div className="md:hidden mt-2.5 pt-2.5 border-t border-border/50 space-y-1.5">
              <MiniProgressBar value={cpuPercent} label="CPU" colorClass={getColorClass(cpuPercent)} />
              <MiniProgressBar value={memoryPercent} label="MEM" colorClass={getColorClass(memoryPercent)} />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                <div className="flex items-center gap-1">
                  <ArrowDown className="size-2.5 text-success" />
                  <span className="tabular-nums">{formatBitRate(status.networkRxRate ?? 0)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowUp className="size-2.5 text-info" />
                  <span className="tabular-nums">{formatBitRate(status.networkTxRate ?? 0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full mode - compact detailed card
  return (
    <div className={`
      relative overflow-hidden rounded-xl border shadow-sm transition-all duration-200 cursor-pointer
      ${isOnline
        ? 'bg-card border-border hover:shadow-md hover:border-primary/30'
        : 'bg-muted/30 border-border/50'
      }
    `}>
      {/* Gradient accent for online entities */}
      {isOnline && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-success via-primary to-info" />
      )}

      {/* Header with resource metrics inline */}
      <div className="p-2.5 sm:p-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Icon */}
          <div className={`
            p-1.5 sm:p-2 rounded-lg shrink-0
            ${entity.type === 'node'
              ? isOnline ? 'bg-info-muted' : 'bg-muted'
              : isOnline ? 'bg-primary/10' : 'bg-muted'
            }
          `}>
            {entity.type === 'node'
              ? <Server className={`size-4 ${isOnline ? 'text-info' : 'text-muted-foreground'}`} strokeWidth={1.5} />
              : <Cpu className={`size-4 ${isOnline ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={1.5} />
            }
          </div>

          {/* Name and ID */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {entity.name || entity.id}
              </h3>
              {isOnline && (
                <div className="hidden sm:flex items-center gap-1 text-success shrink-0">
                  <Wifi className="size-3" />
                  <span className="text-[10px] font-medium">SSE</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground truncate font-mono">
              {entity.id}
            </p>
          </div>

          {/* Status badge */}
          <Badge
            variant={isOnline ? 'default' : 'secondary'}
            className={`shrink-0 text-[10px] ${isOnline ? 'bg-success text-success-foreground' : ''}`}
          >
            {isOnline ? '在线' : '离线'}
          </Badge>
        </div>
      </div>

      {isOnline && status ? (
        <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3 space-y-2">
          {/* Resource metrics - inline progress bars */}
          <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-muted/30">
            <InlineProgress value={cpuPercent} label="CPU" />
            <InlineProgress value={memoryPercent} label="内存" />
            <InlineProgress value={diskPercent} label="磁盘" />
          </div>

          {/* Network Traffic - compact inline */}
          <div className="flex items-center gap-3 px-1">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <ArrowDown className="size-3 text-success shrink-0" />
              <span className="text-[10px] text-muted-foreground">下载</span>
              <span className="text-[11px] font-semibold text-success tabular-nums">{formatBitRate(status.networkRxRate ?? 0)}</span>
              <span className="text-[9px] text-muted-foreground/70 truncate">({formatBytes(status.networkRxBytes ?? 0)})</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <ArrowUp className="size-3 text-info shrink-0" />
              <span className="text-[10px] text-muted-foreground">上传</span>
              <span className="text-[11px] font-semibold text-info tabular-nums">{formatBitRate(status.networkTxRate ?? 0)}</span>
              <span className="text-[9px] text-muted-foreground/70 truncate">({formatBytes(status.networkTxBytes ?? 0)})</span>
            </div>
          </div>

          {/* System Info - compact 3-column grid */}
          <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 pt-1.5 border-t border-border/40">
            <CompactStat
              icon={<Clock className="size-3" />}
              label="运行时间"
              value={formatUptime(status.uptimeSeconds)}
            />
            <CompactStat
              icon={<Activity className="size-3" />}
              label="负载"
              value={status.loadAvg1?.toFixed(2) ?? '-'}
            />
            <CompactStat
              icon={<HardDrive className="size-3" />}
              label="内存"
              value={formatBytes(status.memoryUsed)}
              subValue={`/ ${formatBytes(status.memoryTotal)}`}
            />
            <CompactStat
              icon={<Network className="size-3" />}
              label="连接"
              value={`${(status.tcpConnections ?? 0) + (status.udpConnections ?? 0)}`}
              subValue={`T:${status.tcpConnections ?? 0} U:${status.udpConnections ?? 0}`}
            />
            {(status as NodeSystemStatus).publicIpv4 && (
              <CompactStat
                icon={<Globe className="size-3" />}
                label="公网 IP"
                value={(status as NodeSystemStatus).publicIpv4 ?? '-'}
              />
            )}
            {(status as NodeSystemStatus).agentVersion && (
              <CompactStat
                icon={<Server className="size-3" />}
                label="版本"
                value={(status as NodeSystemStatus).agentVersion ?? '-'}
              />
            )}
          </div>
        </div>
      ) : (
        /* Offline state - compact */
        <div className="p-4 flex flex-col items-center justify-center text-center">
          <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center mb-2">
            <Wifi className="size-4 text-muted-foreground/40" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {entity.type === 'node' ? 'Node Agent 离线' : '转发 Agent 离线'}
          </p>
          {entity.lastSeenAt && (
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              最后在线: {formatRelativeTime(entity.lastSeenAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}, arePropsEqual);
EntityDetailCard.displayName = 'EntityDetailCard';
