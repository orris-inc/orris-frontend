/**
 * Plan Filters Component
 * Desktop filtering toolbar for subscription plans
 */

import { useMemo } from 'react';
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
import type { PlanStatus, PlanType } from '@/api/subscription/types';
import type { SubscriptionPlanFilters } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface PlanFiltersProps {
  filters: SubscriptionPlanFilters;
  onFiltersChange: (filters: Partial<SubscriptionPlanFilters>) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  className?: string;
}

// Plan type options
const PLAN_TYPE_OPTIONS: { value: PlanType; label: string }[] = [
  { value: 'node', label: 'common.planType.node' },
  { value: 'forward', label: 'common.planType.forward' },
  { value: 'hybrid', label: 'common.planType.hybrid' },
];

// ============================================================================
// Main Component
// ============================================================================

export const PlanFilters = ({
  filters,
  onFiltersChange,
  hasFilters,
  onClearFilters,
  className,
}: PlanFiltersProps) => {
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

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Status filter */}
      <Select
        value={filters.status ?? 'all'}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder={t('common.status.label')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter.all')}</SelectItem>
          <SelectItem value="active">{t('common.status.enabled')}</SelectItem>
          <SelectItem value="inactive">{t('common.status.disabled')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Visibility filter */}
      <Select value={visibilityValue} onValueChange={handleVisibilityChange}>
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder={t('filter.visibility')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter.allVisibility')}</SelectItem>
          <SelectItem value="public">{t('admin.plans.public')}</SelectItem>
          <SelectItem value="private">{t('admin.plans.private')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Plan type filter */}
      <Select
        value={filters.planType ?? 'all'}
        onValueChange={handlePlanTypeChange}
      >
        <SelectTrigger className="w-[140px] h-9">
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

      {/* Clear filters button */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-muted-foreground h-9"
        >
          <X className="size-4 mr-1" />
          {t('filter.clearAdvanced')}
        </Button>
      )}
    </div>
  );
};

PlanFilters.displayName = 'PlanFilters';
