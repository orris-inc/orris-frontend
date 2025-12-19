/**
 * useUserForwardRules Hook
 * 用户端转发规则数据管理
 * 基于 TanStack Query 实现
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
  type ForwardRule,
  type CreateForwardRuleRequest,
  type UpdateForwardRuleRequest,
  type ListForwardRulesParams,
} from '@/api/forward';
import type { UserForwardUsage } from '@/api/forward';

// 导出类型供外部使用
export type { UserForwardUsage };

// Query Keys for User Forward Rules
const userForwardRulesQueryKeys = {
  all: ['userForwardRules'] as const,
  lists: () => [...userForwardRulesQueryKeys.all, 'list'] as const,
  list: (params: object) => [...userForwardRulesQueryKeys.lists(), params] as const,
  usage: () => [...userForwardRulesQueryKeys.all, 'usage'] as const,
  detail: (id: string) => [...userForwardRulesQueryKeys.all, 'detail', id] as const,
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
 * 用户转发规则列表查询和操作
 */
export const useUserForwardRules = (options: UseUserForwardRulesOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // 构建查询参数
  const params: ListForwardRulesParams = {
    page,
    pageSize,
    name: filters.name,
    protocol: filters.protocol,
    status: filters.status,
  };

  // 查询转发规则列表
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

  // 创建转发规则
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

  // 更新转发规则
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

  // 删除转发规则
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

  // 启用转发规则
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

  // 禁用转发规则
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
    // 数据
    forwardRules: data?.items ?? [],
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
    createForwardRule: (data: CreateForwardRuleRequest) => createMutation.mutateAsync(data),
    updateForwardRule: (id: string, data: UpdateForwardRuleRequest) =>
      updateMutation.mutateAsync({ id, data }),
    deleteForwardRule: (id: string) => deleteMutation.mutateAsync(id),
    enableForwardRule: (id: string) => enableMutation.mutateAsync(id),
    disableForwardRule: (id: string) => disableMutation.mutateAsync(id),

    // Mutation 状态
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isEnabling: enableMutation.isPending,
    isDisabling: disableMutation.isPending,
  };
};

/**
 * 获取单个转发规则详情
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
 * 获取用户转发规则配额和使用情况
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
 * 用户转发规则页面状态管理 hook
 */
export const useUserForwardRulesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<UserForwardRuleFilters>({});
  const [selectedRule, setSelectedRule] = useState<ForwardRule | null>(null);

  const rulesQuery = useUserForwardRules({ page, pageSize, filters });
  const usageQuery = useUserForwardUsage();

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
