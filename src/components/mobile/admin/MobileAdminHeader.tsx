/**
 * iOS-style Mobile Navigation Bar Component
 *
 * A navigation bar following iOS Human Interface Guidelines:
 * - Centered title (17pt semibold)
 * - Left/right action slots with fixed width for symmetry
 * - Optional back button with iOS chevron style
 * - Glass morphism background with backdrop blur
 * - Safe area support for notch/dynamic island
 * - Optional Large Title mode with scroll-driven collapse
 */

import { ChevronLeft } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface MobileAdminHeaderProps {
  /** Navigation bar title (centered) */
  title: string;
  /** Show iOS-style back button with chevron */
  showBackButton?: boolean;
  /** Back button label (default: "Back") */
  backLabel?: string;
  /** Callback when back button is pressed */
  onBack?: () => void;
  /** Left side custom action (replaces back button if provided) */
  leftAction?: React.ReactNode;
  /** Right side custom action */
  rightAction?: React.ReactNode;
  /** Enable Large Title mode (iOS-style expandable title) */
  largeTitleEnabled?: boolean;
  /** Container element or ref for scroll tracking (required for Large Title) */
  scrollContainer?: React.RefObject<HTMLElement | null>;
  /** Additional CSS classes for the header */
  className?: string;
}

export const MobileAdminHeader = ({
  title,
  showBackButton = false,
  backLabel,
  onBack,
  leftAction,
  rightAction,
  largeTitleEnabled = false,
  scrollContainer,
  className,
}: MobileAdminHeaderProps) => {
  // Track scroll progress for Large Title collapse animation
  const [scrollProgress, setScrollProgress] = useState(0);
  const largeTitleRef = useRef<HTMLDivElement>(null);

  // Large Title collapse threshold (scroll distance to fully collapse)
  const COLLAPSE_THRESHOLD = 52;

  // Handle scroll for Large Title mode
  const handleScroll = useCallback(() => {
    if (!largeTitleEnabled) return;

    const container = scrollContainer?.current ?? window;
    const scrollY =
      container instanceof Window
        ? container.scrollY
        : (container as HTMLElement).scrollTop;

    const progress = Math.min(1, Math.max(0, scrollY / COLLAPSE_THRESHOLD));
    setScrollProgress(progress);
  }, [largeTitleEnabled, scrollContainer]);

  useEffect(() => {
    if (!largeTitleEnabled) return;

    const container = scrollContainer?.current ?? window;
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [largeTitleEnabled, scrollContainer, handleScroll]);

  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  // Back button component - iOS chevron style
  const BackButton = () => (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      className={cn(
        'flex items-center gap-0.5',
        'h-11 min-w-[44px] px-1',
        'text-primary',
        'active:opacity-50',
        'transition-opacity motion-reduce:transition-none',
        '-ml-2' // Align chevron with edge visually
      )}
    >
      <ChevronLeft className="size-[28px] -mr-1" strokeWidth={2.5} />
      {backLabel && (
        <span className="text-[17px]">{backLabel}</span>
      )}
    </button>
  );

  // Standard title opacity - fades in as Large Title collapses
  const standardTitleOpacity = largeTitleEnabled ? scrollProgress : 1;
  // Large Title opacity and scale - fades out and shrinks as user scrolls
  const largeTitleOpacity = 1 - scrollProgress;
  const largeTitleScale = 1 - scrollProgress * 0.15;

  return (
    <div className={cn('sticky top-0 z-30', className)}>
      {/* Standard Navigation Bar */}
      <header
        className={cn(
          // Glass background
          'glass-elevated',
          'border-b border-border/40',
          // Safe area padding for notch
          'pt-[env(safe-area-inset-top)]',
          // Hide bottom border when Large Title is visible
          largeTitleEnabled && scrollProgress < 1 && 'border-b-transparent'
        )}
      >
        <nav
          className={cn(
            'flex items-center',
            'h-11 px-2' // 44px iOS standard height
          )}
        >
          {/* Left section - fixed width for symmetry */}
          <div className="w-20 flex-shrink-0 flex items-center">
            {leftAction ? (
              leftAction
            ) : showBackButton ? (
              <BackButton />
            ) : null}
          </div>

          {/* Center section - title */}
          <div className="flex-1 flex justify-center min-w-0">
            <h1
              className={cn(
                'text-[17px] font-semibold leading-tight',
                'text-foreground truncate',
                'transition-opacity duration-200 motion-reduce:transition-none'
              )}
              style={{ opacity: standardTitleOpacity }}
            >
              {title}
            </h1>
          </div>

          {/* Right section - fixed width for symmetry */}
          <div className="w-20 flex-shrink-0 flex items-center justify-end">
            {rightAction}
          </div>
        </nav>
      </header>

      {/* Large Title section (iOS-style) */}
      {largeTitleEnabled && (
        <div
          ref={largeTitleRef}
          className={cn(
            'glass-elevated',
            'border-b border-border/40',
            'px-4 pb-2',
            'overflow-hidden',
            'transition-[border-color] duration-200'
          )}
          style={{
            opacity: largeTitleOpacity,
            transform: `scale(${largeTitleScale})`,
            transformOrigin: 'left center',
            height: largeTitleOpacity > 0 ? 'auto' : 0,
            paddingBottom: largeTitleOpacity > 0 ? undefined : 0,
          }}
        >
          <h1
            className={cn(
              'text-[34px] font-bold leading-tight',
              'text-foreground'
            )}
          >
            {title}
          </h1>
        </div>
      )}
    </div>
  );
};

MobileAdminHeader.displayName = 'MobileAdminHeader';
