/**
 * Create Subscription Plan Dialog
 * Implemented using wrapped common components
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

interface CreatePlanDialogProps {
  open: boolean;
  /** Used to pre-fill data when duplicating a plan */
  initialPlan?: SubscriptionPlan | null;
  onClose: () => void;
  onSubmit: (data: CreatePlanRequest) => Promise<void>;
}

// Billing cycle options - labels will be translated in component
const BILLING_CYCLE_VALUES = ['weekly', 'monthly', 'quarterly', 'semi_annual', 'yearly', 'lifetime'] as const;

// Forward rule type options
const FORWARD_RULE_TYPE_VALUES: ForwardRuleTypeOption[] = ['direct', 'entry', 'chain', 'direct_chain'];

// Plan type options (hybrid is not yet implemented)
const PLAN_TYPE_VALUES: PlanType[] = ['node', 'forward'];

// Extend CreatePlanRequest to support plan limits
interface CreatePlanFormData extends Omit<CreatePlanRequest, 'limits' | 'pricings'> {
  pricings: PricingOptionInput[];
  // Plan limits
  planLimits: PlanLimits;
}

// Default pricing option
const getDefaultPricing = (): PricingOptionInput => ({
  billingCycle: 'monthly',
  price: 0,
  currency: 'CNY',
  isActive: true,
});

// Default form data
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

// Billing cycle translation key mapping
const BILLING_CYCLE_KEYS: Record<string, string> = {
  weekly: 'billingCycle.weekly',
  monthly: 'billingCycle.monthly',
  quarterly: 'billingCycle.quarterly',
  semi_annual: 'billingCycle.semiAnnual',
  yearly: 'billingCycle.yearly',
  lifetime: 'billingCycle.lifetime',
};

// Forward rule type translation key mapping
const FORWARD_RULE_TYPE_KEYS: Record<ForwardRuleTypeOption, string> = {
  direct: 'admin.plans.ruleType.direct',
  entry: 'admin.plans.ruleType.entry',
  chain: 'admin.plans.ruleType.chain',
  direct_chain: 'admin.plans.ruleType.directChain',
};

// Plan type translation key mapping
const PLAN_TYPE_KEYS: Record<PlanType, string> = {
  node: 'common.planType.node',
  forward: 'common.planType.forward',
  hybrid: 'common.planType.hybrid',
};

export const CreatePlanDialog: React.FC<CreatePlanDialogProps> = ({
  open,
  initialPlan,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreatePlanFormData>(getDefaultFormData());
  const [loading, setLoading] = useState(false);

  // Check if in duplicate mode
  const isDuplicateMode = !!initialPlan;

  // Initialize form data (pre-fill in duplicate mode)
  useEffect(() => {
    if (open && initialPlan) {
      const planLimits = parsePlanLimits(initialPlan.limits);

      setFormData({
        name: `${initialPlan.name} (${t('common.actions.copy')})`,
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
      // Create mode: reset to default values
      setFormData(getDefaultFormData());
    }
  }, [open, initialPlan]);

  const handleChange = (field: keyof CreatePlanFormData, value: unknown) => {
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
      // Reset form
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
      <DialogContent className="@container sm:max-w-3xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {isDuplicateMode && <Copy className="size-5" />}
            {isDuplicateMode ? t('admin.plans.duplicatePlan') : t('admin.plans.createPlan')}
          </DialogTitle>
          <DialogDescription>
            {isDuplicateMode
              ? t('admin.plans.duplicateDescription', { name: initialPlan?.name })
              : t('admin.plans.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t('common.sections.basicInfo')}</h3>
            <Separator />
            <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">
                  {t('admin.plans.form.planName')} <span className="text-destructive">*</span>
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
                  {t('admin.plans.form.slug')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">{t('admin.plans.form.slugHint')}</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="planType">
                  {t('admin.plans.form.planType')} <span className="text-destructive">*</span>
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
                    {PLAN_TYPE_VALUES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(PLAN_TYPE_KEYS[type])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                              {BILLING_CYCLE_VALUES.map((cycle) => (
                                <SelectItem key={cycle} value={cycle}>
                                  {t(BILLING_CYCLE_KEYS[cycle])}
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
          {(formData.planType === 'node' || formData.planType === 'hybrid') && (
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
          {(formData.planType === 'forward' || formData.planType === 'hybrid') && (
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
                    {FORWARD_RULE_TYPE_VALUES.map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <Checkbox
                          id={`rule-type-${type}`}
                          checked={formData.planLimits.ruleTypes?.includes(type) || false}
                          onCheckedChange={() => handleRuleTypeToggle(type)}
                          disabled={loading}
                        />
                        <Label htmlFor={`rule-type-${type}`} className="cursor-pointer">
                          {t(FORWARD_RULE_TYPE_KEYS[type])}
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
                value={formData.description}
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
                <Label htmlFor="trialDays">{t('admin.plans.form.trialDays')}</Label>
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

              <div className="flex items-center gap-2 @sm:col-span-2">
                <Checkbox
                  id="isPublic"
                  checked={formData.isPublic}
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
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.name || !formData.slug}>
            {loading ? t('common.loading.creating') : (isDuplicateMode ? t('admin.plans.form.createCopy') : t('common.actions.create'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
