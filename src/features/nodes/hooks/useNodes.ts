/**
 * useNodes Hook
 * Based on TanStack Query implementation
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
  getNodeInstallScript,
} from '@/api/node';
import type {
  Node,
  NodeStatus,
  ListNodesParams,
  CreateNodeRequest,
  UpdateNodeRequest,
  GenerateNodeTokenResponse,
  GenerateNodeInstallScriptResponse,
  GetNodeInstallScriptParams,
} from '@/api/node';

// Filter types used by frontend
interface NodeFilters {
  status?: NodeStatus;
  search?: string;
}

interface UseNodesOptions {
  page?: number;
  pageSize?: number;
  filters?: NodeFilters;
  enabled?: boolean;
  /** Include user-created nodes in the list (default: false - only admin-created nodes) */
  includeUserNodes?: boolean;
  /** Field to sort by (default: "sort_order") */
  sortBy?: string;
  /** Sort order: "asc" or "desc" (default: "asc") */
  sortOrder?: 'asc' | 'desc';
}

export const useNodes = (options: UseNodesOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true, includeUserNodes, sortBy, sortOrder } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Build query parameters
  const params: ListNodesParams = {
    page,
    pageSize,
    status: filters.status,
    includeUserNodes,
    sortBy,
    sortOrder,
  };

  // Query node list
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

  // Create node
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

  // Update node
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNodeRequest }) =>
      updateNode(id, data),
    onSuccess: () => {
      showSuccess('节点信息更新成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.nodes.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Delete node
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNode(id),
    onSuccess: () => {
      showSuccess('节点删除成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.nodes.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Update node status
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' | 'maintenance' }) =>
      updateNodeStatus(id, { status }),
    onSuccess: (_, { status }) => {
      const statusText = status === 'active' ? '激活' : status === 'inactive' ? '停用' : '维护';
      showSuccess(`节点已${statusText}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.nodes.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Generate Token
  const tokenMutation = useMutation({
    mutationFn: (id: string) => generateNodeToken(id),
    onSuccess: () => {
      showSuccess('Token 生成成功');
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Get installation script
  const installScriptMutation = useMutation({
    mutationFn: ({ id, params }: { id: string; params?: GetNodeInstallScriptParams }) =>
      getNodeInstallScript(id, params),
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    // Data
    nodes: data?.items ?? [],
    pagination: {
      page: data?.page ?? page,
      pageSize: data?.pageSize ?? pageSize,
      total: data?.total ?? 0,
      totalPages: data?.totalPages ?? 0,
    },

    // Status
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,

    // Operations
    refetch,
    createNode: (data: CreateNodeRequest) => createMutation.mutateAsync(data),
    updateNode: (id: string, data: UpdateNodeRequest) =>
      updateMutation.mutateAsync({ id, data }),
    deleteNode: (id: string) => deleteMutation.mutateAsync(id),
    updateNodeStatus: (id: string, status: 'active' | 'inactive' | 'maintenance') =>
      statusMutation.mutateAsync({ id, status }),
    generateToken: (id: string) => tokenMutation.mutateAsync(id),
    getInstallScript: (id: string, params?: GetNodeInstallScriptParams) =>
      installScriptMutation.mutateAsync({ id, params }),

    // Mutation status
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isChangingStatus: statusMutation.isPending,
    isGeneratingToken: tokenMutation.isPending,
    isGettingInstallScript: installScriptMutation.isPending,
  };
};

// Get single node details
export const useNode = (id: string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.nodes.detail(id!),
    queryFn: () => getNode(id!),
    enabled: !!id,
  });

  return {
    node: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

// Node list state management hook (for page-level state)
export const useNodesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<NodeFilters>({});
  const [includeUserNodes, setIncludeUserNodes] = useState(false);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [generatedToken, setGeneratedToken] = useState<GenerateNodeTokenResponse | null>(null);
  const [installScriptData, setInstallScriptData] = useState<GenerateNodeInstallScriptResponse | null>(null);

  const nodesQuery = useNodes({ page, pageSize, filters, includeUserNodes, sortBy, sortOrder });

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

  const handleGenerateToken = async (id: string) => {
    const token = await nodesQuery.generateToken(id);
    setGeneratedToken(token);
    return token;
  };

  const handleGetInstallScript = async (id: string, params?: GetNodeInstallScriptParams) => {
    const data = await nodesQuery.getInstallScript(id, params);
    setInstallScriptData(data);
    return data;
  };

  const handleIncludeUserNodesChange = (include: boolean) => {
    setIncludeUserNodes(include);
    setPage(1);
  };

  const handleSortChange = (newSortBy: string | undefined, newSortOrder: 'asc' | 'desc' | undefined) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  };

  return {
    ...nodesQuery,
    page,
    pageSize,
    filters,
    includeUserNodes,
    sortBy,
    sortOrder,
    selectedNode,
    generatedToken,
    installScriptData,
    setSelectedNode,
    setGeneratedToken,
    setInstallScriptData,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
    handleIncludeUserNodesChange,
    handleSortChange,
    handleGenerateToken,
    handleGetInstallScript,
  };
};
