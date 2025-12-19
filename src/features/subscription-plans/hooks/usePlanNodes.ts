/**
 * usePlanNodes Hook
 * 管理订阅计划关联的节点
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

  // 查询计划关联的节点
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

  // 绑定节点
  // 注：Node.id 是 string 类型，但 API 的 BindNodesRequest.nodeIds 定义为 number[]
  // 这里使用类型断言来适配 SDK 类型定义的不一致
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

  // 解绑节点
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
    // 数据
    nodes: data?.nodes ?? [],
    total: data?.total ?? 0,

    // 状态
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,

    // 操作
    refetch,
    bindNodes: (nodeIds: string[]) => bindMutation.mutateAsync(nodeIds),
    unbindNodes: (nodeIds: string[]) => unbindMutation.mutateAsync(nodeIds),

    // Mutation 状态
    isBinding: bindMutation.isPending,
    isUnbinding: unbindMutation.isPending,
  };
};
