/**
 * 订阅计划筛选组件 - Radix UI 实现
 */

import * as Select from '@radix-ui/react-select';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Label from '@radix-ui/react-label';
import { Check, ChevronDown } from 'lucide-react';
import type { PlanStatus } from '@/api/subscription/types';
import type { SubscriptionPlanFilters } from '../types';

interface PlanFiltersProps {
  filters: SubscriptionPlanFilters;
  onChange: (filters: Partial<SubscriptionPlanFilters>) => void;
}

const STATUSES: { value: PlanStatus; label: string }[] = [
  { value: 'active', label: '激活' },
  { value: 'inactive', label: '未激活' },
];

export const PlanFilters: React.FC<PlanFiltersProps> = ({
  filters,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* 状态筛选 */}
      <div className="space-y-2">
        <Label.Root className="text-sm font-medium">状态</Label.Root>
        <Select.Root
          value={filters.status || 'all'}
          onValueChange={(value) => onChange({ status: value !== 'all' ? value as PlanStatus : undefined })}
        >
          <Select.Trigger className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
            <Select.Value placeholder="全部" />
            <Select.Icon>
              <ChevronDown className="size-4 opacity-50" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80">
              <Select.Viewport className="p-1">
                <Select.Item value="all" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                  <Select.ItemText>全部</Select.ItemText>
                  <Select.ItemIndicator className="absolute right-2 flex items-center justify-center">
                    <Check className="size-4" />
                  </Select.ItemIndicator>
                </Select.Item>
                {STATUSES.map((option) => (
                  <Select.Item key={option.value} value={option.value} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                    <Select.ItemText>{option.label}</Select.ItemText>
                    <Select.ItemIndicator className="absolute right-2 flex items-center justify-center">
                      <Check className="size-4" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      {/* 搜索名称 */}
      <div className="space-y-2">
        <Label.Root className="text-sm font-medium">搜索名称</Label.Root>
        <input
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="输入计划名称..."
          value={filters.search || ''}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>

      {/* 仅公开计划 */}
      <div className="flex items-end space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox.Root
            id="isPublic"
            checked={filters.isPublic ?? false}
            onCheckedChange={(checked) => onChange({ isPublic: checked ? true : undefined })}
            className="peer size-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          >
            <Checkbox.Indicator className="flex items-center justify-center text-current">
              <Check className="size-4" />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <Label.Root htmlFor="isPublic" className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            仅公开计划
          </Label.Root>
        </div>
      </div>
    </div>
  );
};
