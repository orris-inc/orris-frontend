/**
 * Create Subscription Plan Sheet Component
 * Mobile-optimized bottom sheet for creating subscription plans
 * Responsive layout: compact on small screens, expanded on larger screens
 */

import { useState, useCallback } from 'react';
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
  PlanType,
  SubscriptionPlan,
} from '@/api/subscription/types';
import {
  useCreatePlanForm,
  BILLING_CYCLE_VALUES,
  FORWARD_RULE_TYPE_VALUES,
  PLAN_TYPE_VALUES,
  TRAFFIC_RESET_MODE_VALUES,
} from '../hooks/useCreatePlanForm';
import type { TrafficResetMode } from '../hooks/useCreatePlanForm';

interface CreatePlanSheetProps extends CreateSheetProps<CreatePlanRequest> {
  /** Initial plan for duplicate mode */
  initialPlan?: SubscriptionPlan | null;
}

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
  const [loading, setLoading] = useState(false);

  // SelectSheet states
  const [planTypeSheetOpen, setPlanTypeSheetOpen] = useState(false);
  const [trafficResetModeSheetOpen, setTrafficResetModeSheetOpen] = useState(false);
  const [activePricingIndex, setActivePricingIndex] = useState<number | null>(null);
  const [billingCycleSheetOpen, setBillingCycleSheetOpen] = useState(false);
  const [currencySheetOpen, setCurrencySheetOpen] = useState(false);

  const form = useCreatePlanForm({ open, initialPlan });

  // SelectSheet options
  const planTypeOptions: SelectSheetOption<PlanType>[] = PLAN_TYPE_VALUES.map((type) => ({
    value: type,
    label: t(`planType.${type}`),
  }));

  const billingCycleOptions: SelectSheetOption<string>[] = BILLING_CYCLE_VALUES.map((cycle) => ({
    value: cycle,
    label: t(`billingCycle.${cycle}`),
  }));

  const currencyOptions: SelectSheetOption<string>[] = [
    { value: 'CNY', label: 'CNY' },
    { value: 'USD', label: 'USD' },
  ];

  const trafficResetModeOptions: SelectSheetOption<TrafficResetMode>[] = TRAFFIC_RESET_MODE_VALUES.map((mode) => ({
    value: mode,
    label: t(`admin.plans.form.trafficResetMode.${mode === 'calendar_month' ? 'calendarMonth' : 'billingCycle'}`),
  }));

  const handleSubmit = useCallback(async () => {
    if (!form.validate()) return;
    if (form.formData.pricings.length === 0) return;

    setLoading(true);
    try {
      const submitData = form.buildSubmitData();
      await onSubmit(submitData);
      form.reset();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [form, onSubmit, onOpenChange]);

  const handleClose = useCallback(
    (o: boolean) => {
      if (!loading) {
        form.reset();
        onOpenChange(o);
      }
    },
    [loading, onOpenChange, form]
  );

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div
              className={cn(
                'size-8 rounded-full flex items-center justify-center',
                form.isDuplicateMode ? 'bg-info/10' : 'bg-primary/10'
              )}
            >
              {form.isDuplicateMode ? (
                <Copy className="size-4 text-info" />
              ) : (
                <CreditCard className="size-4 text-primary" />
              )}
            </div>
            <span>{form.isDuplicateMode ? t('admin.plans.duplicatePlan') : t('admin.plans.createPlan')}</span>
          </SheetTitle>
          <SheetDescription className="text-xs">
            {form.isDuplicateMode
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
                  value={form.formData.name}
                  onChange={(v) => form.handleChange('name', v)}
                  placeholder={t('admin.plans.form.planName')}
                  icon={<Tag className="size-4" />}
                  error={form.errors.name}
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
                  value={form.formData.slug}
                  onChange={(v) => form.handleChange('slug', v)}
                  placeholder={t('admin.plans.form.slugPlaceholder')}
                  icon={<Hash className="size-4" />}
                  error={form.errors.slug}
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
                  <span>{t(`planType.${form.formData.planType}`)}</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </button>
                <SelectSheet
                  open={planTypeSheetOpen}
                  onOpenChange={setPlanTypeSheetOpen}
                  value={form.formData.planType}
                  onChange={(v) => form.handleChange('planType', v as PlanType)}
                  options={planTypeOptions}
                  title={t('admin.plans.form.planType')}
                />
              </div>
              <div className="flex items-end pb-0.5">
                <div className="flex items-center gap-2 h-11 px-3 rounded-xl ring-1 ring-border bg-muted/30 w-full">
                  <Checkbox
                    id="plan-public"
                    checked={form.formData.isPublic}
                    onCheckedChange={(checked) => form.handleChange('isPublic', checked)}
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
                onClick={form.handleAddPricing}
                disabled={loading}
                className="h-7 text-xs"
              >
                <Plus className="size-3.5 mr-1" />
                {t('admin.plans.form.addPricing')}
              </Button>
            </div>

            {form.formData.pricings.length === 0 ? (
              <div className="rounded-xl ring-1 ring-destructive/20 bg-destructive/5 p-3">
                <div className="flex items-center gap-2 text-destructive text-xs">
                  <AlertCircle className="size-3.5" />
                  <span>{t('admin.plans.form.pricingRequired')}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {form.formData.pricings.map((pricing, index) => (
                  <div key={index} className="rounded-xl ring-1 ring-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('admin.plans.form.pricingNumber', { number: index + 1 })}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => form.handleRemovePricing(index)}
                        disabled={loading || form.formData.pricings.length === 1}
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
                          form.handleUpdatePricing(index, {
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
                          form.handleUpdatePricing(index, { isActive: checked as boolean })
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
          {(form.formData.planType === 'node' || form.formData.planType === 'hybrid') && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('admin.plans.form.nodeLimits')}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t('admin.plans.form.trafficLimit')}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder={t('common.unlimited')}
                    value={
                      form.formData.planLimits.trafficLimit
                        ? form.formData.planLimits.trafficLimit / (1024 * 1024 * 1024)
                        : ''
                    }
                    onChange={(e) =>
                      form.handleLimitChange(
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
                  <label className="text-xs text-muted-foreground">{t('admin.plans.form.trafficResetMode.label')}</label>
                  <button
                    type="button"
                    onClick={() => !loading && setTrafficResetModeSheetOpen(true)}
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
                    <span className="truncate">
                      {t(`admin.plans.form.trafficResetMode.${(form.formData.planLimits.trafficResetMode || 'billing_cycle') === 'calendar_month' ? 'calendarMonth' : 'billingCycle'}`)}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t('admin.plans.form.deviceLimit')}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder={t('common.unlimited')}
                    value={form.formData.planLimits.deviceLimit || ''}
                    onChange={(e) =>
                      form.handleLimitChange(
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
                    value={form.formData.planLimits.speedLimit || ''}
                    onChange={(e) =>
                      form.handleLimitChange(
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
                    value={form.formData.planLimits.connectionLimit || ''}
                    onChange={(e) =>
                      form.handleLimitChange(
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
                    value={form.formData.planLimits.nodeLimit || ''}
                    onChange={(e) =>
                      form.handleLimitChange(
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
          {(form.formData.planType === 'forward' || form.formData.planType === 'hybrid') && (
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
                    value={form.formData.planLimits.ruleLimit || ''}
                    onChange={(e) =>
                      form.handleLimitChange(
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
                      form.formData.planLimits.trafficLimit
                        ? form.formData.planLimits.trafficLimit / (1024 * 1024 * 1024)
                        : ''
                    }
                    onChange={(e) =>
                      form.handleLimitChange(
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
                <label className="text-xs text-muted-foreground">{t('admin.plans.form.trafficResetMode.label')}</label>
                <button
                  type="button"
                  onClick={() => !loading && setTrafficResetModeSheetOpen(true)}
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
                  <span className="truncate">
                    {t(`admin.plans.form.trafficResetMode.${(form.formData.planLimits.trafficResetMode || 'billing_cycle') === 'calendar_month' ? 'calendarMonth' : 'billingCycle'}`)}
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t('admin.plans.form.allowedRuleTypes')}</label>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {FORWARD_RULE_TYPE_VALUES.map((type) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`rule-type-${type}`}
                        checked={form.formData.planLimits.ruleTypes?.includes(type) || false}
                        onCheckedChange={() => form.handleRuleTypeToggle(type)}
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
              value={form.formData.description || ''}
              onChange={(e) => form.handleChange('description', e.target.value)}
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
                value={form.formData.sortOrder || 0}
                onChange={(e) =>
                  form.handleChange('sortOrder', e.target.value === '' ? 0 : Number(e.target.value))
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
            disabled={loading || !form.isFormValid}
            className="w-full h-11"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t('common.loading.creating')}
              </>
            ) : form.isDuplicateMode ? (
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

      {/* Traffic Reset Mode SelectSheet */}
      <SelectSheet
        open={trafficResetModeSheetOpen}
        onOpenChange={setTrafficResetModeSheetOpen}
        value={form.formData.planLimits.trafficResetMode || 'billing_cycle'}
        onChange={(v) => form.handleLimitChange('trafficResetMode', v as TrafficResetMode)}
        options={trafficResetModeOptions}
        title={t('admin.plans.form.trafficResetMode.label')}
      />

      {/* Billing Cycle SelectSheet */}
      <SelectSheet
        open={billingCycleSheetOpen}
        onOpenChange={setBillingCycleSheetOpen}
        value={activePricingIndex !== null ? form.formData.pricings[activePricingIndex]?.billingCycle ?? null : null}
        onChange={(v) => {
          if (activePricingIndex !== null) {
            form.handleUpdatePricing(activePricingIndex, { billingCycle: v });
          }
        }}
        options={billingCycleOptions}
        title={t('admin.plans.form.billingCyclePlaceholder')}
      />

      {/* Currency SelectSheet */}
      <SelectSheet
        open={currencySheetOpen}
        onOpenChange={setCurrencySheetOpen}
        value={activePricingIndex !== null ? form.formData.pricings[activePricingIndex]?.currency ?? null : null}
        onChange={(v) => {
          if (activePricingIndex !== null) {
            form.handleUpdatePricing(activePricingIndex, { currency: v });
          }
        }}
        options={currencyOptions}
        title={t('admin.plans.form.currencyPlaceholder')}
      />
    </Sheet>
  );
};
