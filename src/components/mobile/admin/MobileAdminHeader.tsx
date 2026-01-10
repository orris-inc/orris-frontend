/**
 * Mobile Admin Header Component
 *
 * A compact iOS 26 Liquid Glass style header for mobile admin pages.
 * Features:
 * - Sticky positioning with safe area support
 * - Compact 48px height for maximum content space
 * - Glass elevated background with backdrop blur
 * - Optional back button with minimum touch target
 * - Support for custom right-side actions
 * - Respects prefers-reduced-motion
 */

import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileAdminHeaderProps {
  /** Header title text */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Show back navigation button */
  showBackButton?: boolean;
  /** Callback when back button is pressed */
  onBack?: () => void;
  /** Custom action element on the right side */
  action?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export const MobileAdminHeader = ({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  action,
  className,
}: MobileAdminHeaderProps) => {
  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <header
      className={cn(
        // Positioning - sticky with safe area
        'sticky top-0 z-30',
        // Sizing
        'h-12',
        // Glass effect background
        'glass-elevated',
        // Border
        'border-b border-border/50',
        // Safe area padding
        'pt-[env(safe-area-inset-top)]',
        className
      )}
    >
      <div
        className={cn(
          // Layout
          'flex items-center gap-3',
          // Sizing - full height minus safe area
          'h-12 px-4'
        )}
      >
        {/* Back button */}
        {showBackButton && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className={cn(
              // Touch target - minimum 44px
              'min-w-[44px] min-h-[44px]',
              // Center icon within touch target
              'flex items-center justify-center',
              // Negative margin to align visually while keeping touch target
              '-ml-2',
              // Interactive states
              'rounded-full',
              'active:bg-foreground/10',
              'transition-colors duration-150',
              'motion-reduce:transition-none',
              // Focus state
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
            )}
          >
            <ArrowLeft
              className="w-5 h-5 text-foreground"
              aria-hidden="true"
            />
          </button>
        )}

        {/* Title section - flex grow to fill space */}
        <div className="flex-1 min-w-0">
          <h1
            className={cn(
              'text-base font-semibold truncate',
              'text-foreground'
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right action slot */}
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </header>
  );
};

MobileAdminHeader.displayName = 'MobileAdminHeader';
