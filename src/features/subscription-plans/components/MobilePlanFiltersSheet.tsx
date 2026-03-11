/**
 * Mobile Plan Filters Sheet
 * Bottom sheet for advanced filtering on mobile
 */

import { useMemo } from 'react';
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
import type { PlanStatus, PlanType } from '@/api/subscription/types';
import type { SubscriptionPlanFilters } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface MobilePlanFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: SubscriptionPlanFilters;
  onFiltersChange: (filters: Partial<SubscriptionPlanFilters>) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
}

// Plan type options
const PLAN_TYPE_OPTIONS: { value: PlanType; label: string }[] = [
  { value: 'node', label: 'common.planType.node' },
  { value: 'forward', label: 'common.planType.forward' },
  { value: 'hybrid', label: 'common.planType.hybrid' },
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

export const MobilePlanFiltersSheet = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  hasFilters,
  onClearFilters,
}: MobilePlanFiltersSheetProps) => {
  const { t } = useTranslation();

  // Handle status change
  const handleStatusChange = (value: string) => {
    onFiltersChange({
      status: value === 'all' ? undefined : (value as PlanStatus),
    });
  };

  // Handle visibility change
  const handleVisibilityChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({ isPublic: undefined });
    } else {
      onFiltersChange({ isPublic: value === 'public' });
    }
  };

  // Handle plan type change
  const handlePlanTypeChange = (value: string) => {
    onFiltersChange({
      planType: value === 'all' ? undefined : (value as PlanType),
    });
  };

  // Get current visibility value for select
  const visibilityValue = useMemo(() => {
    if (filters.isPublic === undefined) return 'all';
    return filters.isPublic ? 'public' : 'private';
  }, [filters.isPublic]);

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
                <SelectItem value="active">{t('common.status.enabled')}</SelectItem>
                <SelectItem value="inactive">{t('common.status.disabled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visibility filter */}
          <div className="space-y-2">
            <Label>{t('filter.visibility')}</Label>
            <Select value={visibilityValue} onValueChange={handleVisibilityChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('filter.visibility')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter.allVisibility')}</SelectItem>
                <SelectItem value="public">{t('admin.plans.public')}</SelectItem>
                <SelectItem value="private">{t('admin.plans.private')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Plan type filter */}
          <div className="space-y-2">
            <Label>{t('filter.planType')}</Label>
            <Select
              value={filters.planType ?? 'all'}
              onValueChange={handlePlanTypeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('filter.planType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter.allTypes')}</SelectItem>
                {PLAN_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button className="w-full" onClick={handleApply}>
            {t('common.actions.apply')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

MobilePlanFiltersSheet.displayName = 'MobilePlanFiltersSheet';
