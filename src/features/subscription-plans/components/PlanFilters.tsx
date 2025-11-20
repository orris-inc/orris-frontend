/**
 * 订阅计划筛选组件
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BillingCycle, PlanStatus, SubscriptionPlanFilters } from '../types/subscription-plans.types';

interface PlanFiltersProps {
  filters: SubscriptionPlanFilters;
  onChange: (filters: Partial<SubscriptionPlanFilters>) => void;
}

const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: '月付' },
  { value: 'quarterly', label: '季付' },
  { value: 'semi_annual', label: '半年付' },
  { value: 'annual', label: '年付' },
  { value: 'lifetime', label: '终身' },
];

const STATUSES: { value: PlanStatus; label: string }[] = [
  { value: 'active', label: '激活' },
  { value: 'inactive', label: '未激活' },
  { value: 'archived', label: '已归档' },
];

export const PlanFilters: React.FC<PlanFiltersProps> = ({
  filters,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      <div className="space-y-2">
        <Label>状态</Label>
        <Select
          value={filters.status || ''}
          onValueChange={(value) => onChange({ status: value as PlanStatus || undefined })}
        >
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部</SelectItem>
            {STATUSES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>计费周期</Label>
        <Select
          value={filters.billing_cycle || ''}
          onValueChange={(value) => onChange({ billing_cycle: value as BillingCycle || undefined })}
        >
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部</SelectItem>
            {BILLING_CYCLES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>搜索名称</Label>
        <Input
          placeholder="输入计划名称..."
          value={filters.search || ''}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>

      <div className="flex items-end space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is-public"
            checked={filters.is_public ?? false}
            onCheckedChange={(checked) => onChange({ is_public: checked ? true : undefined })}
          />
          <Label htmlFor="is-public" className="cursor-pointer">
            仅公开计划
          </Label>
        </div>
      </div>
    </div>
  );
};
