/**
 * System Status Display Component
 * Compact mini bars for CPU, memory, and disk usage
 */

import { Cpu, MemoryStick, HardDrive, Clock, Activity } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/common/Tooltip';
import { Progress, ProgressIndicator } from '@/components/common/Progress';

// System status data interface
export interface SystemStatusData {
  cpu?: number;
  memory?: number;
  disk?: number;
  uptime?: number; // seconds
  // Extended fields
  memoryUsed?: number; // bytes
  memoryTotal?: number; // bytes
  memoryAvail?: number; // bytes
  diskUsed?: number; // bytes
  diskTotal?: number; // bytes
  loadAvg1?: number;
  loadAvg5?: number;
  loadAvg15?: number;
}

interface SystemStatusDisplayProps {
  status: SystemStatusData | null | undefined;
  emptyText?: string;
}

// Format uptime
const formatUptime = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Format bytes to human readable
const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

// Get color based on usage
const getBarColor = (value: number): string => {
  if (value >= 80) return 'bg-red-500';
  if (value >= 60) return 'bg-amber-500';
  return 'bg-emerald-500';
};

// Mini bar component for compact display
const MiniBar: React.FC<{
  value: number;
  label: string;
}> = ({ value, label }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[9px] text-muted-foreground/70 leading-none">{label}</span>
    <div className="w-8 h-1 rounded-full bg-muted/50 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${getBarColor(value)}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  </div>
);

// Progress bar for tooltip detail
const StatusProgressBar: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-mono font-medium text-foreground">{value.toFixed(1)}%</span>
    </div>
    <Progress className="h-1.5">
      <ProgressIndicator
        className={getBarColor(value)}
        style={{ transform: `translateX(-${100 - Math.min(value, 100)}%)` }}
      />
    </Progress>
  </div>
);

/**
 * System Status Display Component
 * Compact horizontal mini bars for CPU, memory, disk
 */
export const SystemStatusDisplay: React.FC<SystemStatusDisplayProps> = ({
  status,
  emptyText = '-',
}) => {
  if (!status) {
    return <span className="text-xs text-muted-foreground/50">{emptyText}</span>;
  }

  const cpu = status.cpu ?? 0;
  const memory = status.memory ?? 0;
  const disk = status.disk ?? 0;

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="inline-flex items-center gap-2 cursor-default">
          <MiniBar value={cpu} label="C" />
          <MiniBar value={memory} label="M" />
          <MiniBar value={disk} label="D" />
        </div>
      </TooltipTrigger>
      <TooltipContent className="w-56 p-3">
        <div className="space-y-2.5">
          <StatusProgressBar
            label="CPU"
            value={cpu}
            icon={<Cpu className="size-3" />}
          />
          <div className="space-y-1">
            <StatusProgressBar
              label="内存"
              value={memory}
              icon={<MemoryStick className="size-3" />}
            />
            {status.memoryUsed !== undefined && status.memoryTotal !== undefined && (
              <div className="text-[10px] text-muted-foreground pl-4">
                {formatBytes(status.memoryUsed)} / {formatBytes(status.memoryTotal)}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <StatusProgressBar
              label="磁盘"
              value={disk}
              icon={<HardDrive className="size-3" />}
            />
            {status.diskUsed !== undefined && status.diskTotal !== undefined && (
              <div className="text-[10px] text-muted-foreground pl-4">
                {formatBytes(status.diskUsed)} / {formatBytes(status.diskTotal)}
              </div>
            )}
          </div>
          {/* Load average */}
          {status.loadAvg1 !== undefined && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Activity className="size-3" />
                负载
              </span>
              <span className="font-mono text-[11px] text-foreground">
                {status.loadAvg1.toFixed(2)} / {status.loadAvg5?.toFixed(2) || '-'} / {status.loadAvg15?.toFixed(2) || '-'}
              </span>
            </div>
          )}
          {status.uptime && status.uptime > 0 && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-3" />
                运行时间
              </span>
              <span className="font-medium text-foreground">{formatUptime(status.uptime)}</span>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
