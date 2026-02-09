/**
 * Duplicate Subscription Sheet Component
 * Mobile-optimized bottom sheet for creating subscription based on existing one
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Info, Copy, User, CreditCard, RefreshCw } from 'lucide-react';
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
import { TruncatedId } from '@/components/admin';
import { useDuplicateSubscriptionForm, formatPrice, BILLING_CYCLE_KEYS } from '../hooks/useDuplicateSubscriptionForm';
import type { BillingCycle, Subscription, AdminCreateSubscriptionRequest } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface DuplicateSubscriptionSheetProps extends BaseSheetProps {
  subscription: Subscription | null;
  user?: UserResponse;
  onSubmit: (data: AdminCreateSubscriptionRequest) => Promise<void>;
}

export const DuplicateSubscriptionSheet: React.FC<DuplicateSubscriptionSheetProps> = ({
  open,
  onOpenChange,
  subscription,
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
  } = useDuplicateSubscriptionForm({ subscription, open });

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

  if (!subscription) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <SheetContent className="max-h-[95vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-info/10 flex items-center justify-center">
              <Copy className="size-4 text-info" />
            </div>
            <span>{t('subscription.duplicate')}</span>
          </SheetTitle>
          <SheetDescription className="text-xs flex items-center gap-1">
            {t('subscription.baseOn')} <TruncatedId id={subscription.id} /> {t('common.actions.create')}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-3 space-y-4">
          {plansLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Target User */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">{t('subscription.targetUser')}</label>
                <div className="rounded-xl ring-1 ring-border bg-muted/30 p-3">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    {user ? (
                      <div>
                        <div className="text-sm font-medium">{user.name || user.email}</div>
                        {user.name && <div className="text-xs text-muted-foreground">{user.email}</div>}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">{t('labels.userId')}: {subscription.userId}</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t('subscription.sameUserAssignment')}</p>
              </div>

              {/* Plan Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">{t('subscription.plan')} <span className="text-destructive">*</span></label>
                <MobileSelect
                  value={formData.planId}
                  onChange={(value) => setFormData({ ...formData, planId: value })}
                  options={planOptions}
                  placeholder={t('placeholders.selectPlan')}
                  icon={<CreditCard className="size-5" />}
                  disabled={submitting}
                />
              </div>

              {/* Billing Cycle */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">
                  {t('subscription.billingCycle')}
                  {availablePricings.length > 1 && (
                    <span className="ml-1 text-muted-foreground">({availablePricings.length} {t('subscription.optionsAvailable')})</span>
                  )}
                </label>
                <MobileSelect
                  value={formData.billingCycle}
                  onChange={(value) => setFormData({ ...formData, billingCycle: value as BillingCycle })}
                  options={billingCycleOptions}
                  placeholder={t('subscription.selectPlanFirst')}
                  icon={<RefreshCw className="size-5" />}
                  disabled={submitting || !selectedPlan}
                />
              </div>

              {/* Auto Renew checkbox hidden - feature not complete */}

              {/* Plan Details */}
              {selectedPlan && (
                <div className="rounded-xl ring-1 ring-border p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="size-4 text-muted-foreground" />
                    {t('subscription.planDetails')}
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>{t('labels.name')}: {selectedPlan.name}</p>
                    {selectedPricing && (
                      <p>
                        {t('labels.price')}: {formatPrice(selectedPricing.price, selectedPricing.currency)} / {t(BILLING_CYCLE_KEYS[selectedPricing.billingCycle])}
                      </p>
                    )}
                    {selectedPlan.description && (
                      <p className="mt-1">{selectedPlan.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Info Alert */}
              <div className="rounded-xl border border-info/20 bg-info/10 p-3">
                <div className="flex items-start gap-2">
                  <Info className="size-4 text-info mt-0.5 shrink-0" />
                  <p className="text-xs text-info">
                    {t('subscription.duplicateInfo')}
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetBody>

        <SheetFooter className="pt-3 pb-1">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || submitting}
            className="w-full min-h-[48px]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t('subscription.creating')}
              </>
            ) : (
              t('subscription.create')
            )}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting} className="w-full min-h-[44px]">
            {t('common.actions.cancel')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
