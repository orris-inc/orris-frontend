/**
 * Monitor Page
 * Real-time monitoring dashboard for nodes and forward agents
 * Uses SSE for live data updates
 */

import { useState, useMemo } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { usePageTitle } from '@/shared/hooks';
import { useMonitorData } from '@/features/monitor/hooks';
import {
  MonitorOverviewCards,
  RealtimeMetricsChart,
  EventLogPanel,
  EntityDetailCard,
  EntityTableView,
} from '@/features/monitor/components';
import { Separator } from '@/components/common/Separator';
import { Activity, Server, Cpu, LayoutGrid, LayoutList, Table2 } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/common/Tabs';
import { Button } from '@/components/common/Button';

type EntityFilter = 'all' | 'node' | 'agent';
type ViewMode = 'grid' | 'compact' | 'table';

export const MonitorPage = () => {
  usePageTitle('实时监控');

  const {
    overview,
    eventLog,
    allEntities,
    isConnected,
    getEntityChartData,
  } = useMonitorData({ enabled: true });

  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedChartEntityIds, setSelectedChartEntityIds] = useState<string[]>([]);

  // Filter entities based on selected filter
  const filteredEntities = useMemo(() => {
    if (entityFilter === 'all') return allEntities;
    return allEntities.filter(e => e.type === entityFilter);
  }, [allEntities, entityFilter]);

  // Count by type
  const nodeCount = allEntities.filter(e => e.type === 'node').length;
  const agentCount = allEntities.filter(e => e.type === 'agent').length;

  return (
    <AdminLayout>
      <div className="py-4 sm:py-6">
        {/* Page header - compact style */}
        <header className="mb-4 sm:mb-5">
          <div className="flex items-center gap-2 mb-0.5">
            <div className={`size-1.5 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {isConnected ? '实时数据' : '等待连接'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            实时监控
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            监控节点和转发代理的实时状态
          </p>
        </header>

        {/* Overview cards - compact grid */}
        <section>
          <MonitorOverviewCards overview={overview} isConnected={isConnected} />
        </section>

        <Separator className="my-4 sm:my-5" />

        {/* Charts and logs - 4:1 layout */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-4">
          {/* Left: Real-time chart - takes more space */}
          <div className="xl:col-span-8">
            <RealtimeMetricsChart
              entities={allEntities}
              selectedEntityIds={selectedChartEntityIds}
              onEntitySelect={setSelectedChartEntityIds}
              getEntityChartData={getEntityChartData}
            />
          </div>

          {/* Right: Event log - match chart height */}
          <div className="xl:col-span-4">
            <EventLogPanel events={eventLog} />
          </div>
        </section>

        <Separator className="my-4 sm:my-5" />

        {/* Entity detail cards */}
        <section>
          {/* Section header with filters - responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <h2 className="text-base sm:text-lg font-semibold text-foreground">实体详情</h2>
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  {filteredEntities.length} / {allEntities.length}
                </Badge>
              </div>

              {/* Mobile: View mode toggle */}
              <div className="flex sm:hidden items-center border border-border rounded-lg p-0.5">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-1.5"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="size-3.5" />
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
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-1.5"
                  onClick={() => setViewMode('table')}
                >
                  <Table2 className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Entity type filter - responsive */}
              <Tabs value={entityFilter} onValueChange={(v) => setEntityFilter(v as EntityFilter)} className="flex-1 sm:flex-none">
                <TabsList className="h-7 sm:h-8 w-full sm:w-auto">
                  <TabsTrigger value="all" className="text-[10px] sm:text-xs px-2 sm:px-3 h-6 sm:h-7 flex-1 sm:flex-none">
                    全部
                  </TabsTrigger>
                  <TabsTrigger value="node" className="text-[10px] sm:text-xs px-2 sm:px-3 h-6 sm:h-7 gap-1 sm:gap-1.5 flex-1 sm:flex-none">
                    <Server className="size-2.5 sm:size-3" />
                    <span className="hidden xs:inline">节点</span> ({nodeCount})
                  </TabsTrigger>
                  <TabsTrigger value="agent" className="text-[10px] sm:text-xs px-2 sm:px-3 h-6 sm:h-7 gap-1 sm:gap-1.5 flex-1 sm:flex-none">
                    <Cpu className="size-2.5 sm:size-3" />
                    <span className="hidden xs:inline">代理</span> ({agentCount})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Desktop: View mode toggle */}
              <div className="hidden sm:flex items-center border border-border rounded-lg p-0.5">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('compact')}
                >
                  <LayoutList className="size-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('table')}
                >
                  <Table2 className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Entity display - responsive with view modes */}
          {filteredEntities.length > 0 ? (
            viewMode === 'table' ? (
              <EntityTableView entities={filteredEntities} />
            ) : (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'
                  : 'grid grid-cols-1 lg:grid-cols-2 gap-3'
              }>
                {filteredEntities.map(entity => (
                  <EntityDetailCard key={entity.id} entity={entity} compact={viewMode === 'compact'} />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 bg-card rounded-xl sm:rounded-2xl border border-border">
              <div className="size-12 sm:size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Activity className="size-5 sm:size-7 text-muted-foreground/50" />
              </div>
              <h3 className="text-sm sm:text-base font-medium text-foreground mb-1">
                {entityFilter === 'all' ? '暂无实体数据' : `暂无${entityFilter === 'node' ? '节点' : '代理'}数据`}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
                {entityFilter === 'all'
                  ? '等待 SSE 连接接收节点和代理状态...'
                  : `尝试切换筛选条件查看其他实体`
                }
              </p>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
};
