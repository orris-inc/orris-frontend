/**
 * useExternalForwardRules Hook
 * External forward rule data management
 * Built with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import {
  listExternalForwardRules,
  createExternalForwardRule,
  updateExternalForwardRule,
  deleteExternalForwardRule,
  enableExternalForwardRule,
  disableExternalForwardRule,
} from '@/api/externalforward/client';
import type {
  ExternalForwardRule,
  CreateExternalForwardRuleRequest,
  UpdateExternalForwardRuleRequest,
  ListExternalForwardRulesParams,
  ExternalForwardStatus,
} from '@/api/externalforward/types';

// Export types for external use
export type { ExternalForwardRule, CreateExternalForwardRuleRequest, UpdateExternalForwardRuleRequest };

// Cache time: 2 minutes
const STALE_TIME = 2 * 60 * 1000;

// Query Keys for External Forward Rules
const externalForwardRulesQueryKeys = {
  all: ['externalForwardRules'] as const,
  lists: () => [...externalForwardRulesQueryKeys.all, 'list'] as const,
  list: (subscriptionId: string, params: object) =>
    [...externalForwardRulesQueryKeys.lists(), subscriptionId, params] as const,
  detail: (subscriptionId: string, ruleId: string) =>
    [...externalForwardRulesQueryKeys.all, 'detail', subscriptionId, ruleId] as const,
};

export interface ExternalForwardRuleFilters {
  status?: ExternalForwardStatus;
}

interface UseExternalForwardRulesOptions {
  subscriptionId: string;
  page?: number;
  pageSize?: number;
  filters?: ExternalForwardRuleFilters;
  enabled?: boolean;
}

/**
 * External forward rule list query and operations
 */
export const useExternalForwardRules = (options: UseExternalForwardRulesOptions) => {
  const { subscriptionId, page = 1, pageSize = 20, filters = {}, enabled = true } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Build query params
  const params: ListExternalForwardRulesParams = {
    page,
    pageSize,
    status: filters.status,
  };

  // Query external forward rule list
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: externalForwardRulesQueryKeys.list(subscriptionId, params),
    queryFn: () => listExternalForwardRules(subscriptionId, params),
    enabled: enabled && !!subscriptionId,
    staleTime: STALE_TIME,
  });

  // Create external forward rule
  const createMutation = useMutation({
    mutationFn: (request: CreateExternalForwardRuleRequest) =>
      createExternalForwardRule(subscriptionId, request),
    onSuccess: () => {
      showSuccess('外部规则创建成功');
      queryClient.invalidateQueries({
        queryKey: externalForwardRulesQueryKeys.lists(),
      });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Update external forward rule
  const updateMutation = useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; data: UpdateExternalForwardRuleRequest }) =>
      updateExternalForwardRule(subscriptionId, ruleId, data),
    onSuccess: () => {
      showSuccess('外部规则更新成功');
      queryClient.invalidateQueries({
        queryKey: externalForwardRulesQueryKeys.lists(),
      });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Delete external forward rule
  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) => deleteExternalForwardRule(subscriptionId, ruleId),
    onSuccess: () => {
      showSuccess('外部规则删除成功');
      queryClient.invalidateQueries({
        queryKey: externalForwardRulesQueryKeys.lists(),
      });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Enable external forward rule
  const enableMutation = useMutation({
    mutationFn: (ruleId: string) => enableExternalForwardRule(subscriptionId, ruleId),
    onSuccess: () => {
      showSuccess('外部规则已启用');
      queryClient.invalidateQueries({
        queryKey: externalForwardRulesQueryKeys.lists(),
      });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Disable external forward rule
  const disableMutation = useMutation({
    mutationFn: (ruleId: string) => disableExternalForwardRule(subscriptionId, ruleId),
    onSuccess: () => {
      showSuccess('外部规则已禁用');
      queryClient.invalidateQueries({
        queryKey: externalForwardRulesQueryKeys.lists(),
      });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    // Data
    rules: data?.items ?? [],
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
    createRule: (request: CreateExternalForwardRuleRequest) =>
      createMutation.mutateAsync(request),
    updateRule: (ruleId: string, request: UpdateExternalForwardRuleRequest) =>
      updateMutation.mutateAsync({ ruleId, data: request }),
    deleteRule: (ruleId: string) => deleteMutation.mutateAsync(ruleId),
    enableRule: (ruleId: string) => enableMutation.mutateAsync(ruleId),
    disableRule: (ruleId: string) => disableMutation.mutateAsync(ruleId),

    // Mutation state
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isEnabling: enableMutation.isPending,
    isDisabling: disableMutation.isPending,
  };
};

/**
 * External forward rules section state management hook
 * Combines rules data for the section component
 */
export const useExternalForwardRulesSection = (subscriptionId: string) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<ExternalForwardRuleFilters>({});
  const [selectedRule, setSelectedRule] = useState<ExternalForwardRule | null>(null);

  const rulesQuery = useExternalForwardRules({
    subscriptionId,
    page,
    pageSize,
    filters,
    enabled: !!subscriptionId,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Partial<ExternalForwardRuleFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return {
    ...rulesQuery,
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
