/**
 * System Status Display Component
 * Uses circular progress to show CPU and memory usage, with detailed info on hover
 */

import { Cpu, MemoryStick, HardDrive, Clock } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/common/Tooltip';
import { Progress, ProgressIndicator } from '@/components/common/Progress';

// System status data interface
export interface SystemStatusData {
  cpu: number;
  memory: number;
  disk: number;
  uptime?: number; // seconds
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
  if (days > 0) return `${days}天${hours}时`;
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}时${minutes}分`;
  return `${minutes}分钟`;
};

// Get color based on usage
const getStrokeColor = (value: number): string => {
  if (value >= 80) return '#ef4444'; // red-500
  if (value >= 60) return '#eab308'; // yellow-500
  return '#22c55e'; // green-500
};

// Get progress bar color class
const getProgressColor = (value: number): string => {
  if (value >= 80) return 'bg-red-500';
  if (value >= 60) return 'bg-yellow-500';
  return 'bg-green-500';
};

// Circular progress component
const CircleProgress: React.FC<{
  value: number;
  size?: number;
  strokeWidth?: number;
  icon: React.ReactNode;
}> = ({ value, size = 24, strokeWidth = 2, icon }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const color = getStrokeColor(value);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
};

// Progress bar sub-component (for detail Tooltip)
const StatusProgressBar: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </span>
      <span className="font-mono font-medium">{value.toFixed(1)}%</span>
    </div>
    <Progress className="h-1.5">
      <ProgressIndicator
        className={getProgressColor(value)}
        style={{ transform: `translateX(-${100 - Math.min(value, 100)}%)` }}
      />
    </Progress>
  </div>
);

/**
 * System Status Display Component
 * Uses two circular progress indicators for CPU and memory, shows details on hover
 */
export const SystemStatusDisplay: React.FC<SystemStatusDisplayProps> = ({
  status,
  emptyText = '暂无数据',
}) => {
  if (!status) {
    return <span className="text-xs text-slate-400">{emptyText}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="inline-flex items-center gap-1.5 cursor-default">
          <CircleProgress
            value={status.cpu}
            icon={<Cpu className="size-2.5 text-slate-500 dark:text-slate-400" />}
          />
          <CircleProgress
            value={status.memory}
            icon={<MemoryStick className="size-2.5 text-slate-500 dark:text-slate-400" />}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent className="w-48 p-3">
        <div className="space-y-3">
          <StatusProgressBar
            label="CPU"
            value={status.cpu}
            icon={<Cpu className="size-3" />}
          />
          <StatusProgressBar
            label="内存"
            value={status.memory}
            icon={<MemoryStick className="size-3" />}
          />
          <StatusProgressBar
            label="磁盘"
            value={status.disk}
            icon={<HardDrive className="size-3" />}
          />
          {status.uptime && status.uptime > 0 && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Clock className="size-3" />
                运行时间
              </span>
              <span className="font-medium">{formatUptime(status.uptime)}</span>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
