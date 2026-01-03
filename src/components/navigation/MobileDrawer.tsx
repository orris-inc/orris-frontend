/**
 * Mobile Drawer Navigation Component
 *
 * Slide-out navigation drawer for mobile devices.
 * Features:
 * - Smooth slide animation with backdrop blur
 * - Clear visual hierarchy with brand header
 * - Touch-friendly targets (min 44px)
 * - Active state with left border indicator
 * - Respects reduced-motion preferences
 */

import { useMemo } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as Separator from '@radix-ui/react-separator';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { NavigationItem } from '../../types/navigation.types';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
  brandName?: string;
}

export const MobileDrawer = ({
  open,
  onClose,
  navigationItems,
  brandName = 'Orris',
}: MobileDrawerProps) => {
  const location = useLocation();

  const renderNavigationItems = useMemo(() => {
    return navigationItems.map((item) => {
      if (item.divider) {
        return (
          <Separator.Root
            key={item.id}
            className="my-3 shrink-0 bg-border h-px w-full"
          />
        );
      }

      const Icon = item.icon;
      const isActive = location.pathname === item.path;

      return (
        <RouterLink
          key={item.id}
          to={item.path}
          onClick={onClose}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            // Base styles
            'group relative flex items-center gap-3 rounded-lg px-3 py-3',
            // Touch target
            'min-h-[44px]',
            // Transition
            'transition-all duration-200 ease-out',
            'motion-reduce:transition-none',
            // States
            isActive
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground active:bg-accent active:text-foreground',
            // Disabled state
            item.disabled && 'pointer-events-none opacity-50'
          )}
        >
          {/* Left border indicator for active state */}
          <span
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full',
              'transition-all duration-200 ease-out',
              'motion-reduce:transition-none',
              isActive ? 'h-6 bg-primary-foreground' : 'h-0 bg-transparent'
            )}
            aria-hidden="true"
          />
          {Icon && (
            <Icon
              className={cn(
                'h-5 w-5 flex-shrink-0',
                isActive ? 'text-primary-foreground' : 'text-muted-foreground'
              )}
              aria-hidden="true"
            />
          )}
          <span className="text-sm font-medium">{item.label}</span>
        </RouterLink>
      );
    });
  }, [navigationItems, location.pathname, onClose]);

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'motion-reduce:animate-none'
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex h-full w-[280px] flex-col',
            'border-r bg-background shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:duration-200 data-[state=open]:duration-300',
            'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
            'motion-reduce:animate-none'
          )}
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Dialog.Title className="text-lg font-bold text-foreground">
              {brandName}
            </Dialog.Title>
            <Dialog.Close
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                'text-muted-foreground transition-colors duration-200',
                'hover:bg-accent hover:text-foreground',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'motion-reduce:transition-none'
              )}
            >
              <X className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Close menu</span>
            </Dialog.Close>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav
              className="space-y-1 px-3"
              role="navigation"
              aria-label="Mobile navigation"
            >
              {renderNavigationItems}
            </nav>
          </div>

          {/* Footer hint */}
          <div className="border-t px-4 py-3">
            <p className="text-xs text-muted-foreground text-center">
              Swipe or tap outside to close
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
