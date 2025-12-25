/**
 * useForwardAgents Hook
 * Implemented using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
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
  type ForwardAgent,
  type CreateForwardAgentRequest,
  type UpdateForwardAgentRequest,
  type ListForwardAgentsParams,
  type InstallCommandResponse,
} from '@/api/forward';

// Query Keys
const forwardAgentsQueryKeys = {
  all: ['forwardAgents'] as const,
  lists: () => [...forwardAgentsQueryKeys.all, 'list'] as const,
  list: (params: object) => [...forwardAgentsQueryKeys.lists(), params] as const,
  details: () => [...forwardAgentsQueryKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...forwardAgentsQueryKeys.details(), id] as const,
  runtimeStatus: (id: number | string) => [...forwardAgentsQueryKeys.all, 'runtimeStatus', id] as const,
};

export interface ForwardAgentFilters {
  status?: 'enabled' | 'disabled';
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
    status: filters.status,
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
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isEnabling: enableMutation.isPending,
    isDisabling: disableMutation.isPending,
    isRegeneratingToken: regenerateTokenMutation.isPending,
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
  const { showError } = useNotificationStore();

  const forwardAgentsQuery = useForwardAgents({ page, pageSize, filters });

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

  return {
    ...forwardAgentsQuery,
    page,
    pageSize,
    filters,
    selectedAgent,
    generatedToken,
    installCommandData,
    isLoadingInstallCommand,
    setSelectedAgent,
    setGeneratedToken,
    setInstallCommandData,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
    handleRegenerateToken,
    handleGetInstallCommand,
  };
};

