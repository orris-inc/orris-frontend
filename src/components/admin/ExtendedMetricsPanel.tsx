/**
 * Extended Metrics Panel Component
 * Displays extended system metrics in collapsible accordion sections
 * Used in NodeDetailDialog and ForwardAgentDetailDialog
 */

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/common/Accordion';
import { Progress, ProgressIndicator } from '@/components/common/Progress';
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  Network,
  Server,
  Gauge,
  Terminal,
  Layers,
  Shuffle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Extended metrics data interface
 * Compatible with NodeSystemStatus, AgentSystemStatus, and AgentRuntimeStatus
 */
export interface ExtendedMetricsData {
  // CPU details
  cpuCores?: number;
  cpuModelName?: string;
  cpuMhz?: number;

  // Swap memory
  swapTotal?: number;
  swapUsed?: number;
  swapPercent?: number;

  // Disk I/O
  diskReadBytes?: number;
  diskWriteBytes?: number;
  diskReadRate?: number;
  diskWriteRate?: number;
  diskIops?: number;

  // PSI (Pressure Stall Information)
  psiCpuSome?: number;
  psiCpuFull?: number;
  psiMemorySome?: number;
  psiMemoryFull?: number;
  psiIoSome?: number;
  psiIoFull?: number;

  // Network extended
  networkRxPackets?: number;
  networkTxPackets?: number;
  networkRxErrors?: number;
  networkTxErrors?: number;
  networkRxDropped?: number;
  networkTxDropped?: number;

  // Socket statistics
  socketsUsed?: number;
  socketsTcpInUse?: number;
  socketsUdpInUse?: number;
  socketsTcpOrphan?: number;
  socketsTcpTw?: number;

  // Process statistics
  processesTotal?: number;
  processesRunning?: number;
  processesBlocked?: number;

  // File descriptors
  fileNrAllocated?: number;
  fileNrMax?: number;

  // Context switches and interrupts
  contextSwitches?: number;
  interrupts?: number;

  // Kernel info
  kernelVersion?: string;
  hostname?: string;

  // Virtual memory
  vmPageIn?: number;
  vmPageOut?: number;
  vmSwapIn?: number;
  vmSwapOut?: number;
  vmOomKill?: number;

  // Entropy
  entropyAvailable?: number;
}

interface ExtendedMetricsPanelProps {
  data: ExtendedMetricsData;
  className?: string;
  defaultOpen?: string[];
}

