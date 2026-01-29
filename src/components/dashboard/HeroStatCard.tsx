/**
 * Hero Stat Card Component
 * Displays a single statistic in the Hero section with optional progress bar
 *
 * Design: Mobile-first, compact on small screens, spacious on large
 * Features: Icon with color variants, value with unit, optional progress bar
 */

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconVariant = 'primary' | 'success' | 'warning' | 'info' | 'muted';

interface HeroStatCardProps {
  /** Card title/label */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Subtitle or description below the value */
  subtitle?: string;
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Color variant for icon */
  iconVariant?: IconVariant;
  /** Optional progress bar configuration */
  progress?: {
    value: number;
    max: number;
  };
  /** Additional className */
  className?: string;
  /** Whether this card spans full width on mobile (for single-row items) */
  fullWidth?: boolean;
}

const iconVariantStyles: Record<IconVariant, { bg: string; ring: string; text: string }> = {
  primary: {
    bg: 'bg-primary/10',
    ring: 'ring-primary/20',
    text: 'text-primary',
  },
  success: {
    bg: 'bg-success/10',
    ring: 'ring-success/20',
    text: 'text-success',
  },
  warning: {
    bg: 'bg-warning/10',
    ring: 'ring-warning/20',
    text: 'text-warning',
  },
  info: {
    bg: 'bg-info/10',
    ring: 'ring-info/20',
    text: 'text-info',
  },
  muted: {
    bg: 'bg-muted',
    ring: 'ring-border',
    text: 'text-muted-foreground',
  },
};

/**
 * Get progress bar color based on usage percentage
 */
const getProgressColor = (percent: number): string => {
  if (percent >= 90) return 'bg-destructive';
  if (percent >= 70) return 'bg-warning';
  return 'bg-success';
};

/**
 * Hero stat card - displays a single metric with icon and optional progress
 * Mobile-first: p-3 compact, sm+ larger padding and fonts
 */
export const HeroStatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconVariant = 'primary',
  progress,
  className,
  fullWidth = false,
}: HeroStatCardProps) => {
  const styles = iconVariantStyles[iconVariant];
  const progressPercent = progress && progress.max > 0
    ? Math.min(100, Math.round((progress.value / progress.max) * 100))
    : 0;

  return (
    <div
      className={cn(
        // Base card styles
        'rounded-xl border bg-card/80 backdrop-blur-sm',
        // Mobile: compact padding p-3; sm+: p-4
        'p-3 sm:p-4',
        // Full width variant for single-row items
        fullWidth && 'col-span-2',
        className
      )}
    >
      {/* Header: Icon + Title */}
      <div className="flex items-center gap-2 mb-2">
        {/* Icon - hidden on mobile for density, shown on sm+ */}
        <div
          className={cn(
            'hidden sm:flex items-center justify-center rounded-lg p-1.5 ring-1',
            styles.bg,
            styles.ring
          )}
        >
          <Icon className={cn('size-3.5 lg:size-4', styles.text)} />
        </div>
        <span className="text-xs sm:text-sm text-muted-foreground truncate">
          {title}
        </span>
      </div>

      {/* Value */}
      <div className="text-lg sm:text-xl lg:text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </div>

      {/* Progress bar (optional) */}
      {progress && (
        <div className="mt-2">
          <div className="h-1.5 sm:h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                getProgressColor(progressPercent)
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p className="mt-1.5 text-[10px] sm:text-xs text-muted-foreground truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};
