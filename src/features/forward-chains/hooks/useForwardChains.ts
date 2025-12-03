/**
 * useForwardChains Hook
 * 基于 TanStack Query 实现
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import {
  listForwardChains,
  getForwardChain,
  createForwardChain,
  deleteForwardChain,
  enableForwardChain,
  disableForwardChain,
  type ForwardChain,
  type CreateForwardChainRequest,
  type ListForwardChainsParams,
} from '@/api/forward';

const forwardChainsQueryKeys = {
  all: ['forwardChains'] as const,
  lists: () => [...forwardChainsQueryKeys.all, 'list'] as const,
  list: (params: object) => [...forwardChainsQueryKeys.lists(), params] as const,
  details: () => [...forwardChainsQueryKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...forwardChainsQueryKeys.details(), id] as const,
};

export interface ForwardChainFilters {
  status?: 'enabled' | 'disabled';
}

interface UseForwardChainsOptions {
  page?: number;
  pageSize?: number;
  filters?: ForwardChainFilters;
  enabled?: boolean;
}

export const useForwardChains = (options: UseForwardChainsOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  const params: ListForwardChainsParams = {
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
    queryKey: forwardChainsQueryKeys.list(params),
    queryFn: () => listForwardChains(params),
    enabled,
  });

  const createMutation = useMutation({
    mutationFn: createForwardChain,
    onSuccess: () => {
      showSuccess('转发链创建成功');
      queryClient.invalidateQueries({ queryKey: forwardChainsQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteForwardChain,
    onSuccess: () => {
      showSuccess('转发链删除成功');
      queryClient.invalidateQueries({ queryKey: forwardChainsQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  const enableMutation = useMutation({
    mutationFn: enableForwardChain,
    onSuccess: () => {
      showSuccess('转发链已启用');
      queryClient.invalidateQueries({ queryKey: forwardChainsQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  const disableMutation = useMutation({
    mutationFn: disableForwardChain,
    onSuccess: () => {
      showSuccess('转发链已禁用');
      queryClient.invalidateQueries({ queryKey: forwardChainsQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    forwardChains: data?.items ?? [],
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
    createForwardChain: (data: CreateForwardChainRequest) => createMutation.mutateAsync(data),
    deleteForwardChain: (id: number | string) => deleteMutation.mutateAsync(id),
    enableForwardChain: (id: number | string) => enableMutation.mutateAsync(id),
    disableForwardChain: (id: number | string) => disableMutation.mutateAsync(id),
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isEnabling: enableMutation.isPending,
    isDisabling: disableMutation.isPending,
  };
};

export const useForwardChain = (id: number | string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: forwardChainsQueryKeys.detail(id!),
    queryFn: () => getForwardChain(id!),
    enabled: !!id,
  });

  return {
    forwardChain: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

export const useForwardChainsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<ForwardChainFilters>({});
  const [selectedChain, setSelectedChain] = useState<ForwardChain | null>(null);

  const chainsQuery = useForwardChains({ page, pageSize, filters });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Partial<ForwardChainFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return {
    ...chainsQuery,
    page,
    pageSize,
    filters,
    selectedChain,
    setSelectedChain,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
  };
};
