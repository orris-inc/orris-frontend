/**
 * Lazy-loaded dashboard chart components
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

// Lazy load TrafficHeroCard (contains Recharts)
const LazyTrafficHeroCardInner = lazy(() =>
  import('./TrafficHeroCard').then((m) => ({ default: m.TrafficHeroCard }))
);

type TrafficHeroCardProps = ComponentProps<typeof LazyTrafficHeroCardInner>;

/**
 * Lazy-loaded TrafficHeroCard
 * Only loads Recharts bundle when this component is rendered
 */
export function LazyTrafficHeroCard(props: TrafficHeroCardProps) {
  return (
    <Suspense fallback={<ChartLoadingFallback height={400} className="col-span-4 md:col-span-6 lg:col-span-6 lg:row-span-2" />}>
      <LazyTrafficHeroCardInner {...props} />
    </Suspense>
  );
}
