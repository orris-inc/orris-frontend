/**
 * Shared form hook for RenewSubscription Dialog/Sheet
 * Manages billing cycle selection and lifetime detection
 */

import { useState, useMemo } from 'react';
import type { Subscription } from '@/api/subscription/types';
import type { RenewSubscriptionRequest } from '@/api/admin/types';

type RenewableBillingCycle = NonNullable<RenewSubscriptionRequest['billingCycle']>;

export type { RenewableBillingCycle };

const BILLING_CYCLE_OPTIONS: { value: RenewableBillingCycle; labelKey: string }[] = [
  { value: 'weekly', labelKey: 'billingCycle.weekly' },
  { value: 'monthly', labelKey: 'billingCycle.monthly' },
  { value: 'quarterly', labelKey: 'billingCycle.quarterly' },
  { value: 'semi_annual', labelKey: 'billingCycle.semiAnnual' },
  { value: 'yearly', labelKey: 'billingCycle.yearly' },
];

export { BILLING_CYCLE_OPTIONS };

interface UseRenewSubscriptionFormParams {
  subscription: Subscription | null;
}

export const useRenewSubscriptionForm = ({ subscription }: UseRenewSubscriptionFormParams) => {
  const [selectedCycle, setSelectedCycle] = useState<RenewableBillingCycle | ''>('');

  // Get available billing cycles from the subscription's plan
  const availableCycles = useMemo(() => {
    if (!subscription?.plan?.pricings) return [];
    return subscription.plan.pricings
      .filter((p) => p.isActive && p.billingCycle !== 'lifetime')
      .map((p) => p.billingCycle);
  }, [subscription]);

  // Check if this is a lifetime subscription
  const isLifetime = useMemo(() => {
    if (!subscription?.plan?.pricings) return false;
    return subscription.plan.pricings.some(
      (p) => p.billingCycle === 'lifetime' && p.isActive
    );
  }, [subscription]);

  const reset = () => {
    setSelectedCycle('');
  };

  return {
    selectedCycle,
    setSelectedCycle,
    availableCycles,
    isLifetime,
    reset,
  };
};
