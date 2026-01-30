/**
 * Empty State Component
 * Reusable empty state card with icon, title, description, and action
 */

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ColorVariant = 'primary' | 'warning' | 'muted';

interface EmptyStateProps {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Main title */
  title: string;
  /** Description text */
  description: string;
  /** Color variant for icon */
  variant?: ColorVariant;
  /** Action element (e.g., button, link) */
  action?: ReactNode;
  /** Additional className */
  className?: string;
}

const variantStyles: Record<ColorVariant, { bg: string; text: string }> = {
  primary: {
    bg: 'bg-muted/50',
    text: 'text-muted-foreground/50',
  },
  warning: {
    bg: 'bg-warning/10',
    text: 'text-warning',
  },
  muted: {
    bg: 'bg-muted/50',
    text: 'text-muted-foreground/50',
  },
};

/**
 * Empty state display with centered layout
 * Used when no data is available or user needs to take action
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  variant = 'muted',
  action,
  className,
}: EmptyStateProps) => {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        '@container flex flex-col items-center justify-center',
        'py-12 @sm:py-16 px-4 rounded-xl bg-card ring-1 ring-border',
        className
      )}
    >
      <div
        className={cn(
          'size-16 @sm:size-20 rounded-full flex items-center justify-center mb-4',
          styles.bg
        )}
      >
        <Icon className={cn('size-8 @sm:size-10', styles.text)} />
      </div>
      <h3 className="text-base font-medium text-foreground mb-1 text-center">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
        {description}
      </p>
      {action}
    </div>
  );
};
