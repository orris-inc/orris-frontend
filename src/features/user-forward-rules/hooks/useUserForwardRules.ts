/**
 * useUserForwardRules Hook
 * User-side forward rule data management
 * Built with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import {
  listUserForwardRules,
  getUserForwardRule,
  createUserForwardRule,
  updateUserForwardRule,
  deleteUserForwardRule,
  enableUserForwardRule,
  disableUserForwardRule,
  getUserForwardUsage,
  listUserForwardAgents,
  type ForwardRule,
  type CreateForwardRuleRequest,
  type UpdateForwardRuleRequest,
  type ListForwardRulesParams,
  type UserForwardAgent,
} from '@/api/forward';
import type { UserForwardUsage } from '@/api/forward';

// Export types for external use
export type { UserForwardUsage };

// Query Keys for User Forward Rules
const userForwardRulesQueryKeys = {
  all: ['userForwardRules'] as const,
  lists: () => [...userForwardRulesQueryKeys.all, 'list'] as const,
  list: (params: object) => [...userForwardRulesQueryKeys.lists(), params] as const,
  usage: () => [...userForwardRulesQueryKeys.all, 'usage'] as const,
  detail: (id: string) => [...userForwardRulesQueryKeys.all, 'detail', id] as const,
  agents: () => [...userForwardRulesQueryKeys.all, 'agents'] as const,
};

export interface UserForwardRuleFilters {
  name?: string;
  protocol?: 'tcp' | 'udp' | 'both';
  status?: 'enabled' | 'disabled';
}

interface UseUserForwardRulesOptions {
  page?: number;
  pageSize?: number;
  filters?: UserForwardRuleFilters;
  enabled?: boolean;
}

/**
 * User forward rule list query and operations
 */
export const useUserForwardRules = (options: UseUserForwardRulesOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Build query params
  const params: ListForwardRulesParams = {
    page,
    pageSize,
    name: filters.name,
    protocol: filters.protocol,
    status: filters.status,
  };

  // Query forward rule list
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: userForwardRulesQueryKeys.list(params),
    queryFn: () => listUserForwardRules(params),
    enabled,
  });

  // Create forward rule
  const createMutation = useMutation({
    mutationFn: createUserForwardRule,
    onSuccess: () => {
      showSuccess('转发规则创建成功');
      queryClient.invalidateQueries({ queryKey: userForwardRulesQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userForwardRulesQueryKeys.usage() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Update forward rule
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateForwardRuleRequest }) =>
      updateUserForwardRule(id, data),
    onSuccess: () => {
      showSuccess('转发规则更新成功');
      queryClient.invalidateQueries({ queryKey: userForwardRulesQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Delete forward rule
  const deleteMutation = useMutation({
    mutationFn: deleteUserForwardRule,
    onSuccess: () => {
      showSuccess('转发规则删除成功');
      queryClient.invalidateQueries({ queryKey: userForwardRulesQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userForwardRulesQueryKeys.usage() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Enable forward rule
  const enableMutation = useMutation({
    mutationFn: enableUserForwardRule,
    onSuccess: () => {
      showSuccess('转发规则已启用');
      queryClient.invalidateQueries({ queryKey: userForwardRulesQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Disable forward rule
  const disableMutation = useMutation({
    mutationFn: disableUserForwardRule,
    onSuccess: () => {
      showSuccess('转发规则已禁用');
      queryClient.invalidateQueries({ queryKey: userForwardRulesQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    // Data
    forwardRules: data?.items ?? [],
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

    // Actions
    refetch,
    createForwardRule: (data: CreateForwardRuleRequest) => createMutation.mutateAsync(data),
    updateForwardRule: (id: string, data: UpdateForwardRuleRequest) =>
      updateMutation.mutateAsync({ id, data }),
    deleteForwardRule: (id: string) => deleteMutation.mutateAsync(id),
    enableForwardRule: (id: string) => enableMutation.mutateAsync(id),
    disableForwardRule: (id: string) => disableMutation.mutateAsync(id),

    // Mutation state
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isEnabling: enableMutation.isPending,
    isDisabling: disableMutation.isPending,
  };
};

/**
 * Get single forward rule details
 */
export const useUserForwardRule = (id: string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: userForwardRulesQueryKeys.detail(id!),
    queryFn: () => getUserForwardRule(id!),
    enabled: !!id,
  });

  return {
    forwardRule: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

/**
 * Get user forward rule quota and usage
 */
export const useUserForwardUsage = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: userForwardRulesQueryKeys.usage(),
    queryFn: getUserForwardUsage,
  });

  return {
    usage: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
    refetch,
  };
};

/**
 * User forward rules page state management hook
 */
export const useUserForwardRulesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<UserForwardRuleFilters>({});
  const [selectedRule, setSelectedRule] = useState<ForwardRule | null>(null);

  const rulesQuery = useUserForwardRules({ page, pageSize, filters });
  const usageQuery = useUserForwardUsage();

  // Query all available agents to build agentsMap for rule display
  const agentsQuery = useQuery({
    queryKey: userForwardRulesQueryKeys.agents(),
    queryFn: () => listUserForwardAgents({ page: 1, pageSize: 1000 }),
  });

  // Build agentsMap from agents list
  const agentsMap = useMemo<Record<string, UserForwardAgent>>(() => {
    const agents = agentsQuery.data?.items ?? [];
    return agents.reduce((acc, agent) => {
      acc[agent.id] = agent;
      return acc;
    }, {} as Record<string, UserForwardAgent>);
  }, [agentsQuery.data?.items]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Partial<UserForwardRuleFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return {
    ...rulesQuery,
    usage: usageQuery.usage,
    isUsageLoading: usageQuery.isLoading,
    agentsMap,
    isAgentsLoading: agentsQuery.isLoading,
    page,
    pageSize,
    filters,
    selectedRule,
    setSelectedRule,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
  };
};
