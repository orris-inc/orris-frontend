/**
 * Sheet Component - iOS 26 Liquid Glass Edition
 *
 * Mobile-friendly bottom drawer powered by Vaul.
 * Features:
 * - Native iOS-like gesture handling (swipe to dismiss)
 * - Physics-based spring animations
 * - Snap points support
 * - Automatic keyboard avoidance
 * - Safe area support for notched devices
 * - Respects prefers-reduced-motion
 *
 * @see https://github.com/emilkowalski/vaul
 */

import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

// Re-export Vaul's Drawer as Sheet for API compatibility
export const Sheet = Drawer.Root;
export const SheetTrigger = Drawer.Trigger;
export const SheetPortal = Drawer.Portal;
export const SheetClose = Drawer.Close;

// Overlay - Backdrop layer with iOS 26 blur
interface SheetOverlayProps extends ComponentPropsWithoutRef<typeof Drawer.Overlay> {}

export const SheetOverlay = ({ className, ...props }: SheetOverlayProps) => (
  <Drawer.Overlay
    className={cn(
      'fixed inset-0 z-50',
      'bg-black/30 backdrop-blur-sm',
      className
    )}
    {...props}
  />
);
SheetOverlay.displayName = 'SheetOverlay';

// Content - Sheet main container (slides up from bottom)
interface SheetContentProps extends ComponentPropsWithoutRef<typeof Drawer.Content> {
  /** Show close button in header */
  showClose?: boolean;
  /** Show drag handle indicator */
  showHandle?: boolean;
  // Legacy props for backward compatibility (ignored with Vaul)
  isDragging?: boolean;
  overlayStyle?: React.CSSProperties;
  sheetStyle?: React.CSSProperties;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  overlayRef?: React.RefObject<HTMLElement | null>;
  sheetRef?: React.RefObject<HTMLElement | null>;
}

export const SheetContent = ({
  className,
  children,
  showClose = true,
  showHandle = true,
  // Ignore legacy props - Vaul handles everything
  isDragging: _isDragging,
  overlayStyle: _overlayStyle,
  sheetStyle: _sheetStyle,
  contentRef: _contentRef,
  overlayRef: _overlayRef,
  sheetRef: _sheetRef,
  ...props
}: SheetContentProps) => {
  return (
    <SheetPortal>
      <SheetOverlay />
      <Drawer.Content
        className={cn(
          // Base styles - iOS 26 Liquid Glass
          'fixed z-50 glass-elevated',
          'border-t border-border/50',
          // Position - bottom sheet
          'inset-x-0 bottom-0',
          // Size - full width, max height with safe area
          'w-full max-h-[96vh]',
          // Shape - iOS 26 larger corner radius
          'rounded-t-3xl',
          // Layout
          'flex flex-col',
          // Safe area padding for iOS
          'pb-[env(safe-area-inset-bottom)]',
          // Focus outline
          'outline-none',
          className
        )}
        {...props}
      >
        {/* Drag handle indicator - iOS 26 style */}
        {showHandle && (
          <Drawer.Handle className="mx-auto mt-4 mb-2 h-1.5 w-12 rounded-full bg-foreground/20" />
        )}
        {children}
        {showClose && (
          <Drawer.Close
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
          </Drawer.Close>
        )}
      </Drawer.Content>
    </SheetPortal>
  );
};
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
}: ComponentPropsWithoutRef<typeof Drawer.Title>) => (
  <Drawer.Title
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
}: ComponentPropsWithoutRef<typeof Drawer.Description>) => (
  <Drawer.Description
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
