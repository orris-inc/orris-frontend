/**
 * Quick Action Link Component
 * Reusable navigation card for quick actions section
 *
 * Mobile-first: compact 2-column layout with smaller icons on mobile
 */

import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { ViewTransitionLink } from '@/components/common/ViewTransitionLink';
import { cn } from '@/lib/utils';

type ColorVariant = 'primary' | 'success' | 'warning' | 'destructive';

interface QuickActionLinkProps {
  /** Navigation target */
  to: string;
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Main title text */
  title: string;
  /** Description text */
  description: string;
  /** Color variant for icon and hover state */
  variant?: ColorVariant;
  /** Additional className */
  className?: string;
}

const variantStyles: Record<ColorVariant, { bg: string; ring: string; text: string; hover: string }> = {
  primary: {
    bg: 'bg-primary/10',
    ring: 'ring-primary/20',
    text: 'text-primary',
    hover: 'hover:border-primary/30',
  },
  success: {
    bg: 'bg-success/10',
    ring: 'ring-success/20',
    text: 'text-success',
    hover: 'hover:border-success/30',
  },
  warning: {
    bg: 'bg-warning/10',
    ring: 'ring-warning/20',
    text: 'text-warning',
    hover: 'hover:border-warning/30',
  },
  destructive: {
    bg: 'bg-destructive/10',
    ring: 'ring-destructive/20',
    text: 'text-destructive',
    hover: 'hover:border-destructive/30',
  },
};

/**
 * Navigation card for quick actions
 * Mobile: compact with smaller icon, sm+: larger layout
 */
export const QuickActionLink = ({
  to,
  icon: Icon,
  title,
  description,
  variant = 'primary',
  className,
}: QuickActionLinkProps) => {
  const styles = variantStyles[variant];

  return (
    <ViewTransitionLink
      to={to}
      className={cn(
        // Mobile: compact p-3, sm+: p-4
        'flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl touch-target',
        'bg-card border hover:shadow-sm',
        'transition-all duration-200 group',
        // Focus visible for keyboard navigation
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        styles.hover,
        className
      )}
    >
      <div
        className={cn(
          // Mobile: smaller icon container
          'p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl ring-1 shrink-0',
          styles.bg,
          styles.ring
        )}
      >
        {/* Mobile: smaller icon */}
        <Icon className={cn('size-4 sm:size-5', styles.text)} />
      </div>
      <div className="flex-1 min-w-0">
        {/* Mobile: smaller title font */}
        <div className="text-sm sm:text-base font-medium text-foreground">{title}</div>
        {/* Mobile: text-xs + line-clamp-2 for consistent card height */}
        <div className="text-[11px] sm:text-xs lg:text-sm text-muted-foreground line-clamp-2">
          {description}
        </div>
      </div>
      <ChevronRight
        className={cn(
          // Mobile: smaller arrow
          'size-4 sm:size-5 text-muted-foreground transition-colors shrink-0',
          `group-hover:${styles.text}`
        )}
      />
    </ViewTransitionLink>
  );
};
