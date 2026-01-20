/**
 * useAdminExternalForwardRules Hook
 * Admin external forward rule data management
 * Built with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import {
  listAdminExternalForwardRules,
  createAdminExternalForwardRule,
  updateAdminExternalForwardRule,
  deleteAdminExternalForwardRule,
  enableAdminExternalForwardRule,
  disableAdminExternalForwardRule,
} from '@/api/admin/client';
import type {
  AdminExternalForwardRule,
  AdminListExternalForwardRulesParams,
  AdminCreateExternalForwardRuleRequest,
  AdminUpdateExternalForwardRuleRequest,
  AdminExternalForwardStatus,
} from '@/api/admin/types';

// Export types for external use
export type { AdminExternalForwardRule, AdminCreateExternalForwardRuleRequest, AdminUpdateExternalForwardRuleRequest };

// Cache time: 2 minutes
const STALE_TIME = 2 * 60 * 1000;

// Query Keys for Admin External Forward Rules
const adminExternalForwardRulesQueryKeys = {
  all: ['adminExternalForwardRules'] as const,
  lists: () => [...adminExternalForwardRulesQueryKeys.all, 'list'] as const,
  list: (params: object) => [...adminExternalForwardRulesQueryKeys.lists(), params] as const,
  detail: (ruleId: string) =>
    [...adminExternalForwardRulesQueryKeys.all, 'detail', ruleId] as const,
};

export interface AdminExternalForwardRuleFilters {
  status?: AdminExternalForwardStatus;
  externalSource?: string;
  subscriptionId?: number;
  userId?: number;
}

interface UseAdminExternalForwardRulesOptions {
  page?: number;
  pageSize?: number;
  filters?: AdminExternalForwardRuleFilters;
  orderBy?: AdminListExternalForwardRulesParams['orderBy'];
  order?: AdminListExternalForwardRulesParams['order'];
  enabled?: boolean;
}

/**
 * Admin external forward rule list query and operations
 */
export const useAdminExternalForwardRules = (options: UseAdminExternalForwardRulesOptions = {}) => {
  const {
    page = 1,
    pageSize = 20,
    filters = {},
    orderBy = 'created_at',
    order = 'DESC',
    enabled = true,
  } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Build query params
  const params: AdminListExternalForwardRulesParams = {
    page,
    pageSize,
    status: filters.status,
    externalSource: filters.externalSource,
    subscriptionId: filters.subscriptionId,
    userId: filters.userId,
    orderBy,
    order,
  };

  // Query admin external forward rule list
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: adminExternalForwardRulesQueryKeys.list(params),
    queryFn: () => listAdminExternalForwardRules(params),
    enabled,
    staleTime: STALE_TIME,
  });

  // Create external forward rule
  const createMutation = useMutation({
    mutationFn: (data: AdminCreateExternalForwardRuleRequest) =>
      createAdminExternalForwardRule(data),
    onSuccess: () => {
      showSuccess('外部规则创建成功');
      queryClient.invalidateQueries({
        queryKey: adminExternalForwardRulesQueryKeys.lists(),
      });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Update external forward rule
  const updateMutation = useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; data: AdminUpdateExternalForwardRuleRequest }) =>
      updateAdminExternalForwardRule(ruleId, data),
    onSuccess: () => {
      showSuccess('外部规则更新成功');
      queryClient.invalidateQueries({
        queryKey: adminExternalForwardRulesQueryKeys.lists(),
      });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Delete external forward rule
  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) => deleteAdminExternalForwardRule(ruleId),
    onSuccess: () => {
      showSuccess('外部规则删除成功');
      queryClient.invalidateQueries({
        queryKey: adminExternalForwardRulesQueryKeys.lists(),
      });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Enable external forward rule
  const enableMutation = useMutation({
    mutationFn: (ruleId: string) => enableAdminExternalForwardRule(ruleId),
    onSuccess: () => {
      showSuccess('外部规则已启用');
      queryClient.invalidateQueries({
        queryKey: adminExternalForwardRulesQueryKeys.lists(),
      });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Disable external forward rule
  const disableMutation = useMutation({
    mutationFn: (ruleId: string) => disableAdminExternalForwardRule(ruleId),
    onSuccess: () => {
      showSuccess('外部规则已禁用');
      queryClient.invalidateQueries({
        queryKey: adminExternalForwardRulesQueryKeys.lists(),
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
    createRule: (request: AdminCreateExternalForwardRuleRequest) =>
      createMutation.mutateAsync(request),
    updateRule: (ruleId: string, request: AdminUpdateExternalForwardRuleRequest) =>
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
 * Admin external forward rules page state management hook
 * Combines rules data for the page component
 */
export const useAdminExternalForwardRulesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<AdminExternalForwardRuleFilters>({});
  const [orderBy, setOrderBy] = useState<AdminListExternalForwardRulesParams['orderBy']>('created_at');
  const [order, setOrder] = useState<AdminListExternalForwardRulesParams['order']>('DESC');
  const [selectedRule, setSelectedRule] = useState<AdminExternalForwardRule | null>(null);

  const rulesQuery = useAdminExternalForwardRules({
    page,
    pageSize,
    filters,
    orderBy,
    order,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Partial<AdminExternalForwardRuleFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handleSortChange = (
    newOrderBy: AdminListExternalForwardRulesParams['orderBy'],
    newOrder: AdminListExternalForwardRulesParams['order']
  ) => {
    setOrderBy(newOrderBy);
    setOrder(newOrder);
    setPage(1);
  };

  const handleToggleStatus = async (rule: AdminExternalForwardRule) => {
    if (rule.status === 'enabled') {
      await rulesQuery.disableRule(rule.id);
    } else {
      await rulesQuery.enableRule(rule.id);
    }
  };

  return {
    ...rulesQuery,
    page,
    pageSize,
    filters,
    orderBy,
    order,
    selectedRule,
    setSelectedRule,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
    handleSortChange,
    handleToggleStatus,
  };
};
