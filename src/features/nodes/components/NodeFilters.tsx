/**
 * 节点筛选器组件
 * 支持：状态、地区、标签、排序
 */

import { useState } from 'react';
import { FilterX, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Combobox } from '@/components/common/Combobox';
import type { ListNodesParams } from '@/api/node';

type NodeStatus = 'active' | 'inactive' | 'maintenance' | 'error';

// 前端筛选器类型（继承 API 参数并增加本地搜索）
interface NodeFiltersType extends Omit<ListNodesParams, 'page' | 'pageSize'> {
  search?: string;
}

interface NodeFiltersComponentProps {
  filters: NodeFiltersType;
  onChange: (filters: Partial<NodeFiltersType>) => void;
}

// 排序字段选项
const ORDER_BY_OPTIONS = [
  { value: 'sortOrder', label: '排序顺序' },
  { value: 'createdAt', label: '创建时间' },
  { value: 'updatedAt', label: '更新时间' },
  { value: 'name', label: '节点名称' },
  { value: 'region', label: '地区' },
  { value: 'status', label: '状态' },
] as const;

// 常用地区选项（可根据实际情况调整）
const REGION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '美国', label: '美国' },
  { value: '日本', label: '日本' },
  { value: '香港', label: '香港' },
  { value: '新加坡', label: '新加坡' },
  { value: '英国', label: '英国' },
  { value: '德国', label: '德国' },
  { value: '法国', label: '法国' },
  { value: '加拿大', label: '加拿大' },
  { value: '澳大利亚', label: '澳大利亚' },
  { value: '韩国', label: '韩国' },
  { value: '台湾', label: '台湾' },
  { value: '其他', label: '其他' },
];

// 常用标签选项（可根据实际情况调整）
const TAG_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'premium', label: 'premium' },
  { value: 'fast', label: 'fast' },
  { value: 'stable', label: 'stable' },
  { value: 'game', label: 'game' },
  { value: 'video', label: 'video' },
  { value: 'cn2', label: 'cn2' },
  { value: 'gia', label: 'gia' },
  { value: 'iplc', label: 'iplc' },
  { value: 'iepl', label: 'iepl' },
  { value: 'bgp', label: 'bgp' },
];

export const NodeFilters: React.FC<NodeFiltersComponentProps> = ({ filters, onChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleStatusChange = (value: string): void => {
    const status = value as NodeStatus | '';
    onChange({ status: status || undefined });
  };

  const handleRegionChange = (value: string | string[]): void => {
    const region = typeof value === 'string' ? value : value[0];
    onChange({ region: region || undefined });
  };

  const handleTagsChange = (value: string | string[]): void => {
    const tags = Array.isArray(value) ? value : [value];
    onChange({ tags: tags.length > 0 ? tags : undefined });
  };

  const handleOrderByChange = (value: string): void => {
    onChange({ orderBy: value || undefined });
  };

  const handleOrderChange = (value: string): void => {
    const order = value as 'asc' | 'desc' | '';
    onChange({ order: order || undefined });
  };

  const handleSearchChange = (value: string): void => {
    onChange({ search: value });
  };

  const handleReset = (): void => {
    onChange({
      status: undefined,
      region: undefined,
      tags: undefined,
      orderBy: undefined,
      order: undefined,
      search: '',
    });
    setShowAdvanced(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">筛选条件</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
          {showAdvanced ? '收起' : '展开'}高级筛选
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-12">
        {/* 基础筛选 */}
        <div className="md:col-span-3">
          <Select value={filters.status || ''} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部</SelectItem>
              <SelectItem value="active">激活</SelectItem>
              <SelectItem value="inactive">未激活</SelectItem>
              <SelectItem value="maintenance">维护中</SelectItem>
              <SelectItem value="error">错误</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3">
          <Combobox
            options={REGION_OPTIONS}
            value={filters.region || ''}
            onChange={handleRegionChange}
            placeholder="选择或输入地区"
            searchPlaceholder="搜索地区..."
          />
        </div>

        <div className="md:col-span-4">
          <Input
            placeholder="名称或服务器地址"
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full"
          >
            <FilterX className="mr-2 h-4 w-4" />
            重置
          </Button>
        </div>

        {/* 高级筛选 */}
        {showAdvanced && (
          <div className="md:col-span-12">
            <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-6">
                <Combobox
                  multiple
                  options={TAG_OPTIONS}
                  value={filters.tags || []}
                  onChange={handleTagsChange}
                  placeholder="选择或输入标签"
                  searchPlaceholder="搜索标签..."
                />
              </div>

              <div className="md:col-span-3">
                <Select
                  value={filters.orderBy || 'sortOrder'}
                  onValueChange={handleOrderByChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="排序字段" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_BY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-3">
                <Select
                  value={filters.order || 'asc'}
                  onValueChange={handleOrderChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="排序方向" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">升序</SelectItem>
                    <SelectItem value="desc">降序</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
