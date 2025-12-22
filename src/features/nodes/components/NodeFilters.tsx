/**
 * 节点筛选器组件
 * 支持：状态、搜索
 */

import { FilterX } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import type { NodeStatus } from '@/api/node';

// Frontend filter type
interface NodeFiltersType {
  status?: NodeStatus;
  search?: string;
}

interface NodeFiltersComponentProps {
  filters: NodeFiltersType;
  onChange: (filters: Partial<NodeFiltersType>) => void;
}

export const NodeFilters: React.FC<NodeFiltersComponentProps> = ({ filters, onChange }) => {
  const handleStatusChange = (value: string): void => {
    onChange({ status: value === '_all_' ? undefined : (value as NodeStatus) });
  };

  const handleSearchChange = (value: string): void => {
    onChange({ search: value });
  };

  const handleReset = (): void => {
    onChange({
      status: undefined,
      search: '',
    });
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-36">
        <Select value={filters.status || '_all_'} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all_">全部</SelectItem>
            <SelectItem value="active">激活</SelectItem>
            <SelectItem value="inactive">未激活</SelectItem>
            <SelectItem value="maintenance">维护中</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 max-w-xs">
        <Input
          placeholder="搜索名称或服务器地址"
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <Button
        variant="outline"
        onClick={handleReset}
      >
        <FilterX className="mr-2 h-4 w-4" />
        重置
      </Button>
    </div>
  );
};
