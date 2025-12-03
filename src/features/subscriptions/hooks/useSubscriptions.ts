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
  adminListSubscriptions,
  adminCreateSubscription,
  adminChangeSubscriptionPlan,
  adminGetSubscription,
} from '@/api/admin';
import {
  listTokens,
  generateToken,
  revokeToken,
  refreshToken as refreshSubscriptionToken,
} from '@/api/subscription';
import type {
  Subscription,
  GenerateTokenRequest,
  ListTokensParams,
} from '@/api/subscription/types';
import type {
  AdminListSubscriptionsParams,
  AdminCreateSubscriptionRequest,
  AdminChangePlanRequest,
} from '@/api/admin/types';

interface SubscriptionFilters {
  status?: 'active' | 'cancelled' | 'renewed' | 'expired' | 'pending';
  userId?: number;
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
  const params: AdminListSubscriptionsParams = {
    page,
    pageSize,
    status: filters.status,
    userId: filters.userId,
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
    queryFn: () => adminListSubscriptions(params),
    enabled,
  });

  // 创建订阅
  const createMutation = useMutation({
    mutationFn: adminCreateSubscription,
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
    mutationFn: ({ id, data }: { id: number; data: AdminChangePlanRequest }) =>
      adminChangeSubscriptionPlan(id, data),
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
    createSubscription: (data: AdminCreateSubscriptionRequest) => createMutation.mutateAsync(data),
    changePlan: (id: number, data: AdminChangePlanRequest) =>
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
    queryFn: () => adminGetSubscription(id!),
    enabled: !!id,
  });

  return {
    subscription: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

// 订阅令牌管理 Hook
export const useSubscriptionTokens = (subscriptionId: number | null, params?: ListTokensParams) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.subscriptions.tokens(subscriptionId!),
    queryFn: () => listTokens(subscriptionId!, params),
    enabled: !!subscriptionId,
  });

  // 生成令牌
  const generateMutation = useMutation({
    mutationFn: (data: GenerateTokenRequest) =>
      generateToken(subscriptionId!, data),
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
      revokeToken(subscriptionId!, tokenId),
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
