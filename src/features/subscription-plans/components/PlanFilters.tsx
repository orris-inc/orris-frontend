/**
 * Plan Filters Component (Redesigned)
 *
 * Layout: [Type segmented tabs] [Status select] [Visibility select] [Clear] ... [View toggle]
 * Type tabs are the primary filter — visually prominent segmented control.
 * Status/visibility remain compact selects.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, LayoutGrid, Table2, Zap, ArrowLeftRight, Layers } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { cn } from '@/lib/utils';
import type { PlanStatus, PlanType } from '@/api/subscription/types';
import type { SubscriptionPlanFilters } from '../types';

// ============================================================================
// Types
// ============================================================================

export type PlanViewMode = 'grid' | 'table';

export interface PlanFiltersProps {
  filters: SubscriptionPlanFilters;
  onFiltersChange: (filters: Partial<SubscriptionPlanFilters>) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  viewMode: PlanViewMode;
  onViewModeChange: (mode: PlanViewMode) => void;
  className?: string;
}

// Type tab items
const TYPE_TABS: { value: PlanType | 'all'; labelKey: string; icon?: React.ElementType }[] = [
  { value: 'all', labelKey: 'filter.all' },
  { value: 'node', labelKey: 'common.planType.node', icon: Zap },
  { value: 'forward', labelKey: 'common.planType.forward', icon: ArrowLeftRight },
  { value: 'hybrid', labelKey: 'common.planType.hybrid', icon: Layers },
];

// ============================================================================
// Main Component
// ============================================================================

export const PlanFilters = ({
  filters,
  onFiltersChange,
  hasFilters,
  onClearFilters,
  viewMode,
  onViewModeChange,
  className,
}: PlanFiltersProps) => {
  const { t } = useTranslation();

  const currentType = filters.planType ?? 'all';

  const handleTypeChange = (value: PlanType | 'all') => {
    onFiltersChange({
      planType: value === 'all' ? undefined : value,
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      status: value === 'all' ? undefined : (value as PlanStatus),
    });
  };

  const handleVisibilityChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({ isPublic: undefined });
    } else {
      onFiltersChange({ isPublic: value === 'public' });
    }
  };

  const visibilityValue = useMemo(() => {
    if (filters.isPublic === undefined) return 'all';
    return filters.isPublic ? 'public' : 'private';
  }, [filters.isPublic]);

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Plan type segmented tabs */}
      <div className="flex items-center rounded-xl bg-muted/50 ring-1 ring-border p-0.5">
        {TYPE_TABS.map((tab) => {
          const isActive = currentType === tab.value;
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleTypeChange(tab.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium transition-all',
                isActive
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {Icon && <Icon className="size-3.5" />}
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

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

      {/* Clear filters */}
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* View mode toggle */}
      <div className="flex items-center rounded-xl bg-muted/50 ring-1 ring-border p-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'size-8 rounded-lg flex items-center justify-center transition-all',
                viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{t('admin.plans.catalog.gridView')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={cn(
                'size-8 rounded-lg flex items-center justify-center transition-all',
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Table2 className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{t('admin.plans.catalog.tableView')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

PlanFilters.displayName = 'PlanFilters';
