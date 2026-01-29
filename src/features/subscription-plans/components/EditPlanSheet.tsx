/**
 * Edit Subscription Plan Sheet Component
 * Mobile-optimized bottom sheet for editing subscription plans
 * Responsive layout: compact on small screens, expanded on larger screens
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pencil,
  Plus,
  Trash2,
  AlertCircle,
  Globe,
  Loader2,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  SelectSheet,
  type EditSheetProps,
  type SelectSheetOption,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Label } from '@/components/common/Label';
import { Separator } from '@/components/common/Separator';
import { TruncatedId } from '@/components/admin';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  SubscriptionPlan,
  UpdatePlanRequest,
  PricingOptionInput,
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

type EditPlanSheetProps = EditSheetProps<SubscriptionPlan, UpdatePlanRequest>;

const BILLING_CYCLES = ['weekly', 'monthly', 'quarterly', 'semi_annual', 'yearly', 'lifetime'] as const;

const FORWARD_RULE_TYPES: ForwardRuleTypeOption[] = ['direct', 'entry', 'chain', 'direct_chain'];

interface UpdatePlanFormData extends Omit<UpdatePlanRequest, 'limits'> {
  pricings: PricingOptionInput[];
  planLimits: PlanLimits;
}

// Compact input styles for number inputs in grids
const compactInputStyles = cn(
  'w-full h-10 px-3 text-sm rounded-lg border bg-background',
  'placeholder:text-muted-foreground/60',
  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
);

export const EditPlanSheet: React.FC<EditPlanSheetProps> = ({
  open,
  onOpenChange,
  entity: plan,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<UpdatePlanFormData>({ pricings: [], planLimits: {} });
  const [loading, setLoading] = useState(false);

  // SelectSheet states
  const [activePricingIndex, setActivePricingIndex] = useState<number | null>(null);
  const [billingCycleSheetOpen, setBillingCycleSheetOpen] = useState(false);
  const [currencySheetOpen, setCurrencySheetOpen] = useState(false);

  // SelectSheet options
  const billingCycleOptions: SelectSheetOption<string>[] = BILLING_CYCLES.map((cycle) => ({
    value: cycle,
    label: t(`billingCycle.${cycle}`),
  }));

  const currencyOptions: SelectSheetOption<string>[] = [
    { value: 'CNY', label: 'CNY' },
    { value: 'USD', label: 'USD' },
  ];

  // Update form data when plan changes
  useEffect(() => {
    if (plan) {
      const planLimits = parsePlanLimits(plan.limits);
      setFormData({
        description: plan.description,
        isPublic: plan.isPublic,
        sortOrder: plan.sortOrder,
        pricings: (plan.pricings || []).map((p) => ({
          billingCycle: p.billingCycle,
          price: p.price,
          currency: p.currency,
          isActive: p.isActive,
        })),
        planLimits,
      });
    }
  }, [plan]);

  const handleChange = useCallback((field: keyof UpdatePlanFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const handleSubmit = useCallback(async () => {
    if (!plan) return;
    if (formData.pricings.length === 0) return;

    setLoading(true);
    try {
      const limits =
        Object.keys(formData.planLimits).length > 0
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
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [plan, formData, onSubmit, onOpenChange]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!loading) {
        onOpenChange(open);
      }
    },
    [loading, onOpenChange]
  );

  if (!plan) return null;

  const isFormValid = formData.pricings.length > 0;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Pencil className="size-4 text-blue-500" />
            </div>
            <span>{t('admin.plans.form.editPlan')}</span>
          </SheetTitle>
          <SheetDescription className="text-xs">{t('admin.plans.form.editDescription', { name: plan.name })}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4 py-3">
          {/* Read-only Information - Compact */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">ID</span>
                <TruncatedId id={plan.id} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('admin.plans.table.type')}</span>
                <span className="text-xs">{t(`planType.${plan.planType}`)}</span>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('admin.plans.table.planName')}</span>
                <span className="text-xs font-medium truncate max-w-[100px]">{plan.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('admin.plans.form.slug')}</span>
                <span className="text-xs font-mono truncate max-w-[80px]">{plan.slug}</span>
              </div>
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              id="edit-plan-public"
              checked={formData.isPublic ?? plan.isPublic}
              onCheckedChange={(checked) => handleChange('isPublic', checked)}
              disabled={loading}
            />
            <Label htmlFor="edit-plan-public" className="cursor-pointer text-sm flex items-center gap-1.5">
              <Globe className="size-3.5 text-muted-foreground" />
              {t('admin.plans.form.isPublic')}
            </Label>
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
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <div className="flex items-center gap-2 text-destructive text-xs">
                  <AlertCircle className="size-3.5" />
                  <span>{t('admin.plans.form.pricingRequired')}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.pricings.map((pricing, index) => (
                  <div key={index} className="rounded-lg border p-3 space-y-2">
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
                          'w-full h-10 px-3 rounded-lg text-sm text-left',
                          'flex items-center justify-between',
                          'border bg-background',
                          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
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
                          'w-full h-10 px-3 rounded-lg text-sm text-left',
                          'flex items-center justify-between',
                          'border bg-background',
                          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                          loading && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <span>{pricing.currency}</span>
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`edit-pricing-active-${index}`}
                        checked={pricing.isActive}
                        onCheckedChange={(checked) =>
                          handleUpdatePricing(index, { isActive: checked as boolean })
                        }
                        disabled={loading}
                      />
                      <Label htmlFor={`edit-pricing-active-${index}`} className="cursor-pointer text-xs">
                        {t('admin.plans.form.activatePricing')}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Node Limits - Grid layout */}
          {(plan.planType === 'node' || plan.planType === 'hybrid') && (
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
          {(plan.planType === 'forward' || plan.planType === 'hybrid') && (
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
                        id={`edit-rule-type-${type}`}
                        checked={formData.planLimits.ruleTypes?.includes(type) || false}
                        onCheckedChange={() => handleRuleTypeToggle(type)}
                        disabled={loading}
                        className="size-4"
                      />
                      <Label htmlFor={`edit-rule-type-${type}`} className="cursor-pointer text-xs">
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
                'w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none',
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
                className={cn(compactInputStyles, 'w-24')}
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
                {t('common.loading.saving')}
              </>
            ) : (
              t('admin.plans.form.saveChanges')
            )}
          </Button>
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={loading} className="w-full h-10">
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
