/**
 * usePublicPlans Hook
 * Used on user side, only reads public subscription plans
 * Implemented using TanStack Query
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-client';
import { handleApiError } from '@/shared/lib/axios';
import { getPublicPlans } from '@/api/subscription';
import type { SubscriptionPlan, BillingCycle } from '@/api/subscription/types';

export const usePublicPlans = (billingCycleFilter?: BillingCycle) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.subscriptionPlans.public(),
    queryFn: getPublicPlans,
  });

  const publicPlans = useMemo(() => data ?? [], [data]);

  // Filter plans by billing cycle (frontend filtering)
  // Filter logic: plan's pricings contain pricing options for that billing cycle
  const filteredPlans = useMemo(() => {
    if (!billingCycleFilter) return publicPlans;
    return publicPlans.filter((plan) => {
      return plan.pricings?.some(pricing => pricing.billingCycle === billingCycleFilter);
    });
  }, [publicPlans, billingCycleFilter]);

  // Sort by price (using first pricing's price)
  const sortedPlans = useMemo(() => {
    return [...filteredPlans].sort((a, b) => {
      const priceA = a.pricings?.[0]?.price || 0;
      const priceB = b.pricings?.[0]?.price || 0;
      return priceA - priceB;
    });
  }, [filteredPlans]);

  // Group by billing cycle (grouped by billingCycle in pricings)
  // A plan may appear in multiple billing cycle groups
  const plansByBillingCycle = useMemo(() => {
    return publicPlans.reduce(
      (acc, plan) => {
        (plan.pricings || []).forEach(pricing => {
          if (!acc[pricing.billingCycle]) {
            acc[pricing.billingCycle] = [];
          }
          // Check if the plan has already been added
          if (!acc[pricing.billingCycle].some(p => p.id === plan.id)) {
            acc[pricing.billingCycle].push(plan);
          }
        });
        return acc;
      },
      {} as Record<string, SubscriptionPlan[]>
    );
  }, [publicPlans]);

  return {
    // State
    publicPlans: sortedPlans,
    allPublicPlans: publicPlans,
    plansByBillingCycle,
    isLoading,
    error: error ? handleApiError(error) : null,

    // Methods
    refetch,
  };
};
