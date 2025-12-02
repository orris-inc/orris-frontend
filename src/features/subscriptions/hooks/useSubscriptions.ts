/**
 * useSubscriptions Hook
 * 基于 TanStack Query 实现
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '@/shared/lib/query-client';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  changeSubscriptionPlan,
  getSubscriptionTokens,
  generateSubscriptionToken,
  revokeSubscriptionToken,
  refreshSubscriptionToken,
} from '../api/subscriptions-api';
import type {
  Subscription,
  SubscriptionListParams,
  SubscriptionStatus,
  CreateSubscriptionRequest,
  ChangePlanRequest,
  GenerateTokenRequest,
  GetTokensParams,
} from '../types/subscriptions.types';

interface SubscriptionFilters {
  status?: SubscriptionStatus;
  user_id?: number;
}

interface UseSubscriptionsOptions {
  page?: number;
  pageSize?: number;
  filters?: SubscriptionFilters;
  enabled?: boolean;
}

export const useSubscriptions = (options: UseSubscriptionsOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // 构建查询参数
  const params: SubscriptionListParams = {
    page,
    page_size: pageSize,
    status: filters.status,
    user_id: filters.user_id,
  };

  // 查询订阅列表
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.subscriptions.list(params),
    queryFn: () => getSubscriptions(params),
    enabled,
  });

  // 创建订阅
  const createMutation = useMutation({
    mutationFn: createSubscription,
    onSuccess: () => {
      showSuccess('订阅创建成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 更换订阅计划
  const changePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChangePlanRequest }) =>
      changeSubscriptionPlan(id, data),
    onSuccess: () => {
      showSuccess('订阅计划更换成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    // 数据
    subscriptions: data?.items ?? [],
    pagination: {
      page: data?.page ?? page,
      pageSize: data?.page_size ?? pageSize,
      total: data?.total ?? 0,
      totalPages: data?.total_pages ?? 0,
    },

    // 状态
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,

    // 操作
    refetch,
    createSubscription: (data: CreateSubscriptionRequest) => createMutation.mutateAsync(data),
    changePlan: (id: number, data: ChangePlanRequest) =>
      changePlanMutation.mutateAsync({ id, data }),

    // Mutation 状态
    isCreating: createMutation.isPending,
    isChangingPlan: changePlanMutation.isPending,
  };
};

// 获取单个订阅详情
export const useSubscription = (id: number | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.subscriptions.detail(id!),
    queryFn: () => getSubscriptionById(id!),
    enabled: !!id,
  });

  return {
    subscription: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

// 订阅令牌管理 Hook
export const useSubscriptionTokens = (subscriptionId: number | null, params?: GetTokensParams) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.subscriptions.tokens(subscriptionId!),
    queryFn: () => getSubscriptionTokens(subscriptionId!, params),
    enabled: !!subscriptionId,
  });

  // 生成令牌
  const generateMutation = useMutation({
    mutationFn: (data: GenerateTokenRequest) =>
      generateSubscriptionToken(subscriptionId!, data),
    onSuccess: () => {
      showSuccess('令牌生成成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.tokens(subscriptionId!) });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 撤销令牌
  const revokeMutation = useMutation({
    mutationFn: (tokenId: number) =>
      revokeSubscriptionToken(subscriptionId!, tokenId),
    onSuccess: () => {
      showSuccess('令牌已撤销');
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.tokens(subscriptionId!) });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 刷新令牌
  const refreshMutation = useMutation({
    mutationFn: (tokenId: number) =>
      refreshSubscriptionToken(subscriptionId!, tokenId),
    onSuccess: () => {
      showSuccess('令牌已刷新');
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.tokens(subscriptionId!) });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    tokens: data ?? [],
    isLoading,
    error: error ? handleApiError(error) : null,
    refetch,
    generateToken: (data: GenerateTokenRequest) => generateMutation.mutateAsync(data),
    revokeToken: (tokenId: number) => revokeMutation.mutateAsync(tokenId),
    refreshToken: (tokenId: number) => refreshMutation.mutateAsync(tokenId),
    isGenerating: generateMutation.isPending,
    isRevoking: revokeMutation.isPending,
    isRefreshing: refreshMutation.isPending,
  };
};

// 订阅列表状态管理 hook（用于页面级状态）
export const useSubscriptionsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<SubscriptionFilters>({});
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  const subscriptionsQuery = useSubscriptions({ page, pageSize, filters });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Partial<SubscriptionFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return {
    ...subscriptionsQuery,
    page,
    pageSize,
    filters,
    selectedSubscription,
    setSelectedSubscription,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
  };
};
