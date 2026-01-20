/**
 * MobileDataCard - iOS 26 Liquid Glass styled data card for mobile admin views
 *
 * Replaces table rows with touch-friendly cards featuring:
 * - Always visible header with primary info and status badges
 * - Optional expandable details section (accordion mode)
 * - Bottom action buttons area
 * - Respects prefers-reduced-motion
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/common/Collapsible';
import { MobileActionButton, type MobileActionButtonVariant } from './MobileActionButton';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface MobileDataCardAction {
  /** Icon element to display */
  icon: React.ReactNode;
  /** Button label text */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button variant style */
  variant?: MobileActionButtonVariant;
}

export interface MobileDataCardProps {
  /** Primary header content (always visible) */
  header: React.ReactNode;
  /** Status badges to display alongside header */
  badges?: React.ReactNode;
  /** Expandable details content */
  details?: React.ReactNode;
  /** Action buttons for card footer */
  actions?: MobileDataCardAction[];
  /** Enable accordion expand/collapse behavior */
  expandable?: boolean;
  /** Initial expanded state */
  defaultExpanded?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export const MobileDataCard = ({
  header,
  badges,
  details,
  actions,
  expandable = false,
  defaultExpanded = false,
  className,
}: MobileDataCardProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Determine if card should be expandable
  const canExpand = expandable && details;

  // Card container classes - iOS 26 Liquid Glass style
  const cardClasses = cn(
    'bg-card/60 backdrop-blur-sm',
    'rounded-2xl',
    'border border-border/50',
    'overflow-hidden',
    className
  );

  // Header section classes - optimized for mobile density
  const headerClasses = cn(
    'px-3 py-2.5 min-h-[48px]',
    'flex items-center justify-between gap-2.5',
    canExpand && 'cursor-pointer'
  );

  // Chevron icon classes with rotation animation (iOS spring timing)
  const chevronClasses = cn(
    'size-4 text-muted-foreground shrink-0',
    'transition-transform duration-[var(--spring-ios-default-duration)] ease-[var(--spring-ios-default)]',
    // Respect reduced motion preference
    'motion-reduce:transition-none',
    isExpanded && 'rotate-180'
  );

  // Expandable card content
  if (canExpand) {
    return (
      <Collapsible
        open={isExpanded}
        onOpenChange={setIsExpanded}
        className={cardClasses}
      >
        {/* Header - always visible, acts as trigger */}
        <CollapsibleTrigger className={headerClasses}>
          <div className="flex-1 min-w-0">{header}</div>
          <div className="flex items-center gap-2 shrink-0">
            {badges}
            <ChevronDown className={chevronClasses} />
          </div>
        </CollapsibleTrigger>

        {/* Expandable details section */}
        <CollapsibleContent className="px-0">
          <div className="border-t border-border/30 px-3 py-2.5">{details}</div>
        </CollapsibleContent>

        {/* Actions section (if provided) */}
        {actions && actions.length > 0 && (
          <div className="border-t border-border/30 px-3 py-2.5">
            <div className="flex gap-2 flex-wrap">
              {actions.map((action, index) => (
                <MobileActionButton
                  key={index}
                  icon={action.icon}
                  label={action.label}
                  onClick={action.onClick}
                  variant={action.variant}
                />
              ))}
            </div>
          </div>
        )}
      </Collapsible>
    );
  }

  // Non-expandable card content
  return (
    <div className={cardClasses}>
      {/* Header section */}
      <div className={headerClasses}>
        <div className="flex-1 min-w-0">{header}</div>
        {badges && <div className="flex items-center gap-2 shrink-0">{badges}</div>}
      </div>

      {/* Details section (if provided, always visible) */}
      {details && (
        <div className="border-t border-border/30 px-3 py-2.5">{details}</div>
      )}

      {/* Actions section (if provided) */}
      {actions && actions.length > 0 && (
        <div className="border-t border-border/30 px-3 py-2.5">
          <div className="flex gap-2 flex-wrap">
            {actions.map((action, index) => (
              <MobileActionButton
                key={index}
                icon={action.icon}
                label={action.label}
                onClick={action.onClick}
                variant={action.variant}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

MobileDataCard.displayName = 'MobileDataCard';
