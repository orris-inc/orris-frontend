/**
 * MobilePasswordInput Component
 * Mobile-optimized password input with visibility toggle
 * Features: Large touch targets (44px toggle), visibility toggle, error handling
 */

import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

export interface MobilePasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  /** Error message to display */
  error?: string;
  /** Whether password is visible */
  showPassword: boolean;
  /** Toggle password visibility */
  onToggleShow: () => void;
  /** Value change handler */
  onChange?: (value: string) => void;
  /** Input container className */
  containerClassName?: string;
}

export const MobilePasswordInput: React.FC<MobilePasswordInputProps> = ({
  error,
  showPassword,
  onToggleShow,
  onChange,
  disabled,
  className,
  containerClassName,
  ...props
}) => (
  <div className={cn('space-y-2', containerClassName)}>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Lock className="size-5" />
      </div>
      <input
        type={showPassword ? 'text' : 'password'}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        autoComplete="new-password"
        className={cn(
          // Base styles - larger for touch
          'w-full min-h-[52px] pl-12 pr-14 py-3',
          'text-base', // Prevent iOS zoom
          'rounded-xl border bg-background',
          'placeholder:text-muted-foreground/60',
          // Focus styles
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          // Error state
          error && 'border-destructive focus:ring-destructive/20 focus:border-destructive',
          // Disabled state
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      />
      <button
        type="button"
        onClick={onToggleShow}
        disabled={disabled}
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2',
          'min-h-[44px] min-w-[44px]', // Touch target
          'flex items-center justify-center',
          'rounded-lg',
          'text-muted-foreground hover:text-foreground',
          'active:bg-muted/50',
          'transition-colors',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
    {error && (
      <div className="flex items-center gap-1.5 text-destructive text-sm px-1" role="alert">
        <AlertCircle className="size-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    )}
  </div>
);

MobilePasswordInput.displayName = 'MobilePasswordInput';
