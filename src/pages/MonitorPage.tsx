/**
 * Monitor Page - High Density Design
 * Real-time monitoring dashboard for nodes and forward agents
 * Optimized for maximum information density
 * Responsive: Mobile-first with dedicated mobile view
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/layouts/AdminLayout';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks';
import { useMonitorData } from '@/features/monitor/hooks';
import {
  RealtimeMetricsChart,
  EventLogPanel,
  EntityDetailCard,
  EntityTableView,
  MonitorMobileView,
  EntityFullDetailPanel,
} from '@/features/monitor/components';
import type { EntityStatus } from '@/features/monitor/hooks';
import { formatBitRate, formatBytes } from '@/shared/utils/format-utils';
import { Activity, Server, Cpu, LayoutGrid, LayoutList, Table2, ArrowDown, ArrowUp } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/common/Tabs';
import { Button } from '@/components/common/Button';
import { cardStyles } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';

type EntityFilter = 'all' | 'node' | 'agent';
type ViewMode = 'grid' | 'compact' | 'table';

export const MonitorPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('nav.liveMonitor'));
  const { isMobile } = useBreakpoint();

  const {
    overview,
    eventLog,
    allEntities,
    isConnected,
    getEntityChartData,
  } = useMonitorData({ enabled: true });

  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedChartEntityIds, setSelectedChartEntityIds] = useState<string[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<EntityStatus | null>(null);

  // Handle entity row click
  const handleEntityClick = (entity: EntityStatus) => {
    setSelectedEntity(prev => prev?.id === entity.id ? null : entity);
  };

  // Filter entities based on selected filter
  const filteredEntities = useMemo(() => {
    if (entityFilter === 'all') return allEntities;
    return allEntities.filter(e => e.type === entityFilter);
  }, [allEntities, entityFilter]);

  // Count by type and status
  const nodeCount = allEntities.filter(e => e.type === 'node').length;
  const agentCount = allEntities.filter(e => e.type === 'agent').length;
  const onlineCount = allEntities.filter(e => e.isOnline).length;

  // Helper for status color
  const getStatusColor = (value: number) => {
    if (value >= 80) return 'text-destructive';
    if (value >= 60) return 'text-warning';
    return 'text-success';
  };

  // Mobile view
  if (isMobile) {
    return (
      <AdminLayout>
        <div className="px-3 py-3">
          <MonitorMobileView
            overview={overview}
            entities={allEntities}
            eventLog={eventLog}
            isConnected={isConnected}
          />
        </div>
      </AdminLayout>
    );
  }

  // Desktop view
  return (
    <AdminLayout>
      <div className="py-3 space-y-3">
        {/* High-Density Status Bar - All metrics inline */}
        <header className={cn(cardStyles, 'px-3 py-2')}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left: Title + Connection + Entity counts */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`size-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
                <h1 className="text-sm font-semibold text-foreground">{t('nav.liveMonitor')}</h1>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Server className="size-3 text-info" />
                  <span className="font-medium text-foreground">{overview.onlineNodes}</span>/{overview.totalNodes}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Cpu className="size-3 text-relay" />
                  <span className="font-medium text-foreground">{overview.onlineAgents}</span>/{overview.totalAgents}
                </span>
              </div>
            </div>

            {/* Center: Resource metrics */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <Activity className="size-3 text-muted-foreground" />
                <span className="text-muted-foreground">{t('admin.monitor.cpu')}</span>
                <span className={`font-semibold tabular-nums ${getStatusColor(overview.avgCpu)}`}>
                  {overview.avgCpu.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="size-3 text-muted-foreground" />
                <span className="text-muted-foreground">{t('admin.monitor.memory')}</span>
                <span className={`font-semibold tabular-nums ${getStatusColor(overview.avgMemory)}`}>
                  {overview.avgMemory.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Right: Network metrics */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <ArrowDown className="size-3 text-success" />
                <span className="font-semibold tabular-nums text-success">{formatBitRate(overview.totalNetworkRxRate)}</span>
                <span className="text-muted-foreground/60 hidden lg:inline">({formatBytes(overview.totalNetworkRxBytes)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowUp className="size-3 text-primary" />
                <span className="font-semibold tabular-nums text-primary">{formatBitRate(overview.totalNetworkTxRate)}</span>
                <span className="text-muted-foreground/60 hidden lg:inline">({formatBytes(overview.totalNetworkTxBytes)})</span>
              </div>
            </div>
          </div>
        </header>

        {/* Charts and logs - Compact 3:1 layout */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-3">
          {/* Left: Real-time chart */}
          <div className="xl:col-span-9">
            <RealtimeMetricsChart
              entities={allEntities}
              selectedEntityIds={selectedChartEntityIds}
              onEntitySelect={setSelectedChartEntityIds}
              getEntityChartData={getEntityChartData}
            />
          </div>

          {/* Right: Event log */}
          <div className="xl:col-span-3">
            <EventLogPanel events={eventLog} />
          </div>
        </section>

        {/* Entity section - Compact header + table view default */}
        <section>
          {/* Compact section header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-foreground">{t('admin.monitor.entityDetails')}</h2>
              <Badge variant="secondary" className="text-[10px] h-5">
                {t('admin.monitor.onlineCount', { online: onlineCount, total: allEntities.length })}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {/* Entity type filter */}
              <Tabs value={entityFilter} onValueChange={(v) => setEntityFilter(v as EntityFilter)}>
                <TabsList className="h-7">
                  <TabsTrigger value="all" className="text-[10px] px-2 h-6">
                    {t('filter.all')}
                  </TabsTrigger>
                  <TabsTrigger value="node" className="text-[10px] px-2 h-6 gap-1">
                    <Server className="size-2.5" />
                    {nodeCount}
                  </TabsTrigger>
                  <TabsTrigger value="agent" className="text-[10px] px-2 h-6 gap-1">
                    <Cpu className="size-2.5" />
                    {agentCount}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* View mode toggle */}
              <div className="flex items-center border border-border rounded-md p-0.5">
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-1.5"
                  onClick={() => setViewMode('table')}
                >
                  <Table2 className="size-3.5" />
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-1.5"
                  onClick={() => setViewMode('compact')}
                >
                  <LayoutList className="size-3.5" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-1.5"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Entity display with optional detail panel */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
            {/* Entity list */}
            <div className={selectedEntity ? 'xl:col-span-8' : 'xl:col-span-12'}>
              {filteredEntities.length > 0 ? (
                viewMode === 'table' ? (
                  <EntityTableView
                    entities={filteredEntities}
                    onRowClick={handleEntityClick}
                  />
                ) : (
                  <div className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3'
                      : 'grid grid-cols-1 lg:grid-cols-2 gap-2'
                  }>
                    {filteredEntities.map(entity => (
                      <div
                        key={entity.id}
                        onClick={() => handleEntityClick(entity)}
                        className={entity.id === selectedEntity?.id ? 'ring-1 ring-primary rounded-lg' : ''}
                      >
                        <EntityDetailCard entity={entity} compact={viewMode === 'compact'} />
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className={cn('flex flex-col items-center justify-center py-12', cardStyles)}>
                  <div className="size-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                    <Activity className="size-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {entityFilter === 'all' ? t('admin.monitor.waitingData') : t('admin.monitor.noEntityData')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entityFilter === 'all' ? t('admin.monitor.waitingEntityData') : t('admin.monitor.noEntityUnderFilter')}
                  </p>
                </div>
              )}
            </div>

            {/* Detail panel (shown when entity selected) */}
            {selectedEntity && (
              <div className="xl:col-span-4">
                <EntityFullDetailPanel
                  entity={allEntities.find(e => e.id === selectedEntity.id) || selectedEntity}
                  onClose={() => setSelectedEntity(null)}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};
