/**
 * Edit Subscription Plan Dialog
 * Implemented using wrapped common components
 */

import { useState } from 'react';
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
import type { SubscriptionPlan, UpdatePlanRequest } from '@/api/subscription/types';
import {
  useEditPlanForm,
  BILLING_CYCLE_VALUES,
  BILLING_CYCLE_KEYS,
  FORWARD_RULE_TYPE_VALUES,
  FORWARD_RULE_TYPE_KEYS,
  TRAFFIC_RESET_MODE_VALUES,
  TRAFFIC_RESET_MODE_KEYS,
} from '../hooks/useEditPlanForm';
import type { TrafficResetMode } from '../hooks/useEditPlanForm';

interface EditPlanDialogProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdatePlanRequest) => Promise<void>;
}

export const EditPlanDialog: React.FC<EditPlanDialogProps> = ({
  open,
  plan,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useEditPlanForm({ plan });

  const handleSubmit = async () => {
    if (!plan) return;
    if (form.formData.pricings.length === 0) return;

    setLoading(true);
    try {
      await onSubmit(plan.id, form.buildSubmitData());
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
                  <Button variant="outline" size="sm" onClick={form.handleAddPricing} disabled={loading}>
                    <Plus className="size-4 mr-1" />
                    {t('admin.plans.form.addPricing')}
                  </Button>
                </div>

                {form.formData.pricings.length === 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t('admin.plans.form.pricingRequired')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {form.formData.pricings.map((pricing, index) => (
                      <div key={index} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">{t('admin.plans.form.pricingNumber', { number: index + 1 })}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => form.handleRemovePricing(index)}
                            disabled={loading || form.formData.pricings.length === 1}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <Select
                            value={pricing.billingCycle}
                            onValueChange={(value) => form.handleUpdatePricing(index, { billingCycle: value })}
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
                            onChange={(e) => form.handleUpdatePricing(index, { price: Math.round(Number(e.target.value) * 100) })}
                            disabled={loading}
                          />

                          <Select
                            value={pricing.currency}
                            onValueChange={(value) => form.handleUpdatePricing(index, { currency: value })}
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
                            onCheckedChange={(checked) => form.handleUpdatePricing(index, { isActive: checked as boolean })}
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
                    value={form.formData.planLimits.trafficLimit ? form.formData.planLimits.trafficLimit / (1024 * 1024 * 1024) : ''}
                    onChange={(e) => form.handleLimitChange('trafficLimit', e.target.value === '' ? undefined : Math.round(Number(e.target.value) * 1024 * 1024 * 1024))}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="editTrafficResetMode">{t('admin.plans.form.trafficResetMode.label')}</Label>
                  <Select
                    value={form.formData.planLimits.trafficResetMode || 'billing_cycle'}
                    onValueChange={(value) => form.handleLimitChange('trafficResetMode', value as TrafficResetMode)}
                    disabled={loading}
                  >
                    <SelectTrigger id="editTrafficResetMode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAFFIC_RESET_MODE_VALUES.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {t(TRAFFIC_RESET_MODE_KEYS[mode])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t('admin.plans.form.trafficResetMode.hint')}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="deviceLimit">{t('admin.plans.form.deviceLimit')}</Label>
                  <Input
                    id="deviceLimit"
                    type="number"
                    min="0"
                    placeholder={t('admin.plans.form.unlimitedPlaceholder')}
                    value={form.formData.planLimits.deviceLimit || ''}
                    onChange={(e) => form.handleLimitChange('deviceLimit', e.target.value === '' ? undefined : Number(e.target.value))}
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
                    value={form.formData.planLimits.speedLimit || ''}
                    onChange={(e) => form.handleLimitChange('speedLimit', e.target.value === '' ? undefined : Number(e.target.value))}
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
                    value={form.formData.planLimits.connectionLimit || ''}
                    onChange={(e) => form.handleLimitChange('connectionLimit', e.target.value === '' ? undefined : Number(e.target.value))}
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
                    value={form.formData.planLimits.nodeLimit || ''}
                    onChange={(e) => form.handleLimitChange('nodeLimit', e.target.value === '' ? undefined : Number(e.target.value))}
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
                    value={form.formData.planLimits.ruleLimit || ''}
                    onChange={(e) => form.handleLimitChange('ruleLimit', e.target.value === '' ? undefined : Number(e.target.value))}
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
                    value={form.formData.planLimits.trafficLimit ? form.formData.planLimits.trafficLimit / (1024 * 1024 * 1024) : ''}
                    onChange={(e) => form.handleLimitChange('trafficLimit', e.target.value === '' ? undefined : Math.round(Number(e.target.value) * 1024 * 1024 * 1024))}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="editFwdTrafficResetMode">{t('admin.plans.form.trafficResetMode.label')}</Label>
                  <Select
                    value={form.formData.planLimits.trafficResetMode || 'billing_cycle'}
                    onValueChange={(value) => form.handleLimitChange('trafficResetMode', value as TrafficResetMode)}
                    disabled={loading}
                  >
                    <SelectTrigger id="editFwdTrafficResetMode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAFFIC_RESET_MODE_VALUES.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {t(TRAFFIC_RESET_MODE_KEYS[mode])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t('admin.plans.form.trafficResetMode.hint')}</p>
                </div>

                <div className="flex flex-col gap-2 @sm:col-span-2">
                  <Label>{t('admin.plans.form.allowedRuleTypes')}</Label>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {FORWARD_RULE_TYPE_VALUES.map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <Checkbox
                          id={`rule-type-${type}`}
                          checked={form.formData.planLimits.ruleTypes?.includes(type) || false}
                          onCheckedChange={() => form.handleRuleTypeToggle(type)}
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
                value={form.formData.description || ''}
                onChange={(e) => form.handleChange('description', e.target.value)}
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
                  value={form.formData.sortOrder || 0}
                  onChange={(e) => form.handleChange('sortOrder', e.target.value === '' ? undefined : Number(e.target.value))}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">{t('admin.plans.form.sortOrderHint')}</p>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPublic"
                  checked={form.formData.isPublic ?? plan.isPublic}
                  onCheckedChange={(checked) => form.handleChange('isPublic', checked)}
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
