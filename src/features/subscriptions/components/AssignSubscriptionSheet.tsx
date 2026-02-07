/**
 * Assign Subscription Sheet Component (Admin)
 * Mobile-optimized bottom sheet for assigning subscriptions to users
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Loader2, Info, Package, Calendar } from 'lucide-react';
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
import { MobileSelect } from '@/components/common/mobile-form';
import { Label } from '@/components/common/Label';
import { Alert, AlertDescription } from '@/components/common/Alert';
import { useAssignSubscriptionForm, BILLING_CYCLE_KEYS, formatPrice } from '../hooks/useAssignSubscriptionForm';
import type { BillingCycle, AdminCreateSubscriptionRequest } from '@/api/subscription/types';
import type { UserListItem } from '@/features/users/types/users.types';

interface AssignSubscriptionSheetProps extends BaseSheetProps {
  user: UserListItem | null;
  onSubmit: (data: AdminCreateSubscriptionRequest) => Promise<void>;
}

export const AssignSubscriptionSheet: React.FC<AssignSubscriptionSheetProps> = ({
  open,
  onOpenChange,
  user,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  const {
    formData,
    setFormData,
    plansLoading,
    selectedPlan,
    availablePricings,
    selectedPricing,
    planOptions,
    billingCycleOptions,
    isFormValid,
  } = useAssignSubscriptionForm({ user, open });

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-info/10 flex items-center justify-center">
              <CreditCard className="size-5 text-info" />
            </div>
            <span>{t('subscription.assignSubscription')}</span>
          </SheetTitle>
          <SheetDescription>
            {t('subscription.assignSubscriptionDesc', { user: user.name || user.email })}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-5 py-3">
          {plansLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('subscription.loadingPlans')}</p>
            </div>
          ) : (
            <>
              {/* Plan Selection */}
              <div className="space-y-1.5">
                <Label className="px-1">
                  {t('subscription.subscriptionPlan')} <span className="text-destructive">*</span>
                </Label>
                <MobileSelect
                  value={formData.planId}
                  onChange={(value) => setFormData({ ...formData, planId: value })}
                  options={planOptions}
                  placeholder={t('subscription.selectPlan')}
                  icon={<Package className="size-5" />}
                />
              </div>

              {/* Billing Cycle Selection */}
              <div className="space-y-1.5">
                <Label className="px-1 flex items-center gap-2">
                  {t('subscription.billingCycle')}
                  {availablePricings.length > 1 && (
                    <span className="text-xs text-muted-foreground">
                      ({t('subscription.optionsAvailable', { count: availablePricings.length })})
                    </span>
                  )}
                </Label>
                <MobileSelect
                  value={formData.billingCycle}
                  onChange={(value) => setFormData({ ...formData, billingCycle: value as BillingCycle })}
                  options={billingCycleOptions}
                  placeholder={t('subscription.selectPlanFirst')}
                  icon={<Calendar className="size-5" />}
                  disabled={!selectedPlan || billingCycleOptions.length === 0}
                />
              </div>

              {/* Auto Renew toggle hidden - feature not complete */}

              {/* Plan Details */}
              {selectedPlan && (
                <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Info className="size-4 text-muted-foreground" />
                    {t('subscription.planDetails')}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('subscription.planName')}</span>
                      <span className="font-medium">{selectedPlan.name}</span>
                    </div>
                    {selectedPricing && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('subscription.price')}</span>
                        <span className="font-medium text-primary">
                          {formatPrice(selectedPricing.price, selectedPricing.currency)} / {t(BILLING_CYCLE_KEYS[selectedPricing.billingCycle])}
                        </span>
                      </div>
                    )}
                    {selectedPlan.description && (
                      <p className="text-muted-foreground pt-2 border-t">
                        {selectedPlan.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Info Alert */}
              <Alert className="rounded-xl">
                <Info className="size-4" />
                <AlertDescription>
                  {t('subscription.assignSubscriptionInfo')}
                </AlertDescription>
              </Alert>
            </>
          )}
        </SheetBody>

        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || submitting}
            className="w-full min-h-[52px] text-base"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                {t('subscription.assigning')}
              </>
            ) : (
              t('subscription.confirmAssign')
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="w-full min-h-[44px]"
          >
            {t('common.actions.cancel')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
