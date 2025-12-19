/**
 * useResourceGroups Hook
 * 基于 TanStack Query 实现
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '@/shared/lib/query-client';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import {
  createResourceGroup,
  getResourceGroup,
  listResourceGroups,
  updateResourceGroup,
  deleteResourceGroup,
  activateResourceGroup,
  deactivateResourceGroup,
  listGroupNodes,
  listGroupForwardAgents,
  addNodesToGroup,
  removeNodesFromGroup,
  addForwardAgentsToGroup,
  removeForwardAgentsFromGroup,
} from '@/api/resource';
import type {
  ResourceGroup,
  ResourceGroupStatus,
  CreateResourceGroupRequest,
  UpdateResourceGroupRequest,
  ListResourceGroupsParams,
  ListGroupMembersParams,
  BatchOperationResult,
} from '@/api/resource/types';

interface ResourceGroupFilters {
  status?: ResourceGroupStatus;
  planId?: string;
}

interface UseResourceGroupsOptions {
  page?: number;
  pageSize?: number;
  filters?: ResourceGroupFilters;
  enabled?: boolean;
}

export const useResourceGroups = (options: UseResourceGroupsOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // 构建查询参数
  const params: ListResourceGroupsParams = {
    page,
    pageSize,
    status: filters.status,
    planId: filters.planId,
  };

  // 查询资源组列表
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.resourceGroups.list(params),
    queryFn: () => listResourceGroups(params),
    enabled,
  });

  // 创建资源组
  const createMutation = useMutation({
    mutationFn: createResourceGroup,
    onSuccess: () => {
      showSuccess('资源组创建成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.resourceGroups.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 更新资源组
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateResourceGroupRequest }) =>
      updateResourceGroup(id, data),
    onSuccess: () => {
      showSuccess('资源组更新成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.resourceGroups.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 删除资源组
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteResourceGroup(id),
    onSuccess: () => {
      showSuccess('资源组删除成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.resourceGroups.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 激活资源组
  const activateMutation = useMutation({
    mutationFn: (id: number) => activateResourceGroup(id),
    onSuccess: () => {
      showSuccess('资源组已激活');
      queryClient.invalidateQueries({ queryKey: queryKeys.resourceGroups.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 停用资源组
  const deactivateMutation = useMutation({
    mutationFn: (id: number) => deactivateResourceGroup(id),
    onSuccess: () => {
      showSuccess('资源组已停用');
      queryClient.invalidateQueries({ queryKey: queryKeys.resourceGroups.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    // 数据
    resourceGroups: data?.items ?? [],
    pagination: {
      page: data?.page ?? page,
      pageSize: data?.pageSize ?? pageSize,
      total: data?.total ?? 0,
      totalPages: data?.totalPages ?? 0,
    },

    // 状态
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,

    // 操作
    refetch,
    createResourceGroup: (data: CreateResourceGroupRequest) =>
      createMutation.mutateAsync(data),
    updateResourceGroup: (id: number, data: UpdateResourceGroupRequest) =>
      updateMutation.mutateAsync({ id, data }),
    deleteResourceGroup: (id: number) => deleteMutation.mutateAsync(id),
    activateResourceGroup: (id: number) => activateMutation.mutateAsync(id),
    deactivateResourceGroup: (id: number) => deactivateMutation.mutateAsync(id),
    toggleResourceGroupStatus: (resourceGroup: ResourceGroup) =>
      resourceGroup.status === 'active'
        ? deactivateMutation.mutateAsync(resourceGroup.id)
        : activateMutation.mutateAsync(resourceGroup.id),

    // Mutation 状态
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isActivating: activateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
  };
};

// 获取单个资源组详情
export const useResourceGroup = (id: number | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.resourceGroups.detail(id!),
    queryFn: () => getResourceGroup(id!),
    enabled: !!id,
  });

  return {
    resourceGroup: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

// 资源组列表状态管理 hook（用于页面级状态）
export const useResourceGroupsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<ResourceGroupFilters>({});
  const [selectedResourceGroup, setSelectedResourceGroup] = useState<ResourceGroup | null>(null);

  const resourceGroupsQuery = useResourceGroups({ page, pageSize, filters });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Partial<ResourceGroupFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return {
    ...resourceGroupsQuery,
    page,
    pageSize,
    filters,
    selectedResourceGroup,
    setSelectedResourceGroup,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
  };
};

// 获取资源组成员（节点）
interface UseGroupNodesOptions {
  groupId: number | string | null;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export const useGroupNodes = (options: UseGroupNodesOptions) => {
  const { groupId, page = 1, pageSize = 20, enabled = true } = options;

  const params: ListGroupMembersParams = { page, pageSize };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['resourceGroups', 'nodes', groupId, params],
    queryFn: () => listGroupNodes(groupId!, params),
    enabled: enabled && !!groupId,
  });

  return {
    nodes: data?.items ?? [],
    pagination: {
      page: data?.page ?? page,
      pageSize: data?.pageSize ?? pageSize,
      total: data?.total ?? 0,
      totalPages: data?.totalPages ?? 0,
    },
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,
    refetch,
  };
};

// 获取资源组成员（转发代理）
interface UseGroupForwardAgentsOptions {
  groupId: number | string | null;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export const useGroupForwardAgents = (options: UseGroupForwardAgentsOptions) => {
  const { groupId, page = 1, pageSize = 20, enabled = true } = options;

  const params: ListGroupMembersParams = { page, pageSize };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['resourceGroups', 'forwardAgents', groupId, params],
    queryFn: () => listGroupForwardAgents(groupId!, params),
    enabled: enabled && !!groupId,
  });

  return {
    forwardAgents: data?.items ?? [],
    pagination: {
      page: data?.page ?? page,
      pageSize: data?.pageSize ?? pageSize,
      total: data?.total ?? 0,
      totalPages: data?.totalPages ?? 0,
    },
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,
    refetch,
  };
};

// 资源组成员管理 hook
export const useGroupMemberManagement = (groupId: number | string | null) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // 添加节点到资源组
  const addNodesMutation = useMutation({
    mutationFn: (nodeIds: string[]) => addNodesToGroup(groupId!, { nodeIds }),
    onSuccess: (result: BatchOperationResult) => {
      const successCount = result.succeeded.length;
      const failCount = result.failed?.length ?? 0;
      if (failCount === 0) {
        showSuccess(`成功添加 ${successCount} 个节点`);
      } else {
        showSuccess(`添加完成：${successCount} 成功，${failCount} 失败`);
      }
      queryClient.invalidateQueries({ queryKey: ['resourceGroups', 'nodes', groupId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.nodes.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 从资源组移除节点
  const removeNodesMutation = useMutation({
    mutationFn: (nodeIds: string[]) => removeNodesFromGroup(groupId!, { nodeIds }),
    onSuccess: (result: BatchOperationResult) => {
      const successCount = result.succeeded.length;
      const failCount = result.failed?.length ?? 0;
      if (failCount === 0) {
        showSuccess(`成功移除 ${successCount} 个节点`);
      } else {
        showSuccess(`移除完成：${successCount} 成功，${failCount} 失败`);
      }
      queryClient.invalidateQueries({ queryKey: ['resourceGroups', 'nodes', groupId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.nodes.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 添加转发代理到资源组
  const addAgentsMutation = useMutation({
    mutationFn: (agentIds: string[]) => addForwardAgentsToGroup(groupId!, { agentIds }),
    onSuccess: (result: BatchOperationResult) => {
      const successCount = result.succeeded.length;
      const failCount = result.failed?.length ?? 0;
      if (failCount === 0) {
        showSuccess(`成功添加 ${successCount} 个转发代理`);
      } else {
        showSuccess(`添加完成：${successCount} 成功，${failCount} 失败`);
      }
      queryClient.invalidateQueries({ queryKey: ['resourceGroups', 'forwardAgents', groupId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.forwardAgents.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 从资源组移除转发代理
  const removeAgentsMutation = useMutation({
    mutationFn: (agentIds: string[]) => removeForwardAgentsFromGroup(groupId!, { agentIds }),
    onSuccess: (result: BatchOperationResult) => {
      const successCount = result.succeeded.length;
      const failCount = result.failed?.length ?? 0;
      if (failCount === 0) {
        showSuccess(`成功移除 ${successCount} 个转发代理`);
      } else {
        showSuccess(`移除完成：${successCount} 成功，${failCount} 失败`);
      }
      queryClient.invalidateQueries({ queryKey: ['resourceGroups', 'forwardAgents', groupId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.forwardAgents.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    // 操作
    addNodes: (nodeIds: string[]) => addNodesMutation.mutateAsync(nodeIds),
    removeNodes: (nodeIds: string[]) => removeNodesMutation.mutateAsync(nodeIds),
    addAgents: (agentIds: string[]) => addAgentsMutation.mutateAsync(agentIds),
    removeAgents: (agentIds: string[]) => removeAgentsMutation.mutateAsync(agentIds),

    // 状态
    isAddingNodes: addNodesMutation.isPending,
    isRemovingNodes: removeNodesMutation.isPending,
    isAddingAgents: addAgentsMutation.isPending,
    isRemovingAgents: removeAgentsMutation.isPending,
  };
};
