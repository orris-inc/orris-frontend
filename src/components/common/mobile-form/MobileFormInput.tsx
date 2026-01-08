/**
 * MobileFormInput Component
 * Mobile-optimized form input with icon support and error handling
 * Features: Large touch targets (52px), icon positioning, error display
 */

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface MobileFormInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Left icon element */
  icon?: ReactNode;
  /** Right side element (e.g., toggle button) */
  rightElement?: ReactNode;
  /** Error message to display */
  error?: string;
  /** Value change handler */
  onChange?: (value: string) => void;
  /** Input container className */
  containerClassName?: string;
}

export const MobileFormInput: React.FC<MobileFormInputProps> = ({
  icon,
  rightElement,
  error,
  onChange,
  disabled,
  className,
  containerClassName,
  ...props
}) => (
  <div className={cn('space-y-2', containerClassName)}>
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}
      <input
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        className={cn(
          // Base styles - larger for touch
          'w-full min-h-[52px] py-3',
          'text-base', // Prevent iOS zoom
          'rounded-xl border bg-background',
          'placeholder:text-muted-foreground/60',
          // Padding based on icon/rightElement presence
          icon ? 'pl-12' : 'pl-4',
          rightElement ? 'pr-14' : 'pr-4',
          // Focus styles
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          // Error state
          error && 'border-destructive focus:ring-destructive/20 focus:border-destructive',
          // Disabled state
          disabled && 'opacity-50 cursor-not-allowed bg-muted',
          className
        )}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightElement}</div>
      )}
    </div>
    {error && (
      <div className="flex items-center gap-1.5 text-destructive text-sm px-1" role="alert">
        <AlertCircle className="size-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    )}
  </div>
);

MobileFormInput.displayName = 'MobileFormInput';
