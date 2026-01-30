/**
 * Create Subscription Plan Sheet Component
 * Mobile-optimized bottom sheet for creating subscription plans
 * Responsive layout: compact on small screens, expanded on larger screens
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  SelectSheet,
  type CreateSheetProps,
  type SelectSheetOption,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Label } from '@/components/common/Label';
import { ChevronDown } from 'lucide-react';
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

const BILLING_CYCLES = ['weekly', 'monthly', 'quarterly', 'semi_annual', 'yearly', 'lifetime'] as const;

const FORWARD_RULE_TYPES: ForwardRuleTypeOption[] = ['direct', 'entry', 'chain', 'direct_chain'];

// Plan type options (hybrid is not yet implemented)
const PLAN_TYPES: PlanType[] = ['node', 'forward'];

interface CreatePlanFormData extends Omit<CreatePlanRequest, 'limits' | 'pricings' | 'nodeLimit'> {
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
  sortOrder: 0,
  pricings: [getDefaultPricing()],
  planLimits: {},
});

// Compact input styles for number inputs in grids
const compactInputStyles = cn(
  'w-full h-10 px-3 text-sm rounded-xl ring-1 ring-border bg-background',
  'placeholder:text-muted-foreground/60',
  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
);

export const CreatePlanSheet: React.FC<CreatePlanSheetProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialPlan,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreatePlanFormData>(getDefaultFormData());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});

  // SelectSheet states
  const [planTypeSheetOpen, setPlanTypeSheetOpen] = useState(false);
  const [activePricingIndex, setActivePricingIndex] = useState<number | null>(null);
  const [billingCycleSheetOpen, setBillingCycleSheetOpen] = useState(false);
  const [currencySheetOpen, setCurrencySheetOpen] = useState(false);

  // SelectSheet options
  const planTypeOptions: SelectSheetOption<PlanType>[] = PLAN_TYPES.map((type) => ({
    value: type,
    label: t(`planType.${type}`),
  }));

  const billingCycleOptions: SelectSheetOption<string>[] = BILLING_CYCLES.map((cycle) => ({
    value: cycle,
    label: t(`billingCycle.${cycle}`),
  }));

  const currencyOptions: SelectSheetOption<string>[] = [
    { value: 'CNY', label: 'CNY' },
    { value: 'USD', label: 'USD' },
  ];

  const isDuplicateMode = !!initialPlan;

  // Initialize form data
  useEffect(() => {
    if (open && initialPlan) {
      const planLimits = parsePlanLimits(initialPlan.limits);
      setFormData({
        name: `${initialPlan.name} (${t('common.actions.copy')})`,
        slug: `${initialPlan.slug}-copy`,
        planType: initialPlan.planType || 'node',
        description: initialPlan.description || '',
        isPublic: initialPlan.isPublic,
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
  }, [open, initialPlan, t]);

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
    if (!formData.name.trim()) newErrors.name = t('admin.plans.form.planName') + ' ' + t('common.validation.required');
    if (!formData.slug.trim()) newErrors.slug = t('admin.plans.form.slug') + ' ' + t('common.validation.required');
    else if (!/^[a-z0-9-]+$/.test(formData.slug)) newErrors.slug = t('admin.plans.form.slugHint');
    setErrors(newErrors);
    return !newErrors.name && !newErrors.slug;
  }, [formData.name, formData.slug, t]);

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
        nodeLimit: formData.planLimits.nodeLimit,
        isPublic: formData.isPublic,
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
            <span>{isDuplicateMode ? t('admin.plans.duplicatePlan') : t('admin.plans.createPlan')}</span>
          </SheetTitle>
          <SheetDescription className="text-xs">
            {isDuplicateMode
              ? t('admin.plans.duplicateDescription', { name: initialPlan?.name })
              : t('admin.plans.createDescription')}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4 py-3">
          {/* Basic Information - 2 column grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('common.sections.basicInfo')}</h4>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="plan-name" className="text-xs font-medium">
                  {t('admin.plans.form.planName')} <span className="text-destructive">*</span>
                </label>
                <MobileFormInput
                  id="plan-name"
                  value={formData.name}
                  onChange={(v) => handleChange('name', v)}
                  placeholder={t('admin.plans.form.planName')}
                  icon={<Tag className="size-4" />}
                  error={errors.name}
                  disabled={loading}
                  className="min-h-[44px] py-2 text-sm rounded-lg"
                  containerClassName="space-y-1"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="plan-slug" className="text-xs font-medium">
                  {t('admin.plans.form.slug')} <span className="text-destructive">*</span>
                </label>
                <MobileFormInput
                  id="plan-slug"
                  value={formData.slug}
                  onChange={(v) => handleChange('slug', v)}
                  placeholder={t('admin.plans.form.slugPlaceholder')}
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
                <label className="text-xs font-medium">{t('admin.plans.form.planType')}</label>
                <button
                  type="button"
                  onClick={() => !loading && setPlanTypeSheetOpen(true)}
                  disabled={loading}
                  className={cn(
                    'w-full h-11 px-3 rounded-xl text-sm text-left',
                    'flex items-center justify-between',
                    'ring-1 ring-border bg-background',
                    'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                    'active:scale-[0.98]',
                    loading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span>{t(`planType.${formData.planType}`)}</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </button>
                <SelectSheet
                  open={planTypeSheetOpen}
                  onOpenChange={setPlanTypeSheetOpen}
                  value={formData.planType}
                  onChange={(v) => handleChange('planType', v as PlanType)}
                  options={planTypeOptions}
                  title={t('admin.plans.form.planType')}
                />
              </div>
              <div className="flex items-end pb-0.5">
                <div className="flex items-center gap-2 h-11 px-3 rounded-xl ring-1 ring-border bg-muted/30 w-full">
                  <Checkbox
                    id="plan-public"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => handleChange('isPublic', checked)}
                    disabled={loading}
                  />
                  <Label htmlFor="plan-public" className="cursor-pointer text-sm flex items-center gap-1.5">
                    <Globe className="size-3.5 text-muted-foreground" />
                    {t('admin.plans.public')}
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Options - Compact cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('admin.plans.form.pricingOptions')}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddPricing}
                disabled={loading}
                className="h-7 text-xs"
              >
                <Plus className="size-3.5 mr-1" />
                {t('admin.plans.form.addPricing')}
              </Button>
            </div>

            {formData.pricings.length === 0 ? (
              <div className="rounded-xl ring-1 ring-destructive/20 bg-destructive/5 p-3">
                <div className="flex items-center gap-2 text-destructive text-xs">
                  <AlertCircle className="size-3.5" />
                  <span>{t('admin.plans.form.pricingRequired')}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.pricings.map((pricing, index) => (
                  <div key={index} className="rounded-xl ring-1 ring-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('admin.plans.form.pricingNumber', { number: index + 1 })}</span>
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
                      <button
                        type="button"
                        onClick={() => {
                          if (!loading) {
                            setActivePricingIndex(index);
                            setBillingCycleSheetOpen(true);
                          }
                        }}
                        disabled={loading}
                        className={cn(
                          'w-full h-10 px-3 rounded-xl text-sm text-left',
                          'flex items-center justify-between',
                          'ring-1 ring-border bg-background',
                          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                          'active:scale-[0.98]',
                          loading && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <span className="truncate">{t(`billingCycle.${pricing.billingCycle}`)}</span>
                        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                      </button>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={t('admin.plans.form.pricePlaceholder')}
                        value={pricing.price / 100 || ''}
                        onChange={(e) =>
                          handleUpdatePricing(index, {
                            price: Math.round(Number(e.target.value) * 100),
                          })
                        }
                        disabled={loading}
                        className={compactInputStyles}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!loading) {
                            setActivePricingIndex(index);
                            setCurrencySheetOpen(true);
                          }
                        }}
                        disabled={loading}
                        className={cn(
                          'w-full h-10 px-3 rounded-xl text-sm text-left',
                          'flex items-center justify-between',
                          'ring-1 ring-border bg-background',
                          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                          'active:scale-[0.98]',
                          loading && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <span>{pricing.currency}</span>
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </button>
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
                        {t('admin.plans.form.activatePricing')}
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
                {t('admin.plans.form.nodeLimits')}
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t('admin.plans.form.trafficLimit')}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder={t('common.unlimited')}
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
                  <label className="text-xs text-muted-foreground">{t('admin.plans.form.deviceLimit')}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder={t('common.unlimited')}
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
                  <label className="text-xs text-muted-foreground">{t('admin.plans.form.speedLimit')}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder={t('common.unlimited')}
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
                  <label className="text-xs text-muted-foreground">{t('admin.plans.form.connectionLimit')}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder={t('common.unlimited')}
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
                  <label className="text-xs text-muted-foreground">{t('admin.plans.form.nodeLimit')}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder={t('common.unlimited')}
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
                {t('admin.plans.form.forwardLimits')}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t('admin.plans.form.ruleLimit')}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder={t('common.unlimited')}
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
                  <label className="text-xs text-muted-foreground">{t('admin.plans.form.trafficLimitGB')}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder={t('common.unlimited')}
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
                <label className="text-xs text-muted-foreground">{t('admin.plans.form.allowedRuleTypes')}</label>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {FORWARD_RULE_TYPES.map((type) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`rule-type-${type}`}
                        checked={formData.planLimits.ruleTypes?.includes(type) || false}
                        onCheckedChange={() => handleRuleTypeToggle(type)}
                        disabled={loading}
                        className="size-4"
                      />
                      <Label htmlFor={`rule-type-${type}`} className="cursor-pointer text-xs">
                        {t(`admin.plans.ruleType.${type}`)}
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
              {t('admin.plans.form.otherConfig')}
            </h4>
            <textarea
              placeholder={t('admin.plans.form.descriptionPlaceholder')}
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={loading}
              rows={2}
              className={cn(
                'w-full px-3 py-2 rounded-xl ring-1 ring-border bg-background text-sm resize-none',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                'placeholder:text-muted-foreground/60'
              )}
            />
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t('common.fields.sortOrder')}</label>
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
                {t('common.loading.creating')}
              </>
            ) : isDuplicateMode ? (
              t('admin.plans.form.createCopy')
            ) : (
              t('admin.plans.createPlan')
            )}
          </Button>
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={loading} className="w-full h-10">
            {t('common.actions.cancel')}
          </Button>
        </SheetFooter>
      </SheetContent>

      {/* Billing Cycle SelectSheet */}
      <SelectSheet
        open={billingCycleSheetOpen}
        onOpenChange={setBillingCycleSheetOpen}
        value={activePricingIndex !== null ? formData.pricings[activePricingIndex]?.billingCycle ?? null : null}
        onChange={(v) => {
          if (activePricingIndex !== null) {
            handleUpdatePricing(activePricingIndex, { billingCycle: v });
          }
        }}
        options={billingCycleOptions}
        title={t('admin.plans.form.billingCyclePlaceholder')}
      />

      {/* Currency SelectSheet */}
      <SelectSheet
        open={currencySheetOpen}
        onOpenChange={setCurrencySheetOpen}
        value={activePricingIndex !== null ? formData.pricings[activePricingIndex]?.currency ?? null : null}
        onChange={(v) => {
          if (activePricingIndex !== null) {
            handleUpdatePricing(activePricingIndex, { currency: v });
          }
        }}
        options={currencyOptions}
        title={t('admin.plans.form.currencyPlaceholder')}
      />
    </Sheet>
  );
};
