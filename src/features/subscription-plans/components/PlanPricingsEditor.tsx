/**
 * 计划多定价编辑器组件
 * 用于在创建/编辑计划时管理多个定价选项
 */

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Checkbox } from '@/components/common/Checkbox';
import { Label } from '@/components/common/Label';
import { Card } from '@/components/common/Card';
import { Separator } from '@/components/common/Separator';
import { Alert } from '@/components/common/Alert';
import type { BillingCycle, PricingOption } from '@/api/subscription/types';

interface PlanPricingsEditorProps {
  pricings: PricingOption[];
  onChange: (pricings: PricingOption[]) => void;
  disabled?: boolean;
}

const BILLING_CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'weekly', label: '周付' },
  { value: 'monthly', label: '月付' },
  { value: 'quarterly', label: '季付' },
  { value: 'semi_annual', label: '半年付' },
  { value: 'yearly', label: '年付' },
  { value: 'lifetime', label: '终身' },
];

const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: 'CNY', label: 'CNY (人民币)' },
  { value: 'USD', label: 'USD (美元)' },
];

export const PlanPricingsEditor: React.FC<PlanPricingsEditorProps> = ({
  pricings,
  onChange,
  disabled = false,
}) => {
  const handleAddPricing = () => {
    const newPricing: PricingOption = {
      billingCycle: 'monthly',
      price: 0,
      currency: 'CNY',
      isActive: true,
    };
    onChange([...pricings, newPricing]);
  };

  const handleRemovePricing = (index: number) => {
    onChange(pricings.filter((_, i) => i !== index));
  };

  const handleUpdatePricing = (index: number, updates: Partial<PricingOption>) => {
    const updated = pricings.map((pricing, i) =>
      i === index ? { ...pricing, ...updates } : pricing
    );
    onChange(updated);
  };

  // 检查是否有重复的计费周期
  const getDuplicateCycles = (): string[] => {
    const cycles = pricings.map((p) => p.billingCycle);
    return cycles.filter((cycle, index) => cycles.indexOf(cycle) !== index);
  };

  const duplicateCycles = getDuplicateCycles();
  const hasDuplicates = duplicateCycles.length > 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold">多定价选项（可选）</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddPricing}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          添加定价
        </Button>
      </div>

      {hasDuplicates && (
        <Alert variant="warning" className="mb-4">
          检测到重复的计费周期：{duplicateCycles.join(', ')}。每个计费周期只能有一个定价选项。
        </Alert>
      )}

      {pricings.length === 0 ? (
        <Alert variant="info">
          未配置多定价选项。点击"添加定价"按钮可为此计划添加不同计费周期的价格。
        </Alert>
      ) : (
        <div className="space-y-4">
          {pricings.map((pricing, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-primary">
                  定价选项 #{index + 1}
                </h4>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePricing(index)}
                  disabled={disabled}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`billingCycle-${index}`}>计费周期</Label>
                    <Select
                      value={pricing.billingCycle}
                      onValueChange={(value) =>
                        handleUpdatePricing(index, {
                          billingCycle: value as BillingCycle,
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger
                        id={`billingCycle-${index}`}
                        className={duplicateCycles.includes(pricing.billingCycle as string) ? 'border-destructive' : ''}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BILLING_CYCLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {duplicateCycles.includes(pricing.billingCycle as string) && (
                      <p className="text-xs text-destructive">此计费周期已存在</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`currency-${index}`}>货币</Label>
                    <Select
                      value={pricing.currency}
                      onValueChange={(value) =>
                        handleUpdatePricing(index, { currency: value })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger id={`currency-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`price-${index}`}>价格（元）</Label>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    value={pricing.price / 100}
                    onChange={(e) => {
                      const yuan = Number(e.target.value);
                      handleUpdatePricing(index, {
                        price: Math.round(yuan * 100),
                      });
                    }}
                    step="0.01"
                    min="0"
                    disabled={disabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    {pricing.price / 100} 元 = {pricing.price} 分
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`isActive-${index}`}
                    checked={pricing.isActive}
                    onCheckedChange={(checked) =>
                      handleUpdatePricing(index, { isActive: checked as boolean })
                    }
                    disabled={disabled}
                  />
                  <Label htmlFor={`isActive-${index}`}>激活此定价选项</Label>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Separator className="my-4" />

      <p className="text-xs text-muted-foreground">
        提示：多定价功能允许您为同一个计划配置不同计费周期的价格，如月付、年付等。用户在订阅时可以选择适合自己的计费周期。
      </p>
    </div>
  );
};
