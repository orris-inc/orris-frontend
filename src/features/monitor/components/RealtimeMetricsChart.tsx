/**
 * Realtime Metrics Chart - Modern Design
 * Features:
 * - Animated wave background for empty state
 * - Pill-style metric tabs with clear active state
 * - Glassmorphism tooltip
 * - Gradient area fills
 * - Mini sparkline previews in entity selector
 */

import { memo, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { schemeTableau10, interpolateTurbo } from 'd3-scale-chromatic';
import { Server, Cpu, X, Plus, Activity, HardDrive, Wifi, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/Popover';
import { Checkbox } from '@/components/common/Checkbox';
import { cn } from '@/lib/utils';
import { formatBitRate } from '@/shared/utils/format-utils';
import type { EntityChartDataPoint, EntityStatus } from '../hooks/useMonitorData';

type ChartMode = 'cpu' | 'memory' | 'disk' | 'network';

interface RealtimeMetricsChartProps {
  entities: EntityStatus[];
  selectedEntityIds: string[];
  onEntitySelect: (entityIds: string[]) => void;
  getEntityChartData: (entityId: string) => EntityChartDataPoint[];
}

// Maximum entities allowed for chart readability
const MAX_ENTITIES = 20;

// Hue shift amount for upload color (degrees, positive = warmer/orange direction)
const HUE_SHIFT = 40;

// Convert hex to HSL
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return [h * 360, s, l];
}

// Convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360; // Normalize hue to 0-360
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hNorm = h / 360;

  const r = Math.round(hue2rgb(p, q, hNorm + 1/3) * 255);
  const g = Math.round(hue2rgb(p, q, hNorm) * 255);
  const b = Math.round(hue2rgb(p, q, hNorm - 1/3) * 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Shift hue of a hex color by degrees
function shiftHue(hex: string, degrees: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h + degrees, s, l);
}

// Generate color for entity by index using d3-scale-chromatic
const getEntityColor = (index: number): string => {
  // Use Tableau10 for first 10 colors (high contrast, professionally designed)
  if (index < schemeTableau10.length) {
    return schemeTableau10[index];
  }
  // For additional colors, use Turbo colormap with offset to avoid similar colors
  const t = ((index - schemeTableau10.length) / (MAX_ENTITIES - schemeTableau10.length)) * 0.8 + 0.1;
  return interpolateTurbo(t);
};

// Get upload color by shifting hue of download color
const getUploadColor = (downloadColor: string): string => {
  return shiftHue(downloadColor, HUE_SHIFT);
};

// Metric config with icons (labels are now provided via i18n)
const METRIC_CONFIG: Record<ChartMode, { labelKey: string; icon: React.ElementType }> = {
  cpu: { labelKey: 'admin.monitor.cpu', icon: Activity },
  memory: { labelKey: 'admin.monitor.memory', icon: Cpu },
  disk: { labelKey: 'admin.monitor.disk', icon: HardDrive },
  network: { labelKey: 'admin.monitor.network', icon: Wifi },
};

// Animated wave SVG for empty state
const AnimatedWave = memo(() => (
  <svg
    className="w-full h-24 text-primary/10"
    viewBox="0 0 400 100"
    preserveAspectRatio="none"
  >
    <defs>
      <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path
      fill="url(#wave-gradient)"
      d="M0,50 Q50,30 100,50 T200,50 T300,50 T400,50 L400,100 L0,100 Z"
    >
      <animate
        attributeName="d"
        dur="3s"
        repeatCount="indefinite"
        values="
          M0,50 Q50,30 100,50 T200,50 T300,50 T400,50 L400,100 L0,100 Z;
          M0,50 Q50,70 100,50 T200,50 T300,50 T400,50 L400,100 L0,100 Z;
          M0,50 Q50,30 100,50 T200,50 T300,50 T400,50 L400,100 L0,100 Z
        "
      />
    </path>
    <path
      fill="url(#wave-gradient)"
      opacity="0.5"
      d="M0,60 Q50,40 100,60 T200,60 T300,60 T400,60 L400,100 L0,100 Z"
    >
      <animate
        attributeName="d"
        dur="4s"
        repeatCount="indefinite"
        values="
          M0,60 Q50,40 100,60 T200,60 T300,60 T400,60 L400,100 L0,100 Z;
          M0,60 Q50,80 100,60 T200,60 T300,60 T400,60 L400,100 L0,100 Z;
          M0,60 Q50,40 100,60 T200,60 T300,60 T400,60 L400,100 L0,100 Z
        "
      />
    </path>
  </svg>
));
AnimatedWave.displayName = 'AnimatedWave';

// Mini sparkline for entity preview
const MiniSparkline = memo(({ data, color }: { data: number[]; color: string }) => {
  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 48;
  const height = 16;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});
MiniSparkline.displayName = 'MiniSparkline';

// Glassmorphism tooltip
const GlassTooltip = memo(({ active, payload, label, mode }: {
  active?: boolean;
  payload?: { name: string; value: number; stroke: string }[];
  label?: number;
  mode: ChartMode;
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const time = label ? new Date(label * 1000).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) : '';

  return (
    <div className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl p-3 shadow-2xl min-w-[180px]">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/30">
        <div className="size-1.5 rounded-full bg-success animate-pulse" />
        <span className="text-xs font-medium text-foreground">{time}</span>
      </div>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.stroke }}
              />
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                {entry.name}
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-foreground tabular-nums">
              {mode === 'network'
                ? formatBitRate(entry.value)
                : `${entry.value.toFixed(1)}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
GlassTooltip.displayName = 'GlassTooltip';

// Dynamic chart gradient definitions based on selected entities
const ChartGradients = memo(({ entityCount, isNetworkMode }: { entityCount: number; isNetworkMode: boolean }) => (
  <defs>
    {Array.from({ length: entityCount }, (_, index) => {
      const rxColor = getEntityColor(index);
      const txColor = getUploadColor(rxColor);
      return isNetworkMode ? (
        // Network mode: separate gradients for RX and TX per entity
        <g key={index}>
          <linearGradient id={`gradient-entity-${index}-rx`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={rxColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={rxColor} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id={`gradient-entity-${index}-tx`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={txColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={txColor} stopOpacity={0.02} />
          </linearGradient>
        </g>
      ) : (
        // Other modes: single gradient per entity
        <linearGradient key={index} id={`gradient-entity-${index}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={rxColor} stopOpacity={0.35} />
          <stop offset="100%" stopColor={rxColor} stopOpacity={0.02} />
        </linearGradient>
      );
    })}
  </defs>
));
ChartGradients.displayName = 'ChartGradients';

