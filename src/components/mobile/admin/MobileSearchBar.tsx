/**
 * MobileSearchBar - Search bar for mobile admin pages
 *
 * Features:
 * - Two variants: 'ios' (default) and 'outline' (Tailwind Application UI style)
 * - Search icon prefix
 * - Clear button when has value
 * - Focus state transitions
 */

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MobileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Style variant: 'ios' (rounded, filled) or 'outline' (bordered) */
  variant?: 'ios' | 'outline';
}

export const MobileSearchBar = ({
  value,
  onChange,
  onClear,
  placeholder = '',
  className,
  disabled = false,
  variant = 'ios',
}: MobileSearchBarProps) => {
  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  const isOutline = variant === 'outline';

  return (
    <div
      className={cn(
        'relative',
        isOutline ? 'w-full' : 'flex items-center gap-2 h-10 px-3',
        !isOutline && 'bg-muted/50 rounded-xl focus-within:bg-muted/70',
        'transition-colors',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      <Search
        className={cn(
          'text-muted-foreground shrink-0',
          isOutline
            ? 'absolute left-3 top-1/2 -translate-y-1/2 size-4 pointer-events-none'
            : 'size-4'
        )}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'flex-1 min-w-0 bg-transparent',
          'text-sm text-foreground placeholder:text-muted-foreground',
          'focus:outline-none disabled:cursor-not-allowed',
          isOutline && [
            'w-full h-10 pl-9 pr-9',
            'bg-background border border-input rounded-lg',
            'focus:ring-2 focus:ring-ring focus:ring-offset-1',
          ]
        )}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            'flex items-center justify-center',
            isOutline
              ? 'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted'
              : 'size-5 rounded-full bg-muted-foreground/20'
          )}
        >
          <X
            className={cn(
              'text-muted-foreground',
              isOutline ? 'size-4' : 'size-3'
            )}
          />
        </button>
      )}
    </div>
  );
};

MobileSearchBar.displayName = 'MobileSearchBar';
