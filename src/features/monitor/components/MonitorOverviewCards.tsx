/**
 * Monitor Overview Cards - Compact Design
 * Display key metrics in a compact grid
 */

import { memo } from 'react';
import { Server, Cpu, Activity, Wifi, WifiOff, ArrowDown, ArrowUp } from 'lucide-react';
import { formatBitRate } from '@/shared/utils/format-utils';
import type { MonitorOverview } from '../hooks/useMonitorData';

interface OverviewCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const OverviewCard = memo(({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  iconColor,
}: OverviewCardProps) => (
  <div className="group relative overflow-hidden bg-card rounded-lg p-2.5 border border-border/80 hover:border-border transition-colors">
    <div className="flex items-center gap-2">
      <div className={`${iconBg} p-1.5 rounded-md shrink-0`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground tabular-nums truncate">
          {value}
        </div>
        <div className="text-[10px] text-muted-foreground truncate">
          {title}
          {subtitle && <span className="hidden lg:inline"> · {subtitle}</span>}
        </div>
      </div>
    </div>
  </div>
));
OverviewCard.displayName = 'OverviewCard';

interface MonitorOverviewCardsProps {
  overview: MonitorOverview;
  isConnected: boolean;
}

export const MonitorOverviewCards = memo(({ overview, isConnected }: MonitorOverviewCardsProps) => {
  const cards: OverviewCardProps[] = [
    {
      title: 'Node Agent',
      value: `${overview.onlineNodes}/${overview.totalNodes}`,
      subtitle: overview.totalNodes > 0
        ? `${Math.round((overview.onlineNodes / overview.totalNodes) * 100)}%`
        : '-',
      icon: <Server className="size-3.5" strokeWidth={1.5} />,
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
    },
    {
      title: '转发 Agent',
      value: `${overview.onlineAgents}/${overview.totalAgents}`,
      subtitle: overview.totalAgents > 0
        ? `${Math.round((overview.onlineAgents / overview.totalAgents) * 100)}%`
        : '-',
      icon: <Cpu className="size-3.5" strokeWidth={1.5} />,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-500',
    },
    {
      title: 'CPU',
      value: `${overview.avgCpu.toFixed(1)}%`,
      subtitle: overview.avgCpu >= 80 ? '高' : overview.avgCpu >= 60 ? '中' : '正常',
      icon: <Activity className="size-3.5" strokeWidth={1.5} />,
      iconBg: overview.avgCpu >= 80 ? 'bg-destructive/10' : overview.avgCpu >= 60 ? 'bg-warning/10' : 'bg-success/10',
      iconColor: overview.avgCpu >= 80 ? 'text-destructive' : overview.avgCpu >= 60 ? 'text-warning' : 'text-success',
    },
    {
      title: '内存',
      value: `${overview.avgMemory.toFixed(1)}%`,
      subtitle: overview.avgMemory >= 80 ? '高' : overview.avgMemory >= 60 ? '中' : '正常',
      icon: <Cpu className="size-3.5" strokeWidth={1.5} />,
      iconBg: overview.avgMemory >= 80 ? 'bg-destructive/10' : overview.avgMemory >= 60 ? 'bg-warning/10' : 'bg-success/10',
      iconColor: overview.avgMemory >= 80 ? 'text-destructive' : overview.avgMemory >= 60 ? 'text-warning' : 'text-success',
    },
    {
      title: '下载',
      value: formatBitRate(overview.totalNetworkRxRate),
      subtitle: '总下载',
      icon: <ArrowDown className="size-3.5" strokeWidth={1.5} />,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      title: '上传',
      value: formatBitRate(overview.totalNetworkTxRate),
      subtitle: '总上传',
      icon: <ArrowUp className="size-3.5" strokeWidth={1.5} />,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'SSE',
      value: isConnected ? '已连接' : '断开',
      subtitle: isConnected ? '实时' : '等待',
      icon: isConnected
        ? <Wifi className="size-3.5" strokeWidth={1.5} />
        : <WifiOff className="size-3.5" strokeWidth={1.5} />,
      iconBg: isConnected ? 'bg-success/10' : 'bg-muted',
      iconColor: isConnected ? 'text-success' : 'text-muted-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3">
      {cards.map((card, index) => (
        <OverviewCard key={index} {...card} />
      ))}
    </div>
  );
});
MonitorOverviewCards.displayName = 'MonitorOverviewCards';
