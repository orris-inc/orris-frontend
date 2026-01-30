/**
 * MobileActionButton - iOS Style Action Button for Mobile Cards
 *
 * A reusable action button component following iOS Human Interface Guidelines:
 * - Touch-friendly size with minimum 44px height (iOS HIG standard)
 * - Clear visual hierarchy with variant styles
 * - Smooth press feedback with scale animation
 * - Supports default, primary, success, warning, and destructive variants
 */

import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export type MobileActionButtonVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive';

export type MobileActionButtonSize = 'sm' | 'md';

export interface MobileActionButtonProps {
  /** Icon element to display */
  icon: React.ReactNode;
  /** Button label text */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button variant style */
  variant?: MobileActionButtonVariant;
  /** Button size */
  size?: MobileActionButtonSize;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Variant Styles
// ============================================================================

const variantStyles: Record<MobileActionButtonVariant, string> = {
  default: cn(
    'bg-muted/80 text-foreground',
    'active:bg-muted'
  ),
  primary: cn(
    'bg-primary text-primary-foreground',
    'active:bg-primary/90'
  ),
  success: cn(
    'bg-success/15 text-success',
    'active:bg-success/25'
  ),
  warning: cn(
    'bg-warning/15 text-warning',
    'active:bg-warning/25'
  ),
  destructive: cn(
    'bg-destructive/10 text-destructive',
    'active:bg-destructive/20'
  ),
};

const sizeStyles: Record<MobileActionButtonSize, string> = {
  sm: 'h-8 px-2 gap-1 text-xs rounded-lg',
  md: 'h-11 min-h-[44px] px-4 gap-1.5 text-sm rounded-xl',
};

// ============================================================================
// Component
// ============================================================================

export const MobileActionButton = ({
  icon,
  label,
  onClick,
  variant = 'default',
  size = 'sm',
  disabled = false,
  className,
}: MobileActionButtonProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center',
        'font-medium',
        'transition-all duration-150',
        'touch-manipulation',
        // Active feedback
        'active:scale-[0.98]',
        // Focus
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        // Size styles
        sizeStyles[size],
        // Variant styles
        variantStyles[variant],
        // Disabled state
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

MobileActionButton.displayName = 'MobileActionButton';
