/**
 * useNodes Hook
 * Based on TanStack Query implementation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { queryKeys } from '@/shared/lib/query-client';
import { useNodeEvents } from './useNodeEvents';
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
  getBatchInstallScript,
  batchTriggerNodeUpdate,
  broadcastNodeAPIURLChange,
  notifyNodeAPIURLChange,
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
  BatchInstallScriptRequest,
  BatchInstallScriptResponse,
  BatchUpdateRequest,
  BatchUpdateResponse,
  BroadcastNodeAPIURLChangedRequest,
  BroadcastNodeAPIURLChangedResponse,
  NotifyNodeAPIURLChangedRequest,
  NotifyNodeAPIURLChangedResponse,
} from '@/api/node';

// Filter types used by frontend
interface NodeFilters {
  status?: NodeStatus;
  search?: string;
}

// Extended filter types for UI (includes local filtering options)
export interface NodeFiltersExtended {
  status?: NodeStatus;
  protocol?: Node['protocol'];
  isOnline?: boolean;
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
  const { t } = useTranslation();

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
      showSuccess(t('messages.nodeCreateSuccess'));
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
      showSuccess(t('messages.nodeUpdateSuccess'));
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
      showSuccess(t('messages.nodeDeleteSuccess'));
      queryClient.invalidateQueries({ queryKey: queryKeys.nodes.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Update node status with optimistic update
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' | 'maintenance' }) =>
      updateNodeStatus(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.nodes.lists() });
      const previousData = queryClient.getQueryData(queryKeys.nodes.list(params));
      queryClient.setQueryData(
        queryKeys.nodes.list(params),
        (old: { items: Node[]; page: number; pageSize: number; total: number; totalPages: number } | undefined) => {
          if (!old) return old;
          const updatedItems = old.items.map((node) =>
            node.id === id ? { ...node, status } : node
          );
          return { ...old, items: updatedItems };
        }
      );
      return { previousData };
    },
    onSuccess: (_, { status }) => {
      const statusMessages: Record<string, string> = {
        active: t('messages.nodeActivated'),
        inactive: t('messages.nodeDeactivated'),
        maintenance: t('messages.nodeMaintenance'),
      };
      showSuccess(statusMessages[status]);
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.nodes.list(params), context.previousData);
      }
      showError(handleApiError(error));
    },
  });

  // Generate Token
  const tokenMutation = useMutation({
    mutationFn: (id: string) => generateNodeToken(id),
    onSuccess: () => {
      showSuccess(t('messages.nodeTokenGenerated'));
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

  // Get batch installation script
  const batchInstallScriptMutation = useMutation({
    mutationFn: (data: BatchInstallScriptRequest) => getBatchInstallScript(data),
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Batch update nodes
  const batchUpdateMutation = useMutation({
    mutationFn: (data: BatchUpdateRequest) => batchTriggerNodeUpdate(data),
    onSuccess: (result) => {
      if (result.succeeded.length > 0) {
        showSuccess(t('messages.batchUpdateTriggered', { count: result.succeeded.length, entity: t('monitor.events.nodeAgent') }));
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.nodes.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Toggle mute notification with optimistic update
  const toggleMuteMutation = useMutation({
    mutationFn: ({ id, muteNotification }: { id: string; muteNotification: boolean }) =>
      updateNode(id, { muteNotification }),
    onMutate: async ({ id, muteNotification }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.nodes.lists() });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKeys.nodes.list(params));

      // Optimistically update the cache
      queryClient.setQueryData(
        queryKeys.nodes.list(params),
        (old: { items: Node[]; page: number; pageSize: number; total: number; totalPages: number } | undefined) => {
          if (!old) return old;
          const updatedItems = old.items.map((node) => {
            if (node.id === id) {
              return { ...node, muteNotification };
            }
            return node;
          });
          return { ...old, items: updatedItems };
        }
      );

      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.nodes.list(params), context.previousData);
      }
      showError(handleApiError(error));
    },
    // No need to refetch on success since we already updated optimistically
  });

  // Reorder nodes (update sortOrder for multiple nodes) with optimistic update
  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; sortOrder: number }[]) => {
      // Update all nodes in parallel
      await Promise.all(
        updates.map(({ id, sortOrder }) => updateNode(id, { sortOrder }))
      );
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.nodes.lists() });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKeys.nodes.list(params));

      // Optimistically update the cache
      queryClient.setQueryData(
        queryKeys.nodes.list(params),
        (old: { items: Node[]; page: number; pageSize: number; total: number; totalPages: number } | undefined) => {
          if (!old) return old;
          const updatedItems = old.items.map((node) => {
            const update = updates.find((u) => u.id === node.id);
            if (update) {
              return { ...node, sortOrder: update.sortOrder };
            }
            return node;
          });
          // Sort by new sortOrder
          updatedItems.sort((a, b) => a.sortOrder - b.sortOrder);
          return { ...old, items: updatedItems };
        }
      );

      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.nodes.list(params), context.previousData);
      }
      showError(handleApiError(error));
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.nodes.lists() });
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
    getBatchInstallScript: (data: BatchInstallScriptRequest) =>
      batchInstallScriptMutation.mutateAsync(data),
    batchUpdateNodes: (data: BatchUpdateRequest) => batchUpdateMutation.mutateAsync(data),
    reorderNodes: (updates: { id: string; sortOrder: number }[]) =>
      reorderMutation.mutateAsync(updates),
    toggleMuteNotification: (id: string, muteNotification: boolean) =>
      toggleMuteMutation.mutate({ id, muteNotification }),

    // Mutation status
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isChangingStatus: statusMutation.isPending,
    isGeneratingToken: tokenMutation.isPending,
    isGettingInstallScript: installScriptMutation.isPending,
    isGettingBatchInstallScript: batchInstallScriptMutation.isPending,
    isBatchUpdating: batchUpdateMutation.isPending,
    isReordering: reorderMutation.isPending,
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
  const [extendedFilters, setExtendedFilters] = useState<NodeFiltersExtended>({});
  const [includeUserNodes, setIncludeUserNodes] = useState(false);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [generatedToken, setGeneratedToken] = useState<GenerateNodeTokenResponse | null>(null);
  const [installScriptData, setInstallScriptData] = useState<GenerateNodeInstallScriptResponse | null>(null);
  const [batchInstallScriptData, setBatchInstallScriptData] = useState<BatchInstallScriptResponse | null>(null);
  const [batchUpdateResult, setBatchUpdateResult] = useState<BatchUpdateResponse | null>(null);

  const nodesQuery = useNodes({ page, pageSize, filters, includeUserNodes, sortBy, sortOrder });

  // Subscribe to real-time node events via SSE
  useNodeEvents({ enabled: true });

  // Check if any extended filters are active
  const hasFilters = Boolean(
    extendedFilters.status || extendedFilters.protocol || extendedFilters.isOnline !== undefined
  );

  // Apply local filtering for extended filters
  const filteredNodes = nodesQuery.nodes.filter((node) => {
    // Status filter
    if (extendedFilters.status && node.status !== extendedFilters.status) {
      return false;
    }
    // Protocol filter
    if (extendedFilters.protocol && node.protocol !== extendedFilters.protocol) {
      return false;
    }
    // Online status filter
    if (extendedFilters.isOnline !== undefined && node.isOnline !== extendedFilters.isOnline) {
      return false;
    }
    return true;
  });

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

  const handleExtendedFiltersChange = (newFilters: Partial<NodeFiltersExtended>) => {
    setExtendedFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setExtendedFilters({});
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

  const handleGetBatchInstallScript = async (nodeIds: string[]) => {
    const data = await nodesQuery.getBatchInstallScript({ nodeIds });
    setBatchInstallScriptData(data);
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

  const handleBatchUpdate = async (data: BatchUpdateRequest) => {
    const result = await nodesQuery.batchUpdateNodes(data);
    setBatchUpdateResult(result);
    return result;
  };

  const handleReorder = async (updates: { id: string; sortOrder: number }[]) => {
    await nodesQuery.reorderNodes(updates);
  };

  return {
    ...nodesQuery,
    // Override nodes with filtered results
    nodes: filteredNodes,
    page,
    pageSize,
    filters,
    extendedFilters,
    hasFilters,
    includeUserNodes,
    sortBy,
    sortOrder,
    selectedNode,
    generatedToken,
    installScriptData,
    batchInstallScriptData,
    batchUpdateResult,
    setSelectedNode,
    setGeneratedToken,
    setInstallScriptData,
    setBatchInstallScriptData,
    setBatchUpdateResult,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
    handleExtendedFiltersChange,
    clearFilters,
    handleIncludeUserNodesChange,
    handleSortChange,
    handleGenerateToken,
    handleGetInstallScript,
    handleGetBatchInstallScript,
    handleBatchUpdate,
    handleReorder,
  };
};

// Broadcast API URL change to all connected nodes
export const useBroadcastNodeAPIURL = () => {
  const { showSuccess, showError } = useNotificationStore();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: BroadcastNodeAPIURLChangedRequest) => broadcastNodeAPIURLChange(data),
    onSuccess: (result: BroadcastNodeAPIURLChangedResponse) => {
      if (result.nodesNotified > 0) {
        showSuccess(t('messages.apiURLBroadcasted', { count: result.nodesNotified, entity: t('monitor.events.nodeAgent') }));
      }
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });
};

// Notify a single node of API URL change
export const useNotifyNodeAPIURL = () => {
  const { showSuccess, showError } = useNotificationStore();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ nodeId, data }: { nodeId: string; data: NotifyNodeAPIURLChangedRequest }) =>
      notifyNodeAPIURLChange(nodeId, data),
    onSuccess: (result: NotifyNodeAPIURLChangedResponse) => {
      if (result.notified) {
        showSuccess(t('messages.apiURLNotified', { entity: t('monitor.events.nodeAgent') }));
      } else {
        showError(t('messages.entityNotOnline', { entity: t('monitor.events.nodeAgent') }));
      }
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });
};
