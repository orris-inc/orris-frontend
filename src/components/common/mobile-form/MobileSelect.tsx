/**
 * MobileSelect Component
 * Mobile-optimized select dropdown using Radix UI
 * Features: Large touch targets (52px), icon support, color indicators
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface MobileSelectOption {
  value: string;
  label: string;
  /** Optional color indicator (Tailwind class, e.g., 'bg-emerald-500') */
  color?: string;
}

export interface MobileSelectProps {
  /** Current selected value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Available options */
  options: MobileSelectOption[];
  /** Left icon element */
  icon?: ReactNode;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className for trigger */
  className?: string;
}

export const MobileSelect: React.FC<MobileSelectProps> = ({
  value,
  onChange,
  options,
  icon,
  placeholder,
  disabled,
  className,
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative">
      {/* Icon - positioned outside SelectTrigger */}
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-muted-foreground pointer-events-none">
          {icon}
        </div>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          className={cn(
            'w-full min-h-[52px] py-3',
            'text-base rounded-xl border bg-background',
            'focus:ring-2 focus:ring-primary/20 focus:border-primary',
            '[&>span]:flex [&>span]:items-center [&>span]:gap-2',
            icon && 'pl-12',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <SelectValue placeholder={placeholder}>
            {selectedOption && (
              <span className="flex items-center gap-2">
                {selectedOption.color && (
                  <span
                    className={cn('size-2.5 rounded-full flex-shrink-0', selectedOption.color)}
                  />
                )}
                {selectedOption.label}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={4}
          className="w-[var(--radix-select-trigger-width)] rounded-xl overflow-hidden"
        >
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className={cn(
                'min-h-[48px] py-3 px-4 text-base cursor-pointer',
                'focus:bg-accent rounded-lg mx-1 my-0.5',
                'pl-10' // Space for check icon
              )}
            >
              <span className="flex items-center gap-2">
                {opt.color && (
                  <span className={cn('size-2.5 rounded-full flex-shrink-0', opt.color)} />
                )}
                {opt.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

MobileSelect.displayName = 'MobileSelect';
