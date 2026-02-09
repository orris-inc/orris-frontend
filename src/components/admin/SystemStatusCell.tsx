/**
 * System Status Cell Component
 * Memoized component to prevent unnecessary re-renders during SSE updates
 * Uses TableHoverCard with columnKey for stable hover state
 * Shared by Node and Forward Agent pages
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { TableHoverCard } from './TableHoverCard';
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
  /** Unique identifier for the item (node ID or agent ID) - used for backward compatibility */
  itemId: string;
  /** System status data */
  status: SystemStatusData | undefined;
}


// Mini progress bar component - accepts translated label
const MiniBar = memo(({ label, percent }: { label: string; percent: number }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[9px] text-muted-foreground/70 leading-none">{label}</span>
    <div className="w-6 h-1 rounded-full bg-muted/50 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${
          percent >= 80 ? 'bg-destructive' : percent >= 60 ? 'bg-warning' : 'bg-success'
        }`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  </div>
));
MiniBar.displayName = 'MiniBar';

// HoverCard content component - separated to avoid re-render issues
const StatusHoverContent = memo(({ status }: { status: SystemStatusData }) => {
  const { t } = useTranslation();
  const cpuPercent = status.cpuPercent ?? 0;
  const memoryPercent = status.memoryPercent ?? 0;
  const diskPercent = status.diskPercent ?? 0;
  const totalConnections = (status.tcpConnections || 0) + (status.udpConnections || 0);

  return (
    <div className="space-y-2.5 text-xs">
      {/* Header with optional update time */}
      <div className="flex items-center justify-between">
        <span className="font-medium">{t('admin.monitor.systemMonitor')}</span>
        {status.updatedAt && (
          <span className="text-[10px] text-muted-foreground">{formatRelativeTime(status.updatedAt)}</span>
        )}
      </div>
      {/* System stats */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('admin.monitor.cpu')}</span>
          <span className="font-mono">{cpuPercent.toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('admin.monitor.memory')}</span>
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
          <span className="text-muted-foreground">{t('admin.monitor.disk')}</span>
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
            <span className="text-muted-foreground">{t('admin.monitor.load')}</span>
            <span className="font-mono">
              {status.loadAvg1.toFixed(2)} / {status.loadAvg5?.toFixed(2)} / {status.loadAvg15?.toFixed(2)}
            </span>
          </div>
        )}
        {status.uptimeSeconds !== undefined && status.uptimeSeconds > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('admin.monitor.uptime')}</span>
            <span className="font-mono">
              {Math.floor(status.uptimeSeconds / 86400)}d {Math.floor((status.uptimeSeconds % 86400) / 3600)}h
            </span>
          </div>
        )}
      </div>
      {/* Network stats */}
      <div className="space-y-1.5 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('common.actions.download')}</span>
          <span className="font-mono text-success">{formatBitRate(status.networkRxRate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('common.actions.upload')}</span>
          <span className="font-mono text-info">{formatBitRate(status.networkTxRate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('admin.monitor.total')}</span>
          <span className="font-mono text-[11px]">
            ↓{formatBytes(status.networkRxBytes)} ↑{formatBytes(status.networkTxBytes)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('admin.monitor.connections')}</span>
          <span className="font-mono">
            {totalConnections} (TCP:{status.tcpConnections || 0} UDP:{status.udpConnections || 0})
          </span>
        </div>
      </div>
      {/* Forward agent specific: active rules and connections */}
      {(status.activeRules !== undefined || status.activeConnections !== undefined) && (
        <div className="space-y-1.5 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('admin.monitor.activeRules')}</span>
            <span className="font-mono">{status.activeRules ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('admin.monitor.activeConnections')}</span>
            <span className="font-mono">{status.activeConnections ?? 0}</span>
          </div>
        </div>
      )}
    </div>
  );
});
StatusHoverContent.displayName = 'StatusHoverContent';

/**
 * System Status Cell - displays system metrics with hover card
 * Uses TableHoverCard with columnKey="monitor" for stable state
 * Requires TableHoverCardProvider and TableRowProvider in parent tree
 */
export const SystemStatusCell = memo(({ status }: SystemStatusCellProps) => {
  const { t } = useTranslation();

  if (!status) {
    return <span className="text-xs text-muted-foreground/50">-</span>;
  }

  const cpuPercent = status.cpuPercent ?? 0;
  const memoryPercent = status.memoryPercent ?? 0;
  const diskPercent = status.diskPercent ?? 0;

  return (
    <TableHoverCard
      columnKey="monitor"
      content={<StatusHoverContent status={status} />}
      contentClassName="w-64"
      align="start"
      side="bottom"
    >
      <div className="inline-flex items-center gap-2 whitespace-nowrap">
        {/* System mini bars */}
        <div className="flex items-center gap-1">
          <MiniBar label={t('admin.monitor.detail.cpuShort')} percent={cpuPercent} />
          <MiniBar label={t('admin.monitor.detail.memShort')} percent={memoryPercent} />
          <MiniBar label={t('admin.monitor.detail.diskShort')} percent={diskPercent} />
        </div>
        {/* Network rates */}
        <div className="w-px h-4 bg-border shrink-0" />
        <div className="flex flex-col gap-0 min-w-[52px] shrink-0">
          <span className="text-[10px] font-mono text-success leading-tight">
            ↓{formatBitRate(status.networkRxRate, true)}
          </span>
          <span className="text-[10px] font-mono text-info leading-tight">
            ↑{formatBitRate(status.networkTxRate, true)}
          </span>
        </div>
      </div>
    </TableHoverCard>
  );
});
SystemStatusCell.displayName = 'SystemStatusCell';
