/**
 * Mobile Entity Detail Sheet - iOS 26 Liquid Glass Design
 *
 * A full-featured bottom sheet for displaying node/agent details on mobile.
 * Features:
 * - iOS 26 Liquid Glass material design
 * - Circular progress rings for resource metrics
 * - Collapsible sections for detailed info
 * - Real-time data updates
 * - Optimized touch targets (44px minimum)
 * - Safe area support
 */

import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Server,
  Cpu,
  HardDrive,
  ArrowDown,
  ArrowUp,
  Wifi,
  WifiOff,
  Network,
  ChevronRight,
  Gauge,
  MemoryStick,
  AlertTriangle,
  Terminal,
  Clock,
  Globe,
  Layers,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  type DetailSheetProps,
} from '@/components/common/sheet';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/lib/utils';
import { formatBitRate, formatBytes, formatRelativeTime } from '@/shared/utils/format-utils';
import { getResourceBgClass, getResourceTextClass } from '../utils';
import type { EntityStatus } from '../hooks/useMonitorData';
import type { NodeSystemStatus } from '@/api/node';
import type { AgentSystemStatus } from '@/api/forward';

type MobileEntityDetailSheetProps = DetailSheetProps<EntityStatus>;

// Circular progress ring component
const ProgressRing = memo(({
  value,
  size = 72,
  strokeWidth = 6,
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  sublabel?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  // Get color based on value
  const getStrokeColor = (v: number) => {
    if (v >= 80) return 'stroke-destructive';
    if (v >= 60) return 'stroke-warning';
    return 'stroke-success';
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <circle
            className="stroke-muted"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress circle */}
          <circle
            className={cn('transition-all duration-500', getStrokeColor(value))}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-lg font-bold tabular-nums', getResourceTextClass(value))}>
            {value.toFixed(0)}%
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-foreground">{label}</span>
      {sublabel && (
        <span className="text-[10px] text-muted-foreground">{sublabel}</span>
      )}
    </div>
  );
});
ProgressRing.displayName = 'ProgressRing';

// Metric item component
const MetricItem = memo(({
  icon,
  label,
  value,
  valueClass,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined;
  valueClass?: string;
  subValue?: string;
}) => (
  <div className="flex items-center gap-3 py-2.5 min-h-[44px]">
    <div className="p-2 rounded-xl bg-muted/50 shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-semibold tabular-nums truncate', valueClass || 'text-foreground')}>
        {value ?? '-'}
      </p>
    </div>
    {subValue && (
      <span className="text-xs text-muted-foreground shrink-0">{subValue}</span>
    )}
  </div>
));
MetricItem.displayName = 'MetricItem';

