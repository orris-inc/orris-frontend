/**
 * Create Subscription Plan Sheet Component
 * Mobile-optimized bottom sheet for creating subscription plans
 * Responsive layout: compact on small screens, expanded on larger screens
 */

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Tag,
  Hash,
  Plus,
  Trash2,
  AlertCircle,
  Copy,
  Globe,
  Loader2,
} from 'lucide-react';
import { MobileFormInput } from '@/components/common/mobile-form';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type CreateSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Label } from '@/components/common/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { cn } from '@/lib/utils';
import type {
  CreatePlanRequest,
  PricingOptionInput,
  PlanType,
  SubscriptionPlan,
} from '@/api/subscription/types';

// Locally defined types
type ForwardRuleTypeOption = 'direct' | 'entry' | 'chain' | 'direct_chain';

interface PlanLimits {
  trafficLimit?: number;
  deviceLimit?: number;
  speedLimit?: number;
  connectionLimit?: number;
  ruleLimit?: number;
  ruleTypes?: ForwardRuleTypeOption[];
  nodeLimit?: number;
}

// Helper function: convert PlanLimits to API format
function planLimitsToApiFormat(limits: PlanLimits): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (limits.trafficLimit !== undefined) result['traffic_limit'] = limits.trafficLimit;
  if (limits.deviceLimit !== undefined) result['device_limit'] = limits.deviceLimit;
  if (limits.speedLimit !== undefined) result['speed_limit'] = limits.speedLimit;
  if (limits.connectionLimit !== undefined) result['connection_limit'] = limits.connectionLimit;
  if (limits.ruleLimit !== undefined) result['rule_limit'] = limits.ruleLimit;
  if (limits.ruleTypes !== undefined) result['rule_types'] = limits.ruleTypes;
  if (limits.nodeLimit !== undefined) result['node_limit'] = limits.nodeLimit;
  return result;
}

// Helper function: parse API format limits
function parsePlanLimits(apiLimits: Record<string, unknown> | undefined): PlanLimits {
  if (!apiLimits) return {};
  return {
    trafficLimit: apiLimits.trafficLimit as number | undefined,
    deviceLimit: apiLimits.deviceLimit as number | undefined,
    speedLimit: apiLimits.speedLimit as number | undefined,
    connectionLimit: apiLimits.connectionLimit as number | undefined,
    ruleLimit: apiLimits.ruleLimit as number | undefined,
    ruleTypes: apiLimits.ruleTypes as ForwardRuleTypeOption[] | undefined,
    nodeLimit: apiLimits.nodeLimit as number | undefined,
  };
}

interface CreatePlanSheetProps extends CreateSheetProps<CreatePlanRequest> {
  /** Initial plan for duplicate mode */
  initialPlan?: SubscriptionPlan | null;
}

const BILLING_CYCLES: { value: string; label: string }[] = [
  { value: 'weekly', label: '周付' },
  { value: 'monthly', label: '月付' },
  { value: 'quarterly', label: '季付' },
  { value: 'semi_annual', label: '半年付' },
  { value: 'yearly', label: '年付' },
  { value: 'lifetime', label: '终身' },
];

const FORWARD_RULE_TYPES: { value: ForwardRuleTypeOption; label: string }[] = [
  { value: 'direct', label: '直连' },
  { value: 'entry', label: '入口' },
  { value: 'chain', label: '链式' },
  { value: 'direct_chain', label: '直连链' },
];

// Plan type options (hybrid is not yet implemented)
const PLAN_TYPES: { value: PlanType; label: string }[] = [
  { value: 'node', label: '节点订阅' },
  { value: 'forward', label: '端口转发' },
];

interface CreatePlanFormData extends Omit<CreatePlanRequest, 'limits' | 'pricings'> {
  pricings: PricingOptionInput[];
  planLimits: PlanLimits;
}

const getDefaultPricing = (): PricingOptionInput => ({
  billingCycle: 'monthly',
  price: 0,
  currency: 'CNY',
  isActive: true,
});

