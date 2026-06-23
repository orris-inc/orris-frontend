/**
 * Sheet Component - Vaul Best Practices Edition
 *
 * Mobile-friendly bottom drawer powered by Vaul.
 * @see https://vaul.emilkowal.ski
 * @see https://github.com/emilkowalski/vaul
 *
 * Key Features:
 * - Native iOS-like gesture handling (swipe to dismiss)
 * - Smart scroll detection: swipe-to-close works from anywhere when content is at top
 * - Visual Viewport API for keyboard avoidance
 * - Safe area support for notched devices
 *
 * Usage Notes:
 * - For forms with inputs: keyboardAware mode handles keyboard automatically
 * - For scrollable content: use SheetBody which intelligently handles drag vs scroll
 *   - When scrollTop === 0: allows swipe-to-close from anywhere in the content
 *   - When scrollTop > 0: blocks drag to allow normal scrolling
 * - scrollLockTimeout prevents accidental close after fast scrolling
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
 * - scrollLockTimeout={500}: Prevents accidental close after scrolling
 * - repositionInputs={false}: Disabled because we handle keyboard via Visual Viewport API
 *
 * Override any prop as needed:
 * - handleOnly={true}: Only drag from handle (for complex scrollable content)
 */
type SheetProps = React.ComponentProps<typeof Drawer.Root>;

export const Sheet = ({ repositionInputs = false, ...props }: SheetProps) => (
  <Drawer.Root repositionInputs={repositionInputs} {...props} />
);

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
  /** Enable keyboard-aware positioning using Visual Viewport API (default: true) */
  keyboardAware?: boolean;
}

/**
 * Sheet Content - Main container
 *
 * Layout: Handle -> Children -> Close Button
 *
 * Keyboard Handling:
 * - Uses Visual Viewport API to track viewport changes
 * - Positions Sheet at the top of the keyboard using visualViewport offset
 * - Works reliably on iOS Safari
 */
export const SheetContent = ({
  className,
  children,
  showClose = true,
  showHandle = true,
  keyboardAware = true,
  style,
  ...props
}: SheetContentProps) => {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);

  // iOS Safari keyboard handling using Visual Viewport API
  // Mimics Vaul's internal approach: adjust height and bottom position
  useEffect(() => {
    if (!keyboardAware) return;

    const content = contentRef.current;
    const vv = window.visualViewport;
    if (!content || !vv) return;

    const updatePosition = () => {
      // Calculate keyboard height
      const keyboardHeight = window.innerHeight - vv.height;
      const hasKeyboard = keyboardHeight > 100; // threshold

      if (hasKeyboard) {
        // Vaul-style positioning: adjust height and bottom
        // This keeps the drawer above the keyboard
        const maxSheetHeight = vv.height * 0.85;
        content.style.height = `${maxSheetHeight}px`;
        content.style.bottom = `${keyboardHeight}px`;
      } else {
        // Reset to CSS defaults
        content.style.height = '';
        content.style.bottom = '';
      }
    };

    // Initial update
    updatePosition();

    // Listen for viewport changes
    vv.addEventListener('resize', updatePosition);
    vv.addEventListener('scroll', updatePosition);

    return () => {
      vv.removeEventListener('resize', updatePosition);
      vv.removeEventListener('scroll', updatePosition);
      // Cleanup styles
      content.style.height = '';
      content.style.bottom = '';
    };
  }, [keyboardAware]);

  return (
    <SheetPortal>
      <SheetOverlay />
      <Drawer.Content
        ref={contentRef}
        className={cn(
          // Position & z-index
          'fixed inset-x-0 bottom-0 z-50',
          // Size - use dvh for dynamic viewport
          'w-full max-h-[85vh] max-h-[85dvh]',
          // Shape
          'rounded-t-2xl',
          // Background
          'bg-background border-t border-border shadow-[var(--surface-shadow-lg)]',
          // Layout
          'flex flex-col',
          // Safe area for iOS (JS will override when keyboard is visible)
          'pb-[env(safe-area-inset-bottom)]',
          // Focus
          'outline-none',
          className
        )}
        style={style}
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
            <span className="sr-only">{t('common.actions.close')}</span>
          </Drawer.Close>
        )}
      </Drawer.Content>
    </SheetPortal>
  );
};
SheetContent.displayName = 'SheetContent';

// ============================================================================
// Sheet Header
// ============================================================================

/**
 * Sheet Header - Fixed at top
 *
 * Use for title and description that should always be visible
 */
export const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex-shrink-0 flex flex-col space-y-1.5 px-6 pb-4', className)}
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
 * Sheet Body - Scrollable content area with keyboard-aware scrolling
 *
 * Key features:
 * - Smart drag detection: Only prevents drag-to-close when content is scrolled
 * - When scrolled to top (scrollTop === 0), allows swipe down to close from anywhere
 * - When scrolled (scrollTop > 0), prevents drag to allow normal scrolling
 * - overscroll-contain: Prevents scroll chaining
 * - Auto-scrolls focused inputs into view (iOS keyboard handling)
 * - Grows to fill available space
 */
export const SheetBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  // Track whether content is scrolled - only block drag when scrolled
  const [isScrolled, setIsScrolled] = useState(false);

  // Smart scroll detection - allow drag when at top, block when scrolled
  const handleScroll = useCallback(() => {
    const body = bodyRef.current;
    if (!body) return;

    // Use a small threshold to avoid floating-point issues
    const scrolled = body.scrollTop > 1;
    if (scrolled !== isScrolled) {
      setIsScrolled(scrolled);
    }
  }, [isScrolled]);

  // Handle focus events to scroll inputs into view
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    const scrollInputIntoView = (input: HTMLElement) => {
      // Get input position relative to scroll container
      const bodyRect = body.getBoundingClientRect();
      const inputRect = input.getBoundingClientRect();

      // Calculate where input is relative to the scroll container
      const inputTop = inputRect.top - bodyRect.top + body.scrollTop;
      const inputBottom = inputTop + inputRect.height;

      // Visible area within the scroll container
      const visibleTop = body.scrollTop;
      const visibleBottom = visibleTop + body.clientHeight;

      // Check if input is fully visible
      if (inputTop < visibleTop || inputBottom > visibleBottom) {
        // Scroll to center the input in the visible area
        const targetScroll = inputTop - (body.clientHeight / 2) + (inputRect.height / 2);
        body.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth',
        });
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;

      // Only handle input-like elements
      const isInput = target.tagName === 'INPUT' ||
                      target.tagName === 'TEXTAREA' ||
                      target.tagName === 'SELECT' ||
                      target.isContentEditable;
      if (!isInput) return;

      // Multiple attempts to handle iOS keyboard animation timing
      // iOS keyboard animation takes ~300ms
      setTimeout(() => scrollInputIntoView(target), 100);
      setTimeout(() => scrollInputIntoView(target), 350);
      setTimeout(() => scrollInputIntoView(target), 500);
    };

    body.addEventListener('focusin', handleFocusIn);
    return () => body.removeEventListener('focusin', handleFocusIn);
  }, []);

  return (
    <div
      ref={bodyRef}
      // Smart drag control: only block drag when content is scrolled
      // When at top (scrollTop === 0), allow swipe-to-close from anywhere
      data-vaul-no-drag={isScrolled || undefined}
      onScroll={handleScroll}
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
};
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
