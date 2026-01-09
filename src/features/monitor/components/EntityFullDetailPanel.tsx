/**
 * Entity Full Detail Panel
 * Comprehensive panel displaying ALL system metrics from backend
 * No data is hidden - every field from NodeSystemStatus/AgentSystemStatus is shown
 */

import { memo, useState } from 'react';
import {
  Server,
  Cpu,
  HardDrive,
  ArrowDown,
  ArrowUp,
  Wifi,
  WifiOff,
  Network,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Layers,
  Gauge,
  MemoryStick,
  AlertTriangle,
  Box,
  Terminal,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ScrollArea } from '@/components/common/ScrollArea';
import { cn } from '@/lib/utils';
import { formatBitRate, formatBytes, formatRelativeTime } from '@/shared/utils/format-utils';
import { getResourceBgClass, getResourceTextClass } from '../utils';
import type { EntityStatus } from '../hooks/useMonitorData';
import type { NodeSystemStatus } from '@/api/node';
import type { AgentSystemStatus } from '@/api/forward';

interface EntityFullDetailPanelProps {
  entity: EntityStatus;
  className?: string;
  onClose?: () => void;
}

// Section header component
const SectionHeader = memo(({
  icon,
  title,
  isExpanded,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center gap-2 py-2 px-1 text-xs font-semibold text-foreground hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
  >
    {icon}
    <span className="flex-1 text-left">{title}</span>
    {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
  </button>
));
SectionHeader.displayName = 'SectionHeader';

// Metric row component
const MetricRow = memo(({
  label,
  value,
  subValue,
  colorClass,
}: {
  label: string;
  value: string | number | undefined;
  subValue?: string;
  colorClass?: string;
}) => (
  <div className="flex items-center justify-between py-1 px-1 text-[11px]">
    <span className="text-muted-foreground">{label}</span>
    <div className="text-right">
      <span className={cn('font-medium tabular-nums', colorClass || 'text-foreground')}>
        {value ?? '-'}
      </span>
      {subValue && (
        <span className="text-muted-foreground/70 ml-1">{subValue}</span>
      )}
    </div>
  </div>
));
MetricRow.displayName = 'MetricRow';

// Progress metric row
const ProgressMetricRow = memo(({
  label,
  value,
  used,
  total,
}: {
  label: string;
  value: number;
  used?: number;
  total?: number;
}) => (
  <div className="py-1 px-1">
    <div className="flex items-center justify-between text-[11px] mb-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium tabular-nums', getResourceTextClass(value))}>
        {value.toFixed(1)}%
      </span>
    </div>
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all', getResourceBgClass(value))}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
    {used !== undefined && total !== undefined && (
      <div className="text-[9px] text-muted-foreground/70 mt-0.5 text-right">
        {formatBytes(used)} / {formatBytes(total)}
      </div>
    )}
  </div>
));
ProgressMetricRow.displayName = 'ProgressMetricRow';

// Format rate value
const formatRate = (rate: number | undefined): string => {
  if (rate === undefined || rate === null) return '-';
  return formatBitRate(rate);
};

// Format number with unit
const formatNumber = (n: number | undefined): string => {
  if (n === undefined || n === null) return '-';
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
};

// Format uptime
const formatUptime = (seconds?: number): string => {
  if (!seconds) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

export const EntityFullDetailPanel = memo(({ entity, className, onClose }: EntityFullDetailPanelProps) => {
  const status = entity.status as (NodeSystemStatus | AgentSystemStatus) | null;
  const isOnline = entity.isOnline && status;

  // Section expansion state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    resources: true,
    network: true,
    system: true,
    io: false,
    psi: false,
    sockets: false,
    processes: false,
    vm: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!isOnline || !status) {
    return (
      <div className={cn('rounded-xl border bg-card p-6 text-center', className)}>
        <WifiOff className="size-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {entity.name || entity.id}
        </h3>
        <p className="text-xs text-muted-foreground">
          {entity.type === 'node' ? 'Node Agent' : '转发 Agent'} 离线
        </p>
        {entity.lastSeenAt && (
          <p className="text-[10px] text-muted-foreground/70 mt-2">
            最后在线: {formatRelativeTime(entity.lastSeenAt)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="p-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            entity.type === 'node' ? 'bg-info/10' : 'bg-primary/10'
          )}>
            {entity.type === 'node'
              ? <Server className="size-5 text-info" />
              : <Cpu className="size-5 text-primary" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {entity.name || entity.id}
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono truncate">{entity.id}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="default" className="bg-success text-success-foreground">
              <Wifi className="size-3 mr-1" />
              在线
            </Badge>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
                <ChevronUp className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-4 gap-2 mt-3 text-center">
          <div>
            <p className={cn('text-lg font-bold tabular-nums', getResourceTextClass(status.cpuPercent))}>
              {status.cpuPercent.toFixed(0)}%
            </p>
            <p className="text-[9px] text-muted-foreground">CPU</p>
          </div>
          <div>
            <p className={cn('text-lg font-bold tabular-nums', getResourceTextClass(status.memoryPercent))}>
              {status.memoryPercent.toFixed(0)}%
            </p>
            <p className="text-[9px] text-muted-foreground">内存</p>
          </div>
          <div>
            <p className={cn('text-lg font-bold tabular-nums', getResourceTextClass(status.diskPercent))}>
              {status.diskPercent.toFixed(0)}%
            </p>
            <p className="text-[9px] text-muted-foreground">磁盘</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums text-primary">
              {formatUptime(status.uptimeSeconds).split(' ')[0]}
            </p>
            <p className="text-[9px] text-muted-foreground">运行</p>
          </div>
        </div>
      </div>

      <ScrollArea className="max-h-[60vh]">
        <div className="p-3 space-y-1">
          {/* Resources Section */}
          <SectionHeader
            icon={<Gauge className="size-3.5 text-primary" />}
            title="资源使用"
            isExpanded={expandedSections.resources}
            onToggle={() => toggleSection('resources')}
          />
          {expandedSections.resources && (
            <div className="pl-5 space-y-1 pb-2">
              <ProgressMetricRow
                label="CPU"
                value={status.cpuPercent}
              />
              <MetricRow label="CPU 核心" value={status.cpuCores} />
              <MetricRow label="CPU 型号" value={status.cpuModelName} />
              <MetricRow label="CPU 频率" value={status.cpuMhz ? `${status.cpuMhz.toFixed(0)} MHz` : undefined} />

              <div className="h-px bg-border/50 my-2" />

              <ProgressMetricRow
                label="内存"
                value={status.memoryPercent}
                used={status.memoryUsed}
                total={status.memoryTotal}
              />
              <MetricRow label="可用内存" value={formatBytes(status.memoryAvail)} />

              <div className="h-px bg-border/50 my-2" />

              <ProgressMetricRow
                label="磁盘"
                value={status.diskPercent}
                used={status.diskUsed}
                total={status.diskTotal}
              />

              {/* Swap */}
              {status.swapTotal !== undefined && status.swapTotal > 0 && (
                <>
                  <div className="h-px bg-border/50 my-2" />
                  <ProgressMetricRow
                    label="Swap"
                    value={status.swapPercent ?? 0}
                    used={status.swapUsed}
                    total={status.swapTotal}
                  />
                </>
              )}

              <div className="h-px bg-border/50 my-2" />

              <MetricRow label="运行时间" value={formatUptime(status.uptimeSeconds)} />
              <MetricRow label="1分钟负载" value={status.loadAvg1?.toFixed(2)} />
              <MetricRow label="5分钟负载" value={status.loadAvg5?.toFixed(2)} />
              <MetricRow label="15分钟负载" value={status.loadAvg15?.toFixed(2)} />
            </div>
          )}

          {/* Network Section */}
          <SectionHeader
            icon={<Network className="size-3.5 text-info" />}
            title="网络流量"
            isExpanded={expandedSections.network}
            onToggle={() => toggleSection('network')}
          />
          {expandedSections.network && (
            <div className="pl-5 space-y-1 pb-2">
              <div className="flex items-center gap-4 p-2 rounded-lg bg-muted/30">
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <ArrowDown className="size-3 text-success" />
                    <span className="text-[10px] text-muted-foreground">下载速率</span>
                  </div>
                  <p className="text-sm font-bold text-success tabular-nums">
                    {formatRate(status.networkRxRate)}
                  </p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <ArrowUp className="size-3 text-primary" />
                    <span className="text-[10px] text-muted-foreground">上传速率</span>
                  </div>
                  <p className="text-sm font-bold text-primary tabular-nums">
                    {formatRate(status.networkTxRate)}
                  </p>
                </div>
              </div>

              <MetricRow label="总下载流量" value={formatBytes(status.networkRxBytes)} />
              <MetricRow label="总上传流量" value={formatBytes(status.networkTxBytes)} />

              <div className="h-px bg-border/50 my-2" />

              <MetricRow label="接收数据包" value={formatNumber(status.networkRxPackets)} />
              <MetricRow label="发送数据包" value={formatNumber(status.networkTxPackets)} />
              <MetricRow
                label="接收错误"
                value={status.networkRxErrors}
                colorClass={status.networkRxErrors && status.networkRxErrors > 0 ? 'text-destructive' : undefined}
              />
              <MetricRow
                label="发送错误"
                value={status.networkTxErrors}
                colorClass={status.networkTxErrors && status.networkTxErrors > 0 ? 'text-destructive' : undefined}
              />
              <MetricRow label="接收丢包" value={status.networkRxDropped} />
              <MetricRow label="发送丢包" value={status.networkTxDropped} />

              <div className="h-px bg-border/50 my-2" />

              <MetricRow label="TCP 连接" value={status.tcpConnections} />
              <MetricRow label="UDP 连接" value={status.udpConnections} />
            </div>
          )}

          {/* System Info Section */}
          <SectionHeader
            icon={<Terminal className="size-3.5 text-violet-500" />}
            title="系统信息"
            isExpanded={expandedSections.system}
            onToggle={() => toggleSection('system')}
          />
          {expandedSections.system && (
            <div className="pl-5 space-y-1 pb-2">
              <MetricRow label="Agent 版本" value={status.agentVersion} />
              <MetricRow label="平台" value={status.platform} />
              <MetricRow label="架构" value={status.arch} />
              <MetricRow label="主机名" value={status.hostname} />
              <MetricRow label="内核版本" value={status.kernelVersion} />
              <MetricRow label="公网 IPv4" value={(status as NodeSystemStatus).publicIpv4} />
              <MetricRow label="公网 IPv6" value={(status as NodeSystemStatus).publicIpv6} />
            </div>
          )}

          {/* Disk I/O Section */}
          <SectionHeader
            icon={<HardDrive className="size-3.5 text-orange-500" />}
            title="磁盘 I/O"
            isExpanded={expandedSections.io}
            onToggle={() => toggleSection('io')}
          />
          {expandedSections.io && (
            <div className="pl-5 space-y-1 pb-2">
              <MetricRow label="读取速率" value={formatRate(status.diskReadRate)} />
              <MetricRow label="写入速率" value={formatRate(status.diskWriteRate)} />
              <MetricRow label="总读取" value={formatBytes(status.diskReadBytes ?? 0)} />
              <MetricRow label="总写入" value={formatBytes(status.diskWriteBytes ?? 0)} />
              <MetricRow label="IOPS" value={status.diskIops?.toFixed(0)} />
            </div>
          )}

          {/* PSI Section (Linux only) */}
          {(status.psiCpuSome !== undefined || status.psiMemorySome !== undefined) && (
            <>
              <SectionHeader
                icon={<AlertTriangle className="size-3.5 text-warning" />}
                title="压力指标 (PSI)"
                isExpanded={expandedSections.psi}
                onToggle={() => toggleSection('psi')}
              />
              {expandedSections.psi && (
                <div className="pl-5 space-y-1 pb-2">
                  <div className="text-[10px] text-muted-foreground mb-1">
                    CPU 压力
                  </div>
                  <MetricRow
                    label="Some"
                    value={status.psiCpuSome !== undefined ? `${status.psiCpuSome.toFixed(2)}%` : undefined}
                    colorClass={status.psiCpuSome && status.psiCpuSome > 10 ? 'text-warning' : undefined}
                  />
                  <MetricRow
                    label="Full"
                    value={status.psiCpuFull !== undefined ? `${status.psiCpuFull.toFixed(2)}%` : undefined}
                    colorClass={status.psiCpuFull && status.psiCpuFull > 10 ? 'text-destructive' : undefined}
                  />

                  <div className="h-px bg-border/50 my-2" />
                  <div className="text-[10px] text-muted-foreground mb-1">
                    内存压力
                  </div>
                  <MetricRow
                    label="Some"
                    value={status.psiMemorySome !== undefined ? `${status.psiMemorySome.toFixed(2)}%` : undefined}
                    colorClass={status.psiMemorySome && status.psiMemorySome > 10 ? 'text-warning' : undefined}
                  />
                  <MetricRow
                    label="Full"
                    value={status.psiMemoryFull !== undefined ? `${status.psiMemoryFull.toFixed(2)}%` : undefined}
                    colorClass={status.psiMemoryFull && status.psiMemoryFull > 10 ? 'text-destructive' : undefined}
                  />

                  <div className="h-px bg-border/50 my-2" />
                  <div className="text-[10px] text-muted-foreground mb-1">
                    I/O 压力
                  </div>
                  <MetricRow
                    label="Some"
                    value={status.psiIoSome !== undefined ? `${status.psiIoSome.toFixed(2)}%` : undefined}
                    colorClass={status.psiIoSome && status.psiIoSome > 10 ? 'text-warning' : undefined}
                  />
                  <MetricRow
                    label="Full"
                    value={status.psiIoFull !== undefined ? `${status.psiIoFull.toFixed(2)}%` : undefined}
                    colorClass={status.psiIoFull && status.psiIoFull > 10 ? 'text-destructive' : undefined}
                  />
                </div>
              )}
            </>
          )}

          {/* Sockets Section */}
          <SectionHeader
            icon={<Layers className="size-3.5 text-cyan-500" />}
            title="Socket 统计"
            isExpanded={expandedSections.sockets}
            onToggle={() => toggleSection('sockets')}
          />
          {expandedSections.sockets && (
            <div className="pl-5 space-y-1 pb-2">
              <MetricRow label="总 Sockets" value={status.socketsUsed} />
              <MetricRow label="TCP 使用中" value={status.socketsTcpInUse} />
              <MetricRow label="UDP 使用中" value={status.socketsUdpInUse} />
              <MetricRow label="TCP 孤立" value={status.socketsTcpOrphan} />
              <MetricRow label="TCP TIME_WAIT" value={status.socketsTcpTw} />
            </div>
          )}

          {/* Processes Section */}
          <SectionHeader
            icon={<Box className="size-3.5 text-emerald-500" />}
            title="进程统计"
            isExpanded={expandedSections.processes}
            onToggle={() => toggleSection('processes')}
          />
          {expandedSections.processes && (
            <div className="pl-5 space-y-1 pb-2">
              <MetricRow label="总进程数" value={status.processesTotal} />
              <MetricRow label="运行中" value={status.processesRunning} />
              <MetricRow label="阻塞" value={status.processesBlocked} />

              <div className="h-px bg-border/50 my-2" />

              <MetricRow label="文件描述符" value={status.fileNrAllocated} subValue={`/ ${status.fileNrMax}`} />
              <MetricRow label="上下文切换" value={formatNumber(status.contextSwitches)} />
              <MetricRow label="中断" value={formatNumber(status.interrupts)} />
              <MetricRow label="可用熵" value={status.entropyAvailable} />
            </div>
          )}

          {/* VM Stats Section */}
          <SectionHeader
            icon={<MemoryStick className="size-3.5 text-pink-500" />}
            title="虚拟内存"
            isExpanded={expandedSections.vm}
            onToggle={() => toggleSection('vm')}
          />
          {expandedSections.vm && (
            <div className="pl-5 space-y-1 pb-2">
              <MetricRow label="Page In" value={formatNumber(status.vmPageIn)} />
              <MetricRow label="Page Out" value={formatNumber(status.vmPageOut)} />
              <MetricRow label="Swap In" value={formatNumber(status.vmSwapIn)} />
              <MetricRow label="Swap Out" value={formatNumber(status.vmSwapOut)} />
              <MetricRow
                label="OOM Kills"
                value={status.vmOomKill}
                colorClass={status.vmOomKill && status.vmOomKill > 0 ? 'text-destructive' : undefined}
              />
            </div>
          )}

          {/* Last updated */}
          <div className="pt-2 border-t border-border/50 text-center">
            <p className="text-[9px] text-muted-foreground">
              运行时间: {formatUptime(status.uptimeSeconds)}
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
});
EntityFullDetailPanel.displayName = 'EntityFullDetailPanel';
