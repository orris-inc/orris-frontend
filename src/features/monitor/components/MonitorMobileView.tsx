/**
 * Monitor Mobile View - High Information Density Design
 *
 * Features:
 * - Condensed metrics header with real-time updates
 * - Swipeable entity cards with inline resource bars
 * - Collapsible chart section
 * - Pull-to-refresh support (via parent)
 * - Optimized touch targets (min 44px)
 */

import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Server,
  Cpu,
  ArrowDown,
  ArrowUp,
  Activity,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Filter,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ScrollArea } from '@/components/common/ScrollArea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { cn } from '@/lib/utils';
import { formatBitRate, formatBytes, formatRelativeTime } from '@/shared/utils/format-utils';
import { getResourceBgClass, getResourceTextClass, getResourceMutedTextClass } from '../utils';
import { MobileEntityDetailSheet } from './MobileEntityDetailSheet';
import type { EntityStatus, MonitorEvent, MonitorOverview } from '../hooks/useMonitorData';
import type { NodeSystemStatus } from '@/api/node';
import type { AgentSystemStatus } from '@/api/forward';

type EntityFilter = 'all' | 'node' | 'agent';
type StatusFilter = 'all' | 'online' | 'offline';

interface MonitorMobileViewProps {
  overview: MonitorOverview;
  entities: EntityStatus[];
  eventLog: MonitorEvent[];
  isConnected: boolean;
}

// Compact progress bar for mobile
const MicroProgress = memo(({ value, size = 'sm' }: { value: number; size?: 'sm' | 'xs' }) => (
  <div className={cn('flex-1 rounded-full overflow-hidden bg-muted/60', size === 'sm' ? 'h-1.5' : 'h-1')}>
    <div
      className={cn('h-full rounded-full transition-all', getResourceBgClass(value))}
      style={{ width: `${Math.min(value, 100)}%` }}
    />
  </div>
));
MicroProgress.displayName = 'MicroProgress';

