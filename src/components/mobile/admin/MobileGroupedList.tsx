/**
 * Mobile Grouped List Component - iOS Settings Style
 *
 * A grouped list component that mimics the iOS Settings app design.
 * Features:
 * - iOS-style grouped sections with titles
 * - Card container with rounded corners (8px)
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
    <div className={cn('space-y-1.5', className)}>
      {/* Section header with title and optional action */}
      {(title || action) && (
        <div className="flex items-center justify-between px-3">
          {title && (
            <h3 className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              {title}
            </h3>
          )}
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}

      {/* Card container for list items */}
      <div
        className={cn(
          'rounded-lg overflow-hidden',
          'bg-card',
          'ring-1 ring-border/60'
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
        // Base layout - more compact
        'group relative flex w-full items-center gap-2.5 px-3 py-2',
        // Minimum touch target height (iOS standard)
        'min-h-[44px]',
        // Border radius for first/last items
        first && last && 'rounded-lg',
        first && !last && 'rounded-t-lg',
        !first && last && 'rounded-b-lg',
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
      {/* Icon container - smaller for higher density */}
      {icon && (
        <span
          className={cn(
            'flex size-8 flex-shrink-0 items-center justify-center rounded-lg',
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
            'block text-[13px] font-medium',
            destructive ? 'text-destructive' : 'text-foreground'
          )}
        >
          {title}
        </span>
        {subtitle && (
          <span className="block text-xs text-muted-foreground truncate">
            {subtitle}
          </span>
        )}
      </div>

      {/* Right side value/accessory */}
      {value && (
        <span className="flex-shrink-0 text-xs text-muted-foreground">
          {value}
        </span>
      )}

      {/* Chevron indicator */}
      {showChevron && (
        <ChevronRight
          className={cn(
            'size-4 flex-shrink-0',
            destructive ? 'text-destructive/50' : 'text-muted-foreground/50'
          )}
          aria-hidden="true"
        />
      )}
    </Element>
  );
};
