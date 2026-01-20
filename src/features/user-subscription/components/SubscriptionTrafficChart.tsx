/**
 * Subscription Traffic Chart Component
 * Displays traffic trend chart for user subscription
 */

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { ArrowUp, ArrowDown, Activity, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTrafficStats } from "@/api/subscription";
import type {
  Subscription,
  TrafficStatsRecord,
} from "@/api/subscription/types";
import { Skeleton } from "@/components/common/Skeleton";
import type { TFunction } from "i18next";

interface SubscriptionTrafficChartProps {
  subscription: Subscription;
}

type TimeRange = "today" | "yesterday" | "7d" | "30d";

/**
 * Format bytes to human readable string
 */
const formatTrafficBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Compact format for Y-axis labels
 */
const formatYAxisLabel = (bytes: number): string => {
  if (bytes === 0) return "0";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
  return `${formatted}${sizes[i]}`;
};

/**
 * Format date to local date key (MM-DD)
 */
const formatDateKey = (date: Date): string => {
  return `${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
};

/**
 * Format date to local hour key (HH:00)
 */
const formatHourKey = (date: Date): string => {
  return `${date.getHours().toString().padStart(2, "0")}:00`;
};

/**
 * Parse period string and format to local date/hour key
 */
const formatPeriodKey = (period: string, granularity: "hour" | "day"): string => {
  const date = new Date(period);
  return granularity === "hour" ? formatHourKey(date) : formatDateKey(date);
};

/**
 * Get date range based on time range selection
 */
const getDateRange = (range: TimeRange): { from: Date; to: Date; granularity: "hour" | "day" } => {
  const now = new Date();

  if (range === "today") {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    return { from, to, granularity: "hour" };
  }

  if (range === "yesterday") {
    const from = new Date(now);
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(now);
    to.setDate(to.getDate() - 1);
    to.setHours(23, 59, 59, 999);
    return { from, to, granularity: "hour" };
  }

  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  if (range === "7d") {
    from.setDate(from.getDate() - 6); // Include today, so -6 for 7 days total
  } else {
    from.setDate(from.getDate() - 29); // Include today, so -29 for 30 days total
  }

  return { from, to, granularity: "day" };
};

interface ChartDataPoint {
  period: string;
  upload: number;
  download: number;
}

/**
 * Generate all dates/hours in the range (local time)
 */
const generateDateRange = (from: Date, to: Date, granularity: "hour" | "day"): string[] => {
  const periods: string[] = [];

  if (granularity === "hour") {
    const current = new Date(from);
    current.setMinutes(0, 0, 0);

    const endDate = new Date(to);
    endDate.setMinutes(0, 0, 0);

    while (current <= endDate) {
      periods.push(formatHourKey(current));
      current.setHours(current.getHours() + 1);
    }
  } else {
    const current = new Date(from);
    current.setHours(0, 0, 0, 0);

    const endDate = new Date(to);
    endDate.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      periods.push(formatDateKey(current));
      current.setDate(current.getDate() + 1);
    }
  }

  return periods;
};

/**
 * Aggregate traffic records by period and fill missing dates/hours
 */
const aggregateByPeriod = (
  records: TrafficStatsRecord[],
  from: Date,
  to: Date,
  granularity: "hour" | "day",
): ChartDataPoint[] => {
  // First aggregate the actual data by period key
  const grouped = records.reduce<
    Record<string, { upload: number; download: number }>
  >((acc, record) => {
    const periodKey = formatPeriodKey(record.period, granularity);
    if (!acc[periodKey]) {
      acc[periodKey] = { upload: 0, download: 0 };
    }
    acc[periodKey].upload += record.upload;
    acc[periodKey].download += record.download;
    return acc;
  }, {});

  // Generate all periods in the range
  const allPeriods = generateDateRange(from, to, granularity);

  // Fill missing periods with zero values
  return allPeriods.map((period) => ({
    period,
    upload: grouped[period]?.upload ?? 0,
    download: grouped[period]?.download ?? 0,
  }));
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
const CustomTooltip = ({
  active,
  payload,
  label,
  t,
}: TooltipProps<number, string> & {
  payload?: TooltipPayloadItem[];
  label?: string;
  t: TFunction;
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const upload =
    payload.find((p: TooltipPayloadItem) => p.dataKey === "upload")?.value || 0;
  const download =
    payload.find((p: TooltipPayloadItem) => p.dataKey === "download")?.value ||
    0;
  const total = upload + download;

  return (
    <div
      className={cn(
        "bg-card",
        "backdrop-blur-xl",
        "border border-border",
        "rounded-xl shadow-xl",
        "p-4 min-w-[200px]",
      )}
    >
      {/* Time label */}
      <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-border">
        <div className="p-1.5 rounded-lg bg-muted">
          <Activity className="size-3.5 text-muted-foreground" />
        </div>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>

      {/* Traffic data */}
      <div className="space-y-3">
        {/* Upload */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-3 rounded-full bg-chart-upload ring-2 ring-chart-upload/20" />
            <span className="text-sm font-medium text-muted-foreground">
              {t("userSubscription.upload")}
            </span>
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
            <span className="text-sm font-medium text-muted-foreground">
              {t("userSubscription.download")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowDown
              className="size-3.5 text-chart-download"
              strokeWidth={2}
            />
            <span className="text-sm font-bold text-foreground tabular-nums">
              {formatTrafficBytes(download)}
            </span>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between gap-4 pt-3 mt-1 border-t border-border">
          <span className="text-sm font-semibold text-foreground">
            {t("userSubscription.total")}
          </span>
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
const ChartLegend = ({
  totalUpload,
  totalDownload,
  t,
}: {
  totalUpload: number;
  totalDownload: number;
  t: TFunction;
}) => (
  <div className="flex items-center justify-center gap-2 @sm:gap-4 mt-3 @sm:mt-4 pt-3 @sm:pt-4 border-t border-border">
    <div className="flex items-center gap-1.5 @sm:gap-2 px-2 @sm:px-3 py-1.5 rounded-lg bg-chart-upload/10 ring-1 ring-chart-upload/20">
      <div className="size-2 @sm:size-2.5 rounded-full bg-chart-upload" />
      <span className="text-[10px] @sm:text-xs text-muted-foreground">
        {t("userSubscription.upload")}
      </span>
      <span className="text-[10px] @sm:text-xs font-bold text-chart-upload tabular-nums">
        {formatTrafficBytes(totalUpload)}
      </span>
    </div>
    <div className="flex items-center gap-1.5 @sm:gap-2 px-2 @sm:px-3 py-1.5 rounded-lg bg-chart-download/10 ring-1 ring-chart-download/20">
      <div className="size-2 @sm:size-2.5 rounded-full bg-chart-download" />
      <span className="text-[10px] @sm:text-xs text-muted-foreground">
        {t("userSubscription.download")}
      </span>
      <span className="text-[10px] @sm:text-xs font-bold text-chart-download tabular-nums">
        {formatTrafficBytes(totalDownload)}
      </span>
    </div>
  </div>
);

/**
 * Time range selector
 */
const TimeRangeSelector = ({
  value,
  onChange,
  t,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  t: TFunction;
}) => {
  const options: { value: TimeRange; labelKey: string }[] = [
    { value: "today", labelKey: "userSubscription.today" },
    { value: "yesterday", labelKey: "userSubscription.yesterday" },
    { value: "7d", labelKey: "userSubscription.sevenDays" },
    { value: "30d", labelKey: "userSubscription.thirtyDays" },
  ];

  return (
    <div className="flex items-center gap-0.5 @sm:gap-1 p-0.5 @sm:p-1 rounded-lg bg-muted">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-2 @sm:px-2.5 py-1.5 @sm:py-1.5 min-h-[44px] @sm:min-h-0 text-[10px] @sm:text-xs font-medium rounded-md transition-colors",
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(option.labelKey)}
        </button>
      ))}
    </div>
  );
};

/**
 * Loading skeleton
 */
const ChartSkeleton = () => (
  <div className="@container p-4 rounded-xl bg-card border">
    <div className="flex flex-col @sm:flex-row @sm:items-center justify-between gap-3 @sm:gap-4 mb-4 @sm:mb-6">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-8 w-24" />
    </div>
    <Skeleton className="w-full h-[200px] @sm:h-[280px] rounded-xl" />
    <div className="flex flex-wrap justify-center gap-3 @sm:gap-6 mt-4 @sm:mt-5 pt-4 @sm:pt-5 border-t border-border">
      <Skeleton className="h-8 w-28 @sm:w-32" />
      <Skeleton className="h-8 w-28 @sm:w-32" />
    </div>
  </div>
);

/**
 * Empty state
 */
const EmptyState = ({ t }: { t: TFunction }) => (
  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
    <Activity className="size-12 mb-4 opacity-50" />
    <p className="text-sm">{t("userSubscription.noTrafficData")}</p>
  </div>
);

export const SubscriptionTrafficChart: React.FC<
  SubscriptionTrafficChartProps
> = ({ subscription }) => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const dateRange = useMemo(() => getDateRange(timeRange), [timeRange]);

  // Convert dates to ISO strings for API and cache key
  const apiParams = useMemo(
    () => ({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
      granularity: dateRange.granularity,
    }),
    [dateRange],
  );

  // Query traffic stats - use large pageSize to get all records
  const { data: trafficStats, isLoading } = useQuery({
    queryKey: [
      "subscriptionTrafficChart",
      subscription.id,
      apiParams.from,
      apiParams.to,
      apiParams.granularity,
    ],
    queryFn: () =>
      getTrafficStats(subscription.id, {
        from: apiParams.from,
        to: apiParams.to,
        granularity: apiParams.granularity,
        pageSize: 1000, // Get more records to cover all traffic
      }),
    enabled: !!subscription.id,
  });

  // Process data for chart
  const chartData = useMemo(() => {
    if (!trafficStats?.records) return [];
    return aggregateByPeriod(
      trafficStats.records,
      dateRange.from,
      dateRange.to,
      dateRange.granularity,
    );
  }, [trafficStats?.records, dateRange.from, dateRange.to, dateRange.granularity]);

  // Use API summary for accurate totals (chart aggregation may miss paginated data)
  const { totalUpload, totalDownload } = useMemo(() => {
    if (trafficStats?.summary) {
      return {
        totalUpload: trafficStats.summary.totalUpload,
        totalDownload: trafficStats.summary.totalDownload,
      };
    }
    // Fallback to chart data calculation
    return chartData.reduce(
      (acc, point) => ({
        totalUpload: acc.totalUpload + point.upload,
        totalDownload: acc.totalDownload + point.download,
      }),
      { totalUpload: 0, totalDownload: 0 },
    );
  }, [trafficStats?.summary, chartData]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  return (
    <div className="@container p-3 @sm:p-4 rounded-xl bg-card border">
      {/* Header - compact on mobile */}
      <div className="flex items-center justify-between gap-2 mb-3 @sm:mb-4">
        <div className="flex items-center gap-2 @sm:gap-3 shrink-0">
          <div className="p-1.5 @sm:p-2 rounded-lg @sm:rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Calendar
              className="size-3.5 @sm:size-4 text-primary"
              strokeWidth={1.5}
            />
          </div>
          <div>
            <h3 className="text-xs @sm:text-sm font-semibold text-foreground">
              {t("userSubscription.trafficTrend")}
            </h3>
            <p className="text-[10px] @sm:text-xs text-muted-foreground hidden @sm:block">
              {t("userSubscription.uploadDownloadStats")}
            </p>
          </div>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} t={t} />
      </div>

      {/* Chart or Empty State */}
      {chartData.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <>
          {/* Chart */}
          <div className="w-full h-[160px] @sm:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  {/* Upload gradient */}
                  <linearGradient
                    id="subscriptionUploadGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--color-chart-upload)"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-chart-upload)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  {/* Download gradient */}
                  <linearGradient
                    id="subscriptionDownloadGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--color-chart-download)"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-chart-download)"
                      stopOpacity={0.02}
                    />
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
                  tick={{ fill: "currentColor", fontSize: 11 }}
                  className="text-muted-foreground"
                  dy={10}
                />
                <YAxis
                  tickFormatter={formatYAxisLabel}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "currentColor", fontSize: 11 }}
                  className="text-muted-foreground"
                  width={55}
                />
                <Tooltip
                  content={<CustomTooltip t={t} />}
                  cursor={{
                    stroke: "currentColor",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                    className: "text-border",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="download"
                  name={t("userSubscription.download")}
                  stroke="var(--color-chart-download)"
                  strokeWidth={2.5}
                  fill="url(#subscriptionDownloadGradient)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: "var(--color-chart-download)",
                    stroke: "var(--color-card)",
                    strokeWidth: 2,
                    className: "drop-shadow-md",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="upload"
                  name={t("userSubscription.upload")}
                  stroke="var(--color-chart-upload)"
                  strokeWidth={2.5}
                  fill="url(#subscriptionUploadGradient)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: "var(--color-chart-upload)",
                    stroke: "var(--color-card)",
                    strokeWidth: 2,
                    className: "drop-shadow-md",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend with totals */}
          <ChartLegend
            totalUpload={totalUpload}
            totalDownload={totalDownload}
            t={t}
          />
        </>
      )}
    </div>
  );
};

export default SubscriptionTrafficChart;
