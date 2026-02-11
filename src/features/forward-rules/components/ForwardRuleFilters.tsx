/**
 * Forward Rule Filters Component (Redesigned)
 *
 * Layout: [Protocol segmented tabs] [Status select] [Sort select] | [User rules] [Drag sort] [Clear]
 * Protocol tabs are the primary filter — visually prominent segmented control.
 * Status/sort remain compact selects.
 */

import { useTranslation } from 'react-i18next';
import { X, Users, GripVertical } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Button } from '@/components/common/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { cn } from '@/lib/utils';
import type { ForwardRuleFilters as ForwardRuleFiltersType } from '../hooks/useForwardRules';

// ============================================================================
// Types
// ============================================================================

export interface ForwardRuleFiltersProps {
  filters: ForwardRuleFiltersType;
  onFiltersChange: (filters: Partial<ForwardRuleFiltersType>) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  /** Include user-created rules toggle */
  includeUserRules?: boolean;
  onIncludeUserRulesChange?: (include: boolean) => void;
  /** Drag sort toggle */
  dragSortEnabled?: boolean;
  onDragSortChange?: (enabled: boolean) => void;
  isReordering?: boolean;
  className?: string;
}

// Protocol tab items
const PROTOCOL_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'filter.all' },
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'both', label: 'TCP+UDP' },
];

// Sort options
const SORT_OPTIONS = [
  { value: 'sort_order_asc', label: 'admin.forwardRules.sortOptions.default' },
  { value: 'created_at_desc', label: 'admin.forwardRules.sortOptions.createdDesc' },
  { value: 'created_at_asc', label: 'admin.forwardRules.sortOptions.createdAsc' },
  { value: 'updated_at_desc', label: 'admin.forwardRules.sortOptions.updatedDesc' },
];

// ============================================================================
// Main Component
// ============================================================================

export const ForwardRuleFilters = ({
  filters,
  onFiltersChange,
  hasFilters,
  onClearFilters,
  includeUserRules = false,
  onIncludeUserRulesChange,
  dragSortEnabled = false,
  onDragSortChange,
  isReordering = false,
  className,
}: ForwardRuleFiltersProps) => {
  const { t } = useTranslation();

  const currentProtocol = filters.protocol ?? 'all';

  // Handle protocol change via segmented tabs
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

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Protocol segmented tabs */}
      <div className="flex items-center rounded-xl bg-muted/50 ring-1 ring-border p-0.5">
        {PROTOCOL_TABS.map((tab) => {
          const isActive = currentProtocol === tab.value;
          // Only translate "all", protocol labels are literal
          const label = tab.value === 'all' ? t(tab.label) : tab.label;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleProtocolChange(tab.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium transition-all',
                isActive
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
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
          <SelectItem value="enabled">{t('common.status.enabled')}</SelectItem>
          <SelectItem value="disabled">{t('common.status.disabled')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort filter */}
      <Select value={getSortValue()} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[140px] h-9">
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

      {/* Vertical divider */}
      <div className="h-6 w-px bg-border" />

      {/* User rules toggle */}
      {onIncludeUserRulesChange && (
        <Tooltip>
          <TooltipTrigger asChild>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Switch
                checked={includeUserRules}
                onCheckedChange={onIncludeUserRulesChange}
              >
                <SwitchThumb />
              </Switch>
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Users className="size-4" />
                {t('admin.forwardRules.userRules')}
              </span>
            </label>
          </TooltipTrigger>
          <TooltipContent>{t('admin.forwardRules.showUserRules')}</TooltipContent>
        </Tooltip>
      )}

      {/* Drag sort toggle */}
      {onDragSortChange && (
        <Tooltip>
          <TooltipTrigger asChild>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Switch
                checked={dragSortEnabled}
                onCheckedChange={onDragSortChange}
                disabled={isReordering}
              >
                <SwitchThumb />
              </Switch>
              <span className="text-muted-foreground flex items-center gap-1.5">
                <GripVertical className={dragSortEnabled ? 'size-4 text-primary' : 'size-4'} />
                {t('admin.forwardRules.dragSort')}
              </span>
            </label>
          </TooltipTrigger>
          <TooltipContent>
            {dragSortEnabled ? t('admin.forwardRules.disableDragSort') : t('admin.forwardRules.enableDragSort')}
          </TooltipContent>
        </Tooltip>
      )}

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

ForwardRuleFilters.displayName = 'ForwardRuleFilters';
