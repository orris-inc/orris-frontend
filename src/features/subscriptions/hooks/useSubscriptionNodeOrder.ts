/**
 * useSubscriptionNodeOrder Hook
 *
 * What one subscription actually delivers, in subscription link order. Read-only:
 * unlike the resource-group ordering, this view spans every resource group of the plan
 * and includes the subscriber's own forward rules, so no single endpoint can reposition
 * it — see useSubscriptionOrder (resource-groups) for the editable per-group view.
 *
 * Built with TanStack Query.
 * Added: 2026-08-13
 */

import { useQuery } from '@tanstack/react-query';
import { handleApiError } from '@/shared/lib/axios';
import { getSubscriptionNodeOrder } from '@/api/admin';
import type { SubscriptionNodeMode } from '@/api/admin';

// Cache time: 30 seconds. The list changes when an admin reorders entries, when a user
// adds a forward rule, or when a node goes inactive — none of which this view triggers.
const STALE_TIME = 30 * 1000;

const subscriptionNodeOrderQueryKeys = {
  all: ['subscriptionNodeOrder'] as const,
  detail: (subscriptionId: string, mode: SubscriptionNodeMode) =>
    [...subscriptionNodeOrderQueryKeys.all, subscriptionId, mode] as const,
};

interface UseSubscriptionNodeOrderOptions {
  /** Subscription SID (sub_xxx), null disables the query */
  subscriptionId: string | null;
  /** Which kinds of entry to include, defaults to 'all' */
  mode?: SubscriptionNodeMode;
  enabled?: boolean;
}

/**
 * Read the entries a subscription delivers, in delivery order.
 *
 * `status` explains an empty list: only active subscriptions deliver nodes, so a
 * suspended or expired subscription legitimately returns nothing.
 */
export const useSubscriptionNodeOrder = (options: UseSubscriptionNodeOrderOptions) => {
  const { subscriptionId, mode = 'all', enabled = true } = options;

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: subscriptionNodeOrderQueryKeys.detail(subscriptionId ?? '', mode),
    queryFn: () => getSubscriptionNodeOrder(subscriptionId!, { mode }),
    enabled: enabled && !!subscriptionId,
    staleTime: STALE_TIME,
  });

  return {
    items: data?.items ?? [],
    /** Subscription status as of this read, e.g. 'active' or 'suspended' */
    status: data?.status ?? null,
    total: data?.total ?? 0,
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,
    refetch,
  };
};
