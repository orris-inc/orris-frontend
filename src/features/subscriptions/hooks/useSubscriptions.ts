/**
 * useSubscriptions Hook
 * Implemented using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
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
import {
  suspendSubscription,
  unsuspendSubscription,
  resetSubscriptionUsage,
  type SuspendSubscriptionRequest,
} from '@/api/admin';
import { listUsers } from '@/api/user';
import type {
  Subscription,
  SubscriptionStatus,
  GenerateTokenRequest,
  ListTokensParams,
  AdminListSubscriptionsParams,
  AdminCreateSubscriptionRequest,
  AdminChangePlanRequest,
} from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface SubscriptionFilters {
  status?: SubscriptionStatus;
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

  // Build query parameters
  // TODO: AdminListSubscriptionsParams.userId type needs to be updated to string
  const params: AdminListSubscriptionsParams = {
    page,
    pageSize,
    status: filters.status,
    userId: filters.userId as unknown as number,
  };

  // Query subscription list
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

  // Create subscription
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

  // Change subscription plan
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
    // Data
    subscriptions: data?.items ?? [],
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
    createSubscription: (data: AdminCreateSubscriptionRequest) => createMutation.mutateAsync(data),
    changePlan: (id: string, data: AdminChangePlanRequest) =>
      changePlanMutation.mutateAsync({ id, data }),

    // Mutation state
    isCreating: createMutation.isPending,
    isChangingPlan: changePlanMutation.isPending,
  };
};

// Get single subscription details
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

// Subscription actions hook (suspend, unsuspend, reset usage)
export const useSubscriptionActions = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Suspend subscription
  const suspendMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SuspendSubscriptionRequest }) =>
      suspendSubscription(id, data),
    onSuccess: () => {
      showSuccess('订阅已暂停');
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Unsuspend subscription
  const unsuspendMutation = useMutation({
    mutationFn: (id: string) => unsuspendSubscription(id),
    onSuccess: () => {
      showSuccess('订阅已恢复');
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Reset subscription usage
  const resetUsageMutation = useMutation({
    mutationFn: (id: string) => resetSubscriptionUsage(id),
    onSuccess: () => {
      showSuccess('订阅用量已重置');
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    // Actions
    suspend: (id: string, data: SuspendSubscriptionRequest) =>
      suspendMutation.mutateAsync({ id, data }),
    unsuspend: (id: string) => unsuspendMutation.mutateAsync(id),
    resetUsage: (id: string) => resetUsageMutation.mutateAsync(id),

    // Mutation state
    isSuspending: suspendMutation.isPending,
    isUnsuspending: unsuspendMutation.isPending,
    isResettingUsage: resetUsageMutation.isPending,
  };
};

// Subscription token management Hook
export const useSubscriptionTokens = (subscriptionId: string | null, params?: ListTokensParams) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.subscriptions.tokens(subscriptionId!),
    queryFn: () => listTokens(subscriptionId!, params),
    enabled: !!subscriptionId,
  });

  // Generate token
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

  // Revoke token
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

  // Refresh token
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

// Subscription list state management hook (for page-level state)
export const useSubscriptionsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<SubscriptionFilters>({});
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const queryClient = useQueryClient();

  const subscriptionsQuery = useSubscriptions({ page, pageSize, filters });

  // Get list of user IDs involved in subscriptions
  const userIds = useMemo(() => {
    const ids = subscriptionsQuery.subscriptions.map((s) => s.userId);
    return [...new Set(ids)];
  }, [subscriptionsQuery.subscriptions]);

  // Get user list (when subscription data exists)
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: queryKeys.users.list({ pageSize: 100 }),
    queryFn: () => listUsers({ pageSize: 100 }),
    enabled: userIds.length > 0,
  });

  // Build user ID -> user info mapping
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

  // Prefetch page data on hover
  const prefetchPage = useCallback(
    (targetPage: number) => {
      const totalPages = subscriptionsQuery.pagination.totalPages;
      if (targetPage < 1 || targetPage > totalPages || targetPage === page)
        return;

      const params: AdminListSubscriptionsParams = {
        page: targetPage,
        pageSize,
        status: filters.status,
        userId: filters.userId as unknown as number,
      };

      queryClient.prefetchQuery({
        queryKey: queryKeys.subscriptions.list(params),
        queryFn: () => adminListSubscriptions(params),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient, page, pageSize, filters, subscriptionsQuery.pagination.totalPages]
  );

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
    prefetchPage,
  };
};
