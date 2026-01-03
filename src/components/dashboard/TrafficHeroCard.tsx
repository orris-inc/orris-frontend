/**
 * Traffic Hero Card Component
 * Displays traffic usage with radial progress chart in Bento Grid style
 */

import { useMemo } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';

interface TrafficHeroCardProps {
  upload: number;
  download: number;
  total: number;
  limit: number;
  isLoading?: boolean;
  className?: string;
}

/**
 * Format bytes to readable traffic units
 */
const formatTraffic = (bytes: number): { value: string; unit: string } => {
  if (bytes === 0) return { value: '0', unit: 'B' };
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = (bytes / Math.pow(k, i)).toFixed(1);
  return { value, unit: units[i] };
};

/**
 * Traffic Hero Card with radial progress chart
 */
export const TrafficHeroCard = ({
  upload,
  download,
  total,
  limit,
  isLoading = false,
  className,
}: TrafficHeroCardProps) => {
  // Calculate usage percentage
  const usagePercent = useMemo(() => {
    if (limit <= 0) return 0;
    return Math.min((total / limit) * 100, 100);
  }, [total, limit]);

  // Calculate upload/download percentages for the ratio bar
  const { uploadPercent, downloadPercent } = useMemo(() => {
    if (total <= 0) return { uploadPercent: 50, downloadPercent: 50 };
    return {
      uploadPercent: (upload / total) * 100,
      downloadPercent: (download / total) * 100,
    };
  }, [upload, download, total]);

  // Format traffic values
  const totalFormatted = formatTraffic(total);
  const limitFormatted = formatTraffic(limit);
  const uploadFormatted = formatTraffic(upload);
  const downloadFormatted = formatTraffic(download);

  // Chart data
  const chartData = useMemo(() => [
    { name: 'usage', value: usagePercent, fill: 'url(#trafficGradient)' },
  ], [usagePercent]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn(
        'col-span-4 md:col-span-6 lg:col-span-6 lg:row-span-2',
        'p-6 rounded-2xl bg-card border',
        className
      )}>
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-[180px] lg:h-[200px] w-full rounded-xl" />
        <Skeleton className="h-2 w-full mt-4 rounded-full" />
        <div className="flex justify-between mt-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'col-span-4 md:col-span-6 lg:col-span-6 lg:row-span-2',
      'p-6 rounded-2xl bg-card border',
      'transition-shadow hover:shadow-md',
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <Activity className="size-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">流量使用</h3>
          <p className="text-xs text-muted-foreground">本月用量统计</p>
        </div>
      </div>

      {/* Radial Chart */}
      <div className="relative h-[180px] lg:h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="95%"
            barSize={12}
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <defs>
              <linearGradient id="trafficGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--chart-upload))" />
                <stop offset="100%" stopColor="hsl(var(--chart-download))" />
              </linearGradient>
            </defs>
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: 'hsl(var(--muted))' }}
              dataKey="value"
              cornerRadius={10}
              fill="url(#trafficGradient)"
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center content overlay */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-3xl lg:text-4xl font-bold tabular-nums text-foreground">
            {totalFormatted.value}
          </span>
          <span className="text-sm text-muted-foreground">
            {totalFormatted.unit} / {limitFormatted.value} {limitFormatted.unit}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            {usagePercent.toFixed(1)}% 已使用
          </span>
        </div>
      </div>

      {/* Upload/Download ratio bar */}
      <div className="mt-4">
        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
          <div
            className="h-full bg-chart-upload transition-all"
            style={{ width: `${uploadPercent}%` }}
          />
          <div
            className="h-full bg-chart-download transition-all"
            style={{ width: `${downloadPercent}%` }}
          />
        </div>
      </div>

      {/* Upload/Download labels */}
      <div className="flex justify-between mt-3 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <ArrowUp className="size-4 text-chart-upload" />
          <span>上传</span>
          <span className="font-semibold text-foreground tabular-nums">
            {uploadFormatted.value} {uploadFormatted.unit}
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <ArrowDown className="size-4 text-chart-download" />
          <span>下载</span>
          <span className="font-semibold text-foreground tabular-nums">
            {downloadFormatted.value} {downloadFormatted.unit}
          </span>
        </span>
      </div>
    </div>
  );
};
