/**
 * iOS 26 Liquid Glass Component
 *
 * A foundational component implementing Apple's Liquid Glass design system.
 * Features:
 * - Real-time backdrop blur with configurable intensity
 * - Adaptive backgrounds for light/dark mode
 * - Interactive press animations with spring physics
 * - Capsule/rounded shape variants
 * - Accessibility: respects prefers-reduced-motion
 */

import { cn } from '@/lib/utils';

type GlassVariant = 'regular' | 'elevated' | 'intense';
type GlassShape = 'rounded' | 'capsule' | 'circle';

interface LiquidGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Glass material variant affecting blur and opacity */
  variant?: GlassVariant;
  /** Shape of the glass container */
  shape?: GlassShape;
  /** Enable interactive press animations */
  interactive?: boolean;
  /** Custom border radius (overrides shape) */
  radius?: string | number;
}

const variantClasses: Record<GlassVariant, string> = {
  regular: 'glass',
  elevated: 'glass-elevated',
  intense: 'glass-intense',
};

const shapeClasses: Record<GlassShape, string> = {
  rounded: 'rounded-2xl',
  capsule: 'rounded-full',
  circle: 'rounded-full aspect-square',
};

export const LiquidGlass = ({
  variant = 'regular',
  shape = 'rounded',
  interactive = false,
  radius,
  className,
  style,
  children,
  ...props
}: LiquidGlassProps) => {
  const baseClass = interactive ? 'glass-interactive' : variantClasses[variant];

  return (
    <div
      className={cn(
        baseClass,
        !radius && shapeClasses[shape],
        className
      )}
      style={{
        ...style,
        ...(radius && { borderRadius: typeof radius === 'number' ? `${radius}px` : radius }),
      }}
      {...props}
    >
      {children}
    </div>
  );
};

LiquidGlass.displayName = 'LiquidGlass';

/**
 * GlassButton - iOS 26 style interactive glass button
 */
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon to display */
  icon?: React.ReactNode;
  /** Show label text */
  label?: string;
  /** Active/selected state */
  active?: boolean;
}

export const GlassButton = ({
  icon,
  label,
  active = false,
  className,
  children,
  ...props
}: GlassButtonProps) => {
  return (
    <button
      className={cn(
        'glass-interactive',
        'rounded-full',
        'flex items-center justify-center gap-2',
        'px-4 py-2.5 min-h-[44px]',
        'text-sm font-medium',
        'cursor-pointer select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        active && 'bg-primary/15 text-primary',
        className
      )}
      {...props}
    >
      {icon}
      {label && <span>{label}</span>}
      {children}
    </button>
  );
};

GlassButton.displayName = 'GlassButton';

/**
 * GlassContainer - Groups glass elements with shared morphing behavior
 * Similar to iOS 26's GlassEffectContainer
 */
interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Spacing between glass elements (affects morphing threshold) */
  spacing?: number;
  /** Orientation of contained elements */
  orientation?: 'horizontal' | 'vertical';
}

export const GlassContainer = ({
  spacing = 8,
  orientation = 'horizontal',
  className,
  style,
  children,
  ...props
}: GlassContainerProps) => {
  return (
    <div
      className={cn(
        'flex items-center',
        orientation === 'vertical' && 'flex-col',
        className
      )}
      style={{
        gap: spacing,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

GlassContainer.displayName = 'GlassContainer';
