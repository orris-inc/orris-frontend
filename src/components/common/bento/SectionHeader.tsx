/**
 * Section Header Component
 * Reusable header for content sections with icon, title, and optional count/action
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
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div className="flex items-center gap-2">
        <Icon className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {(count !== undefined || secondaryCount !== undefined) && (
          <span className="text-sm text-muted-foreground">
            ({secondaryCount !== undefined ? `${count}/${secondaryCount}` : count})
          </span>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
