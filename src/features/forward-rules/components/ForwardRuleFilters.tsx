/**
 * Forward Rule Filters Component
 * Desktop filtering toolbar for forward rules
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

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Protocol filter */}
      <Select
        value={filters.protocol ?? 'all'}
        onValueChange={handleProtocolChange}
      >
        <SelectTrigger className="w-[100px] h-9">
          <SelectValue placeholder={t('common.protocol')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter.all')}</SelectItem>
          <SelectItem value="tcp">TCP</SelectItem>
          <SelectItem value="udp">UDP</SelectItem>
          <SelectItem value="both">Both</SelectItem>
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        value={filters.status ?? 'all'}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[100px] h-9">
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
