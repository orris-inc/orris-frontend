/**
 * Admin Button Component
 * Modern style with refined shadows and smooth interactions
 * Based on Radix UI Slot, supports asChild mode
 */

import { forwardRef, ReactNode, ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  asChild?: boolean;
}

/**
 * Admin standard button
 * Unified visual style and interaction effects
 */
export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      children,
      className,
      disabled,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center gap-2 font-medium',
      'transition-all duration-200 ease-out',
      'active:scale-[0.97]',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
    );

    const variants = {
      primary: cn(
        'bg-primary',
        'text-primary-foreground',
        'shadow-md shadow-primary/20',
        'hover:bg-primary/90',
        'hover:shadow-lg hover:shadow-primary/30',
        'ring-1 ring-primary/10'
      ),
      secondary: cn(
        'bg-secondary',
        'text-secondary-foreground',
        'hover:bg-secondary/80',
        'ring-1 ring-border'
      ),
      outline: cn(
        'bg-background/50',
        'backdrop-blur-sm',
        'border border-border',
        'text-foreground',
        'hover:bg-accent',
        'hover:border-border/80'
      ),
      ghost: cn(
        'text-foreground',
        'hover:bg-accent'
      ),
      danger: cn(
        'bg-destructive',
        'text-destructive-foreground',
        'shadow-md shadow-destructive/30',
        'hover:bg-destructive/90',
        'hover:shadow-lg hover:shadow-destructive/40',
        'ring-1 ring-destructive/20'
      ),
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-5 py-2.5 text-sm rounded-xl',
      lg: 'px-6 py-3 text-base rounded-xl',
    };

    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children}
      </Comp>
    );
  }
);

AdminButton.displayName = 'AdminButton';
