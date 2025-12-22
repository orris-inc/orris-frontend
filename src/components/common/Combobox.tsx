/**
 * Combobox Component - Searchable dropdown component
 * Replaces MUI Autocomplete, supports single and multiple selection
 */

import type { ReactNode } from 'react';
import { forwardRef, useState, useCallback, useMemo } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  renderOption?: (option: ComboboxOption) => ReactNode;
}

// ============================================================================
// Combobox
// ============================================================================

const Combobox = forwardRef<HTMLDivElement, ComboboxProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = '选择选项...',
      emptyText = '未找到结果',
      searchPlaceholder = '搜索...',
      multiple = false,
      disabled = false,
      className,
      renderOption,
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    // Filter options
    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase()),
    );

    // Get selected values (as array)
    const selectedValues = useMemo(
      () => (Array.isArray(value) ? value : value ? [value] : []),
      [value]
    );

    // Handle option selection
    const handleSelect = useCallback(
      (optionValue: string) => {
        if (multiple) {
          const newValues = selectedValues.includes(optionValue)
            ? selectedValues.filter((v) => v !== optionValue)
            : [...selectedValues, optionValue];
          onChange?.(newValues);
        } else {
          onChange?.(optionValue);
          setOpen(false);
          setSearch('');
        }
      },
      [multiple, selectedValues, onChange],
    );

    // Remove a single selected value
    const handleRemove = useCallback(
      (optionValue: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (multiple) {
          onChange?.(selectedValues.filter((v) => v !== optionValue));
        } else {
          onChange?.('');
        }
      },
      [multiple, selectedValues, onChange],
    );

    // Get display text
    const getDisplayText = () => {
      if (selectedValues.length === 0) return placeholder;
      if (multiple) {
        return `已选择 ${selectedValues.length} 项`;
      }
      return options.find((opt) => opt.value === selectedValues[0])?.label || placeholder;
    };

    return (
      <div ref={ref} className={cn('relative w-full', className)}>
        {/* Trigger */}
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>

        {/* Selected multi-select tags */}
        {multiple && selectedValues.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedValues.map((val) => {
              const option = options.find((opt) => opt.value === val);
              if (!option) return null;
              return (
                <span
                  key={val}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
                >
                  {option.label}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(val, e)}
                    className="hover:bg-secondary-foreground/20 rounded-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Dropdown content */}
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            {/* Search input */}
            <div className="mb-1 px-2">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Options list */}
            <div className="max-h-[300px] overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      disabled={option.disabled}
                      className={cn(
                        'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
                        isSelected && 'bg-accent text-accent-foreground',
                      )}
                    >
                      {isSelected && (
                        <Check className="mr-2 h-4 w-4 shrink-0" />
                      )}
                      <span className={cn(!isSelected && 'ml-6')}>
                        {renderOption ? renderOption(option) : option.label}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Click outside to close */}
        {open && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setSearch('');
            }}
          />
        )}
      </div>
    );
  },
);
Combobox.displayName = 'Combobox';

// ============================================================================
// Exports
// ============================================================================

export { Combobox };
