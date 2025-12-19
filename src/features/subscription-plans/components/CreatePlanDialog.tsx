/**
 * 创建订阅计划对话框
 * 使用封装的通用组件实现
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Label } from '@/components/common/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Checkbox } from '@/components/common/Checkbox';
import { Separator } from '@/components/common/Separator';
import { Alert, AlertDescription } from '@/components/common/Alert';
import type { CreatePlanRequest, PricingOptionInput, PlanType, SubscriptionPlan } from '@/api/subscription/types';

// 本地定义的类型（原 SDK 已移除）
type ForwardRuleTypeOption = 'direct' | 'entry' | 'chain' | 'direct_chain';

interface PlanLimits {
  trafficLimit?: number;
  deviceLimit?: number;
  speedLimit?: number;
  connectionLimit?: number;
  forwardRuleLimit?: number;
  forwardTrafficLimit?: number;
  forwardRuleTypes?: ForwardRuleTypeOption[];
}

// 辅助函数：将 PlanLimits 转换为 API 格式
function planLimitsToApiFormat(limits: PlanLimits): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (limits.trafficLimit !== undefined) result['traffic_limit'] = limits.trafficLimit;
  if (limits.deviceLimit !== undefined) result['device_limit'] = limits.deviceLimit;
  if (limits.speedLimit !== undefined) result['speed_limit'] = limits.speedLimit;
  if (limits.connectionLimit !== undefined) result['connection_limit'] = limits.connectionLimit;
  if (limits.forwardRuleLimit !== undefined) result['forward_rule_limit'] = limits.forwardRuleLimit;
  if (limits.forwardTrafficLimit !== undefined) result['forward_traffic_limit'] = limits.forwardTrafficLimit;
  if (limits.forwardRuleTypes !== undefined) result['forward_rule_types'] = limits.forwardRuleTypes;
  return result;
}

// 辅助函数：解析 API 格式的限制（axios-case-converter 会将响应转换为 camelCase）
function parsePlanLimits(apiLimits: Record<string, unknown> | undefined): PlanLimits {
  if (!apiLimits) return {};
  return {
    trafficLimit: apiLimits.trafficLimit as number | undefined,
    deviceLimit: apiLimits.deviceLimit as number | undefined,
    speedLimit: apiLimits.speedLimit as number | undefined,
    connectionLimit: apiLimits.connectionLimit as number | undefined,
    forwardRuleLimit: apiLimits.forwardRuleLimit as number | undefined,
    forwardTrafficLimit: apiLimits.forwardTrafficLimit as number | undefined,
    forwardRuleTypes: apiLimits.forwardRuleTypes as ForwardRuleTypeOption[] | undefined,
  };
}

interface CreatePlanDialogProps {
  open: boolean;
  /** 用于复制计划时预填充数据 */
  initialPlan?: SubscriptionPlan | null;
  onClose: () => void;
  onSubmit: (data: CreatePlanRequest) => Promise<void>;
}

const BILLING_CYCLES: { value: string; label: string }[] = [
  { value: 'weekly', label: '周付' },
  { value: 'monthly', label: '月付' },
  { value: 'quarterly', label: '季付' },
  { value: 'semi_annual', label: '半年付' },
  { value: 'yearly', label: '年付' },
  { value: 'lifetime', label: '终身' },
];

// 转发规则类型选项
const FORWARD_RULE_TYPES: { value: ForwardRuleTypeOption; label: string }[] = [
  { value: 'direct', label: '直连' },
  { value: 'entry', label: '入口' },
  { value: 'chain', label: '链式' },
  { value: 'direct_chain', label: '直连链' },
];

// 计划类型选项
const PLAN_TYPES: { value: PlanType; label: string }[] = [
  { value: 'node', label: '节点订阅' },
  { value: 'forward', label: '端口转发' },
];

// 扩展 CreatePlanRequest 以支持计划限制
interface CreatePlanFormData extends Omit<CreatePlanRequest, 'limits' | 'pricings'> {
  pricings: PricingOptionInput[];
  // 计划限制
  planLimits: PlanLimits;
}

// 默认定价选项
const getDefaultPricing = (): PricingOptionInput => ({
  billingCycle: 'monthly',
  price: 0,
  currency: 'CNY',
  isActive: true,
});

