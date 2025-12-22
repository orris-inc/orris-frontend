/**
 * useSubscriptionPlans Hook
 * Implemented using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '@/shared/lib/query-client';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  updatePlanStatus,
  getPublicPlans,
} from '@/api/subscription';
import type {
  SubscriptionPlan,
  ListPlansParams,
  CreatePlanRequest,
  UpdatePlanRequest,
} from '@/api/subscription/types';
import type { SubscriptionPlanFilters } from '../types';

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

  // Build query parameters
  const params: ListPlansParams = {
    page,
    pageSize,
    status: filters.status,
    isPublic: filters.isPublic,
  };

  // Query subscription plan list
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.subscriptionPlans.list(params),
    queryFn: () => listPlans(params),
    enabled,
  });

  // Create subscription plan
  const createMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      showSuccess('订阅计划创建成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionPlans.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Update subscription plan
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanRequest }) =>
      updatePlan(id, data),
    onSuccess: () => {
      showSuccess('订阅计划更新成功');
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionPlans.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Update subscription plan status
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
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
    // Data
    plans: data?.items ?? [],
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

    // Operations
    refetch,
    createPlan: (data: CreatePlanRequest) => createMutation.mutateAsync(data),
    updatePlan: (id: string, data: UpdatePlanRequest) =>
      updateMutation.mutateAsync({ id, data }),
    updatePlanStatus: (id: string, status: 'active' | 'inactive') =>
      statusMutation.mutateAsync({ id, status }),
    togglePlanStatus: (plan: SubscriptionPlan) =>
      statusMutation.mutateAsync({
        id: plan.id,
        status: plan.status === 'active' ? 'inactive' : 'active',
      }),

    // Mutation state
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isChangingStatus: statusMutation.isPending,
  };
};

// Get single subscription plan details
export const useSubscriptionPlan = (id: string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.subscriptionPlans.detail(id!),
    queryFn: () => getPlan(id!),
    enabled: !!id,
  });

  return {
    plan: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

// Get public subscription plan list
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

// Subscription plan list state management hook (for page-level state)
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
