/**
 * Section Header Component
 * Reusable header for content sections with icon, title, and optional count/action
 *
 * Mobile-first: stacked layout on mobile, horizontal on sm+
 */

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Section title */
  title: string;
  /** Optional count to display in parentheses */
  count?: number | string;
  /** Optional secondary count (e.g., "3/5") */
  secondaryCount?: number | string;
  /** Right-side action element (e.g., button, link) */
  action?: ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * Section header with icon, title, and optional count/action
 * Provides consistent styling for content sections
 */
export const SectionHeader = ({
  icon: Icon,
  title,
  count,
  secondaryCount,
  action,
  className,
}: SectionHeaderProps) => {
  return (
    <div
      className={cn(
        // Mobile: stacked layout with gap
        'flex flex-col items-start gap-2',
        // sm+: horizontal layout
        'sm:flex-row sm:items-center sm:justify-between',
        'mb-4',
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="size-5 text-muted-foreground shrink-0" />
        <h2 className="text-lg font-semibold text-foreground truncate">{title}</h2>
        {(count !== undefined || secondaryCount !== undefined) && (
          <span className="text-sm text-muted-foreground shrink-0">
            ({secondaryCount !== undefined ? `${count}/${secondaryCount}` : count})
          </span>
        )}
      </div>
      {action && (
        <div className="shrink-0 -ml-0.5 sm:ml-0">{action}</div>
      )}
    </div>
  );
};
