/**
 * ResponsiveModal Component
 *
 * Automatically switches between Dialog (desktop) and Sheet (mobile)
 * based on screen size. Provides a unified API for both modes.
 *
 * Best Practice:
 * - Header: Fixed at top
 * - Body: Scrollable content area
 * - Footer: Fixed at bottom (for action buttons)
 *
 * Usage:
 * ```tsx
 * <ResponsiveModal open={open} onOpenChange={setOpen}>
 *   <ResponsiveModalHeader>
 *     <ResponsiveModalTitle>Title</ResponsiveModalTitle>
 *   </ResponsiveModalHeader>
 *   <ResponsiveModalBody>
 *     {content}
 *   </ResponsiveModalBody>
 *   <ResponsiveModalFooter>
 *     <Button>Submit</Button>
 *   </ResponsiveModalFooter>
 * </ResponsiveModal>
 * ```
 */

import { createContext, useContext } from 'react';
import { useMediaQuery } from '@/hooks';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './Dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from './sheet/Sheet';

// ============================================================================
// Context
// ============================================================================

interface ResponsiveModalContextValue {
  isMobile: boolean;
}

const ResponsiveModalContext = createContext<ResponsiveModalContextValue>({
  isMobile: false,
});

const useResponsiveModal = () => useContext(ResponsiveModalContext);

// ============================================================================
// Root
// ============================================================================

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Custom class for the content container */
  className?: string;
  /** Max width for dialog mode (default: max-w-lg) */
  maxWidth?: string;
}

export const ResponsiveModal = ({
  open,
  onOpenChange,
  children,
  className,
  maxWidth = 'max-w-lg',
}: ResponsiveModalProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return (
      <ResponsiveModalContext.Provider value={{ isMobile: true }}>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent showClose keyboardAware className={className}>
            {children}
          </SheetContent>
        </Sheet>
      </ResponsiveModalContext.Provider>
    );
  }

  return (
    <ResponsiveModalContext.Provider value={{ isMobile: false }}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            // Layout: flex column with max height
            'flex flex-col max-h-[90vh]',
            maxWidth,
            className
          )}
        >
          {children}
        </DialogContent>
      </Dialog>
    </ResponsiveModalContext.Provider>
  );
};

// ============================================================================
// Header
// ============================================================================

interface ResponsiveModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveModalHeader = ({
  children,
  className,
}: ResponsiveModalHeaderProps) => {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return <SheetHeader className={className}>{children}</SheetHeader>;
  }

  return (
    <DialogHeader className={cn('flex-shrink-0', className)}>
      {children}
    </DialogHeader>
  );
};

// ============================================================================
// Title
// ============================================================================

interface ResponsiveModalTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveModalTitle = ({
  children,
  className,
}: ResponsiveModalTitleProps) => {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return <SheetTitle className={className}>{children}</SheetTitle>;
  }

  return <DialogTitle className={className}>{children}</DialogTitle>;
};

// ============================================================================
// Description
// ============================================================================

interface ResponsiveModalDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveModalDescription = ({
  children,
  className,
}: ResponsiveModalDescriptionProps) => {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return <SheetDescription className={className}>{children}</SheetDescription>;
  }

  return <DialogDescription className={className}>{children}</DialogDescription>;
};

// ============================================================================
// Body
// ============================================================================

interface ResponsiveModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveModalBody = ({
  children,
  className,
}: ResponsiveModalBodyProps) => {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return <SheetBody className={className}>{children}</SheetBody>;
  }

  // Dialog body - scrollable with flex-1 to fill available space
  return (
    <div
      className={cn(
        // Flex behavior: grow to fill, allow shrinking
        'flex-1 min-h-0',
        // Scrolling
        'overflow-y-auto',
        // Padding (negative margin to offset DialogContent padding)
        '-mx-6 px-6 py-4',
        className
      )}
    >
      {children}
    </div>
  );
};

// ============================================================================
// Footer
// ============================================================================

interface ResponsiveModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveModalFooter = ({
  children,
  className,
}: ResponsiveModalFooterProps) => {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return <SheetFooter className={className}>{children}</SheetFooter>;
  }

  return (
    <DialogFooter className={cn('flex-shrink-0 pt-4 border-t mt-4 -mx-6 px-6', className)}>
      {children}
    </DialogFooter>
  );
};

// ============================================================================
// Exports
// ============================================================================

export { useResponsiveModal };
