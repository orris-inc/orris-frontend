/**
 * Collapsible Component - Collapsible region component
 * Based on @radix-ui/react-collapsible
 */

import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { cn } from '@/lib/utils';

// ============================================================================
// Collapsible Root
// ============================================================================

const Collapsible = CollapsiblePrimitive.Root;

// ============================================================================
// CollapsibleTrigger
// ============================================================================

const CollapsibleTrigger = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.Trigger
    ref={ref}
    className={cn(
      'flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
      className,
    )}
    {...props}
  />
));
CollapsibleTrigger.displayName = CollapsiblePrimitive.Trigger.displayName;

// ============================================================================
// CollapsibleContent
// ============================================================================

const CollapsibleContent = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Content>,
  ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.Content
    ref={ref}
    className={cn(
      // CSS Grid trick for smooth height animation (0 to auto)
      'grid text-sm',
      // Grid row transition - smoother than keyframes for height
      'transition-[grid-template-rows,opacity]',
      'duration-[var(--spring-ios-default-duration)]',
      'ease-[var(--spring-ios-default)]',
      // Closed state: 0fr = 0 height
      'data-[state=closed]:grid-rows-[0fr] data-[state=closed]:opacity-0',
      // Open state: 1fr = auto height
      'data-[state=open]:grid-rows-[1fr] data-[state=open]:opacity-100',
      // Respect reduced motion preference
      'motion-reduce:transition-none',
      className,
    )}
    {...props}
  >
    {/* Inner wrapper must have overflow:hidden for grid trick to work */}
    <div className="overflow-hidden">{children}</div>
  </CollapsiblePrimitive.Content>
));
CollapsibleContent.displayName = CollapsiblePrimitive.Content.displayName;

// ============================================================================
// Exports
// ============================================================================

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
