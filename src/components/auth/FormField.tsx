/**
 * Auth Form Field Component
 * Reusable form field with label, input, and error message
 */

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Field label text */
  label: string;
  /** Error message to display */
  error?: string;
  /** Input type - supports password toggle */
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';
  /** Optional hint text below the field */
  hint?: string;
  /** Optional icon on the left side */
  leftIcon?: ReactNode;
  /** Toggle password visibility button text (for accessibility) */
  togglePasswordLabel?: string;
  /** Optional class for the field container */
  containerClassName?: string;
  /** Optional class for the label */
  labelClassName?: string;
  /** Optional class for error message */
  errorClassName?: string;
  /** Optional class for hint text */
  hintClassName?: string;
}

/**
 * Form field with integrated label, error display, and password toggle
 */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      type = 'text',
      hint,
      leftIcon,
      togglePasswordLabel = 'Toggle password visibility',
      containerClassName,
      labelClassName,
      errorClassName,
      hintClassName,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const fieldId = id || props.name;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {/* Label */}
        <LabelPrimitive.Root
          htmlFor={fieldId}
          className={cn('text-sm font-medium text-foreground', labelClassName)}
        >
          {label}
        </LabelPrimitive.Root>

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={fieldId}
            type={inputType}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
            className={cn(
              // Base layout
              'block w-full h-11',
              // Padding
              leftIcon ? 'pl-10' : 'pl-3.5',
              isPassword ? 'pr-11' : 'pr-3.5',
              // Typography
              'text-base sm:text-sm text-foreground placeholder:text-muted-foreground/60',
              // Shape & background
              'rounded-lg bg-background',
              // Ring border (Tailwind UI style)
              'border-0 ring-1 ring-inset ring-input shadow-sm',
              // Focus state
              'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary',
              // Error state
              'aria-[invalid=true]:ring-destructive/50 aria-[invalid=true]:focus:ring-destructive',
              // Hover
              'hover:ring-muted-foreground/40 focus:hover:ring-primary',
              // Disabled
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50',
              // Caret & selection
              'caret-primary selection:bg-primary/20',
              className
            )}
            {...props}
          />

          {/* Password toggle button */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center size-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label={togglePasswordLabel}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${fieldId}-error`}
            className={cn('text-sm text-destructive', errorClassName)}
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Hint text */}
        {hint && !error && (
          <p
            id={`${fieldId}-hint`}
            className={cn('text-sm text-muted-foreground', hintClassName)}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
