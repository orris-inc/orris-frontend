/**
 * User Subscription Hook
 * Manages subscription detail data fetching and state with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSubscription, resetSubscriptionLink } from '@/api/subscription';
import type { Subscription } from '@/api/subscription/types';

// Cache time: 2 minutes for subscription data
const STALE_TIME = 2 * 60 * 1000;

// Query keys for subscription
const subscriptionQueryKeys = {
  all: ['subscription'] as const,
  detail: (id: string) => [...subscriptionQueryKeys.all, 'detail', id] as const,
};

interface UseUserSubscriptionResult {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  resetLink: () => Promise<void>;
  isResettingLink: boolean;
}

/**
 * Hook to fetch and manage a single subscription
 * Uses TanStack Query for caching and automatic refetching
 *
 * @param subscriptionId - Subscription's Stripe-style ID (sub_xxx)
 */
export function useUserSubscription(subscriptionId: string): UseUserSubscriptionResult {
  const queryClient = useQueryClient();

  // Query subscription data
  const {
    data: subscription,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: subscriptionQueryKeys.detail(subscriptionId),
    queryFn: () => getSubscription(subscriptionId),
    enabled: !!subscriptionId,
    staleTime: STALE_TIME,
  });

  // Reset link mutation
  const resetLinkMutation = useMutation({
    mutationFn: () => resetSubscriptionLink(subscriptionId),
    onSuccess: (updatedSubscription) => {
      // Update cache with new subscription data
      queryClient.setQueryData(
        subscriptionQueryKeys.detail(subscriptionId),
        updatedSubscription
      );
    },
  });

  const refetch = async () => {
    await queryRefetch();
  };

  const resetLink = async () => {
    await resetLinkMutation.mutateAsync();
  };

  return {
    subscription: subscription ?? null,
    isLoading,
    error: error ? 'Failed to load subscription' : null,
    refetch,
    resetLink,
    isResettingLink: resetLinkMutation.isPending,
  };
}
