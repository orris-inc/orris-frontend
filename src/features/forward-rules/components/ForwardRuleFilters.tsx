/**
 * 转发规则筛选器组件
 * 支持：协议、状态、规则名称搜索
 */

import { FilterX } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import type { ForwardProtocol, ForwardStatus } from '@/api/forward';

export interface ForwardRuleFilters {
  protocol?: ForwardProtocol;
  status?: ForwardStatus;
  name?: string;
}

interface ForwardRuleFiltersProps {
  filters: ForwardRuleFilters;
  onChange: (filters: Partial<ForwardRuleFilters>) => void;
}

export const ForwardRuleFilters: React.FC<ForwardRuleFiltersProps> = ({ filters, onChange }) => {
  const handleProtocolChange = (value: string): void => {
    onChange({ protocol: value === '_all_' ? undefined : (value as ForwardProtocol) });
  };

  const handleStatusChange = (value: string): void => {
    onChange({ status: value === '_all_' ? undefined : (value as ForwardStatus) });
  };

  const handleSearchChange = (value: string): void => {
    onChange({ name: value || undefined });
  };

  const handleReset = (): void => {
    onChange({
      protocol: undefined,
      status: undefined,
      name: undefined,
    });
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-36">
        <Select value={filters.protocol || '_all_'} onValueChange={handleProtocolChange}>
          <SelectTrigger>
            <SelectValue placeholder="协议" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all_">全部</SelectItem>
            <SelectItem value="tcp">TCP</SelectItem>
            <SelectItem value="udp">UDP</SelectItem>
            <SelectItem value="both">TCP/UDP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-36">
        <Select value={filters.status || '_all_'} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all_">全部</SelectItem>
            <SelectItem value="enabled">已启用</SelectItem>
            <SelectItem value="disabled">已禁用</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 max-w-xs">
        <Input
          placeholder="搜索规则名称"
          value={filters.name || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <Button variant="outline" onClick={handleReset}>
        <FilterX className="mr-2 h-4 w-4" />
        重置
      </Button>
    </div>
  );
};
