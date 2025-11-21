/**
 * 编辑订阅计划对话框 - Radix UI 实现
 */

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Label from '@radix-ui/react-label';
import { Plus, X, Check, ChevronDown } from 'lucide-react';
import type { SubscriptionPlan, UpdatePlanRequest } from '../types/subscription-plans.types';

interface EditPlanDialogProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSubmit: (id: number, data: UpdatePlanRequest) => Promise<void>;
}

export const EditPlanDialog: React.FC<EditPlanDialogProps> = ({
  open,
  plan,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<UpdatePlanRequest>({});
  const [newFeature, setNewFeature] = useState('');
  const [loading, setLoading] = useState(false);

  // 当plan变化时，更新表单数据
  useEffect(() => {
    if (plan) {
      setFormData({
        price: plan.Price,
        currency: plan.Currency,
        description: plan.Description,
        features: plan.Features || [],
        is_public: plan.IsPublic,
        max_users: plan.MaxUsers,
        max_projects: plan.MaxProjects,
        api_rate_limit: plan.APIRateLimit,
        sort_order: plan.SortOrder,
      });
    }
  }, [plan]);

  const handleChange = (field: keyof UpdatePlanRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()],
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      const submitData: UpdatePlanRequest = {
        ...formData,
        price: formData.price,
      };
      await onSubmit(plan.ID, submitData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">编辑订阅计划: {plan.Name}</Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">修改订阅计划的配置信息</Dialog.Description>
          </div>

          <div className="space-y-6">
            {/* 基本信息（只读） */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">基本信息（只读）</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label.Root className="text-sm font-medium leading-none">计划名称</Label.Root>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                    value={plan.Name}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label.Root className="text-sm font-medium leading-none">Slug</Label.Root>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                    value={plan.Slug}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label.Root className="text-sm font-medium leading-none">计费周期</Label.Root>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                    value={plan.BillingCycle}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* 可编辑字段 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">可编辑信息</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label.Root htmlFor="price" className="text-sm font-medium leading-none">价格（元）</Label.Root>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.price !== undefined ? formData.price / 100 : ''}
                    onChange={(e) => handleChange('price', Number(e.target.value) * 100)}
                  />
                </div>

                <div className="space-y-2">
                  <Label.Root htmlFor="currency" className="text-sm font-medium leading-none">货币</Label.Root>
                  <Select.Root
                    value={formData.currency || plan.Currency}
                    onValueChange={(value) => handleChange('currency', value)}
                  >
                    <Select.Trigger id="currency" className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                      <Select.Value />
                      <Select.Icon>
                        <ChevronDown className="size-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80">
                        <Select.Viewport className="p-1">
                          <Select.Item value="CNY" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>CNY (人民币)</Select.ItemText>
                            <Select.ItemIndicator className="absolute right-2 flex items-center justify-center">
                              <Check className="size-4" />
                            </Select.ItemIndicator>
                          </Select.Item>
                          <Select.Item value="USD" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>USD (美元)</Select.ItemText>
                            <Select.ItemIndicator className="absolute right-2 flex items-center justify-center">
                              <Check className="size-4" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label.Root htmlFor="description" className="text-sm font-medium leading-none">描述</Label.Root>
                  <textarea
                    id="description"
                    rows={3}
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 功能列表 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">功能列表</h3>
              <div className="flex gap-2">
                <input
                  placeholder="添加功能"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFeature()}
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                >
                  <Plus className="size-4" />
                  添加
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.features?.map((feature, index) => (
                  <span key={index} className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 限制配置 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">限制配置</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label.Root htmlFor="max_users" className="text-sm font-medium leading-none">最大用户数</Label.Root>
                  <input
                    id="max_users"
                    type="number"
                    min="0"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.max_users || ''}
                    onChange={(e) => handleChange('max_users', e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label.Root htmlFor="max_projects" className="text-sm font-medium leading-none">最大项目数</Label.Root>
                  <input
                    id="max_projects"
                    type="number"
                    min="0"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.max_projects || ''}
                    onChange={(e) => handleChange('max_projects', e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label.Root htmlFor="api_rate_limit" className="text-sm font-medium leading-none">API速率限制（次/小时）</Label.Root>
                  <input
                    id="api_rate_limit"
                    type="number"
                    min="0"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.api_rate_limit || ''}
                    onChange={(e) => handleChange('api_rate_limit', e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label.Root htmlFor="sort_order" className="text-sm font-medium leading-none">排序顺序</Label.Root>
                  <input
                    id="sort_order"
                    type="number"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.sort_order || 0}
                    onChange={(e) => handleChange('sort_order', e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">数字越小越靠前</p>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox.Root
                    id="is_public"
                    checked={formData.is_public ?? plan.IsPublic}
                    onCheckedChange={(checked) => handleChange('is_public', checked)}
                    className="peer size-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  >
                    <Checkbox.Indicator className="flex items-center justify-center text-current">
                      <Check className="size-4" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <Label.Root htmlFor="is_public" className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    公开显示此计划
                  </Label.Root>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
