/**
 * System Status Cell Component
 * Memoized component to prevent unnecessary re-renders during SSE updates
 * Uses Context-based hover state to keep Tooltip open when data updates
 * Shared by Node and Forward Agent pages
 */

import { memo, useCallback } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { useSystemStatusHover } from './SystemStatusHoverContext';
import { formatBitRate, formatBytes, formatRelativeTime } from '@/shared/utils/format-utils';

/**
 * Common system status data interface
 * Compatible with both AgentSystemStatus and NodeSystemStatus
 */
export interface SystemStatusData {
  // System resources
  cpuPercent?: number;
  memoryPercent?: number;
  memoryUsed?: number;
  memoryTotal?: number;
  diskPercent?: number;
  diskUsed?: number;
  diskTotal?: number;
  uptimeSeconds?: number;

  // System load average
  loadAvg1?: number;
  loadAvg5?: number;
  loadAvg15?: number;

  // Network statistics
  networkRxBytes?: number;
  networkTxBytes?: number;
  networkRxRate?: number;
  networkTxRate?: number;

  // Network connections
  tcpConnections?: number;
  udpConnections?: number;

  // Optional: update timestamp (Node has this field)
  updatedAt?: number;

  // Optional: forward agent specific fields
  activeRules?: number;
  activeConnections?: number;
}

interface SystemStatusCellProps {
  /** Unique identifier for the item (node ID or agent ID) */
  itemId: string;
  /** System status data */
  status: SystemStatusData | undefined;
}


// Mini progress bar component
const MiniBar = memo(({ label, percent }: { label: string; percent: number }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[9px] text-muted-foreground/70 leading-none">{label}</span>
    <div className="w-6 h-1 rounded-full bg-muted/50 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${
          percent >= 80 ? 'bg-red-500' : percent >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
        }`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  </div>
));
MiniBar.displayName = 'MiniBar';

// Tooltip content component - separated to avoid re-render issues
const StatusTooltipContent = memo(({ status }: { status: SystemStatusData }) => {
  const cpuPercent = status.cpuPercent ?? 0;
  const memoryPercent = status.memoryPercent ?? 0;
  const diskPercent = status.diskPercent ?? 0;
  const totalConnections = (status.tcpConnections || 0) + (status.udpConnections || 0);

  return (
    <div className="space-y-2.5 text-xs">
      {/* Header with optional update time */}
      <div className="flex items-center justify-between">
        <span className="font-medium">系统监控</span>
        {status.updatedAt && (
          <span className="text-[10px] text-muted-foreground">{formatRelativeTime(status.updatedAt)}</span>
        )}
      </div>
      {/* System stats */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">CPU</span>
          <span className="font-mono">{cpuPercent.toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">内存</span>
          <span className="font-mono">
            {memoryPercent.toFixed(1)}%
            {status.memoryUsed !== undefined && status.memoryTotal !== undefined && (
              <span className="text-muted-foreground ml-1">
                ({formatBytes(status.memoryUsed)}/{formatBytes(status.memoryTotal)})
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">磁盘</span>
          <span className="font-mono">
            {diskPercent.toFixed(1)}%
            {status.diskUsed !== undefined && status.diskTotal !== undefined && (
              <span className="text-muted-foreground ml-1">
                ({formatBytes(status.diskUsed)}/{formatBytes(status.diskTotal)})
              </span>
            )}
          </span>
        </div>
        {status.loadAvg1 !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">负载</span>
            <span className="font-mono">
              {status.loadAvg1.toFixed(2)} / {status.loadAvg5?.toFixed(2)} / {status.loadAvg15?.toFixed(2)}
            </span>
          </div>
        )}
        {status.uptimeSeconds !== undefined && status.uptimeSeconds > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">运行</span>
            <span className="font-mono">
              {Math.floor(status.uptimeSeconds / 86400)}d {Math.floor((status.uptimeSeconds % 86400) / 3600)}h
            </span>
          </div>
        )}
      </div>
      {/* Network stats */}
      <div className="space-y-1.5 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">下载</span>
          <span className="font-mono text-success">{formatBitRate(status.networkRxRate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">上传</span>
          <span className="font-mono text-info">{formatBitRate(status.networkTxRate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">累计</span>
          <span className="font-mono text-[11px]">
            ↓{formatBytes(status.networkRxBytes)} ↑{formatBytes(status.networkTxBytes)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">连接</span>
          <span className="font-mono">
            {totalConnections} (TCP:{status.tcpConnections || 0} UDP:{status.udpConnections || 0})
          </span>
        </div>
      </div>
      {/* Forward agent specific: active rules and connections */}
      {(status.activeRules !== undefined || status.activeConnections !== undefined) && (
        <div className="space-y-1.5 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">活跃规则</span>
            <span className="font-mono">{status.activeRules ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">活跃连接</span>
            <span className="font-mono">{status.activeConnections ?? 0}</span>
          </div>
        </div>
      )}
    </div>
  );
});
StatusTooltipContent.displayName = 'StatusTooltipContent';

/**
 * System Status Cell - displays system metrics with tooltip
 * Uses Context-based hover state lifted to table level
 * This prevents state loss when cell re-renders due to SSE updates
 */
export const SystemStatusCell = memo(({ itemId, status }: SystemStatusCellProps) => {
  // Hover state is managed at table level via Context
  const { hoveredId, setHoveredId } = useSystemStatusHover();
  const isOpen = hoveredId === itemId;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setHoveredId(open ? itemId : null);
    },
    [itemId, setHoveredId]
  );

  if (!status) {
    return <span className="text-xs text-muted-foreground/50">-</span>;
  }

  const cpuPercent = status.cpuPercent ?? 0;
  const memoryPercent = status.memoryPercent ?? 0;
  const diskPercent = status.diskPercent ?? 0;

  return (
    <Tooltip open={isOpen} onOpenChange={handleOpenChange}>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-2.5 cursor-default">
          {/* System mini bars */}
          <div className="flex items-center gap-1.5">
            <MiniBar label="C" percent={cpuPercent} />
            <MiniBar label="M" percent={memoryPercent} />
            <MiniBar label="D" percent={diskPercent} />
          </div>
          {/* Network rates */}
          <div className="w-px h-4 bg-border" />
          <div className="flex flex-col gap-0 min-w-[56px]">
            <span className="text-[10px] font-mono text-success leading-tight">
              ↓{formatBitRate(status.networkRxRate, true)}
            </span>
            <span className="text-[10px] font-mono text-info leading-tight">
              ↑{formatBitRate(status.networkTxRate, true)}
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="w-64">
        <StatusTooltipContent status={status} />
      </TooltipContent>
    </Tooltip>
  );
});
SystemStatusCell.displayName = 'SystemStatusCell';