// Condensed status header for mobile
const MobileStatusHeader = memo(({ overview, isConnected }: { overview: MonitorOverview; isConnected: boolean }) => {
  const { t } = useTranslation();
  return (
  <div className="glass rounded-2xl p-3 space-y-2">
    {/* Top row: connection status + counts */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={cn(
          'size-2 rounded-full',
          isConnected ? 'bg-success animate-pulse motion-reduce:animate-none' : 'bg-muted-foreground'
        )} />
        <span className="text-xs font-medium text-foreground">
          {isConnected ? t('admin.monitor.systemMonitor') : t('admin.forwardAgents.detail.connecting')}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Server className="size-3 text-info" />
          <span className="font-semibold text-foreground">{overview.onlineNodes}</span>
          <span className="text-muted-foreground/60">/{overview.totalNodes}</span>
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Cpu className="size-3 text-violet-500" />
          <span className="font-semibold text-foreground">{overview.onlineAgents}</span>
          <span className="text-muted-foreground/60">/{overview.totalAgents}</span>
        </span>
      </div>
    </div>

    {/* Bottom row: metrics grid */}
    <div className="grid grid-cols-4 gap-2">
      {/* CPU */}
      <div className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg bg-muted/30">
        <Activity className="size-3 text-muted-foreground" />
        <span className={cn('text-sm font-bold tabular-nums', getResourceTextClass(overview.avgCpu))}>
          {overview.avgCpu.toFixed(0)}%
        </span>
        <span className="text-[9px] text-muted-foreground">CPU</span>
      </div>

      {/* Memory */}
      <div className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg bg-muted/30">
        <Cpu className="size-3 text-muted-foreground" />
        <span className={cn('text-sm font-bold tabular-nums', getResourceTextClass(overview.avgMemory))}>
          {overview.avgMemory.toFixed(0)}%
        </span>
        <span className="text-[9px] text-muted-foreground">{t('admin.monitor.metrics.memory')}</span>
      </div>

      {/* Download */}
      <div className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg bg-muted/30">
        <ArrowDown className="size-3 text-success" />
        <span className="text-sm font-bold tabular-nums text-success">
          {formatBitRate(overview.totalNetworkRxRate, true)}
        </span>
        <span className="text-[9px] text-muted-foreground">{t('common.actions.download')}</span>
        <span className="text-[8px] text-muted-foreground/60 tabular-nums">
          {formatBytes(overview.totalNetworkRxBytes)}
        </span>
      </div>

      {/* Upload */}
      <div className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg bg-muted/30">
        <ArrowUp className="size-3 text-primary" />
        <span className="text-sm font-bold tabular-nums text-primary">
          {formatBitRate(overview.totalNetworkTxRate, true)}
        </span>
        <span className="text-[9px] text-muted-foreground">{t('common.actions.upload')}</span>
        <span className="text-[8px] text-muted-foreground/60 tabular-nums">
          {formatBytes(overview.totalNetworkTxBytes)}
        </span>
      </div>
    </div>
  </div>
);
});
MobileStatusHeader.displayName = 'MobileStatusHeader';

// Ultra-compact entity row for mobile list
const MobileEntityRow = memo(({ entity, onClick }: { entity: EntityStatus; onClick?: () => void }) => {
  const { t } = useTranslation();
  const status = entity.status as (NodeSystemStatus | AgentSystemStatus) | null;
  const isOnline = entity.isOnline && status;

  const cpuPercent = status?.cpuPercent ?? 0;
  const memoryPercent = status?.memoryPercent ?? 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 p-2.5 rounded-xl transition-colors touch-manipulation cursor-pointer',
        'active:bg-accent/70 active:scale-[0.98]',
        isOnline ? 'bg-card' : 'bg-muted/30 opacity-60'
      )}
    >
      {/* Icon with status indicator */}
      <div className="relative shrink-0">
        <div className={cn(
          'p-1.5 rounded-lg',
          entity.type === 'node'
            ? isOnline ? 'bg-info/10' : 'bg-muted'
            : isOnline ? 'bg-primary/10' : 'bg-muted'
        )}>
          {entity.type === 'node'
            ? <Server className={cn('size-4', isOnline ? 'text-info' : 'text-muted-foreground')} />
            : <Cpu className={cn('size-4', isOnline ? 'text-primary' : 'text-muted-foreground')} />
          }
        </div>
        {/* Online indicator */}
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-background',
          isOnline ? 'bg-success' : 'bg-muted-foreground'
        )} />
      </div>

      {/* Name and metrics */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {entity.name || entity.id.slice(0, 8)}
          </span>
        </div>

        {isOnline ? (
          <div className="flex items-center gap-3 mt-1">
            {/* CPU mini bar */}
            <div className="flex items-center gap-1 flex-1">
              <span className="text-[9px] text-muted-foreground w-6">CPU</span>
              <MicroProgress value={cpuPercent} size="xs" />
              <span className={cn('text-[10px] tabular-nums w-7 text-right', getResourceMutedTextClass(cpuPercent))}>
                {cpuPercent.toFixed(0)}%
              </span>
            </div>
            {/* Memory mini bar */}
            <div className="flex items-center gap-1 flex-1">
              <span className="text-[9px] text-muted-foreground w-6">MEM</span>
              <MicroProgress value={memoryPercent} size="xs" />
              <span className={cn('text-[10px] tabular-nums w-7 text-right', getResourceMutedTextClass(memoryPercent))}>
                {memoryPercent.toFixed(0)}%
              </span>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {entity.lastSeenAt ? `${t('common.status.offline')} · ${formatRelativeTime(entity.lastSeenAt)}` : t('common.status.offline')}
          </p>
        )}
      </div>

      {/* Network rates (online only) */}
      {isOnline && status && (
        <div className="flex flex-col items-end gap-0.5 text-[10px] shrink-0">
          <div className="flex items-center gap-1">
            <ArrowDown className="size-2.5 text-success" />
            <span className="tabular-nums text-muted-foreground">{formatBitRate(status.networkRxRate ?? 0)}</span>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUp className="size-2.5 text-primary" />
            <span className="tabular-nums text-muted-foreground">{formatBitRate(status.networkTxRate ?? 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
});
MobileEntityRow.displayName = 'MobileEntityRow';

// Compact event log for mobile
const MobileEventLog = memo(({ events, isExpanded, onToggle }: {
  events: MonitorEvent[];
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const { t } = useTranslation();
  const recentEvents = isExpanded ? events : events.slice(0, 3);

  const formatEventTime = (timestamp: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('online')) return <Wifi className="size-3 text-success" />;
    if (eventType.includes('offline')) return <WifiOff className="size-3 text-destructive" />;
    return <Activity className="size-3 text-info" />;
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 cursor-pointer touch-manipulation active:scale-[0.98]"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{t('admin.monitor.eventLog')}</span>
          <Badge variant="secondary" className="text-[10px] h-5">{events.length}</Badge>
        </div>
        {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>

      {/* Event list */}
      <div className={cn('border-t border-border/50', isExpanded ? 'max-h-60' : 'max-h-28', 'overflow-hidden')}>
        <ScrollArea className="h-full">
          <div className="divide-y divide-border/30">
            {recentEvents.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">{t('admin.monitor.noEvents')}</div>
            ) : (
              recentEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-2 px-3 py-2">
                  {getEventIcon(event.eventType)}
                  <span className="flex-1 text-xs text-foreground truncate">{event.message}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{formatEventTime(event.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
});
MobileEventLog.displayName = 'MobileEventLog';

// Main mobile view component
export const MonitorMobileView = memo(({
  overview,
  entities,
  eventLog,
  isConnected,
}: MonitorMobileViewProps) => {
  const { t } = useTranslation();
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedEntity, setSelectedEntity] = useState<EntityStatus | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [eventLogExpanded, setEventLogExpanded] = useState(false);

  // Handle entity click - open detail sheet
  const handleEntityClick = (entity: EntityStatus) => {
    setSelectedEntity(entity);
    setDetailSheetOpen(true);
  };

  // Filter entities
  const filteredEntities = useMemo(() => {
    return entities.filter(e => {
      if (entityFilter !== 'all' && e.type !== entityFilter) return false;
      if (statusFilter === 'online' && !e.isOnline) return false;
      if (statusFilter === 'offline' && e.isOnline) return false;
      return true;
    });
  }, [entities, entityFilter, statusFilter]);

  // Counts
  const nodeCount = entities.filter(e => e.type === 'node').length;
  const agentCount = entities.filter(e => e.type === 'agent').length;
  const onlineCount = entities.filter(e => e.isOnline).length;

  return (
    <div className="space-y-3 pb-safe">
      {/* Status header */}
      <MobileStatusHeader overview={overview} isConnected={isConnected} />

      {/* Filter bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {/* Entity type filter pills */}
          <button
            onClick={() => setEntityFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation min-h-[32px] active:scale-[0.98]',
              entityFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/60 text-muted-foreground'
            )}
          >
            {t('filter.all')} {entities.length}
          </button>
          <button
            onClick={() => setEntityFilter('node')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation min-h-[32px] flex items-center gap-1 active:scale-[0.98]',
              entityFilter === 'node'
                ? 'bg-info text-info-foreground'
                : 'bg-muted/60 text-muted-foreground'
            )}
          >
            <Server className="size-3" />
            {nodeCount}
          </button>
          <button
            onClick={() => setEntityFilter('agent')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation min-h-[32px] flex items-center gap-1 active:scale-[0.98]',
              entityFilter === 'agent'
                ? 'bg-violet-500 text-white'
                : 'bg-muted/60 text-muted-foreground'
            )}
          >
            <Cpu className="size-3" />
            {agentCount}
          </button>
        </div>

        {/* Status filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
              <Filter className="size-3.5" />
              <span className="text-xs">
                {statusFilter === 'all' ? t('filter.all') : statusFilter === 'online' ? t('common.status.online') : t('common.status.offline')}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent align="end" className="w-32" collisionPadding={16}>
              <DropdownMenuItem onSelect={() => setStatusFilter('all')} className="cursor-pointer">
                <Check className={cn('size-4 mr-2', statusFilter === 'all' ? 'opacity-100' : 'opacity-0')} />
                {t('filter.all')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setStatusFilter('online')} className="cursor-pointer">
                <Check className={cn('size-4 mr-2', statusFilter === 'online' ? 'opacity-100' : 'opacity-0')} />
                {t('common.status.online')} ({onlineCount})
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setStatusFilter('offline')} className="cursor-pointer">
                <Check className={cn('size-4 mr-2', statusFilter === 'offline' ? 'opacity-100' : 'opacity-0')} />
                {t('common.status.offline')} ({entities.length - onlineCount})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      </div>

      {/* Entity list */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="divide-y divide-border/30">
          {filteredEntities.length === 0 ? (
            <div className="py-8 text-center">
              <Activity className="size-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {entities.length === 0 ? t('admin.monitor.waitingData') : t('common.messages.noResults')}
              </p>
            </div>
          ) : (
            filteredEntities.map((entity) => (
              <MobileEntityRow
                key={entity.id}
                entity={entity}
                onClick={() => handleEntityClick(entity)}
              />
            ))
          )}
        </div>
      </div>

      {/* Event log */}
      <MobileEventLog
        events={eventLog}
        isExpanded={eventLogExpanded}
        onToggle={() => setEventLogExpanded(!eventLogExpanded)}
      />

      {/* Entity detail sheet */}
      <MobileEntityDetailSheet
        entity={selectedEntity ? entities.find(e => e.id === selectedEntity.id) || selectedEntity : null}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />
    </div>
  );
});
MonitorMobileView.displayName = 'MonitorMobileView';
