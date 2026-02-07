/**
 * Shared form hook for AssignSubscription Dialog/Sheet
 * Manages form data, plan selection, billing cycle for user assignment
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import type {
  BillingCycle,
  PricingOption,
  SubscriptionPlan,
  AdminCreateSubscriptionRequest,
} from '@/api/subscription/types';
import type { UserListItem } from '@/features/users/types/users.types';

interface UseAssignSubscriptionFormParams {
  user: UserListItem | null;
  open: boolean;
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
  const symbol = currency === 'CNY' ? '\u00a5' : '$';
  return `${symbol}${(price / 100).toFixed(2)}`;
};

export { BILLING_CYCLE_KEYS, getAvailablePricings, formatPrice };

export const useAssignSubscriptionForm = ({ user, open }: UseAssignSubscriptionFormParams) => {
  const { t } = useTranslation();
  const { plans, isLoading: plansLoading } = useSubscriptionPlans({ enabled: open });
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

  // Reset form when dialog opens (only execute after data loading completes)
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
          label: `${plan.name} - ${priceDisplay}`,
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
    BILLING_CYCLE_KEYS,
    isFormValid,
    getAvailablePricings,
    formatPrice,
  };
};
