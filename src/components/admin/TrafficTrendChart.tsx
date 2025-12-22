/**
 * Traffic Trend Chart Component
 * Displays traffic upload/download trends over time with dual area chart
 */

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
import { AdminCard, AdminCardHeader, AdminCardContent } from './AdminCard';
import { Skeleton } from '@/components/common/Skeleton';
import { TrafficTrendPoint, formatTrafficBytes } from '@/api/admin';

interface TrafficTrendChartProps {
  data: TrafficTrendPoint[];
  granularity: 'hour' | 'day' | 'month';
  loading: boolean;
  headerAction?: React.ReactNode;
}

/**
 * Format period string based on granularity
 * @param period - ISO8601 date string
 * @param granularity - Time granularity
 * @returns Formatted date string
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

/**
 * Custom Tooltip Component
 * Displays formatted traffic data on hover
 */
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string> & {
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry: { name: string; value: number; color: string }, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {formatTrafficBytes(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Traffic Trend Chart Component
 * Displays dual area chart for upload and download traffic trends
 */
export const TrafficTrendChart = ({ data, granularity, loading, headerAction }: TrafficTrendChartProps) => {
  // Transform data for recharts format with formatted period
  const chartData = data.map((point) => ({
    period: formatPeriod(point.period, granularity),
    upload: point.upload,
    download: point.download,
  }));

  if (loading) {
    return (
      <AdminCard>
        <AdminCardHeader title="流量趋势" action={headerAction} />
        <AdminCardContent>
          <Skeleton className="w-full h-[300px]" />
        </AdminCardContent>
      </AdminCard>
    );
  }

  return (
    <AdminCard>
      <AdminCardHeader title="流量趋势" action={headerAction} />
      <AdminCardContent>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                {/* Upload gradient - Blue */}
                <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                {/* Download gradient - Green */}
                <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-slate-200 dark:stroke-slate-700"
              />
              <XAxis
                dataKey="period"
                className="text-xs text-slate-600 dark:text-slate-400"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                tickFormatter={(value: number) => formatTrafficBytes(value)}
                className="text-xs text-slate-600 dark:text-slate-400"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="upload"
                name="上传"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#uploadGradient)"
              />
              <Area
                type="monotone"
                dataKey="download"
                name="下载"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#downloadGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </AdminCardContent>
    </AdminCard>
  );
};
