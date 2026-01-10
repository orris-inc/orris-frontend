/**
 * Sheet Component - Vaul Best Practices Edition
 *
 * Mobile-friendly bottom drawer powered by Vaul.
 * @see https://vaul.emilkowal.ski
 * @see https://github.com/emilkowalski/vaul
 *
 * Key Features:
 * - Native iOS-like gesture handling (swipe to dismiss)
 * - Built-in scroll handling (only draggable when scrolled to top)
 * - Keyboard avoidance via repositionInputs
 * - Safe area support for notched devices
 *
 * Usage Notes:
 * - For forms with inputs: repositionInputs handles keyboard automatically
 * - For scrollable content: use SheetBody which has data-vaul-no-drag
 * - scrollLockTimeout prevents accidental close after fast scrolling
 */

import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

// ============================================================================
// Sheet Root
// ============================================================================

/**
 * Sheet Root - Wrapper with sensible defaults
 *
 * Default behavior:
 * - modal={true}: Prevents outside interaction
 * - dismissible={true}: Can close via drag/click/ESC
 * - repositionInputs={true}: Handles mobile keyboard automatically
 * - scrollLockTimeout={500}: Prevents accidental close after scrolling
 *
 * Override any prop as needed:
 * - handleOnly={true}: Only drag from handle (for complex scrollable content)
 * - repositionInputs={false}: Disable if you handle keyboard yourself
 */
export const Sheet = Drawer.Root;

export const SheetTrigger = Drawer.Trigger;
export const SheetPortal = Drawer.Portal;
export const SheetClose = Drawer.Close;

// ============================================================================
// Sheet Overlay
// ============================================================================

type SheetOverlayProps = ComponentPropsWithoutRef<typeof Drawer.Overlay>;

export const SheetOverlay = ({ className, ...props }: SheetOverlayProps) => (
  <Drawer.Overlay
    className={cn('fixed inset-0 z-50 bg-black/40', className)}
    {...props}
  />
);
SheetOverlay.displayName = 'SheetOverlay';

// ============================================================================
// Sheet Content
// ============================================================================

interface SheetContentProps extends ComponentPropsWithoutRef<typeof Drawer.Content> {
  /** Show close button (default: true) */
  showClose?: boolean;
  /** Show drag handle indicator (default: true) */
  showHandle?: boolean;
}

/**
 * Sheet Content - Main container
 *
 * Layout: Handle -> Children -> Close Button
 * Uses flex column with max-h-[85vh] for keyboard space
 */
export const SheetContent = ({
  className,
  children,
  showClose = true,
  showHandle = true,
  ...props
}: SheetContentProps) => (
  <SheetPortal>
    <SheetOverlay />
    <Drawer.Content
      className={cn(
        // Position & z-index
        'fixed inset-x-0 bottom-0 z-50',
        // Size - leave space for keyboard
        'w-full max-h-[85vh]',
        // Shape
        'rounded-t-2xl',
        // Background
        'bg-background border-t border-border',
        // Layout
        'flex flex-col',
        // Safe area for iOS
        'pb-[env(safe-area-inset-bottom)]',
        // Focus
        'outline-none',
        className
      )}
      {...props}
    >
      {/* Drag handle - always visible for affordance */}
      {showHandle && (
        <Drawer.Handle className="mx-auto mt-3 mb-2 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
      )}

      {children}

      {/* Close button - absolute positioned */}
      {showClose && (
        <Drawer.Close
          className={cn(
            'absolute right-3 top-3',
            'size-9 rounded-full',
            'flex items-center justify-center',
            'text-muted-foreground hover:text-foreground',
            'hover:bg-muted/80 active:bg-muted',
            'transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <X className="size-5" />
          <span className="sr-only">Close</span>
        </Drawer.Close>
      )}
    </Drawer.Content>
  </SheetPortal>
);
SheetContent.displayName = 'SheetContent';

// ============================================================================
// Sheet Header
// ============================================================================

export const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 px-6 pb-4', className)}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

// ============================================================================
// Sheet Title & Description
// ============================================================================

export const SheetTitle = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Drawer.Title>) => (
  <Drawer.Title
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
);
SheetTitle.displayName = 'SheetTitle';

export const SheetDescription = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Drawer.Description>) => (
  <Drawer.Description
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
);
SheetDescription.displayName = 'SheetDescription';

// ============================================================================
// Sheet Body - Scrollable Content Area
// ============================================================================

/**
 * Sheet Body - Scrollable content area
 *
 * Key features:
 * - data-vaul-no-drag: Prevents drag-to-close while scrolling
 * - overscroll-contain: Prevents scroll chaining
 * - Grows to fill available space
 *
 * Vaul's built-in behavior: Only allows drag-to-close when scrolled to top
 */
export const SheetBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-vaul-no-drag
    className={cn(
      // Flex behavior
      'flex-1 min-h-0',
      // Scrolling
      'overflow-y-auto overscroll-contain',
      // Padding
      'px-6',
      className
    )}
    {...props}
  />
);
SheetBody.displayName = 'SheetBody';

// ============================================================================
// Sheet Footer
// ============================================================================

/**
 * Sheet Footer - Fixed at bottom
 *
 * Use for action buttons that should always be visible
 */
export const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex-shrink-0',
      'flex flex-col gap-3',
      'px-6 pt-4 pb-2',
      'border-t border-border',
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';
