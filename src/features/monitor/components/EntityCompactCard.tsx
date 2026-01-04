/**
 * Entity Compact Card
 * Compact card design for displaying node/agent metrics
 * Optimized for dashboard grid layouts
 */

import { memo } from 'react';
import { Server, Cpu, ArrowDown, ArrowUp, Wifi, WifiOff } from 'lucide-react';
import { formatBitRate, formatBytes } from '@/shared/utils/format-utils';
import type { EntityStatus } from '../hooks/useMonitorData';
import type { NodeSystemStatus } from '@/api/node';
import type { AgentSystemStatus } from '@/api/forward';

interface EntityCompactCardProps {
  entity: EntityStatus;
}

// Mini circular progress
const MiniGauge = memo(({ value, label, size = 44 }: { value: number; label: string; size?: number }) => {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (clampedValue / 100) * circumference;

  const getColor = () => {
    if (clampedValue >= 90) return 'stroke-destructive';
    if (clampedValue >= 75) return 'stroke-warning';
    return 'stroke-success';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${getColor()} transition-all duration-300`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold tabular-nums text-foreground">
            {clampedValue.toFixed(0)}
          </span>
        </div>
      </div>
      <span className="text-[9px] text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
});
MiniGauge.displayName = 'MiniGauge';

// Mini progress bar
const MiniBar = memo(({ value, className }: { value: number; className?: string }) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const color = clampedValue >= 90 ? 'bg-destructive' : clampedValue >= 75 ? 'bg-warning' : 'bg-success';

  return (
    <div className={`h-1 rounded-full bg-muted/50 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
});
MiniBar.displayName = 'MiniBar';

export const EntityCompactCard = memo(({ entity }: EntityCompactCardProps) => {
  const status = entity.status as (NodeSystemStatus | AgentSystemStatus) | null;
  const isOnline = entity.isOnline && status;

  const cpuPercent = status?.cpuPercent ?? 0;
  const memoryPercent = status?.memoryPercent ?? 0;
  const diskPercent = status?.diskPercent ?? 0;

  return (
    <div className={`
      relative rounded-xl border transition-all duration-200 cursor-pointer
      ${isOnline
        ? 'bg-card border-border hover:border-primary/40 hover:shadow-md'
        : 'bg-muted/20 border-border/50 opacity-70'
      }
    `}>
      {/* Status indicator line */}
      {isOnline && (
        <div className="absolute top-0 left-3 right-3 h-0.5 rounded-b-full bg-gradient-to-r from-success via-primary to-info" />
      )}

      <div className="p-3">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-3">
          {/* Icon */}
          <div className={`
            p-1.5 rounded-lg shrink-0
            ${entity.type === 'node'
              ? isOnline ? 'bg-info/10' : 'bg-muted'
              : isOnline ? 'bg-primary/10' : 'bg-muted'
            }
          `}>
            {entity.type === 'node'
              ? <Server className={`size-3.5 ${isOnline ? 'text-info' : 'text-muted-foreground'}`} />
              : <Cpu className={`size-3.5 ${isOnline ? 'text-primary' : 'text-muted-foreground'}`} />
            }
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {entity.name || entity.id.slice(-8)}
            </p>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="size-3 text-success" />
            ) : (
              <WifiOff className="size-3 text-muted-foreground" />
            )}
            <span className={`
              size-1.5 rounded-full
              ${isOnline ? 'bg-success animate-pulse' : 'bg-muted-foreground'}
            `} />
          </div>
        </div>

        {isOnline && status ? (
          <>
            {/* Gauges row */}
            <div className="flex items-center justify-between mb-3 px-1">
              <MiniGauge value={cpuPercent} label="CPU" />
              <MiniGauge value={memoryPercent} label="内存" />
              <MiniGauge value={diskPercent} label="磁盘" />
            </div>

            {/* Network stats */}
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              {/* Download */}
              <div className="flex items-center gap-2">
                <ArrowDown className="size-3 text-success shrink-0" />
                <MiniBar value={(status.networkRxRate ?? 0) / 1000000 * 10} className="flex-1" />
                <span className="text-[10px] font-mono text-success w-14 text-right">
                  {formatBitRate(status.networkRxRate, true)}
                </span>
              </div>
              {/* Upload */}
              <div className="flex items-center gap-2">
                <ArrowUp className="size-3 text-info shrink-0" />
                <MiniBar value={(status.networkTxRate ?? 0) / 1000000 * 10} className="flex-1" />
                <span className="text-[10px] font-mono text-info w-14 text-right">
                  {formatBitRate(status.networkTxRate, true)}
                </span>
              </div>
            </div>

            {/* Footer stats */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
              <span>流量: {formatBytes((status.networkRxBytes ?? 0) + (status.networkTxBytes ?? 0))}</span>
              <span>连接: {(status.tcpConnections ?? 0) + (status.udpConnections ?? 0)}</span>
            </div>
          </>
        ) : (
          /* Offline placeholder */
          <div className="py-4 text-center">
            <p className="text-[10px] text-muted-foreground">离线</p>
          </div>
        )}
      </div>
    </div>
  );
});
EntityCompactCard.displayName = 'EntityCompactCard';
