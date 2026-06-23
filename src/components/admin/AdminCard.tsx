/**
 * Admin Container Component
 * A simple container for content sections - not a decorative card
 * Following Tailwind UI Application UI patterns where tables/lists have their own borders
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface AdminCardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  /**
   * Container variants:
   * - default: transparent container (content provides its own styling)
   * - bordered: adds ring border (for sections that need visual separation)
   * - flush: no styling, just a wrapper
   */
  variant?: 'default' | 'bordered' | 'flush';
}

/**
 * Admin content container
 * Default is transparent - let the content (tables, lists) provide their own styling
 */
export const AdminCard = ({ children, className, noPadding, variant = 'default' }: AdminCardProps) => {
  // Flush variant - just a wrapper
  if (variant === 'flush') {
    return <div className={className}>{children}</div>;
  }

  const variants = {
    default: '', // Transparent container
    bordered: 'ring-1 ring-border/60 rounded-lg overflow-hidden shadow-[var(--surface-shadow)]',
  };

  return (
    <div
      className={cn(
        '@container',
        variants[variant],
        !noPadding && variant !== 'default' && 'p-4 @sm:p-6',
        className
      )}
    >
      {children}
    </div>
  );
};

export interface AdminCardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Section header - can be used independently
 */
export const AdminCardHeader = ({ title, description, action, className }: AdminCardHeaderProps) => {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

/**
 * Content wrapper
 */
export const AdminCardContent = ({ children, className }: { children: ReactNode; className?: string }) => {
  return <div className={cn(className)}>{children}</div>;
};
