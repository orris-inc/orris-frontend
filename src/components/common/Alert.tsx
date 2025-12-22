/**
 * Alert Component - Alert notification component
 * Supports multiple variants: default, destructive, warning, success, info
 */

import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// Alert Variants
// ============================================================================

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        warning:
          'border-yellow-500/50 text-yellow-900 dark:text-yellow-400 dark:border-yellow-500 [&>svg]:text-yellow-900 dark:[&>svg]:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30',
        success:
          'border-green-500/50 text-green-900 dark:text-green-400 dark:border-green-500 [&>svg]:text-green-900 dark:[&>svg]:text-green-400 bg-green-50 dark:bg-green-950/30',
        info: 'border-blue-500/50 text-blue-900 dark:text-blue-400 dark:border-blue-500 [&>svg]:text-blue-900 dark:[&>svg]:text-blue-400 bg-blue-50 dark:bg-blue-950/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

// ============================================================================
// Alert Root
// ============================================================================

interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  ),
);
Alert.displayName = 'Alert';

// ============================================================================
// AlertTitle
// ============================================================================

const AlertTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

// ============================================================================
// AlertDescription
// ============================================================================

const AlertDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

// ============================================================================
// Exports
// ============================================================================

export { Alert, AlertTitle, AlertDescription };
