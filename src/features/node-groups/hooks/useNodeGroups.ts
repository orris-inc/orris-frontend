/**
 * useNodeGroups Hook
 * 基于 TanStack Query 实现
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '@/shared/lib/query-client';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import {
  listNodeGroups,
  getNodeGroup,
  createNodeGroup,
  updateNodeGroup,
  deleteNodeGroup,
  listGroupNodes,
  batchAddNodesToGroup,
  batchRemoveNodesFromGroup,
  type NodeGroup,
  type ListNodeGroupsParams,
  type CreateNodeGroupRequest,
  type UpdateNodeGroupRequest,
} from '@/api/node';

interface NodeGroupFilters {
  isPublic?: boolean;
  search?: string;
}

interface UseNodeGroupsOptions {
  page?: number;
  pageSize?: number;
  filters?: NodeGroupFilters;
  enabled?: boolean;
}

export const useNodeGroups = (options: UseNodeGroupsOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // 构建查询参数
  const params: ListNodeGroupsParams = {
    page,
    pageSize,
    isPublic: filters.isPublic,
  };

  // 查询节点组列表
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.nodeGroups.list(params),
    queryFn: () => listNodeGroups(params),
    enabled,
  });

  // 创建节点组
  const createMutation = useMutation({
    mutationFn: createNodeGroup,
    onSuccess: () => {
      showSuccess('节点组创建成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.nodeGroups.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 更新节点组
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateNodeGroupRequest }) =>
      updateNodeGroup(typeof id === 'string' ? parseInt(id, 10) : id, data),
    onSuccess: () => {
      showSuccess('节点组更新成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.nodeGroups.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 删除节点组
  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => deleteNodeGroup(typeof id === 'string' ? parseInt(id, 10) : id),
    onSuccess: () => {
      showSuccess('节点组删除成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.nodeGroups.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 批量添加节点到组
  const addNodesMutation = useMutation({
    mutationFn: ({ groupId, nodeIds }: { groupId: number | string; nodeIds: number[] }) =>
      batchAddNodesToGroup(typeof groupId === 'string' ? parseInt(groupId, 10) : groupId, { nodeIds }),
    onSuccess: (_, { groupId }) => {
      showSuccess('节点添加成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.nodeGroups.nodes(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.nodeGroups.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 批量从组中移除节点
  const removeNodesMutation = useMutation({
    mutationFn: ({ groupId, nodeIds }: { groupId: number | string; nodeIds: number[] }) =>
      batchRemoveNodesFromGroup(typeof groupId === 'string' ? parseInt(groupId, 10) : groupId, { nodeIds }),
    onSuccess: (_, { groupId }) => {
      showSuccess('节点移除成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.nodeGroups.nodes(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.nodeGroups.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    // 数据
    nodeGroups: data?.items ?? [],
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
    createNodeGroup: (data: CreateNodeGroupRequest) => createMutation.mutateAsync(data),
    updateNodeGroup: (id: number | string, data: UpdateNodeGroupRequest) =>
      updateMutation.mutateAsync({ id, data }),
    deleteNodeGroup: (id: number | string) => deleteMutation.mutateAsync(id),
    addNodesToGroup: (groupId: number | string, nodeIds: number[]) =>
      addNodesMutation.mutateAsync({ groupId, nodeIds }),
    removeNodesFromGroup: (groupId: number | string, nodeIds: number[]) =>
      removeNodesMutation.mutateAsync({ groupId, nodeIds }),

    // Mutation 状态
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAddingNodes: addNodesMutation.isPending,
    isRemovingNodes: removeNodesMutation.isPending,
  };
};

// 获取单个节点组详情
export const useNodeGroup = (id: number | string | null) => {
  const numericId = id !== null ? (typeof id === 'string' ? parseInt(id, 10) : id) : null;
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.nodeGroups.detail(numericId!),
    queryFn: () => getNodeGroup(numericId!),
    enabled: !!numericId,
  });

  return {
    nodeGroup: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

// 获取节点组中的节点列表
export const useNodeGroupNodes = (groupId: number | string | null) => {
  const numericGroupId = groupId !== null ? (typeof groupId === 'string' ? parseInt(groupId, 10) : groupId) : null;
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.nodeGroups.nodes(numericGroupId!),
    queryFn: () => listGroupNodes(numericGroupId!),
    enabled: !!numericGroupId,
  });

  return {
    nodes: data ?? [],
    isLoading,
    error: error ? handleApiError(error) : null,
    refetch,
  };
};

// 节点组列表状态管理 hook（用于页面级状态）
export const useNodeGroupsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<NodeGroupFilters>({});
  const [selectedNodeGroup, setSelectedNodeGroup] = useState<NodeGroup | null>(null);

  const nodeGroupsQuery = useNodeGroups({ page, pageSize, filters });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Partial<NodeGroupFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return {
    ...nodeGroupsQuery,
    page,
    pageSize,
    filters,
    selectedNodeGroup,
    setSelectedNodeGroup,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
  };
};
