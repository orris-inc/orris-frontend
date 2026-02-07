/**
 * Change subscription plan dialog component
 * Desktop dialog for changing subscription plan (upgrade/downgrade)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpCircle, ArrowDownCircle, Info, Loader2, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Label';
import { TruncatedId } from '@/components/admin';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { RadioGroup, RadioGroupItem } from '@/components/common/RadioGroup';
import { Skeleton } from '@/components/common/Skeleton';
import { useChangePlanForm } from '../hooks/useChangePlanForm';
import type { Subscription } from '@/api/subscription/types';
import type { ChangePlanRequest } from '@/api/admin/types';

interface ChangePlanDialogProps {
  open: boolean;
  subscription: Subscription | null;
  onClose: () => void;
  onConfirm: (data: ChangePlanRequest) => Promise<void>;
}

export const ChangePlanDialog: React.FC<ChangePlanDialogProps> = ({
  open,
  subscription,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const {
    selectedPlanId,
    setSelectedPlanId,
    changeType,
    setChangeType,
    effectiveDate,
    setEffectiveDate,
    plansLoading,
    availablePlans,
    isFormValid,
    buildSubmitData,
    reset,
  } = useChangePlanForm({ subscription, open });

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setLoading(true);
    try {
      await onConfirm(buildSubmitData());
      reset();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="size-5 text-primary" />
            {t('subscription.changePlanTitle')}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1 flex-wrap">
            {t('subscription.changePlanDesc', { id: '' })} <TruncatedId id={subscription.id} />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Plan Info */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground mb-1">{t('subscription.currentPlan')}</div>
            <div className="font-medium">{subscription.plan?.name || t('subscription.unknownPlan')}</div>
          </div>

          {/* Plan Selection */}
          <div className="space-y-2">
            <Label>{t('subscription.newPlan')} *</Label>
            {plansLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : availablePlans.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 border rounded-lg">
                {t('subscription.noOtherPlans')}
              </div>
            ) : (
              <Select
                value={selectedPlanId}
                onValueChange={setSelectedPlanId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('subscription.selectNewPlan')} />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans.map((plan) => {
                    const activePrice = plan.pricings?.find((p) => p.isActive);
                    return (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex items-center gap-2">
                          <span>{plan.name}</span>
                          {activePrice && (
                            <span className="text-muted-foreground text-xs">
                              ¥{(activePrice.price / 100).toFixed(2)}/{t(`billingCycle.per${activePrice.billingCycle.charAt(0).toUpperCase() + activePrice.billingCycle.slice(1)}`)}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Change Type */}
          <div className="space-y-2">
            <Label>{t('subscription.changeType')}</Label>
            <RadioGroup
              value={changeType}
              onValueChange={(value) => setChangeType(value as 'upgrade' | 'downgrade')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upgrade" id="upgrade" />
                <Label htmlFor="upgrade" className="cursor-pointer flex items-center gap-1.5">
                  <ArrowUpCircle className="size-4 text-emerald-500" />
                  {t('subscription.upgrade')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="downgrade" id="downgrade" />
                <Label htmlFor="downgrade" className="cursor-pointer flex items-center gap-1.5">
                  <ArrowDownCircle className="size-4 text-amber-500" />
                  {t('subscription.downgrade')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Effective Date */}
          <div className="space-y-2">
            <Label>{t('subscription.effectiveDate')}</Label>
            <RadioGroup
              value={effectiveDate}
              onValueChange={(value) => setEffectiveDate(value as 'immediate' | 'period_end')}
              className="space-y-2"
            >
              <div className="flex items-start space-x-2 p-3 rounded-lg border bg-muted/30">
                <RadioGroupItem value="immediate" id="immediate" className="mt-0.5" />
                <div>
                  <Label htmlFor="immediate" className="cursor-pointer font-medium">
                    {t('subscription.effectiveImmediate')}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {changeType === 'upgrade'
                      ? t('subscription.changePlanWarning')
                      : t('subscription.changePlanWarning')}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg border bg-muted/30">
                <RadioGroupItem value="period_end" id="period_end" className="mt-0.5" />
                <div>
                  <Label htmlFor="period_end" className="cursor-pointer font-medium">
                    {t('subscription.effectivePeriodEnd')}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('subscription.changePlanWarning')}
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Warning Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-3">
            <div className="flex items-start gap-2">
              <Info className="size-4 text-blue-600 dark:text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {t('subscription.changePlanWarning')}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t('common.processing')}
              </>
            ) : (
              t('subscription.confirmChangePlan')
            )}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.actions.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
