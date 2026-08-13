/**
 * useSubscriptionOrder Hook
 * Merged subscription ordering of a resource group's direct nodes and system forward rules.
 * Built with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import { getSubscriptionOrder, reorderSubscriptionOrder } from '@/api/node';
import type { SubscriptionOrderItem, ReorderSubscriptionOrderItem } from '@/api/node';

// Cache time: 1 minute, the order changes only through admin actions
const STALE_TIME = 60 * 1000;

const subscriptionOrderQueryKeys = {
  all: ['subscriptionOrder'] as const,
  detail: (groupId: string) => [...subscriptionOrderQueryKeys.all, groupId] as const,
};

interface UseSubscriptionOrderOptions {
  /** Resource group SID, null disables the query */
  groupId: string | null;
  enabled?: boolean;
}

/**
 * Read and reorder a resource group's subscription sequence.
 * Direct nodes and forward rules share one sort_order sequence, so both kinds are
 * returned as a single list in the exact order a subscription renders them.
 */
export const useSubscriptionOrder = (options: UseSubscriptionOrderOptions) => {
  const { groupId, enabled = true } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();
  const { t } = useTranslation();

  const queryKey = subscriptionOrderQueryKeys.detail(groupId ?? '');

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: () => getSubscriptionOrder({ groupId: groupId! }),
    enabled: enabled && !!groupId,
    staleTime: STALE_TIME,
  });

  // Reorder with optimistic update: the list is small and fully loaded, so the new
  // order can be applied locally before the request settles.
  const reorderMutation = useMutation({
    mutationFn: (items: ReorderSubscriptionOrderItem[]) => reorderSubscriptionOrder({ items }),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<SubscriptionOrderItem[]>(queryKey);

      queryClient.setQueryData<SubscriptionOrderItem[]>(queryKey, (old) => {
        if (!old) return old;
        const updated = old.map((item) => {
          const update = items.find((i) => i.type === item.type && i.id === item.id);
          return update ? { ...item, sortOrder: update.sortOrder } : item;
        });
        return [...updated].sort((a, b) => a.sortOrder - b.sortOrder);
      });

      return { previousData };
    },
    onSuccess: () => {
      showSuccess(t('resourceGroups.subscriptionOrder.reorderSuccess'));
    },
    onError: (err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      showError(handleApiError(err));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    items: data ?? [],
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,
    refetch,
    reorder: (items: ReorderSubscriptionOrderItem[]) => reorderMutation.mutateAsync(items),
    isReordering: reorderMutation.isPending,
  };
};
