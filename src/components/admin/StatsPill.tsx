/**
 * StatsPill - Reusable stats indicator pill
 *
 * Used in admin page toolbars to display counts with status-colored pills.
 * Supports dot indicators, custom icons, and semantic color variants.
 *
 * @example
 * <StatsPill>42 nodes</StatsPill>
 * <StatsPill variant="success" dot>12 online</StatsPill>
 * <StatsPill variant="info" icon={<Users className="size-3" />}>5 users</StatsPill>
 */

import { cn } from '@/lib/utils';

export type StatsPillVariant = 'default' | 'success' | 'warning' | 'info' | 'muted' | 'destructive';

export interface StatsPillProps {
  children: React.ReactNode;
  variant?: StatsPillVariant;
  /** Show a colored dot indicator */
  dot?: boolean;
  /** Custom icon (replaces dot if both provided) */
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<StatsPillVariant, string> = {
  default: 'ring-border/60',
  success: 'ring-success/30 bg-success/5 text-success',
  warning: 'ring-warning/30 bg-warning/5 text-warning',
  info: 'ring-info/30 bg-info/5 text-info',
  muted: 'ring-border/60 text-muted-foreground',
  destructive: 'ring-destructive/30 bg-destructive/5 text-destructive',
};

const dotStyles: Record<StatsPillVariant, string> = {
  default: 'bg-foreground',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  muted: 'bg-muted-foreground',
  destructive: 'bg-destructive',
};

export function StatsPill({
  children,
  variant = 'default',
  dot,
  icon,
  className,
}: StatsPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ring-1 text-[13px] font-medium tabular-nums',
        variantStyles[variant],
        className,
      )}
    >
      {icon ?? (dot && <span className={cn('size-1.5 rounded-full', dotStyles[variant])} />)}
      {children}
    </span>
  );
}
