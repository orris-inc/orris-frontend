/**
 * Quick Action Link Component
 * Reusable navigation card for quick actions section
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
 * Provides consistent styling for action links across dashboard pages
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
        'flex items-center gap-3 p-4 rounded-xl cursor-pointer touch-target',
        'bg-card border hover:shadow-sm',
        'transition-all duration-200 group',
        styles.hover,
        className
      )}
    >
      <div
        className={cn(
          'p-2.5 rounded-xl ring-1 shrink-0',
          styles.bg,
          styles.ring
        )}
      >
        <Icon className={cn('size-5', styles.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <ChevronRight
        className={cn(
          'size-5 text-muted-foreground transition-colors shrink-0',
          `group-hover:${styles.text}`
        )}
      />
    </ViewTransitionLink>
  );
};
