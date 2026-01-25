/**
 * Assign Subscription Sheet Component (Admin)
 * Mobile-optimized bottom sheet for assigning subscriptions to users
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Loader2, Info, Package, Calendar, RefreshCw } from 'lucide-react';
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
import { MobileSelect, type MobileSelectOption } from '@/components/common/mobile-form';
import { Checkbox } from '@/components/common/Checkbox';
import { Label } from '@/components/common/Label';
import { Alert, AlertDescription } from '@/components/common/Alert';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { cn } from '@/lib/utils';
import type { BillingCycle, PricingOption, SubscriptionPlan, AdminCreateSubscriptionRequest } from '@/api/subscription/types';
import type { UserListItem } from '@/features/users/types/users.types';

interface AssignSubscriptionSheetProps extends BaseSheetProps {
  user: UserListItem | null;
  onSubmit: (data: AdminCreateSubscriptionRequest) => Promise<void>;
}

// Billing cycle translation keys
const BILLING_CYCLE_KEYS: Record<BillingCycle, string> = {
  weekly: 'billingCycle.weekly',
  monthly: 'billingCycle.monthly',
  quarterly: 'billingCycle.quarterly',
  semi_annual: 'billingCycle.semiAnnual',
  yearly: 'billingCycle.yearly',
  lifetime: 'billingCycle.lifetime',
};

// Get available pricing options for the plan
const getAvailablePricings = (plan: SubscriptionPlan): PricingOption[] => {
  if (!plan.pricings) return [];
  return plan.pricings.filter(p => p.isActive);
};

// Format price display
const formatPrice = (price: number, currency: string): string => {
  const symbol = currency === 'CNY' ? '¥' : '$';
  return `${symbol}${(price / 100).toFixed(2)}`;
};

export const AssignSubscriptionSheet: React.FC<AssignSubscriptionSheetProps> = ({
  open,
  onOpenChange,
  user,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const { plans, isLoading: plansLoading } = useSubscriptionPlans({ enabled: open });
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<AdminCreateSubscriptionRequest>({
    userId: '',
    planId: '',
    billingCycle: 'monthly',
    autoRenew: true,
  });

  // Get selected plan
  const selectedPlan = useMemo(() => {
    return plans.find(p => p.id === formData.planId) || null;
  }, [plans, formData.planId]);

  // Get available pricing options for selected plan
  const availablePricings = useMemo(() => {
    if (!selectedPlan) return [];
    return getAvailablePricings(selectedPlan);
  }, [selectedPlan]);

  // Get selected pricing
  const selectedPricing = useMemo(() => {
    return availablePricings.find(p => p.billingCycle === formData.billingCycle) || availablePricings[0] || null;
  }, [availablePricings, formData.billingCycle]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && user && !plansLoading) {
      const defaultPlan = plans.find(p => p.status === 'active');
      const firstPricing = defaultPlan?.pricings?.find(p => p.isActive);
      const defaultBillingCycle = firstPricing?.billingCycle || 'monthly';
      setFormData({
        userId: user.id,
        planId: '',
        billingCycle: defaultBillingCycle,
        autoRenew: true,
      });
    }
  }, [open, user, plans, plansLoading]);

  // Auto-set billing cycle when plan changes
  useEffect(() => {
    if (selectedPlan && availablePricings.length > 0) {
      setFormData(prev => {
        const currentCycleAvailable = availablePricings.some(p => p.billingCycle === prev.billingCycle);
        if (!currentCycleAvailable) {
          return { ...prev, billingCycle: availablePricings[0].billingCycle };
        }
        return prev;
      });
    }
  }, [selectedPlan, availablePricings]);

  const handleSubmit = async () => {
    if (!formData.planId) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Prepare plan options
  const planOptions = useMemo((): MobileSelectOption[] => {
    return plans
      .filter(plan => plan.status === 'active')
      .map(plan => {
        const pricings = getAvailablePricings(plan);
        let priceDisplay: string;
        if (pricings.length === 0) {
          priceDisplay = t('subscription.noPricing');
        } else if (pricings.length === 1) {
          priceDisplay = formatPrice(pricings[0].price, pricings[0].currency);
        } else {
          const prices = pricings.map(p => p.price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const currency = pricings[0].currency;
          priceDisplay = minPrice === maxPrice
            ? formatPrice(minPrice, currency)
            : `${formatPrice(minPrice, currency)} - ${formatPrice(maxPrice, currency)}`;
        }
        return {
          value: plan.id.toString(),
          label: `${plan.name} - ${priceDisplay}`
        };
      });
  }, [plans, t]);

  // Prepare billing cycle options
  const billingCycleOptions = useMemo((): MobileSelectOption[] => {
    if (availablePricings.length > 0) {
      return availablePricings.map(p => ({
        value: p.billingCycle,
        label: `${t(BILLING_CYCLE_KEYS[p.billingCycle])} - ${formatPrice(p.price, p.currency)}`,
      }));
    }
    return [];
  }, [availablePricings, t]);

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

              {/* Auto Renew */}
              <div
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border bg-muted/30',
                  'active:bg-muted/50 transition-colors cursor-pointer'
                )}
                onClick={() => setFormData({ ...formData, autoRenew: !formData.autoRenew })}
              >
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{t('subscription.autoRenew')}</p>
                  <p className="text-sm text-muted-foreground">{t('subscription.autoRenewDesc')}</p>
                </div>
                <Checkbox
                  checked={formData.autoRenew}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoRenew: checked === true })}
                  className="size-6"
                />
              </div>

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
            disabled={!formData.planId || submitting}
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
