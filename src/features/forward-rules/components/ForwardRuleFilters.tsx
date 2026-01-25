/**
 * 转发规则筛选器组件
 * 支持：协议、状态、规则名称搜索、排序
 * 移动端使用折叠面板
 */

import { useState } from 'react';
import { FilterX, Filter, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/common/Collapsible';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { ForwardProtocol, ForwardStatus } from '@/api/forward';

export interface ForwardRuleFilters {
  protocol?: ForwardProtocol;
  status?: ForwardStatus;
  name?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

interface ForwardRuleFiltersProps {
  filters: ForwardRuleFilters;
  onChange: (filters: Partial<ForwardRuleFilters>) => void;
}

export const ForwardRuleFilters: React.FC<ForwardRuleFiltersProps> = ({ filters, onChange }) => {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();
  const [isOpen, setIsOpen] = useState(false);

  // Check if any filter is active (sort_order is default, not considered as active filter)
  const isDefaultSort = filters.orderBy === 'sort_order' && filters.order === 'asc';
  const hasActiveFilters = !!(filters.protocol || filters.status || filters.name || (filters.orderBy && !isDefaultSort));

  const handleProtocolChange = (value: string): void => {
    onChange({ protocol: value === '_all_' ? undefined : (value as ForwardProtocol) });
  };

  const handleStatusChange = (value: string): void => {
    onChange({ status: value === '_all_' ? undefined : (value as ForwardStatus) });
  };

  const handleSearchChange = (value: string): void => {
    onChange({ name: value || undefined });
  };

  const handleSortChange = (value: string): void => {
    // Extract order from the end (last part after final underscore)
    const lastUnderscoreIndex = value.lastIndexOf('_');
    const orderBy = value.substring(0, lastUnderscoreIndex);
    const order = value.substring(lastUnderscoreIndex + 1) as 'asc' | 'desc';
    onChange({ orderBy, order });
  };

  // Get current sort value for select
  const getSortValue = (): string => {
    if (!filters.orderBy) return 'sort_order_asc';
    return `${filters.orderBy}_${filters.order || 'desc'}`;
  };

  const handleReset = (): void => {
    onChange({
      protocol: undefined,
      status: undefined,
      name: undefined,
      orderBy: 'sort_order',
      order: 'asc',
    });
  };

  // Filter controls component
  const filterControls = (
    <div className="@container">
      <div className="grid grid-cols-2 gap-2 @sm:flex @sm:flex-wrap @sm:items-center @sm:gap-3">
        <Input
          placeholder={t('common.placeholders.search')}
          value={filters.name || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="col-span-2 @sm:w-48"
        />

        <Select value={filters.protocol || '_all_'} onValueChange={handleProtocolChange}>
          <SelectTrigger className="w-full @sm:w-28">
            <SelectValue placeholder={t('common.protocol')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all_">{t('filter.all')}</SelectItem>
            <SelectItem value="tcp">TCP</SelectItem>
            <SelectItem value="udp">UDP</SelectItem>
            <SelectItem value="both">TCP/UDP</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status || '_all_'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full @sm:w-28">
            <SelectValue placeholder={t('common.status.label')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all_">{t('filter.all')}</SelectItem>
            <SelectItem value="enabled">{t('common.status.enabled')}</SelectItem>
            <SelectItem value="disabled">{t('common.status.disabled')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={getSortValue()} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full @sm:w-32">
            <SelectValue placeholder={t('common.table.sort')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sort_order_asc">{t('admin.forwardRules.sortOptions.default')}</SelectItem>
            <SelectItem value="created_at_desc">{t('admin.forwardRules.sortOptions.createdDesc')}</SelectItem>
            <SelectItem value="created_at_asc">{t('admin.forwardRules.sortOptions.createdAsc')}</SelectItem>
            <SelectItem value="updated_at_desc">{t('admin.forwardRules.sortOptions.updatedDesc')}</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleReset} className="w-full @sm:w-auto">
          <FilterX className="mr-1.5 h-3.5 w-3.5" />
          {t('common.actions.reset')}
        </Button>
      </div>
    </div>
  );

  // Mobile: Collapsible filter panel
  if (isMobile) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Filter className="size-3.5" />
              <span>{t('common.actions.filter')}</span>
              {hasActiveFilters && (
                <span className="px-1 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded">
                  {t('common.status.active')}
                </span>
              )}
            </div>
            <ChevronDown className={`size-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-2">
            {filterControls}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Desktop: Always visible
  return filterControls;
};
