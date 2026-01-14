/**
 * Lazy-loaded chart components
 * Only loads Recharts when chart is actually rendered
 */

import { lazy, Suspense, ComponentProps } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Loading placeholder for charts
function ChartLoadingFallback({
  className,
  height = 280,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-muted/30 rounded-xl',
        className
      )}
      style={{ height }}
    >
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// Lazy load TrafficTrendChart
const LazyTrafficTrendChartInner = lazy(() =>
  import('./TrafficTrendChart').then((m) => ({ default: m.TrafficTrendChart }))
);

// Type for TrafficTrendChart props
type TrafficTrendChartProps = ComponentProps<typeof LazyTrafficTrendChartInner>;

/**
 * Lazy-loaded TrafficTrendChart
 * Only loads Recharts bundle when this component is rendered
 */
export function LazyTrafficTrendChart(props: TrafficTrendChartProps) {
  return (
    <Suspense fallback={<ChartLoadingFallback height={280} />}>
      <LazyTrafficTrendChartInner {...props} />
    </Suspense>
  );
}

// Lazy load ExtendedMetricsPanel
const LazyExtendedMetricsPanelInner = lazy(() =>
  import('./ExtendedMetricsPanel').then((m) => ({
    default: m.ExtendedMetricsPanel,
  }))
);

type ExtendedMetricsPanelProps = ComponentProps<
  typeof LazyExtendedMetricsPanelInner
>;

/**
 * Lazy-loaded ExtendedMetricsPanel
 * Contains charts, only loads when panel is rendered
 */
export function LazyExtendedMetricsPanel(props: ExtendedMetricsPanelProps) {
  return (
    <Suspense fallback={<ChartLoadingFallback height={200} />}>
      <LazyExtendedMetricsPanelInner {...props} />
    </Suspense>
  );
}
