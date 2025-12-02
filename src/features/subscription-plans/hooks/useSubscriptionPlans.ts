/**
 * useSubscriptionPlans Hook
 * 基于 TanStack Query 实现
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '@/shared/lib/query-client';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import {
  getSubscriptionPlans,
  getSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  updatePlanStatus,
  getPublicPlans,
} from '../api/subscription-plans-api';
import type {
  SubscriptionPlan,
  SubscriptionPlanListParams,
  SubscriptionPlanFilters,
  CreatePlanRequest,
  UpdatePlanRequest,
} from '../types/subscription-plans.types';

interface UseSubscriptionPlansOptions {
  page?: number;
  pageSize?: number;
  filters?: SubscriptionPlanFilters;
  enabled?: boolean;
}

export const useSubscriptionPlans = (options: UseSubscriptionPlansOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // 构建查询参数
  const params: SubscriptionPlanListParams = {
    page,
    page_size: pageSize,
    status: filters.status,
    is_public: filters.is_public,
    billing_cycle: filters.billing_cycle,
  };

  // 查询订阅计划列表
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.subscriptionPlans.list(params),
    queryFn: () => getSubscriptionPlans(params),
    enabled,
  });

  // 创建订阅计划
  const createMutation = useMutation({
    mutationFn: createSubscriptionPlan,
    onSuccess: () => {
      showSuccess('订阅计划创建成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionPlans.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 更新订阅计划
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlanRequest }) =>
      updateSubscriptionPlan(id, data),
    onSuccess: () => {
      showSuccess('订阅计划更新成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionPlans.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 更新订阅计划状态
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'inactive' }) =>
      updatePlanStatus(id, { status }),
    onSuccess: (_, { status }) => {
      showSuccess(`订阅计划已${status === 'active' ? '激活' : '停用'}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionPlans.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionPlans.public() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    // 数据
    plans: data?.items ?? [],
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
    createPlan: (data: CreatePlanRequest) => createMutation.mutateAsync(data),
    updatePlan: (id: number, data: UpdatePlanRequest) =>
      updateMutation.mutateAsync({ id, data }),
    updatePlanStatus: (id: number, status: 'active' | 'inactive') =>
      statusMutation.mutateAsync({ id, status }),
    togglePlanStatus: (plan: SubscriptionPlan) =>
      statusMutation.mutateAsync({
        id: plan.ID,
        status: plan.Status === 'active' ? 'inactive' : 'active',
      }),

    // Mutation 状态
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isChangingStatus: statusMutation.isPending,
  };
};

// 获取单个订阅计划详情
export const useSubscriptionPlan = (id: number | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.subscriptionPlans.detail(id!),
    queryFn: () => getSubscriptionPlanById(id!),
    enabled: !!id,
  });

  return {
    plan: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

// 获取公开的订阅计划列表
export const usePublicPlans = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.subscriptionPlans.public(),
    queryFn: getPublicPlans,
  });

  return {
    plans: data ?? [],
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

// 订阅计划列表状态管理 hook（用于页面级状态）
export const useSubscriptionPlansPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<SubscriptionPlanFilters>({});
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const plansQuery = useSubscriptionPlans({ page, pageSize, filters });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Partial<SubscriptionPlanFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return {
    ...plansQuery,
    page,
    pageSize,
    filters,
    selectedPlan,
    setSelectedPlan,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
  };
};
