/**
 * Forward agent filters component
 * Supports: status, name search, sorting
 */

import { FilterX } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import type { ForwardStatus } from '@/api/forward';

export interface ForwardAgentFilters {
  status?: ForwardStatus;
  name?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

interface ForwardAgentFiltersProps {
  filters: ForwardAgentFilters;
  onChange: (filters: Partial<ForwardAgentFilters>) => void;
}

export const ForwardAgentFiltersComponent: React.FC<ForwardAgentFiltersProps> = ({ filters, onChange }) => {
  const handleStatusChange = (value: string): void => {
    onChange({ status: value === '_all_' ? undefined : (value as ForwardStatus) });
  };

  const handleSearchChange = (value: string): void => {
    onChange({ name: value || undefined });
  };

  const handleSortChange = (value: string): void => {
    if (value === '_default_') {
      onChange({ orderBy: undefined, order: undefined });
    } else {
      // Extract order from the end (last part after final underscore)
      const lastUnderscoreIndex = value.lastIndexOf('_');
      const orderBy = value.substring(0, lastUnderscoreIndex);
      const order = value.substring(lastUnderscoreIndex + 1) as 'asc' | 'desc';
      onChange({ orderBy, order });
    }
  };

  // Get current sort value for select
  const getSortValue = (): string => {
    if (!filters.orderBy) return '_default_';
    return `${filters.orderBy}_${filters.order || 'desc'}`;
  };

  const handleReset = (): void => {
    onChange({
      status: undefined,
      name: undefined,
      orderBy: undefined,
      order: undefined,
    });
  };

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {/* Status filter - responsive width */}
      <div className="w-[72px] sm:w-28">
        <Select value={filters.status || '_all_'} onValueChange={handleStatusChange}>
          <SelectTrigger className="text-xs sm:text-sm">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all_">全部</SelectItem>
            <SelectItem value="enabled">已启用</SelectItem>
            <SelectItem value="disabled">已禁用</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search input - hidden on mobile */}
      <div className="hidden sm:block flex-1 max-w-xs">
        <Input
          placeholder="搜索节点名称"
          value={filters.name || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Sort filter - responsive width */}
      <div className="w-[88px] sm:w-32">
        <Select value={getSortValue()} onValueChange={handleSortChange}>
          <SelectTrigger className="text-xs sm:text-sm">
            <SelectValue placeholder="排序" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_default_">默认排序</SelectItem>
            <SelectItem value="created_at_desc">创建时间 ↓</SelectItem>
            <SelectItem value="created_at_asc">创建时间 ↑</SelectItem>
            <SelectItem value="updated_at_desc">更新时间 ↓</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reset button - icon only on mobile */}
      <Button variant="outline" size="sm" onClick={handleReset} className="shrink-0">
        <FilterX className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">重置</span>
      </Button>
    </div>
  );
};