const getDefaultFormData = (): CreatePlanFormData => ({
  name: '',
  slug: '',
  planType: 'node',
  description: '',
  isPublic: true,
  trialDays: 0,
  maxUsers: undefined,
  maxProjects: undefined,
  apiRateLimit: undefined,
  sortOrder: 0,
  pricings: [getDefaultPricing()],
  planLimits: {},
});

// Compact input styles for number inputs in grids
const compactInputStyles = cn(
  'w-full h-10 px-3 text-sm rounded-lg border bg-background',
  'placeholder:text-muted-foreground/60',
  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
);

export const CreatePlanSheet: React.FC<CreatePlanSheetProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialPlan,
}) => {
  const [formData, setFormData] = useState<CreatePlanFormData>(getDefaultFormData());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});

  const isDuplicateMode = !!initialPlan;

  // Initialize form data
  useEffect(() => {
    if (open && initialPlan) {
      const planLimits = parsePlanLimits(initialPlan.limits);
      setFormData({
        name: `${initialPlan.name} (副本)`,
        slug: `${initialPlan.slug}-copy`,
        planType: initialPlan.planType || 'node',
        description: initialPlan.description || '',
        isPublic: initialPlan.isPublic,
        trialDays: initialPlan.trialDays || 0,
        maxUsers: initialPlan.maxUsers || undefined,
        maxProjects: initialPlan.maxProjects || undefined,
        apiRateLimit: initialPlan.apiRateLimit || undefined,
        sortOrder: initialPlan.sortOrder || 0,
        pricings:
          initialPlan.pricings && initialPlan.pricings.length > 0
            ? initialPlan.pricings.map((p) => ({
                billingCycle: p.billingCycle,
                price: p.price,
                currency: p.currency,
                isActive: p.isActive,
              }))
            : [getDefaultPricing()],
        planLimits,
      });
    } else if (open && !initialPlan) {
      setFormData(getDefaultFormData());
    }
    setErrors({});
  }, [open, initialPlan]);

  const handleChange = useCallback((field: keyof CreatePlanFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'name' || field === 'slug') {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, []);

  const handleLimitChange = useCallback((field: keyof PlanLimits, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      planLimits: { ...prev.planLimits, [field]: value },
    }));
  }, []);

  const handleRuleTypeToggle = useCallback((type: ForwardRuleTypeOption) => {
    setFormData((prev) => {
      const currentTypes = prev.planLimits.ruleTypes || [];
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter((t) => t !== type)
        : [...currentTypes, type];
      return {
        ...prev,
        planLimits: { ...prev.planLimits, ruleTypes: newTypes },
      };
    });
  }, []);

  const handleAddPricing = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      pricings: [...prev.pricings, getDefaultPricing()],
    }));
  }, []);

  const handleRemovePricing = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      pricings: prev.pricings.filter((_, i) => i !== index),
    }));
  }, []);

  const handleUpdatePricing = useCallback((index: number, updates: Partial<PricingOptionInput>) => {
    setFormData((prev) => ({
      ...prev,
      pricings: prev.pricings.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    }));
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: { name?: string; slug?: string } = {};
    if (!formData.name.trim()) newErrors.name = '请输入计划名称';
    if (!formData.slug.trim()) newErrors.slug = '请输入 Slug';
    else if (!/^[a-z0-9-]+$/.test(formData.slug)) newErrors.slug = '仅允许小写字母、数字和连字符';
    setErrors(newErrors);
    return !newErrors.name && !newErrors.slug;
  }, [formData.name, formData.slug]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    if (formData.pricings.length === 0) return;

    setLoading(true);
    try {
      const limits =
        Object.keys(formData.planLimits).length > 0
          ? planLimitsToApiFormat(formData.planLimits)
          : undefined;

      const submitData: CreatePlanRequest = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        planType: formData.planType,
        limits,
        isPublic: formData.isPublic,
        trialDays: formData.trialDays,
        maxUsers: formData.maxUsers,
        maxProjects: formData.maxProjects,
        apiRateLimit: formData.apiRateLimit,
        sortOrder: formData.sortOrder,
        pricings: formData.pricings,
      };
      await onSubmit(submitData);
      setFormData(getDefaultFormData());
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [formData, validate, onSubmit, onOpenChange]);

  const handleClose = useCallback(
    (o: boolean) => {
      if (!loading) {
        setFormData(getDefaultFormData());
        setErrors({});
        onOpenChange(o);
      }
    },
    [loading, onOpenChange]
  );

  const isFormValid = formData.name.trim() && formData.slug.trim() && formData.pricings.length > 0;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div
              className={cn(
                'size-8 rounded-full flex items-center justify-center',
                isDuplicateMode ? 'bg-blue-500/10' : 'bg-primary/10'
              )}
            >
              {isDuplicateMode ? (
                <Copy className="size-4 text-blue-500" />
              ) : (
                <CreditCard className="size-4 text-primary" />
              )}
            </div>
            <span>{isDuplicateMode ? '复制订阅计划' : '创建订阅计划'}</span>
          </SheetTitle>
          <SheetDescription className="text-xs">
            {isDuplicateMode
              ? `基于「${initialPlan?.name}」创建新计划`
              : '填写以下信息创建新的订阅计划'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4 py-3">
          {/* Basic Information - 2 column grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">基本信息</h4>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="plan-name" className="text-xs font-medium">
                  计划名称 <span className="text-destructive">*</span>
                </label>
                <MobileFormInput
                  id="plan-name"
                  value={formData.name}
                  onChange={(v) => handleChange('name', v)}
                  placeholder="计划名称"
                  icon={<Tag className="size-4" />}
                  error={errors.name}
                  disabled={loading}
                  className="min-h-[44px] py-2 text-sm rounded-lg"
                  containerClassName="space-y-1"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="plan-slug" className="text-xs font-medium">
                  Slug <span className="text-destructive">*</span>
                </label>
                <MobileFormInput
                  id="plan-slug"
                  value={formData.slug}
                  onChange={(v) => handleChange('slug', v)}
                  placeholder="url-slug"
                  icon={<Hash className="size-4" />}
                  error={errors.slug}
                  disabled={loading}
                  className="min-h-[44px] py-2 text-sm rounded-lg"
                  containerClassName="space-y-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">计划类型</label>
                <Select
                  value={formData.planType}
                  onValueChange={(v) => handleChange('planType', v as PlanType)}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11 rounded-lg text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_TYPES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-0.5">
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg border bg-muted/30 w-full">
                  <Checkbox
                    id="plan-public"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => handleChange('isPublic', checked)}
                    disabled={loading}
                  />
                  <Label htmlFor="plan-public" className="cursor-pointer text-sm flex items-center gap-1.5">
                    <Globe className="size-3.5 text-muted-foreground" />
                    公开
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Options - Compact cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                定价选项
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddPricing}
                disabled={loading}
                className="h-7 text-xs"
              >
                <Plus className="size-3.5 mr-1" />
                添加
              </Button>
            </div>

            {formData.pricings.length === 0 ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <div className="flex items-center gap-2 text-destructive text-xs">
                  <AlertCircle className="size-3.5" />
                  <span>至少需要添加一个定价选项</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.pricings.map((pricing, index) => (
                  <div key={index} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">定价 #{index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePricing(index)}
                        disabled={loading || formData.pricings.length === 1}
                        className="text-destructive hover:text-destructive/80 h-6 w-6 p-0"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Select
                        value={pricing.billingCycle}
                        onValueChange={(value) => handleUpdatePricing(index, { billingCycle: value })}
                        disabled={loading}
                      >
                        <SelectTrigger className="h-10 rounded-lg text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BILLING_CYCLES.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="价格"
                        value={pricing.price / 100 || ''}
                        onChange={(e) =>
                          handleUpdatePricing(index, {
                            price: Math.round(Number(e.target.value) * 100),
                          })
                        }
                        disabled={loading}
                        className={compactInputStyles}
                      />
                      <Select
                        value={pricing.currency}
                        onValueChange={(value) => handleUpdatePricing(index, { currency: value })}
                        disabled={loading}
                      >
                        <SelectTrigger className="h-10 rounded-lg text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CNY">CNY</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`pricing-active-${index}`}
                        checked={pricing.isActive}
                        onCheckedChange={(checked) =>
                          handleUpdatePricing(index, { isActive: checked as boolean })
                        }
                        disabled={loading}
                      />
                      <Label htmlFor={`pricing-active-${index}`} className="cursor-pointer text-xs">
                        激活
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Node Limits - Grid layout */}
          {(formData.planType === 'node' || formData.planType === 'hybrid') && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                节点限制
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">流量 (GB)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="无限"
                    value={
                      formData.planLimits.trafficLimit
                        ? formData.planLimits.trafficLimit / (1024 * 1024 * 1024)
                        : ''
                    }
                    onChange={(e) =>
                      handleLimitChange(
                        'trafficLimit',
                        e.target.value === ''
                          ? undefined
                          : Math.round(Number(e.target.value) * 1024 * 1024 * 1024)
                      )
                    }
                    disabled={loading}
                    className={compactInputStyles}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">设备数</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="无限"
                    value={formData.planLimits.deviceLimit || ''}
                    onChange={(e) =>
                      handleLimitChange(
                        'deviceLimit',
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
                    }
                    disabled={loading}
                    className={compactInputStyles}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">速度 (Mbps)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="无限"
                    value={formData.planLimits.speedLimit || ''}
                    onChange={(e) =>
                      handleLimitChange(
                        'speedLimit',
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
                    }
                    disabled={loading}
                    className={compactInputStyles}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">连接数</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="无限"
                    value={formData.planLimits.connectionLimit || ''}
                    onChange={(e) =>
                      handleLimitChange(
                        'connectionLimit',
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
                    }
                    disabled={loading}
                    className={compactInputStyles}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">节点数</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="无限"
                    value={formData.planLimits.nodeLimit || ''}
                    onChange={(e) =>
                      handleLimitChange(
                        'nodeLimit',
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
                    }
                    disabled={loading}
                    className={compactInputStyles}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Forward Limits */}
          {(formData.planType === 'forward' || formData.planType === 'hybrid') && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                转发限制
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">规则数</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="无限"
                    value={formData.planLimits.ruleLimit || ''}
                    onChange={(e) =>
                      handleLimitChange(
                        'ruleLimit',
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
                    }
                    disabled={loading}
                    className={compactInputStyles}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">流量 (GB)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="无限"
                    value={
                      formData.planLimits.trafficLimit
                        ? formData.planLimits.trafficLimit / (1024 * 1024 * 1024)
                        : ''
                    }
                    onChange={(e) =>
                      handleLimitChange(
                        'trafficLimit',
                        e.target.value === ''
                          ? undefined
                          : Math.round(Number(e.target.value) * 1024 * 1024 * 1024)
                      )
                    }
                    disabled={loading}
                    className={compactInputStyles}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">允许的规则类型</label>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {FORWARD_RULE_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`rule-type-${type.value}`}
                        checked={formData.planLimits.ruleTypes?.includes(type.value) || false}
                        onCheckedChange={() => handleRuleTypeToggle(type.value)}
                        disabled={loading}
                        className="size-4"
                      />
                      <Label htmlFor={`rule-type-${type.value}`} className="cursor-pointer text-xs">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description & Config - Compact */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              其他配置
            </h4>
            <textarea
              placeholder="计划描述（可选）"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={loading}
              rows={2}
              className={cn(
                'w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                'placeholder:text-muted-foreground/60'
              )}
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">试用天数</label>
                <input
                  type="number"
                  min="0"
                  value={formData.trialDays || 0}
                  onChange={(e) =>
                    handleChange('trialDays', e.target.value === '' ? 0 : Number(e.target.value))
                  }
                  disabled={loading}
                  className={compactInputStyles}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">排序</label>
                <input
                  type="number"
                  value={formData.sortOrder || 0}
                  onChange={(e) =>
                    handleChange('sortOrder', e.target.value === '' ? 0 : Number(e.target.value))
                  }
                  disabled={loading}
                  className={compactInputStyles}
                />
              </div>
            </div>
          </div>
        </SheetBody>

        <SheetFooter className="pt-3 pb-1">
          <Button
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            className="w-full h-11"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                创建中...
              </>
            ) : isDuplicateMode ? (
              '创建副本'
            ) : (
              '创建计划'
            )}
          </Button>
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={loading} className="w-full h-10">
            取消
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