// 默认表单数据
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

export const CreatePlanDialog: React.FC<CreatePlanDialogProps> = ({
  open,
  initialPlan,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreatePlanFormData>(getDefaultFormData());
  const [loading, setLoading] = useState(false);

  // 是否为复制模式
  const isDuplicateMode = !!initialPlan;

  // 初始化表单数据（复制模式时预填充）
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
        pricings: initialPlan.pricings && initialPlan.pricings.length > 0
          ? initialPlan.pricings.map(p => ({
              billingCycle: p.billingCycle,
              price: p.price,
              currency: p.currency,
              isActive: p.isActive,
            }))
          : [getDefaultPricing()],
        planLimits,
      });
    } else if (open && !initialPlan) {
      // 创建模式：重置为默认值
      setFormData(getDefaultFormData());
    }
  }, [open, initialPlan]);

  const handleChange = (field: keyof CreatePlanFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 处理计划限制变更
  const handleLimitChange = (field: keyof PlanLimits, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      planLimits: { ...prev.planLimits, [field]: value },
    }));
  };

  // 处理转发规则类型多选
  const handleForwardTypeToggle = (type: ForwardRuleTypeOption) => {
    setFormData((prev) => {
      const currentTypes = prev.planLimits.forwardRuleTypes || [];
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter((t) => t !== type)
        : [...currentTypes, type];
      return {
        ...prev,
        planLimits: { ...prev.planLimits, forwardRuleTypes: newTypes },
      };
    });
  };

  // 多定价相关操作
  const handleAddPricing = () => {
    const newPricing: PricingOptionInput = {
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

  const handleUpdatePricing = (index: number, updates: Partial<PricingOptionInput>) => {
    setFormData((prev) => ({
      ...prev,
      pricings: prev.pricings.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    }));
  };

  const handleSubmit = async () => {
    // 验证至少有一个定价
    if (formData.pricings.length === 0) {
      return;
    }

    setLoading(true);
    try {
      // 构建计划限制
      const limits = Object.keys(formData.planLimits).length > 0
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
      onClose();
      // 重置表单
      setFormData(getDefaultFormData());
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDuplicateMode && <Copy className="size-5" />}
            {isDuplicateMode ? '复制订阅计划' : '创建订阅计划'}
          </DialogTitle>
          <DialogDescription>
            {isDuplicateMode
              ? `基于「${initialPlan?.name}」创建新的订阅计划`
              : '填写以下信息创建新的订阅计划'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">基本信息</h3>
            <Separator />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">
                  计划名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="slug">
                  Slug (URL标识) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">仅小写字母、数字和连字符</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="planType">
                  计划类型 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.planType}
                  onValueChange={(value) => handleChange('planType', value as PlanType)}
                  disabled={loading}
                >
                  <SelectTrigger id="planType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 定价选项 */}
              <div className="space-y-4 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>
                    定价选项 <span className="text-destructive">*</span>
                  </Label>
                  <Button variant="outline" size="sm" onClick={handleAddPricing} disabled={loading}>
                    <Plus className="size-4 mr-1" />
                    添加定价
                  </Button>
                </div>

                {formData.pricings.length === 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      至少需要添加一个定价选项
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {formData.pricings.map((pricing, index) => (
                      <div key={index} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">定价 #{index + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePricing(index)}
                            disabled={loading || formData.pricings.length === 1}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <Select
                            value={pricing.billingCycle}
                            onValueChange={(value) => handleUpdatePricing(index, { billingCycle: value })}
                            disabled={loading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="计费周期" />
                            </SelectTrigger>
                            <SelectContent>
                              {BILLING_CYCLES.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="价格（元）"
                            value={pricing.price / 100 || ''}
                            onChange={(e) => handleUpdatePricing(index, { price: Math.round(Number(e.target.value) * 100) })}
                            disabled={loading}
                          />

                          <Select
                            value={pricing.currency}
                            onValueChange={(value) => handleUpdatePricing(index, { currency: value })}
                            disabled={loading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="货币" />
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
                            onCheckedChange={(checked) => handleUpdatePricing(index, { isActive: checked as boolean })}
                            disabled={loading}
                          />
                          <Label htmlFor={`pricing-active-${index}`} className="cursor-pointer">
                            激活此定价
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* 节点订阅限制配置 - 仅节点类型计划显示 */}
          {formData.planType === 'node' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">节点限制配置</h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="trafficLimit">月流量上限 (GB)</Label>
                  <Input
                    id="trafficLimit"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0 表示无限制"
                    value={formData.planLimits.trafficLimit ? formData.planLimits.trafficLimit / (1024 * 1024 * 1024) : ''}
                    onChange={(e) => handleLimitChange('trafficLimit', e.target.value === '' ? undefined : Math.round(Number(e.target.value) * 1024 * 1024 * 1024))}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="deviceLimit">设备数量上限</Label>
                  <Input
                    id="deviceLimit"
                    type="number"
                    min="0"
                    placeholder="0 表示无限制"
                    value={formData.planLimits.deviceLimit || ''}
                    onChange={(e) => handleLimitChange('deviceLimit', e.target.value === '' ? undefined : Number(e.target.value))}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="speedLimit">速度限制 (Mbps)</Label>
                  <Input
                    id="speedLimit"
                    type="number"
                    min="0"
                    placeholder="0 表示无限制"
                    value={formData.planLimits.speedLimit || ''}
                    onChange={(e) => handleLimitChange('speedLimit', e.target.value === '' ? undefined : Number(e.target.value))}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="connectionLimit">连接数上限</Label>
                  <Input
                    id="connectionLimit"
                    type="number"
                    min="0"
                    placeholder="0 表示无限制"
                    value={formData.planLimits.connectionLimit || ''}
                    onChange={(e) => handleLimitChange('connectionLimit', e.target.value === '' ? undefined : Number(e.target.value))}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 转发限制配置 - 仅端口转发类型计划显示 */}
          {formData.planType === 'forward' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">转发限制配置</h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="forwardRuleLimit">转发规则数量上限</Label>
                  <Input
                    id="forwardRuleLimit"
                    type="number"
                    min="0"
                    placeholder="0 表示无限制"
                    value={formData.planLimits.forwardRuleLimit || ''}
                    onChange={(e) => handleLimitChange('forwardRuleLimit', e.target.value === '' ? undefined : Number(e.target.value))}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="forwardTrafficLimit">转发流量上限 (GB)</Label>
                  <Input
                    id="forwardTrafficLimit"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0 表示无限制"
                    value={formData.planLimits.forwardTrafficLimit ? formData.planLimits.forwardTrafficLimit / (1024 * 1024 * 1024) : ''}
                    onChange={(e) => handleLimitChange('forwardTrafficLimit', e.target.value === '' ? undefined : Math.round(Number(e.target.value) * 1024 * 1024 * 1024))}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label>允许的转发类型</Label>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {FORWARD_RULE_TYPES.map((type) => (
                      <div key={type.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`forward-type-${type.value}`}
                          checked={formData.planLimits.forwardRuleTypes?.includes(type.value) || false}
                          onCheckedChange={() => handleForwardTypeToggle(type.value)}
                          disabled={loading}
                        />
                        <Label htmlFor={`forward-type-${type.value}`} className="cursor-pointer">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">不选择表示允许所有类型</p>
                </div>
              </div>
            </div>
          )}

          {/* 通用配置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">通用配置</h3>
            <Separator />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="trialDays">试用天数</Label>
                <Input
                  id="trialDays"
                  type="number"
                  min="0"
                  value={formData.trialDays || 0}
                  onChange={(e) => handleChange('trialDays', e.target.value === '' ? undefined : Number(e.target.value))}
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="sortOrder">排序顺序</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder || 0}
                  onChange={(e) => handleChange('sortOrder', e.target.value === '' ? undefined : Number(e.target.value))}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">数字越小越靠前</p>
              </div>

              <div className="flex items-center gap-2 sm:col-span-2">
                <Checkbox
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleChange('isPublic', checked)}
                  disabled={loading}
                />
                <Label htmlFor="isPublic" className="cursor-pointer font-medium">
                  公开显示此计划
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.name || !formData.slug}>
            {loading ? '创建中...' : (isDuplicateMode ? '创建副本' : '创建')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
