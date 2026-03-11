/**
 * Mobile Forward Rule Filters Sheet
 * Bottom sheet for advanced filtering on mobile
 */

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
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Label';
import { cn } from '@/lib/utils';
import type { ForwardRuleFilters } from '../hooks/useForwardRules';

// ============================================================================
// Types
// ============================================================================

export interface MobileForwardRuleFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ForwardRuleFilters;
  onFiltersChange: (filters: Partial<ForwardRuleFilters>) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  /** Include user-created rules toggle */
  includeUserRules?: boolean;
  onIncludeUserRulesChange?: (include: boolean) => void;
}

// Sort options
const SORT_OPTIONS = [
  { value: 'sort_order_asc', label: 'admin.forwardRules.sortOptions.default' },
  { value: 'created_at_desc', label: 'admin.forwardRules.sortOptions.createdDesc' },
  { value: 'created_at_asc', label: 'admin.forwardRules.sortOptions.createdAsc' },
  { value: 'updated_at_desc', label: 'admin.forwardRules.sortOptions.updatedDesc' },
];

// ============================================================================
// Filter Button (Trigger)
// ============================================================================

export interface MobileFilterButtonProps {
  hasFilters: boolean;
  onClick?: () => void;
}

export const MobileFilterButton = ({ hasFilters, onClick }: MobileFilterButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'size-10 rounded-lg shrink-0',
        'flex items-center justify-center',
        'ring-1 ring-border bg-background',
        'hover:bg-muted active:bg-muted/80 active:scale-[0.98]',
        'transition-colors relative',
        'pointer-coarse:size-11'
      )}
    >
      <Filter className="size-4 text-muted-foreground" />
      {hasFilters && (
        <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-primary" />
      )}
    </button>
  );
};

// ============================================================================
// Main Sheet Component
// ============================================================================

export const MobileForwardRuleFiltersSheet = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  hasFilters,
  onClearFilters,
  includeUserRules = false,
  onIncludeUserRulesChange,
}: MobileForwardRuleFiltersSheetProps) => {
  const { t } = useTranslation();

  // Handle protocol change
  const handleProtocolChange = (value: string) => {
    onFiltersChange({
      protocol: value === 'all' ? undefined : (value as 'tcp' | 'udp' | 'both'),
    });
  };

  // Handle status change
  const handleStatusChange = (value: string) => {
    onFiltersChange({
      status: value === 'all' ? undefined : (value as 'enabled' | 'disabled'),
    });
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    const lastUnderscoreIndex = value.lastIndexOf('_');
    const orderBy = value.substring(0, lastUnderscoreIndex);
    const order = value.substring(lastUnderscoreIndex + 1) as 'asc' | 'desc';
    onFiltersChange({ orderBy, order });
  };

  // Get current sort value
  const getSortValue = (): string => {
    if (!filters.orderBy) return 'sort_order_asc';
    return `${filters.orderBy}_${filters.order || 'desc'}`;
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
            <span>{t('common.actions.filter')}</span>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground -mr-2"
              >
                <X className="size-4 mr-1" />
                {t('filter.clearAdvanced')}
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="py-4 space-y-3">
          {/* Protocol filter */}
          <div className="space-y-2">
            <Label>{t('common.protocol')}</Label>
            <Select
              value={filters.protocol ?? 'all'}
              onValueChange={handleProtocolChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('common.protocol')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter.all')}</SelectItem>
                <SelectItem value="tcp">TCP</SelectItem>
                <SelectItem value="udp">UDP</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status filter */}
          <div className="space-y-2">
            <Label>{t('common.status.label')}</Label>
            <Select
              value={filters.status ?? 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('common.status.label')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter.all')}</SelectItem>
                <SelectItem value="enabled">{t('common.status.enabled')}</SelectItem>
                <SelectItem value="disabled">{t('common.status.disabled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort filter */}
          <div className="space-y-2">
            <Label>{t('admin.forwardRules.sortLabel')}</Label>
            <Select value={getSortValue()} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User rules toggle */}
          {onIncludeUserRulesChange && (
            <div className="flex items-center justify-between py-2">
              <Label className="cursor-pointer">
                {t('admin.forwardRules.showUserRules')}
              </Label>
              <Switch
                checked={includeUserRules}
                onCheckedChange={onIncludeUserRulesChange}
              >
                <SwitchThumb />
              </Switch>
            </div>
          )}
        </SheetBody>

        <SheetFooter>
          <Button className="w-full active:scale-[0.98]" onClick={handleApply}>
            {t('common.actions.apply')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

MobileForwardRuleFiltersSheet.displayName = 'MobileForwardRuleFiltersSheet';
