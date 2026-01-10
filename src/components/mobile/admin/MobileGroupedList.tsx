/**
 * Mobile Grouped List Component - iOS Settings Style
 *
 * A grouped list component that mimics the iOS Settings app design.
 * Features:
 * - iOS-style grouped sections with titles
 * - Card container with rounded corners (16px)
 * - Touch-friendly targets (min 44px height)
 * - Subtle dividers between items
 * - Active state feedback
 * - Respects reduced-motion preferences
 */

import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface MobileGroupedListProps {
  /** Optional section title displayed above the list */
  title?: string;
  /** List items to render inside the card */
  children: React.ReactNode;
  /** Optional action element (e.g., button) displayed next to the title */
  action?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export interface MobileListItemProps {
  /** Icon element to display on the left */
  icon?: React.ReactNode;
  /** Background color class for the icon container */
  iconBg?: string;
  /** Primary text content */
  title: string;
  /** Secondary text below the title */
  subtitle?: string;
  /** Value or element to display on the right side */
  value?: React.ReactNode;
  /** Whether to show a chevron indicator */
  showChevron?: boolean;
  /** Click handler - if provided, item becomes interactive */
  onClick?: () => void;
  /** Whether this is a destructive action (red text) */
  destructive?: boolean;
  /** Whether this is the first item in the group */
  first?: boolean;
  /** Whether this is the last item in the group */
  last?: boolean;
}

// ============================================================================
// MobileGroupedList Component
// ============================================================================

export const MobileGroupedList = ({
  title,
  children,
  action,
  className,
}: MobileGroupedListProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Section header with title and optional action */}
      {(title || action) && (
        <div className="flex items-center justify-between px-4">
          {title && (
            <h3 className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              {title}
            </h3>
          )}
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}

      {/* Card container for list items */}
      <div
        className={cn(
          'rounded-2xl overflow-hidden',
          'bg-card/60 backdrop-blur-sm',
          'shadow-sm shadow-black/5'
        )}
      >
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// MobileListItem Component
// ============================================================================

export const MobileListItem = ({
  icon,
  iconBg,
  title,
  subtitle,
  value,
  showChevron = false,
  onClick,
  destructive = false,
  first = false,
  last = false,
}: MobileListItemProps) => {
  // Determine if item is interactive
  const isInteractive = !!onClick;

  // Base element - button if interactive, div otherwise
  const Element = isInteractive ? 'button' : 'div';

  return (
    <Element
      onClick={onClick}
      type={isInteractive ? 'button' : undefined}
      className={cn(
        // Base layout
        'group relative flex w-full items-center gap-3 px-4 py-3',
        // Minimum touch target height
        'min-h-[52px]',
        // Border radius for first/last items
        first && last && 'rounded-2xl',
        first && !last && 'rounded-t-2xl',
        !first && last && 'rounded-b-2xl',
        // Divider between items (not on last item)
        !last && 'border-b border-border/30',
        // Interactive states
        isInteractive && [
          'cursor-pointer',
          'transition-colors duration-150',
          'motion-reduce:transition-none',
          'active:bg-muted/80',
        ],
        // Text alignment for button
        isInteractive && 'text-left'
      )}
    >
      {/* Icon container */}
      {icon && (
        <span
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
            'transition-colors duration-150',
            'motion-reduce:transition-none',
            iconBg || 'bg-muted/60',
            destructive && 'bg-destructive/10'
          )}
        >
          <span
            className={cn(
              'flex items-center justify-center',
              destructive ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {icon}
          </span>
        </span>
      )}

      {/* Content area */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'block text-sm font-medium',
            destructive ? 'text-destructive' : 'text-foreground'
          )}
        >
          {title}
        </span>
        {subtitle && (
          <span className="block text-sm text-muted-foreground truncate">
            {subtitle}
          </span>
        )}
      </div>

      {/* Right side value/accessory */}
      {value && (
        <span className="flex-shrink-0 text-sm text-muted-foreground">
          {value}
        </span>
      )}

      {/* Chevron indicator */}
      {showChevron && (
        <ChevronRight
          className={cn(
            'h-5 w-5 flex-shrink-0',
            destructive ? 'text-destructive/50' : 'text-muted-foreground/50'
          )}
          aria-hidden="true"
        />
      )}
    </Element>
  );
};
