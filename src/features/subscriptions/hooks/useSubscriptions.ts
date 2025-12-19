/**
 * useSubscriptions Hook
 * 基于 TanStack Query 实现
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { queryKeys } from '@/shared/lib/query-client';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import {
  adminListSubscriptions,
  adminCreateSubscription,
  adminChangeSubscriptionPlan,
  adminGetSubscription,
} from '@/api/subscription';
import {
  listTokens,
  generateToken,
  revokeToken,
  refreshToken as refreshSubscriptionToken,
} from '@/api/subscription';
import { listUsers } from '@/api/user';
import type {
  Subscription,
  GenerateTokenRequest,
  ListTokensParams,
} from '@/api/subscription/types';
import type {
  AdminListSubscriptionsParams,
  AdminCreateSubscriptionRequest,
  AdminChangePlanRequest,
} from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface SubscriptionFilters {
  status?: 'active' | 'cancelled' | 'renewed' | 'expired' | 'pending';
  userId?: string;
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
  // TODO: AdminListSubscriptionsParams.userId 类型需要同步更新为 string
  const params: AdminListSubscriptionsParams = {
    page,
    pageSize,
    status: filters.status,
    userId: filters.userId as unknown as number,
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
    mutationFn: ({ id, data }: { id: string; data: AdminChangePlanRequest }) =>
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
    changePlan: (id: string, data: AdminChangePlanRequest) =>
      changePlanMutation.mutateAsync({ id, data }),

    // Mutation 状态
    isCreating: createMutation.isPending,
    isChangingPlan: changePlanMutation.isPending,
  };
};

// 获取单个订阅详情
export const useSubscription = (id: string | null) => {
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
export const useSubscriptionTokens = (subscriptionId: string | null, params?: ListTokensParams) => {
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
    mutationFn: (tokenId: string) =>
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
    mutationFn: (tokenId: string) =>
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
    revokeToken: (tokenId: string) => revokeMutation.mutateAsync(tokenId),
    refreshToken: (tokenId: string) => refreshMutation.mutateAsync(tokenId),
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

  // 获取订阅中涉及的用户 ID 列表
  const userIds = useMemo(() => {
    const ids = subscriptionsQuery.subscriptions.map((s) => s.userId);
    return [...new Set(ids)];
  }, [subscriptionsQuery.subscriptions]);

  // 获取用户列表（当有订阅数据时）
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: queryKeys.users.list({ pageSize: 100 }),
    queryFn: () => listUsers({ pageSize: 100 }),
    enabled: userIds.length > 0,
  });

  // 构建用户 ID -> 用户信息的映射
  const usersMap = useMemo(() => {
    const map: Record<string, UserResponse> = {};
    if (usersData?.items) {
      for (const user of usersData.items) {
        map[user.id] = user;
      }
    }
    return map;
  }, [usersData]);

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
    usersMap,
    isUsersLoading,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
  };
};