export const RealtimeMetricsChart = memo(({
  entities,
  selectedEntityIds,
  onEntitySelect,
  getEntityChartData,
}: RealtimeMetricsChartProps) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ChartMode>('cpu');
  const [selectorOpen, setSelectorOpen] = useState(false);

  // Get online entities for selection
  const onlineEntities = useMemo(() =>
    entities.filter(e => e.isOnline),
    [entities]
  );

  // Get selected entities with colors and sparkline data
  const selectedEntities = useMemo(() => {
    return selectedEntityIds
      .map((id, index) => {
        const entity = entities.find(e => e.id === id);
        if (!entity) return null;
        const chartData = getEntityChartData(id);
        const sparklineData = chartData.slice(-20).map(d => {
          if (mode === 'network') return d.networkRxRate;
          return d[mode as 'cpu' | 'memory' | 'disk'] ?? d.cpu;
        });
        const strokeColor = getEntityColor(index);
        return {
          ...entity,
          colorIndex: index,
          colors: {
            stroke: strokeColor,
            fill: `url(#gradient-entity-${index})`,
          },
          sparklineData,
          currentValue: chartData.length > 0 ? chartData[chartData.length - 1] : null,
        };
      })
      .filter(Boolean) as (EntityStatus & {
        colorIndex: number;
        colors: { stroke: string; fill: string };
        sparklineData: number[];
        currentValue: EntityChartDataPoint | null;
      })[];
  }, [entities, selectedEntityIds, getEntityChartData, mode]);

  // Merge chart data from all selected entities
  const chartData = useMemo(() => {
    if (selectedEntityIds.length === 0) return [];

    const allTimestamps = new Set<number>();
    const entityDataMap = new Map<string, Map<number, EntityChartDataPoint>>();

    selectedEntityIds.forEach(entityId => {
      const data = getEntityChartData(entityId);
      const dataByTimestamp = new Map<number, EntityChartDataPoint>();
      data.forEach(point => {
        allTimestamps.add(point.timestamp);
        dataByTimestamp.set(point.timestamp, point);
      });
      entityDataMap.set(entityId, dataByTimestamp);
    });

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    return sortedTimestamps.map(timestamp => {
      const point: Record<string, number> = { timestamp };

      selectedEntityIds.forEach(entityId => {
        const entityData = entityDataMap.get(entityId)?.get(timestamp);
        const entity = entities.find(e => e.id === entityId);
        const name = entity?.name || entityId.slice(0, 8);

        if (entityData) {
          if (mode === 'network') {
            point[`${name}_rx`] = entityData.networkRxRate;
            point[`${name}_tx`] = entityData.networkTxRate;
          } else {
            point[name] = entityData[mode];
          }
        }
      });

      return point;
    });
  }, [selectedEntityIds, getEntityChartData, entities, mode]);

  // Handle entity toggle
  const toggleEntity = useCallback((entityId: string) => {
    if (selectedEntityIds.includes(entityId)) {
      onEntitySelect(selectedEntityIds.filter(id => id !== entityId));
    } else if (selectedEntityIds.length < MAX_ENTITIES) {
      onEntitySelect([...selectedEntityIds, entityId]);
    }
  }, [selectedEntityIds, onEntitySelect]);

  // Remove entity from selection
  const removeEntity = useCallback((entityId: string) => {
    onEntitySelect(selectedEntityIds.filter(id => id !== entityId));
  }, [selectedEntityIds, onEntitySelect]);

  // Format x-axis timestamp
  const formatXAxis = useCallback((timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Y-axis configuration
  const yAxisConfig = useMemo(() => {
    if (mode === 'network') {
      return {
        domain: ['auto', 'auto'] as ['auto', 'auto'],
        formatter: (value: number) => formatBitRate(value, true),
      };
    }
    return {
      domain: [0, 100] as [number, number],
      formatter: (value: number) => `${value}%`,
    };
  }, [mode]);

  return (
    <div className="@container bg-card rounded-xl ring-1 ring-border overflow-hidden">
      {/* Compact Header */}
      <div className="p-3">
        {/* Single row: Title + Metric tabs + Entity selector */}
        <div className="flex flex-col @md:flex-row @md:items-center @md:justify-between gap-2 @md:gap-3 mb-2">
          {/* Left: Compact title */}
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground">{t('admin.monitor.performanceMonitor')}</span>
            {selectedEntityIds.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {t('admin.monitor.entitiesCount', { count: selectedEntityIds.length })}
              </Badge>
            )}
          </div>

          {/* Right: Metric tabs - compact pills */}
          <div className="flex items-center p-0.5 rounded-md bg-muted/60 border border-border/50 self-start @md:self-auto">
            {(Object.keys(METRIC_CONFIG) as ChartMode[]).map((key) => {
              const config = METRIC_CONFIG[key];
              const Icon = config.icon;
              const isActive = mode === key;
              return (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer',
                    isActive
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="size-3" />
                  <span className="hidden @sm:inline">{t(config.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Entity selector row - scrollable on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1 scrollbar-none">
          <Popover open={selectorOpen} onOpenChange={setSelectorOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-7 gap-1.5 border-dashed transition-all shrink-0 text-xs',
                  selectedEntityIds.length === 0
                    ? 'border-primary/50 bg-primary/5 hover:bg-primary/10 hover:border-primary text-primary'
                    : 'hover:border-primary hover:bg-primary/5'
                )}
              >
                <Plus className="size-3.5" />
                <span>{t('admin.monitor.add')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={onlineEntities.length > 0 && selectedEntityIds.length === Math.min(onlineEntities.length, MAX_ENTITIES)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          // Select all (up to MAX_ENTITIES)
                          onEntitySelect(onlineEntities.slice(0, MAX_ENTITIES).map(e => e.id));
                        } else {
                          // Deselect all
                          onEntitySelect([]);
                        }
                      }}
                      disabled={onlineEntities.length === 0}
                      className="shrink-0"
                    />
                    <span className="text-sm font-medium text-foreground">{t('common.actions.selectAll')}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {selectedEntityIds.length}/{MAX_ENTITIES}
                  </Badge>
                </div>
              </div>
              <div className="p-2 max-h-[300px] overflow-y-auto">
                {onlineEntities.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <Wifi className="size-5 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{t('admin.monitor.noOnlineEntities')}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{t('admin.monitor.waitingAgentOnline')}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {onlineEntities.map((entity) => {
                      const selectedIndex = selectedEntityIds.indexOf(entity.id);
                      const isSelected = selectedIndex !== -1;
                      const isDisabled = !isSelected && selectedEntityIds.length >= MAX_ENTITIES;
                      const entityChartData = getEntityChartData(entity.id);
                      const sparklineData = entityChartData.slice(-10).map(d => d.cpu);
                      const sparklineColor = isSelected ? getEntityColor(selectedIndex) : 'var(--color-chart-muted)';

                      return (
                        <label
                          key={entity.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all',
                            isSelected
                              ? 'bg-primary/10 ring-1 ring-primary/30'
                              : 'hover:bg-accent/50',
                            isDisabled && 'opacity-40 cursor-not-allowed'
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => !isDisabled && toggleEntity(entity.id)}
                            disabled={isDisabled}
                            className="shrink-0"
                          />
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={cn(
                              'p-1.5 rounded-lg shrink-0',
                              entity.type === 'node' ? 'bg-info/10' : 'bg-violet-500/10'
                            )}>
                              {entity.type === 'node'
                                ? <Server className="size-4 text-info" />
                                : <Cpu className="size-4 text-violet-500" />
                              }
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {entity.name || entity.id.slice(0, 12)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entity.type === 'node' ? 'Node' : 'Agent'}
                              </p>
                            </div>
                          </div>
                          {sparklineData.length > 1 && (
                            <MiniSparkline
                              data={sparklineData}
                              color={sparklineColor}
                            />
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Selected entity chips - compact with shrink-0 for stable layout */}
          {selectedEntities.map((entity) => (
            <div
              key={entity.id}
              className="group flex items-center gap-1.5 h-7 pl-2 pr-1 rounded-md bg-muted/50 border border-border/50 hover:border-border transition-colors shrink-0"
            >
              <div
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: entity.colors.stroke }}
              />
              <span className="text-xs font-medium text-foreground max-w-[60px] @sm:max-w-[80px] truncate">
                {entity.name || entity.id.slice(0, 6)}
              </span>
              {entity.currentValue && (
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                  {mode === 'network'
                    ? formatBitRate(entity.currentValue.networkRxRate)
                    : `${(entity.currentValue[mode as 'cpu' | 'memory' | 'disk'] ?? 0).toFixed(0)}%`}
                </span>
              )}
              <button
                onClick={() => removeEntity(entity.id)}
                className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer shrink-0"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chart area - responsive height */}
      <div className="px-3 pb-3 h-[200px] @md:h-[260px]">
        {selectedEntityIds.length === 0 ? (
          /* Empty state - Compact */
          <div className="h-full flex items-center justify-center bg-muted/20 rounded-lg border border-dashed border-border/60">
            <div className="text-center px-4">
              <BarChart3 className="size-8 @md:size-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs @md:text-sm text-muted-foreground mb-2">{t('admin.monitor.clickAddToSelectEntities')}</p>
              <div className="flex flex-wrap items-center justify-center gap-2 @md:gap-3 text-[10px] text-muted-foreground/60">
                <span className="flex items-center gap-1">
                  <Activity className="size-3" />{t('admin.monitor.cpu')}
                </span>
                <span className="flex items-center gap-1">
                  <Cpu className="size-3" />{t('admin.monitor.memory')}
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="size-3" />{t('admin.monitor.disk')}
                </span>
                <span className="flex items-center gap-1">
                  <Wifi className="size-3" />{t('admin.monitor.network')}
                </span>
              </div>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          /* Loading state - Compact */
          <div className="h-full flex items-center justify-center bg-muted/20 rounded-lg border border-dashed border-border/60">
            <div className="text-center">
              <div className="flex gap-1 items-end justify-center mb-2">
                <div className="w-1.5 h-3 bg-primary/40 rounded-full animate-pulse motion-reduce:animate-none" />
                <div className="w-1.5 h-5 bg-primary/60 rounded-full animate-pulse motion-reduce:animate-none delay-75" />
                <div className="w-1.5 h-4 bg-primary/50 rounded-full animate-pulse motion-reduce:animate-none delay-150" />
                <div className="w-1.5 h-6 bg-primary/70 rounded-full animate-pulse motion-reduce:animate-none delay-200" />
              </div>
              <p className="text-xs text-muted-foreground">{t('admin.monitor.waitingData')}</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <ChartGradients entityCount={selectedEntityIds.length} isNetworkMode={mode === 'network'} />
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                strokeOpacity={0.4}
                vertical={false}
              />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                domain={yAxisConfig.domain}
                tickFormatter={yAxisConfig.formatter}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={mode === 'network' ? 64 : 48}
              />
              <Tooltip
                content={<GlassTooltip mode={mode} />}
                cursor={{
                  stroke: 'var(--color-primary)',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                  strokeOpacity: 0.5,
                }}
              />
              {mode === 'network' ? (
                selectedEntities.flatMap((entity) => {
                  const name = entity.name || entity.id.slice(0, 8);
                  const rxColor = entity.colors.stroke;
                  const txColor = getUploadColor(rxColor);
                  return [
                    <Area
                      key={`${entity.id}_rx`}
                      type="stepAfter"
                      dataKey={`${name}_rx`}
                      name={`${name} ↓`}
                      stroke={rxColor}
                      fill={`url(#gradient-entity-${entity.colorIndex}-rx)`}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />,
                    <Area
                      key={`${entity.id}_tx`}
                      type="stepAfter"
                      dataKey={`${name}_tx`}
                      name={`${name} ↑`}
                      stroke={txColor}
                      fill={`url(#gradient-entity-${entity.colorIndex}-tx)`}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />,
                  ];
                })
              ) : (
                selectedEntities.map((entity) => {
                  const name = entity.name || entity.id.slice(0, 8);
                  return (
                    <Area
                      key={entity.id}
                      type="stepAfter"
                      dataKey={name}
                      name={name}
                      stroke={entity.colors.stroke}
                      fill={entity.colors.fill}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                  );
                })
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});
RealtimeMetricsChart.displayName = 'RealtimeMetricsChart';
