/**
 * Shared form hook for DuplicateSubscription Dialog/Sheet
 * Manages form data, plan selection, billing cycle, and computed values
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import type {
  BillingCycle,
  PricingOption,
  Subscription,
  SubscriptionPlan,
  AdminCreateSubscriptionRequest,
} from '@/api/subscription/types';

interface UseDuplicateSubscriptionFormParams {
  subscription: Subscription | null;
  open: boolean;
}

// Get available pricing options for the plan
const getAvailablePricings = (plan: SubscriptionPlan): PricingOption[] => {
  return plan.pricings?.filter(p => p.isActive) || [];
};

// Format price display
const formatPrice = (price: number, currency: string): string => {
  const symbol = currency === 'CNY' ? '\u00a5' : '$';
  return `${symbol}${(price / 100).toFixed(2)}`;
};

// Billing cycle translation keys
const BILLING_CYCLE_KEYS: Record<BillingCycle, string> = {
  weekly: 'billingCycle.weekly',
  monthly: 'billingCycle.monthly',
  quarterly: 'billingCycle.quarterly',
  semi_annual: 'billingCycle.semiAnnual',
  yearly: 'billingCycle.yearly',
  lifetime: 'billingCycle.lifetime',
};

export { getAvailablePricings, formatPrice, BILLING_CYCLE_KEYS };

export const useDuplicateSubscriptionForm = ({ subscription, open }: UseDuplicateSubscriptionFormParams) => {
  const { t } = useTranslation();
  const { plans, isLoading: plansLoading } = useSubscriptionPlans({ enabled: open });
  const [formData, setFormData] = useState<AdminCreateSubscriptionRequest>({
    userId: '',
    planId: '',
    billingCycle: 'monthly',
    autoRenew: true,
  });

  // Billing cycle display name mapping
  const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = useMemo(() => ({
    weekly: t('billingCycle.weekly'),
    monthly: t('billingCycle.monthly'),
    quarterly: t('billingCycle.quarterly'),
    semi_annual: t('billingCycle.semiAnnual'),
    yearly: t('billingCycle.yearly'),
    lifetime: t('billingCycle.lifetime'),
  }), [t]);

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

  // Initialize form (based on original subscription data)
  useEffect(() => {
    if (open && subscription) {
      const defaultPricing = subscription.plan?.pricings?.[0];
      setFormData({
        userId: subscription.userId,
        planId: subscription.plan?.id || '',
        billingCycle: (defaultPricing?.billingCycle as BillingCycle) || 'monthly',
        autoRenew: subscription.autoRenew,
      });
    }
  }, [open, subscription]);

  // Automatically set default billing cycle when selected plan changes
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

  // Prepare plan options (show price range)
  const planOptions = useMemo(() => {
    return plans
      .filter(plan => plan.status === 'active')
      .map(plan => {
        const pricings = getAvailablePricings(plan);
        let priceDisplay: string;
        if (pricings.length > 1) {
          const prices = pricings.map(p => p.price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const currency = pricings[0].currency;
          priceDisplay = minPrice === maxPrice
            ? formatPrice(minPrice, currency)
            : `${formatPrice(minPrice, currency)} - ${formatPrice(maxPrice, currency)}`;
        } else if (pricings.length === 1) {
          priceDisplay = formatPrice(pricings[0].price, pricings[0].currency);
        } else {
          priceDisplay = t('subscription.noPriceSet');
        }
        return {
          value: plan.id.toString(),
          label: `${plan.name} - ${priceDisplay}`,
        };
      });
  }, [plans, t]);

  // Prepare billing cycle options (based on selected plan's available pricing)
  const billingCycleOptions = useMemo(() => {
    if (availablePricings.length > 0) {
      return availablePricings.map(p => ({
        value: p.billingCycle,
        label: `${BILLING_CYCLE_LABELS[p.billingCycle]} - ${formatPrice(p.price, p.currency)}`,
      }));
    }
    return Object.entries(BILLING_CYCLE_LABELS).map(([value, label]) => ({
      value: value as BillingCycle,
      label,
    }));
  }, [availablePricings, BILLING_CYCLE_LABELS]);

  const isFormValid = !!formData.planId;

  return {
    formData,
    setFormData,
    plans,
    plansLoading,
    selectedPlan,
    availablePricings,
    selectedPricing,
    planOptions,
    billingCycleOptions,
    BILLING_CYCLE_LABELS,
    BILLING_CYCLE_KEYS,
    isFormValid,
    getAvailablePricings,
    formatPrice,
  };
};
