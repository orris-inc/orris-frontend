/**
 * useForwardAgents Hook
 * Implemented using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import { useForwardAgentEvents } from './useForwardAgentEvents';
import {
  listForwardAgents,
  getForwardAgent,
  createForwardAgent,
  updateForwardAgent,
  deleteForwardAgent,
  enableForwardAgent,
  disableForwardAgent,
  regenerateForwardAgentToken,
  getForwardAgentRuntimeStatus,
  getInstallCommand,
  getAgentVersion,
  triggerAgentUpdate,
  batchTriggerAgentUpdate,
  broadcastAPIURLChange,
  notifyAgentAPIURLChange,
  type ForwardAgent,
  type CreateForwardAgentRequest,
  type UpdateForwardAgentRequest,
  type ListForwardAgentsParams,
  type InstallCommandResponse,
  type AgentBatchUpdateRequest,
  type AgentBatchUpdateResponse,
  type BroadcastAPIURLChangedRequest,
  type BroadcastAPIURLChangedResponse,
  type NotifyAgentAPIURLChangedRequest,
  type NotifyAgentAPIURLChangedResponse,
} from '@/api/forward';

// Query Keys
const forwardAgentsQueryKeys = {
  all: ['forwardAgents'] as const,
  lists: () => [...forwardAgentsQueryKeys.all, 'list'] as const,
  list: (params: object) => [...forwardAgentsQueryKeys.lists(), params] as const,
  details: () => [...forwardAgentsQueryKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...forwardAgentsQueryKeys.details(), id] as const,
  runtimeStatus: (id: number | string) => [...forwardAgentsQueryKeys.all, 'runtimeStatus', id] as const,
  version: (id: number | string) => [...forwardAgentsQueryKeys.all, 'version', id] as const,
};

export interface ForwardAgentFilters {
  status?: 'enabled' | 'disabled';
  name?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

interface UseForwardAgentsOptions {
  page?: number;
  pageSize?: number;
  filters?: ForwardAgentFilters;
  enabled?: boolean;
}

export const useForwardAgents = (options: UseForwardAgentsOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  const params: ListForwardAgentsParams = {
    page,
    pageSize,
    name: filters.name,
    status: filters.status,
    orderBy: filters.orderBy,
    order: filters.order,
  };

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: forwardAgentsQueryKeys.list(params),
    queryFn: () => listForwardAgents(params),
    enabled,
  });

  const createMutation = useMutation({
    mutationFn: createForwardAgent,
    onSuccess: () => {
      showSuccess('转发节点创建成功');
      queryClient.invalidateQueries({ queryKey: forwardAgentsQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateForwardAgentRequest }) =>
      updateForwardAgent(id, data),
    onSuccess: () => {
      showSuccess('转发节点信息更新成功');
      queryClient.invalidateQueries({ queryKey: forwardAgentsQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteForwardAgent,
    onSuccess: () => {
      showSuccess('转发节点删除成功');
      queryClient.invalidateQueries({ queryKey: forwardAgentsQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  const enableMutation = useMutation({
    mutationFn: enableForwardAgent,
    onSuccess: () => {
      showSuccess('转发节点已启用');
      queryClient.invalidateQueries({ queryKey: forwardAgentsQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  const disableMutation = useMutation({
    mutationFn: disableForwardAgent,
    onSuccess: () => {
      showSuccess('转发节点已禁用');
      queryClient.invalidateQueries({ queryKey: forwardAgentsQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: regenerateForwardAgentToken,
    onSuccess: () => {
      showSuccess('Token重新生成成功');
      queryClient.invalidateQueries({ queryKey: forwardAgentsQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Batch update agents
  const batchUpdateMutation = useMutation({
    mutationFn: (data: AgentBatchUpdateRequest) => batchTriggerAgentUpdate(data),
    onSuccess: (result) => {
      if (result.succeeded.length > 0) {
        showSuccess(`已触发 ${result.succeeded.length} 个转发节点更新`);
      }
      queryClient.invalidateQueries({ queryKey: forwardAgentsQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
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
    createForwardAgent: (data: CreateForwardAgentRequest) => createMutation.mutateAsync(data),
    updateForwardAgent: (id: number | string, data: UpdateForwardAgentRequest) =>
      updateMutation.mutateAsync({ id, data }),
    deleteForwardAgent: (id: number | string) => deleteMutation.mutateAsync(id),
    enableForwardAgent: (id: number | string) => enableMutation.mutateAsync(id),
    disableForwardAgent: (id: number | string) => disableMutation.mutateAsync(id),
    regenerateToken: (id: number | string) => regenerateTokenMutation.mutateAsync(id),
    batchUpdateAgents: (data: AgentBatchUpdateRequest) => batchUpdateMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isEnabling: enableMutation.isPending,
    isDisabling: disableMutation.isPending,
    isRegeneratingToken: regenerateTokenMutation.isPending,
    isBatchUpdating: batchUpdateMutation.isPending,
  };
};

export const useForwardAgent = (id: number | string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: forwardAgentsQueryKeys.detail(id!),
    queryFn: () => getForwardAgent(id!),
    enabled: !!id,
  });

  return {
    forwardAgent: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

// Get forward agent runtime status
export const useForwardAgentRuntimeStatus = (id: number | string | null) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: forwardAgentsQueryKeys.runtimeStatus(id!),
    queryFn: () => getForwardAgentRuntimeStatus(id!),
    enabled: !!id,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    staleTime: 5000, // Data considered fresh for 5 seconds
  });

  return {
    runtimeStatus: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
    refetch,
  };
};

export const useForwardAgentsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<ForwardAgentFilters>({});
  const [selectedAgent, setSelectedAgent] = useState<ForwardAgent | null>(null);
  const [generatedToken, setGeneratedToken] = useState<{ token: string } | null>(null);
  const [installCommandData, setInstallCommandData] = useState<InstallCommandResponse | null>(null);
  const [isLoadingInstallCommand, setIsLoadingInstallCommand] = useState(false);
  const [batchUpdateResult, setBatchUpdateResult] = useState<AgentBatchUpdateResponse | null>(null);
  const { showError } = useNotificationStore();

  const forwardAgentsQuery = useForwardAgents({ page, pageSize, filters });

  // Subscribe to real-time forward agent events via SSE
  useForwardAgentEvents({ enabled: true });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Partial<ForwardAgentFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handleRegenerateToken = async (id: number | string) => {
    const token = await forwardAgentsQuery.regenerateToken(id);
    setGeneratedToken(token);
    return token;
  };

  const handleGetInstallCommand = async (id: number | string) => {
    setIsLoadingInstallCommand(true);
    try {
      const command = await getInstallCommand(id);
      setInstallCommandData(command);
      return command;
    } catch (error) {
      showError(handleApiError(error));
      return null;
    } finally {
      setIsLoadingInstallCommand(false);
    }
  };

  const handleBatchUpdate = async (data: AgentBatchUpdateRequest) => {
    const result = await forwardAgentsQuery.batchUpdateAgents(data);
    setBatchUpdateResult(result);
    return result;
  };

  return {
    ...forwardAgentsQuery,
    page,
    pageSize,
    filters,
    selectedAgent,
    generatedToken,
    installCommandData,
    isLoadingInstallCommand,
    batchUpdateResult,
    setSelectedAgent,
    setGeneratedToken,
    setInstallCommandData,
    setBatchUpdateResult,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
    handleRegenerateToken,
    handleGetInstallCommand,
    handleBatchUpdate,
  };
};

// Get agent version information
export const useAgentVersion = (id: number | string | null, enabled: boolean = true) => {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: forwardAgentsQueryKeys.version(id!),
    queryFn: () => getAgentVersion(id!),
    enabled: !!id && enabled,
    staleTime: 30000, // Data considered fresh for 30 seconds
  });

  return {
    versionInfo: data ?? null,
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,
    refetch,
  };
};

// Trigger agent update mutation
export const useTriggerAgentUpdate = () => {
  const { showSuccess, showError } = useNotificationStore();

  return useMutation({
    mutationFn: triggerAgentUpdate,
    onSuccess: (data) => {
      showSuccess(`更新命令已发送，目标版本: ${data.targetVersion}`);
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });
};

// Broadcast API URL change to all connected agents
export const useBroadcastAPIURL = () => {
  const { showSuccess, showError } = useNotificationStore();

  return useMutation({
    mutationFn: (data: BroadcastAPIURLChangedRequest) => broadcastAPIURLChange(data),
    onSuccess: (result: BroadcastAPIURLChangedResponse) => {
      if (result.agentsNotified > 0) {
        showSuccess(`已通知 ${result.agentsNotified} 个转发节点更新API地址`);
      }
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });
};

// Notify single agent of API URL change
export const useNotifyAgentAPIURL = () => {
  const { showSuccess, showError } = useNotificationStore();

  return useMutation({
    mutationFn: ({ agentId, data }: { agentId: string; data: NotifyAgentAPIURLChangedRequest }) =>
      notifyAgentAPIURLChange(agentId, data),
    onSuccess: (result: NotifyAgentAPIURLChangedResponse) => {
      if (result.notified) {
        showSuccess('已通知转发节点更新API地址');
      }
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });
};
