/**
 * useNodes Hook
 * 基于 TanStack Query 实现
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '@/shared/lib/query-client';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import {
  listNodes,
  getNode,
  createNode,
  updateNode,
  deleteNode,
  updateNodeStatus,
  generateNodeToken,
} from '@/api/node';
import type {
  Node,
  NodeStatus,
  ListNodesParams,
  CreateNodeRequest,
  UpdateNodeRequest,
  GenerateNodeTokenResponse,
} from '@/api/node';

// 前端使用的筛选条件类型
interface NodeFilters {
  status?: NodeStatus;
  search?: string;
}

interface UseNodesOptions {
  page?: number;
  pageSize?: number;
  filters?: NodeFilters;
  enabled?: boolean;
}

export const useNodes = (options: UseNodesOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // 构建查询参数
  const params: ListNodesParams = {
    page,
    pageSize,
    status: filters.status,
  };

  // 查询节点列表
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.nodes.list(params),
    queryFn: () => listNodes(params),
    enabled,
  });

  // 创建节点
  const createMutation = useMutation({
    mutationFn: createNode,
    onSuccess: () => {
      showSuccess('节点创建成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.nodes.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 更新节点
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateNodeRequest }) =>
      updateNode(typeof id === 'string' ? parseInt(id, 10) : id, data),
    onSuccess: () => {
      showSuccess('节点信息更新成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.nodes.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 删除节点
  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => deleteNode(typeof id === 'string' ? parseInt(id, 10) : id),
    onSuccess: () => {
      showSuccess('节点删除成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.nodes.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 更新节点状态
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: 'active' | 'inactive' | 'maintenance' }) =>
      updateNodeStatus(typeof id === 'string' ? parseInt(id, 10) : id, { status }),
    onSuccess: (_, { status }) => {
      const statusText = status === 'active' ? '激活' : status === 'inactive' ? '停用' : '维护';
      showSuccess(`节点已${statusText}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.nodes.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 生成 Token
  const tokenMutation = useMutation({
    mutationFn: (id: number | string) => generateNodeToken(typeof id === 'string' ? parseInt(id, 10) : id),
    onSuccess: () => {
      showSuccess('Token 生成成功');
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    // 数据
    nodes: data?.items ?? [],
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
    createNode: (data: CreateNodeRequest) => createMutation.mutateAsync(data),
    updateNode: (id: number | string, data: UpdateNodeRequest) =>
      updateMutation.mutateAsync({ id, data }),
    deleteNode: (id: number | string) => deleteMutation.mutateAsync(id),
    updateNodeStatus: (id: number | string, status: 'active' | 'inactive' | 'maintenance') =>
      statusMutation.mutateAsync({ id, status }),
    generateToken: (id: number | string) => tokenMutation.mutateAsync(id),

    // Mutation 状态
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isChangingStatus: statusMutation.isPending,
    isGeneratingToken: tokenMutation.isPending,
  };
};

// 获取单个节点详情
export const useNode = (id: number | string | null) => {
  const numericId = id !== null ? (typeof id === 'string' ? parseInt(id, 10) : id) : null;
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.nodes.detail(numericId!),
    queryFn: () => getNode(numericId!),
    enabled: !!numericId,
  });

  return {
    node: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

// 节点列表状态管理 hook（用于页面级状态）
export const useNodesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<NodeFilters>({});
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [generatedToken, setGeneratedToken] = useState<GenerateNodeTokenResponse | null>(null);

  const nodesQuery = useNodes({ page, pageSize, filters });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Partial<NodeFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handleGenerateToken = async (id: number | string) => {
    const token = await nodesQuery.generateToken(id);
    setGeneratedToken(token);
    return token;
  };

  return {
    ...nodesQuery,
    page,
    pageSize,
    filters,
    selectedNode,
    generatedToken,
    setSelectedNode,
    setGeneratedToken,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
    handleGenerateToken,
  };
};
