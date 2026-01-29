/**
 * Change subscription plan sheet component
 * Mobile-optimized bottom sheet for changing subscription plan
 */

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpCircle, ArrowDownCircle, Info, Loader2, RefreshCw } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type BaseSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Label';
import { TruncatedId } from '@/components/admin';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { RadioGroup, RadioGroupItem } from '@/components/common/RadioGroup';
import { Skeleton } from '@/components/common/Skeleton';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import type { Subscription } from '@/api/subscription/types';
import type { ChangePlanRequest } from '@/api/admin/types';

interface ChangePlanSheetProps extends BaseSheetProps {
  subscription: Subscription | null;
  onConfirm: (data: ChangePlanRequest) => Promise<void>;
}

export const ChangePlanSheet: React.FC<ChangePlanSheetProps> = ({
  open,
  onOpenChange,
  subscription,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [changeType, setChangeType] = useState<'upgrade' | 'downgrade'>('upgrade');
  const [effectiveDate, setEffectiveDate] = useState<'immediate' | 'period_end'>('immediate');
  const [loading, setLoading] = useState(false);

  // Fetch all available plans
  const { plans, isLoading: plansLoading } = useSubscriptionPlans({
    page: 1,
    pageSize: 100,
    filters: { status: 'active' },
    enabled: open,
  });

  // Filter out current plan
  const availablePlans = useMemo(() => {
    if (!subscription?.plan?.id) return plans;
    return plans.filter((p) => p.id !== subscription.plan?.id);
  }, [plans, subscription]);

  // Auto-determine change type based on selected plan price
  useEffect(() => {
    if (!selectedPlanId || !subscription?.plan?.pricings) return;

    const selectedPlan = availablePlans.find((p) => p.id === selectedPlanId);
    if (!selectedPlan?.pricings?.length) return;

    // Compare monthly prices (or first available pricing)
    const currentPrice = subscription.plan.pricings.find((p) => p.isActive)?.price || 0;
    const newPrice = selectedPlan.pricings.find((p) => p.isActive)?.price || 0;

    setChangeType(newPrice >= currentPrice ? 'upgrade' : 'downgrade');
  }, [selectedPlanId, subscription, availablePlans]);

  const handleSubmit = async () => {
    if (!selectedPlanId) return;
    setLoading(true);
    try {
      await onConfirm({
        newPlanId: selectedPlanId,
        changeType,
        effectiveDate,
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPlanId('');
    setChangeType('upgrade');
    setEffectiveDate('immediate');
  };

  const handleClose = (open: boolean) => {
    if (!loading && !open) {
      resetForm();
      onOpenChange(false);
    }
  };

  if (!subscription) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="max-h-[95vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <RefreshCw className="size-4 text-primary" />
            </div>
            <span>{t('subscription.changePlanTitle')}</span>
          </SheetTitle>
          <SheetDescription className="text-xs flex items-center gap-1">
            {t('subscription.label')} <TruncatedId id={subscription.id} />
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-4 space-y-4 overflow-y-auto">
          {/* Current Plan Info */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground mb-1">{t('subscription.currentPlan')}</div>
            <div className="font-medium">{subscription.plan?.name || t('subscription.unknownPlan')}</div>
          </div>

          {/* Plan Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('subscription.newPlan')} *</Label>
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
                              ¥{(activePrice.price / 100).toFixed(2)}
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
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('subscription.changeType')}</Label>
            <RadioGroup
              value={changeType}
              onValueChange={(value) => setChangeType(value as 'upgrade' | 'downgrade')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upgrade" id="upgrade-mobile" />
                <Label htmlFor="upgrade-mobile" className="cursor-pointer flex items-center gap-1.5 text-sm">
                  <ArrowUpCircle className="size-4 text-emerald-500" />
                  {t('subscription.upgrade')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="downgrade" id="downgrade-mobile" />
                <Label htmlFor="downgrade-mobile" className="cursor-pointer flex items-center gap-1.5 text-sm">
                  <ArrowDownCircle className="size-4 text-amber-500" />
                  {t('subscription.downgrade')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Effective Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('subscription.effectiveDate')}</Label>
            <RadioGroup
              value={effectiveDate}
              onValueChange={(value) => setEffectiveDate(value as 'immediate' | 'period_end')}
              className="space-y-2"
            >
              <div className="flex items-start space-x-2 p-3 rounded-lg border bg-muted/30">
                <RadioGroupItem value="immediate" id="immediate-mobile" className="mt-0.5" />
                <Label htmlFor="immediate-mobile" className="cursor-pointer text-sm">
                  {t('subscription.effectiveImmediate')}
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg border bg-muted/30">
                <RadioGroupItem value="period_end" id="period_end-mobile" className="mt-0.5" />
                <Label htmlFor="period_end-mobile" className="cursor-pointer text-sm">
                  {t('subscription.effectivePeriodEnd')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Warning Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-3">
            <div className="flex items-start gap-2">
              <Info className="size-4 text-blue-600 dark:text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {t('subscription.changePlanWarning')}
              </p>
            </div>
          </div>
        </SheetBody>

        <SheetFooter className="pt-3 pb-1">
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedPlanId || availablePlans.length === 0}
            className="w-full min-h-[48px]"
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
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={loading} className="w-full min-h-[44px]">
            {t('common.actions.back')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
