/**
 * 节点组筛选器组件
 */

import type { FC } from 'react';
import { Filter } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Button } from '@/components/common/Button';

interface NodeGroupFiltersType {
  isPublic?: boolean;
  search?: string;
}

interface NodeGroupFiltersProps {
  filters: NodeGroupFiltersType;
  onChange: (filters: Partial<NodeGroupFiltersType>) => void;
}

export const NodeGroupFilters: FC<NodeGroupFiltersProps> = ({ filters, onChange }) => {
  const handlePublicChange = (value: string): void => {
    onChange({
      isPublic: value === '' ? undefined : value === 'true',
    });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onChange({ search: event.target.value });
  };

  const handleReset = (): void => {
    onChange({ isPublic: undefined, search: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">筛选条件</h2>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* 公开性筛选 */}
        <div className="min-w-[150px]">
          <Select
            value={filters.isPublic === undefined ? '' : String(filters.isPublic)}
            onValueChange={handlePublicChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="公开性" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部</SelectItem>
              <SelectItem value="true">公开</SelectItem>
              <SelectItem value="false">私有</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 搜索框 */}
        <div className="min-w-[250px]">
          <Input
            placeholder="搜索名称或描述"
            value={filters.search || ''}
            onChange={handleSearchChange}
          />
        </div>

        {/* 重置按钮 */}
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={filters.isPublic === undefined && !filters.search}
        >
          重置
        </Button>
      </div>
    </div>
  );
};