// Format bytes to human readable
const formatBytes = (bytes?: number): string => {
  if (bytes === undefined || bytes === null) return '-';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Format rate (bytes per second)
const formatRate = (bytesPerSec?: number): string => {
  if (bytesPerSec === undefined || bytesPerSec === null) return '-';
  if (bytesPerSec === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
  return `${parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Format large numbers
const formatNumber = (num?: number): string => {
  if (num === undefined || num === null) return '-';
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString();
};

// Get progress color based on value
const getProgressColor = (value: number): string => {
  if (value >= 90) return 'bg-red-500';
  if (value >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
};

// Metric item component
interface MetricItemProps {
  label: string;
  value: React.ReactNode;
  suffix?: string;
  mono?: boolean;
  valueClassName?: string;
}

const MetricItem = ({ label, value, suffix, mono, valueClassName }: MetricItemProps) => {
  if (value === undefined || value === null || value === '-') return null;
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-xs font-medium', mono && 'font-mono', valueClassName)}>
        {value}
        {suffix && <span className="text-muted-foreground ml-0.5">{suffix}</span>}
      </span>
    </div>
  );
};

// Section header component
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  iconColor?: string;
}

const SectionHeader = ({ icon, title, iconColor = 'text-muted-foreground' }: SectionHeaderProps) => (
  <div className="flex items-center gap-2">
    <span className={cn('size-4', iconColor)}>{icon}</span>
    <span className="text-sm font-medium">{title}</span>
  </div>
);

// Check if section has data
const hasCpuDetails = (data: ExtendedMetricsData) =>
  data.cpuCores !== undefined || data.cpuModelName !== undefined || data.cpuMhz !== undefined;

const hasSwapData = (data: ExtendedMetricsData) =>
  data.swapTotal !== undefined || data.swapUsed !== undefined || data.swapPercent !== undefined;

const hasDiskIoData = (data: ExtendedMetricsData) =>
  data.diskReadBytes !== undefined ||
  data.diskWriteBytes !== undefined ||
  data.diskReadRate !== undefined ||
  data.diskIops !== undefined;

const hasPsiData = (data: ExtendedMetricsData) =>
  data.psiCpuSome !== undefined ||
  data.psiMemorySome !== undefined ||
  data.psiIoSome !== undefined;

const hasNetworkExtended = (data: ExtendedMetricsData) =>
  data.networkRxPackets !== undefined ||
  data.networkRxErrors !== undefined ||
  data.networkRxDropped !== undefined;

const hasSocketData = (data: ExtendedMetricsData) =>
  data.socketsUsed !== undefined || data.socketsTcpInUse !== undefined;

const hasProcessData = (data: ExtendedMetricsData) =>
  data.processesTotal !== undefined || data.processesRunning !== undefined;

const hasSystemInfo = (data: ExtendedMetricsData) =>
  data.kernelVersion !== undefined ||
  data.hostname !== undefined ||
  data.fileNrAllocated !== undefined ||
  data.entropyAvailable !== undefined;

const hasVmStats = (data: ExtendedMetricsData) =>
  data.vmPageIn !== undefined || data.vmSwapIn !== undefined || data.vmOomKill !== undefined;

const hasContextSwitches = (data: ExtendedMetricsData) =>
  data.contextSwitches !== undefined || data.interrupts !== undefined;

// Check if there's any extended metrics data
export const hasExtendedMetrics = (data?: ExtendedMetricsData): boolean => {
  if (!data) return false;
  return (
    hasCpuDetails(data) ||
    hasSwapData(data) ||
    hasDiskIoData(data) ||
    hasPsiData(data) ||
    hasNetworkExtended(data) ||
    hasSocketData(data) ||
    hasProcessData(data) ||
    hasSystemInfo(data) ||
    hasVmStats(data) ||
    hasContextSwitches(data)
  );
};

/**
 * Extended Metrics Panel
 * Displays extended system metrics in collapsible accordion sections
 */
export const ExtendedMetricsPanel = ({
  data,
  className,
  defaultOpen = [],
}: ExtendedMetricsPanelProps) => {
  if (!hasExtendedMetrics(data)) {
    return null;
  }

  return (
    <div className={cn('rounded-lg border border-border bg-card/50', className)}>
      <Accordion type="multiple" defaultValue={defaultOpen}>
        {/* CPU Details */}
        {hasCpuDetails(data) && (
          <AccordionItem value="cpu" className="border-b-0 border-border/50 last:border-0">
            <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-muted/50 rounded-t-lg">
              <SectionHeader
                icon={<Cpu className="size-4" />}
                title="CPU 详情"
                iconColor="text-blue-500"
              />
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 pt-0">
              <div className="space-y-0.5 bg-muted/30 rounded-md p-2">
                <MetricItem label="核心数" value={data.cpuCores} suffix="核" />
                {data.cpuModelName && (
                  <MetricItem label="型号" value={data.cpuModelName} mono />
                )}
                <MetricItem label="频率" value={data.cpuMhz?.toFixed(0)} suffix="MHz" />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Swap Memory */}
        {hasSwapData(data) && (
          <AccordionItem value="swap" className="border-b-0 border-border/50">
            <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-muted/50">
              <SectionHeader
                icon={<MemoryStick className="size-4" />}
                title="Swap 内存"
                iconColor="text-purple-500"
              />
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 pt-0">
              <div className="space-y-2 bg-muted/30 rounded-md p-2">
                {data.swapPercent !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">使用率</span>
                      <span className="font-medium">{data.swapPercent.toFixed(1)}%</span>
                    </div>
                    <Progress value={data.swapPercent} className="h-1.5">
                      <ProgressIndicator
                        className={getProgressColor(data.swapPercent)}
                        style={{ transform: `translateX(-${100 - data.swapPercent}%)` }}
                      />
                    </Progress>
                  </div>
                )}
                <MetricItem label="已用" value={formatBytes(data.swapUsed)} />
                <MetricItem label="总量" value={formatBytes(data.swapTotal)} />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Disk I/O */}
        {hasDiskIoData(data) && (
          <AccordionItem value="diskio" className="border-b-0 border-border/50">
            <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-muted/50">
              <SectionHeader
                icon={<HardDrive className="size-4" />}
                title="磁盘 I/O"
                iconColor="text-orange-500"
              />
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 pt-0">
              <div className="space-y-0.5 bg-muted/30 rounded-md p-2">
                <MetricItem label="读取总量" value={formatBytes(data.diskReadBytes)} />
                <MetricItem label="写入总量" value={formatBytes(data.diskWriteBytes)} />
                <MetricItem label="读取速率" value={formatRate(data.diskReadRate)} />
                <MetricItem label="写入速率" value={formatRate(data.diskWriteRate)} />
                <MetricItem label="IOPS" value={formatNumber(data.diskIops)} />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* PSI (Pressure Stall Information) */}
        {hasPsiData(data) && (
          <AccordionItem value="psi" className="border-b-0 border-border/50">
            <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-muted/50">
              <SectionHeader
                icon={<Gauge className="size-4" />}
                title="压力指标 (PSI)"
                iconColor="text-red-500"
              />
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 pt-0">
              <div className="grid grid-cols-3 gap-2">
                {/* CPU Pressure */}
                <div className="bg-muted/30 rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">CPU</p>
                  <p className="text-xs font-medium">
                    {data.psiCpuSome?.toFixed(1) ?? '-'}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    ({data.psiCpuFull?.toFixed(1) ?? '-'}% full)
                  </p>
                </div>
                {/* Memory Pressure */}
                <div className="bg-muted/30 rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">Memory</p>
                  <p className="text-xs font-medium">
                    {data.psiMemorySome?.toFixed(1) ?? '-'}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    ({data.psiMemoryFull?.toFixed(1) ?? '-'}% full)
                  </p>
                </div>
                {/* I/O Pressure */}
                <div className="bg-muted/30 rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">I/O</p>
                  <p className="text-xs font-medium">
                    {data.psiIoSome?.toFixed(1) ?? '-'}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    ({data.psiIoFull?.toFixed(1) ?? '-'}% full)
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Network Extended */}
        {hasNetworkExtended(data) && (
          <AccordionItem value="network" className="border-b-0 border-border/50">
            <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-muted/50">
              <SectionHeader
                icon={<Network className="size-4" />}
                title="网络统计"
                iconColor="text-cyan-500"
              />
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 pt-0">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/30 rounded-md p-2">
                  <p className="text-[10px] text-muted-foreground mb-1">接收 (RX)</p>
                  <MetricItem label="数据包" value={formatNumber(data.networkRxPackets)} />
                  <MetricItem label="错误" value={formatNumber(data.networkRxErrors)} />
                  <MetricItem label="丢弃" value={formatNumber(data.networkRxDropped)} />
                </div>
                <div className="bg-muted/30 rounded-md p-2">
                  <p className="text-[10px] text-muted-foreground mb-1">发送 (TX)</p>
                  <MetricItem label="数据包" value={formatNumber(data.networkTxPackets)} />
                  <MetricItem label="错误" value={formatNumber(data.networkTxErrors)} />
                  <MetricItem label="丢弃" value={formatNumber(data.networkTxDropped)} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Socket Statistics */}
        {hasSocketData(data) && (
          <AccordionItem value="sockets" className="border-b-0 border-border/50">
            <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-muted/50">
              <SectionHeader
                icon={<Layers className="size-4" />}
                title="Socket 统计"
                iconColor="text-indigo-500"
              />
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 pt-0">
              <div className="space-y-0.5 bg-muted/30 rounded-md p-2">
                <MetricItem label="总使用" value={formatNumber(data.socketsUsed)} />
                <MetricItem label="TCP 使用" value={formatNumber(data.socketsTcpInUse)} />
                <MetricItem label="UDP 使用" value={formatNumber(data.socketsUdpInUse)} />
                <MetricItem label="TCP 孤立" value={formatNumber(data.socketsTcpOrphan)} />
                <MetricItem label="TCP TIME_WAIT" value={formatNumber(data.socketsTcpTw)} />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Process Statistics */}
        {hasProcessData(data) && (
          <AccordionItem value="processes" className="border-b-0 border-border/50">
            <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-muted/50">
              <SectionHeader
                icon={<Activity className="size-4" />}
                title="进程统计"
                iconColor="text-green-500"
              />
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 pt-0">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/30 rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">总数</p>
                  <p className="text-sm font-medium">{formatNumber(data.processesTotal)}</p>
                </div>
                <div className="bg-muted/30 rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">运行中</p>
                  <p className="text-sm font-medium text-green-600">
                    {formatNumber(data.processesRunning)}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">阻塞</p>
                  <p className="text-sm font-medium text-orange-600">
                    {formatNumber(data.processesBlocked)}
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Context Switches & Interrupts */}
        {hasContextSwitches(data) && (
          <AccordionItem value="switches" className="border-b-0 border-border/50">
            <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-muted/50">
              <SectionHeader
                icon={<Shuffle className="size-4" />}
                title="上下文切换"
                iconColor="text-pink-500"
              />
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 pt-0">
              <div className="space-y-0.5 bg-muted/30 rounded-md p-2">
                <MetricItem label="上下文切换" value={formatNumber(data.contextSwitches)} />
                <MetricItem label="中断" value={formatNumber(data.interrupts)} />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* VM Statistics */}
        {hasVmStats(data) && (
          <AccordionItem value="vm" className="border-b-0 border-border/50">
            <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-muted/50">
              <SectionHeader
                icon={<Server className="size-4" />}
                title="虚拟内存"
                iconColor="text-amber-500"
              />
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 pt-0">
              <div className="space-y-0.5 bg-muted/30 rounded-md p-2">
                <MetricItem label="Page In" value={formatNumber(data.vmPageIn)} />
                <MetricItem label="Page Out" value={formatNumber(data.vmPageOut)} />
                <MetricItem label="Swap In" value={formatNumber(data.vmSwapIn)} />
                <MetricItem label="Swap Out" value={formatNumber(data.vmSwapOut)} />
                {data.vmOomKill !== undefined && data.vmOomKill > 0 && (
                  <MetricItem
                    label="OOM Kill"
                    value={formatNumber(data.vmOomKill)}
                    valueClassName="text-red-600"
                  />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* System Info */}
        {hasSystemInfo(data) && (
          <AccordionItem value="system" className="border-0">
            <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-muted/50 rounded-b-lg">
              <SectionHeader
                icon={<Terminal className="size-4" />}
                title="系统信息"
                iconColor="text-slate-500"
              />
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 pt-0">
              <div className="space-y-0.5 bg-muted/30 rounded-md p-2">
                {data.hostname && <MetricItem label="主机名" value={data.hostname} mono />}
                {data.kernelVersion && (
                  <MetricItem label="内核版本" value={data.kernelVersion} mono />
                )}
                {data.fileNrAllocated !== undefined && data.fileNrMax !== undefined && (
                  <MetricItem
                    label="文件描述符"
                    value={`${formatNumber(data.fileNrAllocated)} / ${formatNumber(data.fileNrMax)}`}
                  />
                )}
                <MetricItem label="熵池可用" value={formatNumber(data.entropyAvailable)} suffix="bits" />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};
