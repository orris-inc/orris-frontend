/**
 * Edit Subscription Plan Dialog
 * Implemented using wrapped common components
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
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
import { TruncatedId } from '@/components/admin';
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
import type { SubscriptionPlan, UpdatePlanRequest, PricingOptionInput } from '@/api/subscription/types';

// Locally defined types (removed from original SDK)
type ForwardRuleTypeOption = 'direct' | 'entry' | 'chain' | 'direct_chain';

interface PlanLimits {
  trafficLimit?: number;
  deviceLimit?: number;
  speedLimit?: number;
  connectionLimit?: number;
  forwardRuleLimit?: number;
  forwardTrafficLimit?: number;
  forwardRuleTypes?: ForwardRuleTypeOption[];
  nodeLimit?: number;
}

// Helper function: convert PlanLimits to API format
function planLimitsToApiFormat(limits: PlanLimits): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (limits.trafficLimit !== undefined) result['traffic_limit'] = limits.trafficLimit;
  if (limits.deviceLimit !== undefined) result['device_limit'] = limits.deviceLimit;
  if (limits.speedLimit !== undefined) result['speed_limit'] = limits.speedLimit;
  if (limits.connectionLimit !== undefined) result['connection_limit'] = limits.connectionLimit;
  if (limits.forwardRuleLimit !== undefined) result['forward_rule_limit'] = limits.forwardRuleLimit;
  if (limits.forwardTrafficLimit !== undefined) result['forward_traffic_limit'] = limits.forwardTrafficLimit;
  if (limits.forwardRuleTypes !== undefined) result['forward_rule_types'] = limits.forwardRuleTypes;
  if (limits.nodeLimit !== undefined) result['node_limit'] = limits.nodeLimit;
  return result;
}

// Helper function: parse API format limits (axios-case-converter converts response to camelCase)
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
    nodeLimit: apiLimits.nodeLimit as number | undefined,
  };
}

interface EditPlanDialogProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdatePlanRequest) => Promise<void>;
}

const BILLING_CYCLES: { value: string; label: string }[] = [
  { value: 'weekly', label: '周付' },
  { value: 'monthly', label: '月付' },
  { value: 'quarterly', label: '季付' },
  { value: 'semi_annual', label: '半年付' },
  { value: 'yearly', label: '年付' },
  { value: 'lifetime', label: '终身' },
];

// Forward rule type options
const FORWARD_RULE_TYPES: { value: ForwardRuleTypeOption; label: string }[] = [
  { value: 'direct', label: '直连' },
  { value: 'entry', label: '入口' },
  { value: 'chain', label: '链式' },
  { value: 'direct_chain', label: '直连链' },
];

// Extend UpdatePlanRequest to support multi-pricing management and plan limits
interface UpdatePlanFormData extends Omit<UpdatePlanRequest, 'limits'> {
  pricings: PricingOptionInput[];
  // Plan limits
  planLimits: PlanLimits;
}

export const EditPlanDialog: React.FC<EditPlanDialogProps> = ({
  open,
  plan,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<UpdatePlanFormData>({ pricings: [], planLimits: {} });
  const [loading, setLoading] = useState(false);

  // Update form data when plan changes
  useEffect(() => {
    if (plan) {
      // Parse plan limits
      const planLimits = parsePlanLimits(plan.limits);

      setFormData({
        description: plan.description,
        isPublic: plan.isPublic,
        maxUsers: plan.maxUsers,
        maxProjects: plan.maxProjects,
        apiRateLimit: plan.apiRateLimit,
        sortOrder: plan.sortOrder,
        pricings: (plan.pricings || []).map(p => ({
          billingCycle: p.billingCycle,
          price: p.price,
          currency: p.currency,
          isActive: p.isActive,
        })),
        planLimits,
      });
    }
  }, [plan]);

  const handleChange = (field: keyof UpdatePlanFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle plan limit changes
  const handleLimitChange = (field: keyof PlanLimits, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      planLimits: { ...prev.planLimits, [field]: value },
    }));
  };

  // Handle forward rule type multi-select
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

  // Multi-pricing related operations
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
    if (!plan) return;
    // Validate at least one pricing option
    if (formData.pricings.length === 0) {
      return;
    }

    setLoading(true);
    try {
      // Build plan limits
      const limits = Object.keys(formData.planLimits).length > 0
        ? planLimitsToApiFormat(formData.planLimits)
        : undefined;

      const submitData: UpdatePlanRequest = {
        description: formData.description,
        limits,
        isPublic: formData.isPublic,
        maxUsers: formData.maxUsers,
        maxProjects: formData.maxProjects,
        apiRateLimit: formData.apiRateLimit,
        sortOrder: formData.sortOrder,
        pricings: formData.pricings,
      };
      await onSubmit(plan.id, submitData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>编辑订阅计划: {plan.name}</DialogTitle>
          <DialogDescription>修改订阅计划的配置信息</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        <div className="space-y-6 py-4">
          {/* Basic Information (Read-only) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">基本信息（只读）</h3>
            <Separator />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>计划ID</Label>
                <div className="flex h-10 items-center px-3 rounded-md border bg-muted">
                  <TruncatedId id={plan.id} fullWidth />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>计划名称</Label>
                <Input value={plan.name} disabled />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Slug</Label>
                <Input value={plan.slug} disabled />
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">可编辑信息</h3>
            <Separator />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Pricing Options */}
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
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Node subscription limit configuration - shown for node and hybrid type plans */}
          {(plan.planType === 'node' || plan.planType === 'hybrid') && (
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

                <div className="flex flex-col gap-2">
                  <Label htmlFor="nodeLimit">用户可创建节点数上限</Label>
                  <Input
                    id="nodeLimit"
                    type="number"
                    min="0"
                    placeholder="0 表示无限制"
                    value={formData.planLimits.nodeLimit || ''}
                    onChange={(e) => handleLimitChange('nodeLimit', e.target.value === '' ? undefined : Number(e.target.value))}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Forward limit configuration - shown for forward and hybrid type plans */}
          {(plan.planType === 'forward' || plan.planType === 'hybrid') && (
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

          {/* General Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">通用配置</h3>
            <Separator />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPublic"
                  checked={formData.isPublic ?? plan.isPublic}
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
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
