/**
 * Shared form hook for ChangePlan Dialog/Sheet
 * Manages plan selection, change type, and effective date state
 */

import { useState, useMemo, useEffect } from 'react';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import type { Subscription } from '@/api/subscription/types';
import type { ChangePlanRequest } from '@/api/admin/types';

interface UseChangePlanFormParams {
  subscription: Subscription | null;
  open: boolean;
}

export const useChangePlanForm = ({ subscription, open }: UseChangePlanFormParams) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [changeType, setChangeType] = useState<'upgrade' | 'downgrade'>('upgrade');
  const [effectiveDate, setEffectiveDate] = useState<'immediate' | 'period_end'>('immediate');

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

  const reset = () => {
    setSelectedPlanId('');
    setChangeType('upgrade');
    setEffectiveDate('immediate');
  };

  const buildSubmitData = (): ChangePlanRequest => ({
    newPlanId: selectedPlanId,
    changeType,
    effectiveDate,
  });

  const isFormValid = !!selectedPlanId && availablePlans.length > 0;

  return {
    selectedPlanId,
    setSelectedPlanId,
    changeType,
    setChangeType,
    effectiveDate,
    setEffectiveDate,
    plans,
    plansLoading,
    availablePlans,
    isFormValid,
    buildSubmitData,
    reset,
  };
};
