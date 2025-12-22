/**
 * usePlanNodes Hook
 * Manage nodes associated with subscription plans
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-client';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import { getPlanNodes, bindNodes, unbindNodes } from '@/api/subscription';

interface UsePlanNodesOptions {
  planId: string | null;
  enabled?: boolean;
}

export const usePlanNodes = (options: UsePlanNodesOptions) => {
  const { planId, enabled = true } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Query nodes associated with the plan
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.subscriptionPlans.nodes(planId!),
    queryFn: () => getPlanNodes(planId!),
    enabled: enabled && planId !== null,
  });

  // Bind nodes
  // Note: Node.id is string type, but API's BindNodesRequest.nodeIds is defined as number[]
  // Use type assertion here to adapt to SDK type definition inconsistency
  const bindMutation = useMutation({
    mutationFn: (nodeIds: string[]) =>
      bindNodes(planId!, { nodeIds: nodeIds as unknown as number[] }),
    onSuccess: () => {
      showSuccess('节点绑定成功');
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptionPlans.nodes(planId!),
      });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Unbind nodes
  const unbindMutation = useMutation({
    mutationFn: (nodeIds: string[]) =>
      unbindNodes(planId!, { nodeIds: nodeIds as unknown as number[] }),
    onSuccess: () => {
      showSuccess('节点解绑成功');
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptionPlans.nodes(planId!),
      });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    // Data
    nodes: data?.nodes ?? [],
    total: data?.total ?? 0,

    // State
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,

    // Operations
    refetch,
    bindNodes: (nodeIds: string[]) => bindMutation.mutateAsync(nodeIds),
    unbindNodes: (nodeIds: string[]) => unbindMutation.mutateAsync(nodeIds),

    // Mutation state
    isBinding: bindMutation.isPending,
    isUnbinding: unbindMutation.isPending,
  };
};
