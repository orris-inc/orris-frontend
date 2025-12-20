/**
 * useUserNodes Hook
 * User node data management
 * Based on TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import {
  listUserNodes,
  getUserNode,
  createUserNode,
  updateUserNode,
  deleteUserNode,
  regenerateUserNodeToken,
  getUserNodeUsage,
  getUserNodeInstallScript,
  type UserNode,
  type CreateUserNodeRequest,
  type CreateUserNodeResponse,
  type UpdateUserNodeRequest,
  type ListUserNodesParams,
  type RegenerateUserNodeTokenResponse,
  type UserNodeUsage,
  type UserNodeInstallScriptResponse,
  type GetUserNodeInstallScriptParams,
} from '@/api/node';

// Export types for external use
export type {
  UserNode,
  CreateUserNodeResponse,
  RegenerateUserNodeTokenResponse,
  UserNodeUsage,
  UserNodeInstallScriptResponse,
};

// Query Keys for User Nodes
const userNodesQueryKeys = {
  all: ['userNodes'] as const,
  lists: () => [...userNodesQueryKeys.all, 'list'] as const,
  list: (params: object) => [...userNodesQueryKeys.lists(), params] as const,
  detail: (id: string) => [...userNodesQueryKeys.all, 'detail', id] as const,
  usage: () => [...userNodesQueryKeys.all, 'usage'] as const,
  installScript: (id: string, params?: object) =>
    [...userNodesQueryKeys.all, 'installScript', id, params] as const,
};

export interface UserNodeFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

interface UseUserNodesOptions {
  page?: number;
  pageSize?: number;
  filters?: UserNodeFilters;
  enabled?: boolean;
}

/**
 * User nodes list query and operations
 */
export const useUserNodes = (options: UseUserNodesOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Build query params
  const params: ListUserNodesParams = {
    page,
    pageSize,
    search: filters.search,
    status: filters.status,
  };

  // Query user nodes list
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: userNodesQueryKeys.list(params),
    queryFn: () => listUserNodes(params),
    enabled,
  });

  // Create user node
  const createMutation = useMutation({
    mutationFn: createUserNode,
    onSuccess: () => {
      showSuccess('节点创建成功');
      queryClient.invalidateQueries({ queryKey: userNodesQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Update user node
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserNodeRequest }) =>
      updateUserNode(id, data),
    onSuccess: () => {
      showSuccess('节点更新成功');
      queryClient.invalidateQueries({ queryKey: userNodesQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Delete user node
  const deleteMutation = useMutation({
    mutationFn: deleteUserNode,
    onSuccess: () => {
      showSuccess('节点删除成功');
      queryClient.invalidateQueries({ queryKey: userNodesQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Regenerate token
  const regenerateTokenMutation = useMutation({
    mutationFn: regenerateUserNodeToken,
    onSuccess: () => {
      showSuccess('Token 已重新生成');
    },
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

    // State
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,

    // Operations
    refetch,
    createNode: (data: CreateUserNodeRequest) => createMutation.mutateAsync(data),
    updateNode: (id: string, data: UpdateUserNodeRequest) =>
      updateMutation.mutateAsync({ id, data }),
    deleteNode: (id: string) => deleteMutation.mutateAsync(id),
    regenerateToken: (id: string) => regenerateTokenMutation.mutateAsync(id),

    // Mutation state
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRegeneratingToken: regenerateTokenMutation.isPending,
  };
};

/**
 * Get single user node detail
 */
export const useUserNode = (id: string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: userNodesQueryKeys.detail(id!),
    queryFn: () => getUserNode(id!),
    enabled: !!id,
  });

  return {
    node: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

/**
 * User nodes page state management hook
 */
export const useUserNodesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<UserNodeFilters>({});
  const [selectedNode, setSelectedNode] = useState<UserNode | null>(null);

  const nodesQuery = useUserNodes({ page, pageSize, filters });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Partial<UserNodeFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return {
    ...nodesQuery,
    page,
    pageSize,
    filters,
    selectedNode,
    setSelectedNode,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
  };
};

/**
 * User node usage/quota query
 * GET /user/nodes/usage
 */
export const useUserNodeUsage = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: userNodesQueryKeys.usage(),
    queryFn: getUserNodeUsage,
  });

  return {
    usage: data ?? null,
    nodeCount: data?.nodeCount ?? 0,
    nodeLimit: data?.nodeLimit ?? 0,
    isLoading,
    error: error ? handleApiError(error) : null,
    refetch,
  };
};

/**
 * User node install script query
 * GET /user/nodes/:id/install-script
 */
export const useUserNodeInstallScript = (
  id: string | null,
  params?: GetUserNodeInstallScriptParams
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: userNodesQueryKeys.installScript(id!, params),
    queryFn: () => getUserNodeInstallScript(id!, params),
    enabled: !!id,
  });

  return {
    installScript: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
    refetch,
  };
};
