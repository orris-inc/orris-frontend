/**
 * Sheet Component - iOS 26 Liquid Glass Edition
 *
 * Mobile-friendly bottom drawer based on Radix UI Dialog.
 * Features:
 * - iOS 26 Liquid Glass material design
 * - Spring-based animations
 * - Optimized for touch interactions
 * - Safe area support for notched devices
 * - Respects prefers-reduced-motion
 */

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

// Root - Sheet container
export const Sheet = DialogPrimitive.Root;

// Trigger - Button or element that opens the Sheet
export const SheetTrigger = DialogPrimitive.Trigger;

// Portal - Mounts Sheet content outside the DOM tree
export const SheetPortal = DialogPrimitive.Portal;

// Close - Button or element that closes the Sheet
export const SheetClose = DialogPrimitive.Close;

// Overlay - Backdrop layer with iOS 26 blur
export const SheetOverlay = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50',
      'bg-black/30 backdrop-blur-xl',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'motion-reduce:animate-none',
      className
    )}
    {...props}
  />
);
SheetOverlay.displayName = 'SheetOverlay';

// Content - Sheet main container (slides up from bottom)
interface SheetContentProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Show close button in header */
  showClose?: boolean;
}

export const SheetContent = ({
  className,
  children,
  showClose = true,
  ...props
}: SheetContentProps) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      className={cn(
        // Base styles - iOS 26 Liquid Glass
        'fixed z-50 glass-elevated',
        'border-b-0 border-x-0',
        // Position - bottom sheet
        'inset-x-0 bottom-0',
        // Size - full width, max height with safe area
        'w-full max-h-[90vh]',
        // Shape - iOS 26 larger corner radius
        'rounded-t-3xl',
        // Layout
        'flex flex-col',
        // Safe area padding for iOS
        'pb-[env(safe-area-inset-bottom)]',
        // Animation - iOS 26 spring timing
        'duration-[var(--duration-normal)] ease-[var(--spring-bounce)]',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        'motion-reduce:animate-none',
        className
      )}
      {...props}
    >
      {/* Drag handle indicator - iOS 26 style */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-9 h-1.5 rounded-full bg-foreground/20" />
      </div>
      {children}
      {showClose && (
        <DialogPrimitive.Close
          className={cn(
            'absolute right-4 top-4',
            'min-h-[44px] min-w-[44px]', // Touch target
            'flex items-center justify-center',
            'rounded-full glass-interactive',
            'text-muted-foreground',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            'motion-reduce:transition-none'
          )}
        >
          <X className="size-5" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </SheetPortal>
);
SheetContent.displayName = 'SheetContent';

// Header - Sheet header container
export const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 px-6 pb-4',
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

// Title - Sheet title
export const SheetTitle = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
);
SheetTitle.displayName = 'SheetTitle';

// Description - Sheet description text
export const SheetDescription = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
);
SheetDescription.displayName = 'SheetDescription';

// Body - Scrollable content area
export const SheetBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex-1 overflow-y-auto px-6',
      // Smooth scrolling with momentum
      '-webkit-overflow-scrolling-touch',
      className
    )}
    {...props}
  />
);
SheetBody.displayName = 'SheetBody';

// Footer - Sheet footer container (sticky at bottom)
export const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col gap-3 px-6 pt-4 pb-2',
      'border-t border-border/50',
      // Sticky footer with glass effect
      'sticky bottom-0',
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';
