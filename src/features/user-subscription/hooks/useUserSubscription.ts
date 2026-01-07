/**
 * User Subscription Hook
 * Manages subscription detail data fetching and state
 */

import { useState, useEffect, useCallback } from 'react';
import { getSubscription, resetSubscriptionLink } from '@/api/subscription';
import type { Subscription } from '@/api/subscription/types';

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
 * @param subscriptionId - Subscription's Stripe-style ID (sub_xxx)
 */
export function useUserSubscription(subscriptionId: string): UseUserSubscriptionResult {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResettingLink, setIsResettingLink] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!subscriptionId) {
      setIsLoading(false);
      setError('Invalid subscription ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getSubscription(subscriptionId);
      setSubscription(data);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      setError('Failed to load subscription');
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [subscriptionId]);

  const resetLink = useCallback(async () => {
    if (!subscriptionId) return;

    setIsResettingLink(true);
    try {
      const updated = await resetSubscriptionLink(subscriptionId);
      setSubscription(updated);
    } catch (err) {
      console.error('Failed to reset subscription link:', err);
      throw err;
    } finally {
      setIsResettingLink(false);
    }
  }, [subscriptionId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    isLoading,
    error,
    refetch: fetchSubscription,
    resetLink,
    isResettingLink,
  };
}
