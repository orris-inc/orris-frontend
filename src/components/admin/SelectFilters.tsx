/**
 * Select Filters Component
 * Generic select-based filtering components for admin pages
 *
 * Features:
 * - Single SelectFilter for individual filter
 * - SelectFiltersGroup for combining multiple filters
 * - Clear all filters button
 * - Fully customizable through configuration
 */

import { useMemo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

/** Single filter option */
export interface FilterOption {
  /** Option value */
  value: string;
  /** Display label (can be i18n key) */
  label: string;
  /** Whether to translate the label (default: true) */
  translate?: boolean;
}

/** Filter configuration */
export interface FilterConfig {
  /** Unique filter key */
  key: string;
  /** Placeholder text (i18n key) */
  placeholder: string;
  /** Trigger width class (e.g., 'w-[120px]') */
  width?: string;
  /** Available options */
  options: FilterOption[];
  /** "All" option label (i18n key, default: 'filter.all') */
  allLabel?: string;
}

/** Filter values record */
export type FilterValues = Record<string, string | undefined>;

// ============================================================================
// Single Select Filter
// ============================================================================

export interface SelectFilterProps {
  /** Filter configuration */
  config: FilterConfig;
  /** Current value */
  value?: string;
  /** Value change handler */
  onChange: (value: string | undefined) => void;
  /** Additional class names */
  className?: string;
}

export const SelectFilter = ({
  config,
  value,
  onChange,
  className,
}: SelectFilterProps) => {
  const { t } = useTranslation();

  const handleChange = (newValue: string) => {
    onChange(newValue === 'all' ? undefined : newValue);
  };

  return (
    <Select value={value ?? 'all'} onValueChange={handleChange}>
      <SelectTrigger className={cn('h-9', config.width ?? 'w-[120px]', className)}>
        <SelectValue placeholder={t(config.placeholder)} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t(config.allLabel ?? 'filter.all')}</SelectItem>
        {config.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.translate === false ? option.label : t(option.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

SelectFilter.displayName = 'SelectFilter';

// ============================================================================
// Select Filters Group
// ============================================================================

export interface SelectFiltersGroupProps {
  /** Array of filter configurations */
  filters: FilterConfig[];
  /** Current filter values */
  values: FilterValues;
  /** Filter values change handler */
  onChange: (values: Partial<FilterValues>) => void;
  /** Show clear button when filters are active (default: true) */
  showClearButton?: boolean;
  /** Clear button label (i18n key) */
  clearLabel?: string;
  /** Additional content after filters */
  children?: ReactNode;
  /** Additional class names */
  className?: string;
}

export const SelectFiltersGroup = ({
  filters,
  values,
  onChange,
  showClearButton = true,
  clearLabel = 'filter.clearAdvanced',
  children,
  className,
}: SelectFiltersGroupProps) => {
  const { t } = useTranslation();

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return filters.some((f) => values[f.key] !== undefined);
  }, [filters, values]);

  // Handle single filter change
  const handleFilterChange = (key: string, value: string | undefined) => {
    onChange({ [key]: value });
  };

  // Clear all filters
  const clearFilters = () => {
    const cleared: FilterValues = {};
    filters.forEach((f) => {
      cleared[f.key] = undefined;
    });
    onChange(cleared);
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {filters.map((config) => (
        <SelectFilter
          key={config.key}
          config={config}
          value={values[config.key]}
          onChange={(value) => handleFilterChange(config.key, value)}
        />
      ))}

      {children}

      {showClearButton && hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground h-9"
        >
          <X className="size-4 mr-1" />
          {t(clearLabel)}
        </Button>
      )}
    </div>
  );
};

SelectFiltersGroup.displayName = 'SelectFiltersGroup';