// Collapsible section component
const CollapsibleSection = memo(({
  icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 min-h-[52px] cursor-pointer touch-manipulation"
      >
        <div className="p-1.5 rounded-lg bg-muted/50">
          {icon}
        </div>
        <span className="flex-1 text-left text-sm font-semibold text-foreground">{title}</span>
        <ChevronRight
          className={cn(
            'size-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-90'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 pb-4 pt-1 border-t border-border/30">
          {children}
        </div>
      </div>
    </div>
  );
});
CollapsibleSection.displayName = 'CollapsibleSection';

// Network speed card
const NetworkSpeedCard = memo(({
  rxRate,
  txRate,
  rxBytes,
  txBytes,
  labels,
}: {
  rxRate: number;
  txRate: number;
  rxBytes: number;
  txBytes: number;
  labels: {
    title: string;
    download: string;
    upload: string;
    total: string;
  };
}) => (
  <div className="glass rounded-2xl p-4">
    <div className="flex items-center gap-2 mb-3">
      <Network className="size-4 text-muted-foreground" />
      <span className="text-sm font-semibold text-foreground">{labels.title}</span>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {/* Download */}
      <div className="p-3 rounded-xl bg-success/10 border border-success/20">
        <div className="flex items-center gap-1.5 mb-1">
          <ArrowDown className="size-4 text-success" />
          <span className="text-xs text-muted-foreground">{labels.download}</span>
        </div>
        <p className="text-lg font-bold text-success tabular-nums">
          {formatBitRate(rxRate)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {labels.total} {formatBytes(rxBytes)}
        </p>
      </div>
      {/* Upload */}
      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
        <div className="flex items-center gap-1.5 mb-1">
          <ArrowUp className="size-4 text-primary" />
          <span className="text-xs text-muted-foreground">{labels.upload}</span>
        </div>
        <p className="text-lg font-bold text-primary tabular-nums">
          {formatBitRate(txRate)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {labels.total} {formatBytes(txBytes)}
        </p>
      </div>
    </div>
  </div>
));
NetworkSpeedCard.displayName = 'NetworkSpeedCard';

// Format uptime - returns object for i18n
const formatUptime = (seconds?: number, labels?: { days: string; hours: string; minutes: string }): string => {
  if (!seconds) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const d = labels?.days ?? 'd';
  const h = labels?.hours ?? 'h';
  const m = labels?.minutes ?? 'm';
  if (days > 0) return `${days}${d} ${hours}${h} ${mins}${m}`;
  if (hours > 0) return `${hours}${h} ${mins}${m}`;
  return `${mins}${m}`;
};

// Format number with unit
const formatNumber = (n: number | undefined): string => {
  if (n === undefined || n === null) return '-';
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
};

// Progress bar component
const ProgressBar = memo(({
  value,
  label,
  used,
  total,
  usedLabel,
  totalLabel,
}: {
  value: number;
  label: string;
  used?: number;
  total?: number;
  usedLabel?: string;
  totalLabel?: string;
}) => (
  <div className="py-2">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-xs font-semibold tabular-nums', getResourceTextClass(value))}>
        {value.toFixed(1)}%
      </span>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-300', getResourceBgClass(value))}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
    {used !== undefined && total !== undefined && (
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
        <span>{usedLabel ?? 'Used'} {formatBytes(used)}</span>
        <span>{totalLabel ?? 'Total'} {formatBytes(total)}</span>
      </div>
    )}
  </div>
));
ProgressBar.displayName = 'ProgressBar';

export const MobileEntityDetailSheet = memo(({
  entity,
  open,
  onOpenChange,
}: MobileEntityDetailSheetProps) => {
  const { t } = useTranslation();

  if (!entity) return null;

  const status = entity.status as (NodeSystemStatus | AgentSystemStatus) | null;
  const isOnline = entity.isOnline && status;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[92vh]" showClose={false}>
        <SheetHeader className="px-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2.5 rounded-xl',
                entity.type === 'node'
                  ? isOnline ? 'bg-info/15' : 'bg-muted'
                  : isOnline ? 'bg-primary/15' : 'bg-muted'
              )}>
                {entity.type === 'node'
                  ? <Server className={cn('size-5', isOnline ? 'text-info' : 'text-muted-foreground')} />
                  : <Cpu className={cn('size-5', isOnline ? 'text-primary' : 'text-muted-foreground')} />
                }
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-base truncate">
                  {entity.name || entity.id.slice(0, 12)}
                </SheetTitle>
                <p className="text-xs text-muted-foreground font-mono truncate">{entity.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isOnline ? 'default' : 'secondary'}
                className={cn(isOnline && 'bg-success text-success-foreground')}
              >
                {isOnline ? (
                  <>
                    <Wifi className="size-3 mr-1" />
                    {t('admin.monitor.detail.online')}
                  </>
                ) : (
                  <>
                    <WifiOff className="size-3 mr-1" />
                    {t('admin.monitor.detail.offline')}
                  </>
                )}
              </Badge>
              {/* iOS-style close button */}
              <button
                onClick={() => onOpenChange(false)}
                className={cn(
                  'size-8 flex items-center justify-center rounded-full',
                  'bg-muted/80 active:bg-muted',
                  'text-muted-foreground active:text-foreground',
                  'transition-colors duration-150',
                  'touch-manipulation'
                )}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="px-4 space-y-4">
          {isOnline && status ? (
            <>
              {/* Resource Rings */}
              <div className="glass rounded-2xl p-4">
                <div className="flex justify-around">
                  <ProgressRing
                    value={status.cpuPercent}
                    label={t('admin.monitor.cpu')}
                    sublabel={`${status.cpuCores || '-'} ${t('admin.monitor.detail.cores')}`}
                  />
                  <ProgressRing
                    value={status.memoryPercent}
                    label={t('admin.monitor.memory')}
                    sublabel={formatBytes(status.memoryUsed)}
                  />
                  <ProgressRing
                    value={status.diskPercent}
                    label={t('admin.monitor.disk')}
                    sublabel={formatBytes(status.diskUsed)}
                  />
                </div>
              </div>

              {/* Network Speed */}
              <NetworkSpeedCard
                rxRate={status.networkRxRate ?? 0}
                txRate={status.networkTxRate ?? 0}
                rxBytes={status.networkRxBytes ?? 0}
                txBytes={status.networkTxBytes ?? 0}
                labels={{
                  title: t('admin.monitor.detail.networkTraffic'),
                  download: t('admin.monitor.download'),
                  upload: t('admin.monitor.upload'),
                  total: t('admin.monitor.total'),
                }}
              />

              {/* Quick Stats */}
              <div className="glass rounded-2xl p-4 space-y-1">
                <MetricItem
                  icon={<Clock className="size-4 text-muted-foreground" />}
                  label={t('admin.monitor.uptime')}
                  value={formatUptime(status.uptimeSeconds)}
                />
                <div className="h-px bg-border/30" />
                <MetricItem
                  icon={<Gauge className="size-4 text-muted-foreground" />}
                  label={t('admin.monitor.detail.systemLoad')}
                  value={status.loadAvg1?.toFixed(2)}
                  subValue={`5m: ${status.loadAvg5?.toFixed(2) || '-'} / 15m: ${status.loadAvg15?.toFixed(2) || '-'}`}
                />
                <div className="h-px bg-border/30" />
                <MetricItem
                  icon={<Network className="size-4 text-muted-foreground" />}
                  label={t('admin.monitor.connections')}
                  value={`${(status.tcpConnections ?? 0) + (status.udpConnections ?? 0)}`}
                  subValue={`TCP ${status.tcpConnections ?? 0} / UDP ${status.udpConnections ?? 0}`}
                />
              </div>

              {/* System Info Section */}
              <CollapsibleSection
                icon={<Terminal className="size-4 text-violet-500" />}
                title={t('admin.monitor.detail.systemInfo')}
                defaultOpen
              >
                <div className="space-y-2 text-sm">
                  {(status as NodeSystemStatus).publicIpv4 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">公网 IPv4</span>
                      <span className="font-mono text-foreground">{(status as NodeSystemStatus).publicIpv4}</span>
                    </div>
                  )}
                  {(status as NodeSystemStatus).publicIpv6 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">公网 IPv6</span>
                      <span className="font-mono text-foreground text-xs">{(status as NodeSystemStatus).publicIpv6}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">平台</span>
                    <span className="text-foreground">{status.platform} / {status.arch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">主机名</span>
                    <span className="text-foreground">{status.hostname || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">内核版本</span>
                    <span className="text-foreground text-xs">{status.kernelVersion || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agent 版本</span>
                    <span className="text-foreground">{status.agentVersion || '-'}</span>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Resource Details Section */}
              <CollapsibleSection
                icon={<Gauge className="size-4 text-primary" />}
                title={t('admin.monitor.detail.resourceDetails')}
              >
                <div className="space-y-3">
                  <ProgressBar
                    value={status.cpuPercent}
                    label={t('admin.monitor.detail.cpuUsage')}
                  />
                  {status.cpuModelName && (
                    <p className="text-xs text-muted-foreground">
                      {status.cpuModelName} @ {status.cpuMhz?.toFixed(0) || '-'} MHz
                    </p>
                  )}
                  <ProgressBar
                    value={status.memoryPercent}
                    label={t('admin.monitor.detail.memoryUsage')}
                    used={status.memoryUsed}
                    total={status.memoryTotal}
                  />
                  <ProgressBar
                    value={status.diskPercent}
                    label={t('admin.monitor.detail.diskUsage')}
                    used={status.diskUsed}
                    total={status.diskTotal}
                  />
                  {status.swapTotal !== undefined && status.swapTotal > 0 && (
                    <ProgressBar
                      value={status.swapPercent ?? 0}
                      label={t('admin.monitor.detail.swapUsage')}
                      used={status.swapUsed}
                      total={status.swapTotal}
                    />
                  )}
                </div>
              </CollapsibleSection>

              {/* Network Details Section */}
              <CollapsibleSection
                icon={<Globe className="size-4 text-info" />}
                title={t('admin.monitor.detail.networkDetails')}
              >
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">接收数据包</span>
                    <span className="tabular-nums text-foreground">{formatNumber(status.networkRxPackets)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">发送数据包</span>
                    <span className="tabular-nums text-foreground">{formatNumber(status.networkTxPackets)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">接收错误</span>
                    <span className={cn(
                      'tabular-nums',
                      status.networkRxErrors && status.networkRxErrors > 0 ? 'text-destructive' : 'text-foreground'
                    )}>{status.networkRxErrors ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">发送错误</span>
                    <span className={cn(
                      'tabular-nums',
                      status.networkTxErrors && status.networkTxErrors > 0 ? 'text-destructive' : 'text-foreground'
                    )}>{status.networkTxErrors ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">丢包 (接收/发送)</span>
                    <span className="tabular-nums text-foreground">
                      {status.networkRxDropped ?? 0} / {status.networkTxDropped ?? 0}
                    </span>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Disk I/O Section */}
              <CollapsibleSection
                icon={<HardDrive className="size-4 text-warning" />}
                title={t('admin.monitor.metrics.diskIO')}
              >
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">读取速率</span>
                    <span className="tabular-nums text-foreground">{formatBitRate(status.diskReadRate ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">写入速率</span>
                    <span className="tabular-nums text-foreground">{formatBitRate(status.diskWriteRate ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总读取</span>
                    <span className="tabular-nums text-foreground">{formatBytes(status.diskReadBytes ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总写入</span>
                    <span className="tabular-nums text-foreground">{formatBytes(status.diskWriteBytes ?? 0)}</span>
                  </div>
                  {status.diskIops !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IOPS</span>
                      <span className="tabular-nums text-foreground">{status.diskIops.toFixed(0)}</span>
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              {/* Socket & Process Section */}
              <CollapsibleSection
                icon={<Layers className="size-4 text-info" />}
                title={t('admin.monitor.detail.socketAndProcess')}
              >
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总 Sockets</span>
                    <span className="tabular-nums text-foreground">{status.socketsUsed ?? '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TCP 使用中</span>
                    <span className="tabular-nums text-foreground">{status.socketsTcpInUse ?? '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TCP TIME_WAIT</span>
                    <span className="tabular-nums text-foreground">{status.socketsTcpTw ?? '-'}</span>
                  </div>
                  <div className="h-px bg-border/30 my-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总进程数</span>
                    <span className="tabular-nums text-foreground">{status.processesTotal ?? '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">运行中</span>
                    <span className="tabular-nums text-foreground">{status.processesRunning ?? '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">文件描述符</span>
                    <span className="tabular-nums text-foreground">
                      {status.fileNrAllocated ?? '-'} / {status.fileNrMax ?? '-'}
                    </span>
                  </div>
                </div>
              </CollapsibleSection>

              {/* PSI Section (Linux only) */}
              {(status.psiCpuSome !== undefined || status.psiMemorySome !== undefined) && (
                <CollapsibleSection
                  icon={<AlertTriangle className="size-4 text-warning" />}
                  title={t('admin.monitor.metrics.pressureIndicators')}
                >
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">CPU 压力</p>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Some: </span>
                          <span className={cn(
                            'tabular-nums',
                            status.psiCpuSome && status.psiCpuSome > 10 ? 'text-warning' : 'text-foreground'
                          )}>{status.psiCpuSome?.toFixed(2) ?? '-'}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Full: </span>
                          <span className={cn(
                            'tabular-nums',
                            status.psiCpuFull && status.psiCpuFull > 10 ? 'text-destructive' : 'text-foreground'
                          )}>{status.psiCpuFull?.toFixed(2) ?? '-'}%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">内存压力</p>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Some: </span>
                          <span className={cn(
                            'tabular-nums',
                            status.psiMemorySome && status.psiMemorySome > 10 ? 'text-warning' : 'text-foreground'
                          )}>{status.psiMemorySome?.toFixed(2) ?? '-'}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Full: </span>
                          <span className={cn(
                            'tabular-nums',
                            status.psiMemoryFull && status.psiMemoryFull > 10 ? 'text-destructive' : 'text-foreground'
                          )}>{status.psiMemoryFull?.toFixed(2) ?? '-'}%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">I/O 压力</p>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Some: </span>
                          <span className={cn(
                            'tabular-nums',
                            status.psiIoSome && status.psiIoSome > 10 ? 'text-warning' : 'text-foreground'
                          )}>{status.psiIoSome?.toFixed(2) ?? '-'}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Full: </span>
                          <span className={cn(
                            'tabular-nums',
                            status.psiIoFull && status.psiIoFull > 10 ? 'text-destructive' : 'text-foreground'
                          )}>{status.psiIoFull?.toFixed(2) ?? '-'}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>
              )}

              {/* VM Stats Section */}
              <CollapsibleSection
                icon={<MemoryStick className="size-4 text-primary" />}
                title={t('admin.monitor.metrics.virtualMemory')}
              >
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Page In</span>
                    <span className="tabular-nums text-foreground">{formatNumber(status.vmPageIn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Page Out</span>
                    <span className="tabular-nums text-foreground">{formatNumber(status.vmPageOut)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Swap In</span>
                    <span className="tabular-nums text-foreground">{formatNumber(status.vmSwapIn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Swap Out</span>
                    <span className="tabular-nums text-foreground">{formatNumber(status.vmSwapOut)}</span>
                  </div>
                  {status.vmOomKill !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">OOM Kills</span>
                      <span className={cn(
                        'tabular-nums',
                        status.vmOomKill > 0 ? 'text-destructive' : 'text-foreground'
                      )}>{status.vmOomKill}</span>
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            </>
          ) : (
            /* Offline state */
            <div className="glass rounded-2xl p-8 text-center">
              <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <WifiOff className="size-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                {entity.type === 'node' ? t('admin.monitor.detail.nodeAgentOffline') : t('admin.monitor.detail.forwardAgentOffline')}
              </h3>
              <p className="text-sm text-muted-foreground">
                无法获取实时数据
              </p>
              {entity.lastSeenAt && (
                <p className="text-xs text-muted-foreground/70 mt-4">
                  最后在线: {formatRelativeTime(entity.lastSeenAt)}
                </p>
              )}
            </div>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
});
MobileEntityDetailSheet.displayName = 'MobileEntityDetailSheet';
