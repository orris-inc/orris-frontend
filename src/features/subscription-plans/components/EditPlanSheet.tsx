/**
 * Edit Subscription Plan Sheet Component
 * Mobile-optimized bottom sheet for editing subscription plans
 * Responsive layout: compact on small screens, expanded on larger screens
 */

import { useState, useCallback } from 'react';
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
} from '@/api/subscription/types';
import {
  useEditPlanForm,
  BILLING_CYCLE_VALUES,
  FORWARD_RULE_TYPE_VALUES,
} from '../hooks/useEditPlanForm';

type EditPlanSheetProps = EditSheetProps<SubscriptionPlan, UpdatePlanRequest>;

// Compact input styles for number inputs in grids
const compactInputStyles = cn(
  'w-full h-10 px-3 text-sm rounded-xl ring-1 ring-border bg-background',
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
  const [loading, setLoading] = useState(false);

  // SelectSheet states
  const [activePricingIndex, setActivePricingIndex] = useState<number | null>(null);
  const [billingCycleSheetOpen, setBillingCycleSheetOpen] = useState(false);
  const [currencySheetOpen, setCurrencySheetOpen] = useState(false);

  const form = useEditPlanForm({ plan });

  // SelectSheet options
  const billingCycleOptions: SelectSheetOption<string>[] = BILLING_CYCLE_VALUES.map((cycle) => ({
    value: cycle,
    label: t(`billingCycle.${cycle}`),
  }));

  const currencyOptions: SelectSheetOption<string>[] = [
    { value: 'CNY', label: 'CNY' },
    { value: 'USD', label: 'USD' },
  ];

  const handleSubmit = useCallback(async () => {
    if (!plan) return;
    if (form.formData.pricings.length === 0) return;

    setLoading(true);
    try {
      const submitData = form.buildSubmitData();
      await onSubmit(plan.id, submitData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [plan, form, onSubmit, onOpenChange]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!loading) {
        onOpenChange(open);
      }
    },
    [loading, onOpenChange]
  );

  if (!plan) return null;

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
          <div className="rounded-xl ring-1 ring-border bg-muted/30 p-3 space-y-2">
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
              checked={form.formData.isPublic ?? plan.isPublic}
              onCheckedChange={(checked) => form.handleChange('isPublic', checked)}
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
                        id={`edit-pricing-active-${index}`}
                        checked={pricing.isActive}
                        onCheckedChange={(checked) =>
                          form.handleUpdatePricing(index, { isActive: checked as boolean })
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
                <label className="text-xs text-muted-foreground">{t('admin.plans.form.allowedRuleTypes')}</label>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {FORWARD_RULE_TYPE_VALUES.map((type) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`edit-rule-type-${type}`}
                        checked={form.formData.planLimits.ruleTypes?.includes(type) || false}
                        onCheckedChange={() => form.handleRuleTypeToggle(type)}
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
                className={cn(compactInputStyles, 'w-24')}
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
