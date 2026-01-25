/**
 * Forward agent filters component
 * Supports: status, name search, sorting
 */

import { useTranslation } from 'react-i18next';
import { FilterX } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import type { ForwardStatus } from '@/api/forward';

export interface ForwardAgentFilters {
  status?: ForwardStatus;
  name?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ForwardAgentFiltersProps {
  filters: ForwardAgentFilters;
  onChange: (filters: Partial<ForwardAgentFilters>) => void;
}

export const ForwardAgentFiltersComponent: React.FC<ForwardAgentFiltersProps> = ({ filters, onChange }) => {
  const { t } = useTranslation();

  const handleStatusChange = (value: string): void => {
    onChange({ status: value === '_all_' ? undefined : (value as ForwardStatus) });
  };

  const handleSearchChange = (value: string): void => {
    onChange({ name: value || undefined });
  };

  const handleSortChange = (value: string): void => {
    if (value === '_default_') {
      onChange({ sortBy: undefined, sortOrder: undefined });
    } else {
      // Extract order from the end (last part after final underscore)
      const lastUnderscoreIndex = value.lastIndexOf('_');
      const sortBy = value.substring(0, lastUnderscoreIndex);
      const sortOrder = value.substring(lastUnderscoreIndex + 1) as 'asc' | 'desc';
      onChange({ sortBy, sortOrder });
    }
  };

  // Get current sort value for select
  const getSortValue = (): string => {
    if (!filters.sortBy) return '_default_';
    return `${filters.sortBy}_${filters.sortOrder || 'desc'}`;
  };

  const handleReset = (): void => {
    onChange({
      status: undefined,
      name: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    });
  };

  return (
    <div className="@container flex items-center gap-2 @sm:gap-4">
      <div className="w-[72px] @sm:w-28">
        <Select value={filters.status || '_all_'} onValueChange={handleStatusChange}>
          <SelectTrigger className="text-xs @sm:text-sm">
            <SelectValue placeholder={t('common.status.label')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all_">{t('admin.forwardAgents.filters.all')}</SelectItem>
            <SelectItem value="enabled">{t('common.status.enabled')}</SelectItem>
            <SelectItem value="disabled">{t('common.status.disabled')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="hidden @sm:block flex-1 max-w-xs">
        <Input
          placeholder={t('admin.forwardAgents.filters.searchAgent')}
          value={filters.name || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <div className="w-[88px] @sm:w-32">
        <Select value={getSortValue()} onValueChange={handleSortChange}>
          <SelectTrigger className="text-xs @sm:text-sm">
            <SelectValue placeholder={t('common.table.sort')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_default_">{t('admin.forwardAgents.filters.default')}</SelectItem>
            <SelectItem value="created_at_desc">{t('admin.forwardAgents.filters.createdDesc')}</SelectItem>
            <SelectItem value="created_at_asc">{t('admin.forwardAgents.filters.createdAsc')}</SelectItem>
            <SelectItem value="updated_at_desc">{t('admin.forwardAgents.filters.updatedDesc')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" size="sm" onClick={handleReset} className="shrink-0">
        <FilterX className="h-4 w-4 @sm:mr-2" />
        <span className="hidden @sm:inline">{t('common.actions.reset')}</span>
      </Button>
    </div>
  );
};
