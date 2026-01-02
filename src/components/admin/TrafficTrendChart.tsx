/**
 * Traffic Trend Chart Component
 * Modern design with glassmorphism tooltip and smooth gradients
 */

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { AdminCard } from './AdminCard';
import { Skeleton } from '@/components/common/Skeleton';
import { TrafficTrendPoint, formatTrafficBytes } from '@/api/admin';
import { cn } from '@/lib/utils';

interface TrafficTrendChartProps {
  data: TrafficTrendPoint[];
  granularity: 'hour' | 'day' | 'month';
  loading: boolean;
  headerAction?: React.ReactNode;
}

/**
 * Compact format for Y-axis labels
 */
const formatYAxisLabel = (bytes: number): string => {
  if (bytes === 0) return '0';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
  return `${formatted}${sizes[i]}`;
};

/**
 * Format period string based on granularity
 */
const formatPeriod = (period: string, granularity: 'hour' | 'day' | 'month'): string => {
  const date = new Date(period);

  switch (granularity) {
    case 'hour':
      return `${date.getHours().toString().padStart(2, '0')}:00`;
    case 'day':
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    case 'month':
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    default:
      return period;
  }
};

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
  color: string;
  name: string;
}

/**
 * Custom Tooltip with glassmorphism style
 */
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string> & {
  payload?: TooltipPayloadItem[];
  label?: string;
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const upload = payload.find((p: TooltipPayloadItem) => p.dataKey === 'upload')?.value || 0;
  const download = payload.find((p: TooltipPayloadItem) => p.dataKey === 'download')?.value || 0;
  const total = upload + download;

  return (
    <div className={cn(
      'bg-card',
      'backdrop-blur-xl',
      'border border-border',
      'rounded-xl shadow-xl',
      'p-4 min-w-[200px]'
    )}>
      {/* Time label */}
      <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-border">
        <div className="p-1.5 rounded-lg bg-muted">
          <Activity className="size-3.5 text-muted-foreground" />
        </div>
        <span className="text-sm font-semibold text-foreground">
          {label}
        </span>
      </div>

      {/* Traffic data */}
      <div className="space-y-3">
        {/* Upload */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-3 rounded-full bg-chart-upload ring-2 ring-chart-upload/20" />
            <span className="text-sm font-medium text-muted-foreground">上传</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUp className="size-3.5 text-chart-upload" strokeWidth={2} />
            <span className="text-sm font-bold text-foreground tabular-nums">
              {formatTrafficBytes(upload)}
            </span>
          </div>
        </div>

        {/* Download */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-3 rounded-full bg-chart-download ring-2 ring-chart-download/20" />
            <span className="text-sm font-medium text-muted-foreground">下载</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowDown className="size-3.5 text-chart-download" strokeWidth={2} />
            <span className="text-sm font-bold text-foreground tabular-nums">
              {formatTrafficBytes(download)}
            </span>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between gap-4 pt-3 mt-1 border-t border-border">
          <span className="text-sm font-semibold text-foreground">总计</span>
          <span className="text-base font-bold text-foreground tabular-nums">
            {formatTrafficBytes(total)}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Legend component
 */
const ChartLegend = ({ totalUpload, totalDownload }: { totalUpload: number; totalDownload: number }) => (
  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-border">
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-chart-upload/10 ring-1 ring-chart-upload/20">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="size-2.5 sm:size-3 rounded-full bg-chart-upload ring-2 ring-chart-upload/20" />
        <ArrowUp className="size-3.5 sm:size-4 text-chart-upload" strokeWidth={2} />
      </div>
      <span className="text-xs sm:text-sm font-medium text-muted-foreground">上传</span>
      <span className="text-xs sm:text-sm font-bold text-chart-upload tabular-nums">
        {formatTrafficBytes(totalUpload)}
      </span>
    </div>
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-chart-download/10 ring-1 ring-chart-download/20">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="size-2.5 sm:size-3 rounded-full bg-chart-download ring-2 ring-chart-download/20" />
        <ArrowDown className="size-3.5 sm:size-4 text-chart-download" strokeWidth={2} />
      </div>
      <span className="text-xs sm:text-sm font-medium text-muted-foreground">下载</span>
      <span className="text-xs sm:text-sm font-bold text-chart-download tabular-nums">
        {formatTrafficBytes(totalDownload)}
      </span>
    </div>
  </div>
);

/**
 * Traffic Trend Chart Component
 */
export const TrafficTrendChart = ({ data, granularity, loading, headerAction }: TrafficTrendChartProps) => {
  // Transform data for recharts format
  const chartData = useMemo(() => data.map((point) => ({
    period: formatPeriod(point.period, granularity),
    upload: point.upload,
    download: point.download,
  })), [data, granularity]);

  // Calculate totals
  const { totalUpload, totalDownload } = useMemo(() => {
    return data.reduce(
      (acc, point) => ({
        totalUpload: acc.totalUpload + point.upload,
        totalDownload: acc.totalDownload + point.download,
      }),
      { totalUpload: 0, totalDownload: 0 }
    );
  }, [data]);

  if (loading) {
    return (
      <AdminCard variant="glass" noPadding>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Skeleton className="h-10 w-32" />
            {headerAction}
          </div>
          <Skeleton className="w-full h-[200px] sm:h-[280px] rounded-xl" />
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-border">
            <Skeleton className="h-8 w-28 sm:w-32" />
            <Skeleton className="h-8 w-28 sm:w-32" />
          </div>
        </div>
      </AdminCard>
    );
  }

  return (
    <AdminCard variant="glass" noPadding>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Activity className="size-4 sm:size-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground whitespace-nowrap">
                流量趋势
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                上传与下载流量统计
              </p>
            </div>
          </div>
          {headerAction && (
            <div className="shrink-0 -mx-1 sm:mx-0">
              {headerAction}
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="w-full h-[200px] sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                {/* Upload gradient - uses CSS variable */}
                <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-upload))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--chart-upload))" stopOpacity={0.02} />
                </linearGradient>
                {/* Download gradient - uses CSS variable */}
                <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-download))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--chart-download))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="currentColor"
                className="text-border"
                vertical={false}
              />
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'currentColor', fontSize: 11 }}
                className="text-muted-foreground"
                dy={10}
              />
              <YAxis
                tickFormatter={formatYAxisLabel}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'currentColor', fontSize: 11 }}
                className="text-muted-foreground"
                width={55}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: 'currentColor',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                  className: 'text-border',
                }}
              />
              <Area
                type="monotone"
                dataKey="download"
                name="下载"
                stroke="hsl(var(--chart-download))"
                strokeWidth={2.5}
                fill="url(#downloadGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: 'hsl(var(--chart-download))',
                  stroke: 'hsl(var(--card))',
                  strokeWidth: 2,
                  className: 'drop-shadow-md',
                }}
              />
              <Area
                type="monotone"
                dataKey="upload"
                name="上传"
                stroke="hsl(var(--chart-upload))"
                strokeWidth={2.5}
                fill="url(#uploadGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: 'hsl(var(--chart-upload))',
                  stroke: 'hsl(var(--card))',
                  strokeWidth: 2,
                  className: 'drop-shadow-md',
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with totals */}
        <ChartLegend totalUpload={totalUpload} totalDownload={totalDownload} />
      </div>
    </AdminCard>
  );
};

export default TrafficTrendChart;
