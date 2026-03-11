/**
 * MobileEmptyState - Empty state component for mobile lists
 *
 * Tailwind Application UI style:
 * - Centered content with icon
 * - Title and description
 * - Optional action button
 */

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface MobileEmptyStateProps {
  /** Icon component to display */
  icon: LucideIcon;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button config */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    /** Button variant (default: primary) */
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

export const MobileEmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: MobileEmptyStateProps) => {
  const ActionIcon = action?.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="size-6 text-muted-foreground" />
      </div>

      <h3 className="text-[15px] font-semibold text-foreground mb-1">{title}</h3>

      {description && (
        <p className="text-xs text-muted-foreground mb-6 max-w-xs">
          {description}
        </p>
      )}

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cn(
            'inline-flex items-center gap-2',
            'px-4 py-2 rounded-lg text-[13px] font-medium min-h-[44px]',
            'transition-colors motion-reduce:transition-none',
            action.variant === 'secondary'
              ? 'bg-muted text-foreground hover:bg-muted/80'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {ActionIcon && <ActionIcon className="size-4" />}
          {action.label}
        </button>
      )}
    </div>
  );
};

MobileEmptyState.displayName = 'MobileEmptyState';
