/**
 * 创建订阅计划对话框 - Radix UI 实现
 * 支持多定价模式
 */

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Label from '@radix-ui/react-label';
import * as Tabs from '@radix-ui/react-tabs';
import { Plus, X, Check, ChevronDown, Trash2 } from 'lucide-react';
import type { CreatePlanRequest, BillingCycle, PricingOption } from '@/api/subscription/types';

interface CreatePlanDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePlanRequest) => Promise<void>;
}

const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'weekly', label: '周付' },
  { value: 'monthly', label: '月付' },
  { value: 'quarterly', label: '季付' },
  { value: 'semi_annual', label: '半年付' },
  { value: 'yearly', label: '年付' },
  { value: 'lifetime', label: '终身' },
];

// 扩展 CreatePlanRequest 以支持多定价
interface CreatePlanFormData extends Omit<CreatePlanRequest, 'price' | 'currency' | 'billingCycle'> {
  price: number;
  currency: string;
  billingCycle: string;
  pricings: PricingOption[];
  usePricings: boolean; // 是否使用多定价模式
}

export const CreatePlanDialog: React.FC<CreatePlanDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreatePlanFormData>({
    name: '',
    slug: '',
    price: 0,
    currency: 'CNY',
    billingCycle: 'monthly',
    description: '',
    features: [],
    isPublic: true,
    trialDays: 0,
    maxUsers: undefined,
    maxProjects: undefined,
    apiRateLimit: undefined,
    sortOrder: 0,
    pricings: [],
    usePricings: false,
  });

  const [newFeature, setNewFeature] = useState('');
  const [loading, setLoading] = useState(false);
  const [pricingMode, setPricingMode] = useState<'single' | 'multiple'>('single');

  const handleChange = (field: keyof CreatePlanFormData, value: unknown) => {
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

  // 多定价相关操作
  const handleAddPricing = () => {
    const newPricing: PricingOption = {
      billingCycle: 'monthly',
      price: 0,
      currency: 'CNY',
      isActive: true,
    };
    setFormData((prev) => ({
      ...prev,
      pricings: [...prev.pricings, newPricing],
    }));
  };

  const handleRemovePricing = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pricings: prev.pricings.filter((_, i) => i !== index),
    }));
  };

  const handleUpdatePricing = (index: number, updates: Partial<PricingOption>) => {
    setFormData((prev) => ({
      ...prev,
      pricings: prev.pricings.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 构建提交数据
      const submitData: CreatePlanRequest = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        features: formData.features,
        isPublic: formData.isPublic,
        trialDays: formData.trialDays,
        maxUsers: formData.maxUsers,
        maxProjects: formData.maxProjects,
        apiRateLimit: formData.apiRateLimit,
        sortOrder: formData.sortOrder,
        // 基础定价（用于向后兼容）
        price: pricingMode === 'single'
          ? Math.round(formData.price * 100)
          : (formData.pricings[0]?.price || 0),
        currency: pricingMode === 'single'
          ? formData.currency
          : (formData.pricings[0]?.currency || 'CNY'),
        billingCycle: pricingMode === 'single'
          ? formData.billingCycle
          : (formData.pricings[0]?.billingCycle || 'monthly'),
      };
      await onSubmit(submitData);
      onClose();
      // 重置表单
      setFormData({
        name: '',
        slug: '',
        price: 0,
        currency: 'CNY',
        billingCycle: 'monthly',
        description: '',
        features: [],
        isPublic: true,
        trialDays: 0,
        sortOrder: 0,
        pricings: [],
        usePricings: false,
      });
      setPricingMode('single');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">创建订阅计划</Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">填写以下信息创建新的订阅计划</Dialog.Description>
          </div>

          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">基本信息</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label.Root htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    计划名称 <span className="text-destructive">*</span>
                  </Label.Root>
                  <input
                    id="name"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label.Root htmlFor="slug" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Slug (URL标识) <span className="text-destructive">*</span>
                  </Label.Root>
                  <input
                    id="slug"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">仅小写字母、数字和连字符</p>
                </div>

                {/* 定价模式切换 */}
                <div className="space-y-2 sm:col-span-2">
                  <Label.Root className="text-sm font-medium leading-none">定价模式</Label.Root>
                  <Tabs.Root value={pricingMode} onValueChange={(v) => setPricingMode(v as 'single' | 'multiple')}>
                    <Tabs.List className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                      <Tabs.Trigger
                        value="single"
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                      >
                        单一定价
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="multiple"
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                      >
                        多定价
                      </Tabs.Trigger>
                    </Tabs.List>
                  </Tabs.Root>
                  <p className="text-xs text-muted-foreground">
                    {pricingMode === 'single' ? '设置单一价格和计费周期' : '为不同计费周期设置不同价格'}
                  </p>
                </div>

                {pricingMode === 'single' ? (
                  <>
                    <div className="space-y-2">
                      <Label.Root htmlFor="price" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        价格（元）<span className="text-destructive">*</span>
                      </Label.Root>
                      <input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.price}
                        onChange={(e) => handleChange('price', Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label.Root htmlFor="currency" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        货币 <span className="text-destructive">*</span>
                      </Label.Root>
                      <Select.Root
                        value={formData.currency}
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

                    <div className="space-y-2">
                      <Label.Root htmlFor="billingCycle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        计费周期 <span className="text-destructive">*</span>
                      </Label.Root>
                      <Select.Root
                        value={formData.billingCycle}
                        onValueChange={(value) => handleChange('billingCycle', value)}
                      >
                        <Select.Trigger id="billingCycle" className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                          <Select.Value />
                          <Select.Icon>
                            <ChevronDown className="size-4 opacity-50" />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80">
                            <Select.Viewport className="p-1">
                              {BILLING_CYCLES.map((option) => (
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
                  </>
                ) : (
                  <div className="space-y-4 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label.Root className="text-sm font-medium">定价选项</Label.Root>
                      <button
                        type="button"
                        onClick={handleAddPricing}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3"
                      >
                        <Plus className="size-4 mr-1" />
                        添加定价
                      </button>
                    </div>

                    {formData.pricings.length === 0 ? (
                      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                        暂无定价选项，点击"添加定价"开始配置
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.pricings.map((pricing, index) => (
                          <div key={index} className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">定价 #{index + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemovePricing(index)}
                                className="text-destructive hover:text-destructive/80"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <Select.Root
                                value={pricing.billingCycle}
                                onValueChange={(value) => handleUpdatePricing(index, { billingCycle: value as BillingCycle })}
                              >
                                <Select.Trigger className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                                  <Select.Value placeholder="计费周期" />
                                  <Select.Icon><ChevronDown className="size-4 opacity-50" /></Select.Icon>
                                </Select.Trigger>
                                <Select.Portal>
                                  <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                                    <Select.Viewport className="p-1">
                                      {BILLING_CYCLES.map((opt) => (
                                        <Select.Item key={opt.value} value={opt.value} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                                          <Select.ItemText>{opt.label}</Select.ItemText>
                                          <Select.ItemIndicator className="absolute right-2"><Check className="size-4" /></Select.ItemIndicator>
                                        </Select.Item>
                                      ))}
                                    </Select.Viewport>
                                  </Select.Content>
                                </Select.Portal>
                              </Select.Root>

                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="价格（元）"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={pricing.price / 100 || ''}
                                onChange={(e) => handleUpdatePricing(index, { price: Math.round(Number(e.target.value) * 100) })}
                              />

                              <Select.Root
                                value={pricing.currency}
                                onValueChange={(value) => handleUpdatePricing(index, { currency: value })}
                              >
                                <Select.Trigger className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring">
                                  <Select.Value placeholder="货币" />
                                  <Select.Icon><ChevronDown className="size-4 opacity-50" /></Select.Icon>
                                </Select.Trigger>
                                <Select.Portal>
                                  <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                                    <Select.Viewport className="p-1">
                                      <Select.Item value="CNY" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                                        <Select.ItemText>CNY</Select.ItemText>
                                        <Select.ItemIndicator className="absolute right-2"><Check className="size-4" /></Select.ItemIndicator>
                                      </Select.Item>
                                      <Select.Item value="USD" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                                        <Select.ItemText>USD</Select.ItemText>
                                        <Select.ItemIndicator className="absolute right-2"><Check className="size-4" /></Select.ItemIndicator>
                                      </Select.Item>
                                    </Select.Viewport>
                                  </Select.Content>
                                </Select.Portal>
                              </Select.Root>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox.Root
                                id={`pricing-active-${index}`}
                                checked={pricing.isActive}
                                onCheckedChange={(checked) => handleUpdatePricing(index, { isActive: checked as boolean })}
                                className="peer size-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                              >
                                <Checkbox.Indicator className="flex items-center justify-center text-current">
                                  <Check className="size-4" />
                                </Checkbox.Indicator>
                              </Checkbox.Root>
                              <Label.Root htmlFor={`pricing-active-${index}`} className="text-sm cursor-pointer">
                                激活此定价
                              </Label.Root>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2 sm:col-span-2">
                  <Label.Root htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">描述</Label.Root>
                  <textarea
                    id="description"
                    rows={3}
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.description}
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
              <h3 className="text-sm font-semibold">限制配置（可选）</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label.Root htmlFor="maxUsers" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">最大用户数</Label.Root>
                  <input
                    id="maxUsers"
                    type="number"
                    min="0"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.maxUsers || ''}
                    onChange={(e) => handleChange('maxUsers', e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label.Root htmlFor="maxProjects" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">最大项目数</Label.Root>
                  <input
                    id="maxProjects"
                    type="number"
                    min="0"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.maxProjects || ''}
                    onChange={(e) => handleChange('maxProjects', e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label.Root htmlFor="apiRateLimit" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">API速率限制（次/小时）</Label.Root>
                  <input
                    id="apiRateLimit"
                    type="number"
                    min="0"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.apiRateLimit || ''}
                    onChange={(e) => handleChange('apiRateLimit', e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* 其他设置 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">其他设置</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label.Root htmlFor="trialDays" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">试用天数</Label.Root>
                  <input
                    id="trialDays"
                    type="number"
                    min="0"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.trialDays || 0}
                    onChange={(e) => handleChange('trialDays', e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label.Root htmlFor="sortOrder" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">排序顺序</Label.Root>
                  <input
                    id="sortOrder"
                    type="number"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.sortOrder || 0}
                    onChange={(e) => handleChange('sortOrder', e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">数字越小越靠前</p>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox.Root
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => handleChange('isPublic', checked)}
                    className="peer size-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  >
                    <Checkbox.Indicator className="flex items-center justify-center text-current">
                      <Check className="size-4" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <Label.Root htmlFor="isPublic" className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
              disabled={loading || !formData.name || !formData.slug}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            >
              {loading ? '创建中...' : '创建'}
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
