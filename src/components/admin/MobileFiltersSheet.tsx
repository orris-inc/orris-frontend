/**
 * Mobile Filters Sheet Component
 * Generic bottom sheet for advanced filtering on mobile
 *
 * Features:
 * - Configurable filter fields via FilterConfig
 * - Clear all filters button
 * - Apply button to close sheet
 * - Filter trigger button with active indicator
 */

import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/common/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Label';
import { cn } from '@/lib/utils';
import type { FilterConfig, FilterValues } from './SelectFilters';

// ============================================================================
// Types
// ============================================================================

export interface MobileFiltersSheetProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Open state change handler */
  onOpenChange: (open: boolean) => void;
  /** Array of filter configurations */
  filters: FilterConfig[];
  /** Current filter values */
  values: FilterValues;
  /** Filter values change handler */
  onChange: (values: Partial<FilterValues>) => void;
  /** Sheet title (i18n key, default: 'common.actions.filter') */
  title?: string;
  /** Clear button label (i18n key) */
  clearLabel?: string;
  /** Apply button label (i18n key) */
  applyLabel?: string;
  /** Additional content in the sheet body */
  children?: ReactNode;
}

// ============================================================================
// Filter Trigger Button
// ============================================================================

export interface MobileFilterButtonProps {
  /** Whether any filter is active */
  hasFilters: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional class names */
  className?: string;
}

export const MobileFilterButton = ({
  hasFilters,
  onClick,
  className,
}: MobileFilterButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'size-10 rounded-lg shrink-0',
        'flex items-center justify-center',
        'border border-input bg-background',
        'hover:bg-muted active:bg-muted/80',
        'transition-colors relative',
        'pointer-coarse:size-11',
        className
      )}
    >
      <Filter className="size-4 text-muted-foreground" />
      {hasFilters && (
        <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-primary" />
      )}
    </button>
  );
};

MobileFilterButton.displayName = 'MobileFilterButton';

// ============================================================================
// Main Sheet Component
// ============================================================================

export const MobileFiltersSheet = ({
  open,
  onOpenChange,
  filters,
  values,
  onChange,
  title = 'common.actions.filter',
  clearLabel = 'filter.clearAdvanced',
  applyLabel = 'common.actions.apply',
  children,
}: MobileFiltersSheetProps) => {
  const { t } = useTranslation();

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return filters.some((f) => values[f.key] !== undefined);
  }, [filters, values]);

  // Handle single filter change
  const handleFilterChange = (key: string, value: string) => {
    onChange({ [key]: value === 'all' ? undefined : value });
  };

  // Clear all filters
  const clearFilters = () => {
    const cleared: FilterValues = {};
    filters.forEach((f) => {
      cleared[f.key] = undefined;
    });
    onChange(cleared);
  };

  // Apply and close
  const handleApply = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[85vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center justify-between">
            <span>{t(title)}</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground -mr-2"
              >
                <X className="size-4 mr-1" />
                {t(clearLabel)}
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="py-4 space-y-5">
          {filters.map((config) => (
            <div key={config.key} className="space-y-2">
              <Label>{t(config.placeholder)}</Label>
              <Select
                value={values[config.key] ?? 'all'}
                onValueChange={(value) => handleFilterChange(config.key, value)}
              >
                <SelectTrigger className="w-full">
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
            </div>
          ))}

          {children}
        </SheetBody>

        <SheetFooter>
          <Button className="w-full" onClick={handleApply}>
            {t(applyLabel)}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

MobileFiltersSheet.displayName = 'MobileFiltersSheet';

