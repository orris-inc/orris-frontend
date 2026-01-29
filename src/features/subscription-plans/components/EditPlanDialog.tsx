/**
 * Edit Subscription Plan Dialog
 * Implemented using wrapped common components
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

// Helper function: parse API format limits (axios-case-converter converts response to camelCase)
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

interface EditPlanDialogProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdatePlanRequest) => Promise<void>;
}

const BILLING_CYCLES: { value: string; labelKey: string }[] = [
  { value: 'weekly', labelKey: 'billingCycle.weekly' },
  { value: 'monthly', labelKey: 'billingCycle.monthly' },
  { value: 'quarterly', labelKey: 'billingCycle.quarterly' },
  { value: 'semi_annual', labelKey: 'billingCycle.semiAnnual' },
  { value: 'yearly', labelKey: 'billingCycle.yearly' },
  { value: 'lifetime', labelKey: 'billingCycle.lifetime' },
];

// Forward rule type options
const FORWARD_RULE_TYPES: { value: ForwardRuleTypeOption; labelKey: string }[] = [
  { value: 'direct', labelKey: 'admin.plans.ruleType.direct' },
  { value: 'entry', labelKey: 'admin.plans.ruleType.entry' },
  { value: 'chain', labelKey: 'admin.plans.ruleType.chain' },
  { value: 'direct_chain', labelKey: 'admin.plans.ruleType.directChain' },
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
  const { t } = useTranslation();
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

  // Handle rule type multi-select
  const handleRuleTypeToggle = (type: ForwardRuleTypeOption) => {
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
      <DialogContent className="@container sm:max-w-3xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('subscriptionPlans.editPlan')}: {plan.name}</DialogTitle>
          <DialogDescription>{t('subscriptionPlans.editPlanDescription')}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        <div className="space-y-6 py-4">
          {/* Basic Information (Read-only) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t('admin.forwardRules.form.basicInfoReadonly')}</h3>
            <Separator />
            <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>{t('subscriptionPlans.planId')}</Label>
                <div className="flex h-10 items-center px-3 rounded-md border bg-muted">
                  <TruncatedId id={plan.id} fullWidth />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>{t('admin.plans.form.planName')}</Label>
                <Input value={plan.name} disabled />
              </div>

              <div className="flex flex-col gap-2">
                <Label>{t('admin.plans.form.slug')}</Label>
                <Input value={plan.slug} disabled />
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t('common.sections.editableInfo')}</h3>
            <Separator />
            <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
              {/* Pricing Options */}
              <div className="space-y-4 @sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>
                    {t('admin.plans.form.pricingOptions')} <span className="text-destructive">*</span>
                  </Label>
                  <Button variant="outline" size="sm" onClick={handleAddPricing} disabled={loading}>
                    <Plus className="size-4 mr-1" />
                    {t('admin.plans.form.addPricing')}
                  </Button>
                </div>

                {formData.pricings.length === 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t('admin.plans.form.pricingRequired')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {formData.pricings.map((pricing, index) => (
                      <div key={index} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">{t('admin.plans.form.pricingNumber', { number: index + 1 })}</span>
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
                              <SelectValue placeholder={t('admin.plans.form.billingCyclePlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              {BILLING_CYCLES.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {t(opt.labelKey)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={t('admin.plans.form.pricePlaceholder')}
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
                              <SelectValue placeholder={t('admin.plans.form.currencyPlaceholder')} />
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
                            {t('admin.plans.form.activatePricing')}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Node subscription limit configuration - shown for node and hybrid type plans */}
          {(plan.planType === 'node' || plan.planType === 'hybrid') && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('admin.plans.form.nodeLimits')}</h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="trafficLimit">{t('admin.plans.form.trafficLimit')}</Label>
                  <Input
                    id="trafficLimit"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder={t('admin.plans.form.unlimitedPlaceholder')}
                    value={formData.planLimits.trafficLimit ? formData.planLimits.trafficLimit / (1024 * 1024 * 1024) : ''}
                    onChange={(e) => handleLimitChange('trafficLimit', e.target.value === '' ? undefined : Math.round(Number(e.target.value) * 1024 * 1024 * 1024))}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="deviceLimit">{t('admin.plans.form.deviceLimit')}</Label>
                  <Input
                    id="deviceLimit"
                    type="number"
                    min="0"
                    placeholder={t('admin.plans.form.unlimitedPlaceholder')}
                    value={formData.planLimits.deviceLimit || ''}
                    onChange={(e) => handleLimitChange('deviceLimit', e.target.value === '' ? undefined : Number(e.target.value))}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="speedLimit">{t('admin.plans.form.speedLimit')}</Label>
                  <Input
                    id="speedLimit"
                    type="number"
                    min="0"
                    placeholder={t('admin.plans.form.unlimitedPlaceholder')}
                    value={formData.planLimits.speedLimit || ''}
                    onChange={(e) => handleLimitChange('speedLimit', e.target.value === '' ? undefined : Number(e.target.value))}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="connectionLimit">{t('admin.plans.form.connectionLimit')}</Label>
                  <Input
                    id="connectionLimit"
                    type="number"
                    min="0"
                    placeholder={t('admin.plans.form.unlimitedPlaceholder')}
                    value={formData.planLimits.connectionLimit || ''}
                    onChange={(e) => handleLimitChange('connectionLimit', e.target.value === '' ? undefined : Number(e.target.value))}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="nodeLimit">{t('admin.plans.form.nodeLimit')}</Label>
                  <Input
                    id="nodeLimit"
                    type="number"
                    min="0"
                    placeholder={t('admin.plans.form.unlimitedPlaceholder')}
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
              <h3 className="text-sm font-semibold">{t('admin.plans.form.forwardLimits')}</h3>
              <Separator />
              <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ruleLimit">{t('admin.plans.form.ruleLimit')}</Label>
                  <Input
                    id="ruleLimit"
                    type="number"
                    min="0"
                    placeholder={t('admin.plans.form.unlimitedPlaceholder')}
                    value={formData.planLimits.ruleLimit || ''}
                    onChange={(e) => handleLimitChange('ruleLimit', e.target.value === '' ? undefined : Number(e.target.value))}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="trafficLimit">{t('admin.plans.form.trafficLimitGB')}</Label>
                  <Input
                    id="trafficLimit"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder={t('admin.plans.form.unlimitedPlaceholder')}
                    value={formData.planLimits.trafficLimit ? formData.planLimits.trafficLimit / (1024 * 1024 * 1024) : ''}
                    onChange={(e) => handleLimitChange('trafficLimit', e.target.value === '' ? undefined : Math.round(Number(e.target.value) * 1024 * 1024 * 1024))}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2 @sm:col-span-2">
                  <Label>{t('admin.plans.form.allowedRuleTypes')}</Label>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {FORWARD_RULE_TYPES.map((type) => (
                      <div key={type.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`rule-type-${type.value}`}
                          checked={formData.planLimits.ruleTypes?.includes(type.value) || false}
                          onCheckedChange={() => handleRuleTypeToggle(type.value)}
                          disabled={loading}
                        />
                        <Label htmlFor={`rule-type-${type.value}`} className="cursor-pointer">
                          {t(type.labelKey)}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('admin.plans.form.noSelectionAllowAll')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t('common.fields.description')}</h3>
            <Separator />
            <div className="flex flex-col gap-2">
              <Textarea
                id="description"
                rows={3}
                placeholder={t('admin.plans.form.descriptionPlaceholder')}
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* General Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t('admin.plans.form.generalConfig')}</h3>
            <Separator />
            <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sortOrder">{t('common.fields.sortOrder')}</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder || 0}
                  onChange={(e) => handleChange('sortOrder', e.target.value === '' ? undefined : Number(e.target.value))}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">{t('admin.plans.form.sortOrderHint')}</p>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPublic"
                  checked={formData.isPublic ?? plan.isPublic}
                  onCheckedChange={(checked) => handleChange('isPublic', checked)}
                  disabled={loading}
                />
                <Label htmlFor="isPublic" className="cursor-pointer font-medium">
                  {t('admin.plans.form.isPublic')}
                </Label>
              </div>
            </div>
          </div>
        </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? t('common.loading.saving') : t('common.actions.save')}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.actions.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
