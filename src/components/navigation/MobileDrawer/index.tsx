/**
 * Mobile Drawer Navigation Component - Tailwind Application UI Edition
 *
 * A clean, accessible slide-out navigation drawer for mobile devices.
 * Follows Tailwind UI Application Shell patterns with Vaul for native gestures.
 *
 * Features:
 * - Clean off-canvas design following Tailwind UI patterns
 * - Native iOS-like swipe gestures (powered by Vaul)
 * - Clear visual hierarchy with grouped navigation
 * - Touch-friendly targets (min 44px)
 * - Quick actions footer (theme, logout)
 * - Respects reduced-motion preferences
 * - Safe area insets support for notched devices
 *
 * @see https://github.com/emilkowalski/vaul
 */

import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Drawer } from 'vaul';
import { cn } from '@/lib/utils';

import { MobileDrawerHeader } from './MobileDrawerHeader';
import { MobileDrawerNav } from './MobileDrawerNav';
import { MobileDrawerFooter } from './MobileDrawerFooter';

import type { MobileDrawerProps } from './types';

export const MobileDrawer = ({
  open,
  onClose,
  navigationItems,
  user,
  showAdminSwitch = false,
  isAdminView = false,
  title,
  serverVersion,
  clientVersion,
  onAdminClick,
  onLogout,
}: MobileDrawerProps) => {
  const navigate = useNavigate();

  // Smart scroll detection for drag-to-close
  const navListRef = useRef<HTMLDivElement>(null);
  const [isNavScrolled, setIsNavScrolled] = useState(false);

  const handleNavScroll = useCallback(() => {
    const navList = navListRef.current;
    if (!navList) return;
    const scrolled = navList.scrollTop > 1;
    if (scrolled !== isNavScrolled) {
      setIsNavScrolled(scrolled);
    }
  }, [isNavScrolled]);

  // Navigate and close drawer
  const handleNavigation = useCallback(
    (path: string) => {
      onClose();
      requestAnimationFrame(() => {
        navigate(path);
      });
    },
    [navigate, onClose]
  );

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      direction="left"
    >
      <Drawer.Portal>
        {/* Backdrop overlay */}
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/30" />

        {/* Drawer panel */}
        <Drawer.Content
          className={cn(
            // Positioning
            'fixed inset-y-0 left-0 z-50',
            'w-full max-w-xs',
            // Layout
            'flex flex-col',
            // IMPORTANT: Vaul best practice - prevent content overflow
            'overflow-hidden',
            // Background - clean solid background (Tailwind UI style)
            'bg-background',
            // Border
            'border-r border-border',
            // Shadow
            'shadow-xl',
            // Focus outline
            'outline-none',
            // Safe area
            'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]'
          )}
        >
          {/* Header */}
          <MobileDrawerHeader
            user={user}
            title={title}
            onClose={onClose}
          />

          {/* Navigation - Smart drag control: only block when scrolled */}
          <div
            ref={navListRef}
            data-vaul-no-drag={isNavScrolled || undefined}
            onScroll={handleNavScroll}
            className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide px-3 py-4"
          >
            <MobileDrawerNav
              items={navigationItems}
              isGrouped={isAdminView}
              onNavigate={handleNavigation}
            />
          </div>

          {/* Footer - Actions */}
          <MobileDrawerFooter
            showAdminSwitch={showAdminSwitch}
            isAdminView={isAdminView}
            serverVersion={serverVersion}
            clientVersion={clientVersion}
            onAdminClick={onAdminClick}
            onLogout={onLogout}
            onClose={onClose}
          />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

// Re-export types for convenience
export type { MobileDrawerProps, MobileDrawerUser } from './types';
