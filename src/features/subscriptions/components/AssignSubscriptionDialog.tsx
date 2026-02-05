/**
 * Assign Subscription Dialog Component (Admin)
 * Supports multiple pricing selection
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Info, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as LabelPrimitive from '@radix-ui/react-label';
import { SimpleSelect } from '@/lib/SimpleSelect';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { getButtonClass, labelStyles, alertStyles, alertDescriptionStyles } from '@/lib/ui-styles';
import type { BillingCycle, PricingOption, SubscriptionPlan, AdminCreateSubscriptionRequest } from '@/api/subscription/types';
import type { UserListItem } from '@/features/users/types/users.types';

interface AssignSubscriptionDialogProps {
  open: boolean;
  user: UserListItem | null;
  onClose: () => void;
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

export const AssignSubscriptionDialog: React.FC<AssignSubscriptionDialogProps> = ({
  open,
  user,
  onClose,
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

  // Reset form (only execute after data loading completes, avoid infinite loop from plans empty array reference change)
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

  // Automatically set default billing cycle when selected plan changes
  useEffect(() => {
    if (selectedPlan && availablePricings.length > 0) {
      // Use functional update to avoid dependency on formData.billingCycle
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
    if (!formData.planId) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (openState: boolean) => {
    if (!openState && !submitting) {
      onClose();
    }
  };

  // Prepare plan options (show price range)
  const planOptions = useMemo(() => {
    return plans
      .filter(plan => plan.status === 'active')
      .map(plan => {
        const pricings = getAvailablePricings(plan);
        let priceDisplay: string;
        if (pricings.length === 0) {
          priceDisplay = t('subscription.noPriceSet');
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

  // Prepare billing cycle options (based on selected plan's available pricing)
  const billingCycleOptions = useMemo(() => {
    if (availablePricings.length > 0) {
      return availablePricings.map(p => ({
        value: p.billingCycle,
        label: `${t(BILLING_CYCLE_KEYS[p.billingCycle])} - ${formatPrice(p.price, p.currency)}`,
      }));
    }
    // Default options when no pricing available
    return Object.entries(BILLING_CYCLE_KEYS).map(([value, key]) => ({
      value: value as BillingCycle,
      label: t(key),
    }));
  }, [availablePricings, t]);

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="@container fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
                {t('subscription.assignToUser')}
              </Dialog.Title>
              {user && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t('common.role.user')}: {user.name} ({user.email})
                </p>
              )}
            </div>
            <Dialog.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          {plansLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6 py-4">
              {/* Subscription plan selection */}
              <div className="grid gap-2">
                <LabelPrimitive.Root className={labelStyles}>{t('subscription.plan')}</LabelPrimitive.Root>
                <SimpleSelect
                  value={formData.planId}
                  onValueChange={(value) => setFormData({ ...formData, planId: value })}
                  options={planOptions}
                  placeholder={t('placeholders.selectPlan')}
                />
              </div>

              {/* Billing cycle selection */}
              <div className="grid gap-2">
                <LabelPrimitive.Root className={labelStyles}>
                  {t('subscription.billingCycle')}
                  {availablePricings.length > 1 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({availablePricings.length} {t('subscription.optionsAvailable')})
                    </span>
                  )}
                </LabelPrimitive.Root>
                <SimpleSelect
                  value={formData.billingCycle}
                  onValueChange={(value) => setFormData({ ...formData, billingCycle: value as BillingCycle })}
                  options={billingCycleOptions}
                  disabled={!selectedPlan}
                />
              </div>

              {/* Auto-renewal checkbox hidden - feature not complete */}

              {/* Plan details */}
              {selectedPlan && (
                <div className="rounded-md bg-muted p-4 text-sm">
                  <h4 className="font-medium mb-2">{t('subscription.planDetails')}</h4>
                  <div className="space-y-1 text-muted-foreground">
                    <p>{t('fields.name')}: {selectedPlan.name}</p>
                    {selectedPricing && (
                      <p>
                        {t('fields.price')}: {formatPrice(selectedPricing.price, selectedPricing.currency)} / {t(BILLING_CYCLE_KEYS[selectedPricing.billingCycle])}
                      </p>
                    )}
                    {selectedPlan.description && (
                      <p className="mt-1">{selectedPlan.description}</p>
                    )}
                  </div>
                </div>
              )}

              <div className={alertStyles}>
                <Info className="h-4 w-4" />
                <div className={alertDescriptionStyles}>
                  {t('subscription.assignInfo')}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className={getButtonClass('outline', 'default')}
            >
              {t('common.actions.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.planId || submitting}
              className={getButtonClass('default', 'default')}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('subscription.assigning')}
                </>
              ) : (
                t('subscription.confirmAssign')
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
