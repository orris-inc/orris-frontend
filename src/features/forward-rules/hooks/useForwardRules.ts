/**
 * useForwardRules Hook
 * 基于 TanStack Query 实现
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import {
  listForwardRules,
  getForwardRule,
  createForwardRule,
  updateForwardRule,
  deleteForwardRule,
  enableForwardRule,
  disableForwardRule,
  resetForwardRuleTraffic,
  listForwardAgents,
  type ForwardRule,
  type ForwardAgent,
  type CreateForwardRuleRequest,
  type UpdateForwardRuleRequest,
  type ListForwardRulesParams,
} from '@/api/forward';

// Query Keys for Forward Rules
const forwardRulesQueryKeys = {
  all: ['forwardRules'] as const,
  lists: () => [...forwardRulesQueryKeys.all, 'list'] as const,
  list: (params: object) => [...forwardRulesQueryKeys.lists(), params] as const,
  details: () => [...forwardRulesQueryKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...forwardRulesQueryKeys.details(), id] as const,
};

export interface ForwardRuleFilters {
  name?: string;
  protocol?: 'tcp' | 'udp' | 'both';
  status?: 'enabled' | 'disabled';
  orderBy?: string;
  order?: 'asc' | 'desc';
}

interface UseForwardRulesOptions {
  page?: number;
  pageSize?: number;
  filters?: ForwardRuleFilters;
  enabled?: boolean;
}

export const useForwardRules = (options: UseForwardRulesOptions = {}) => {
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
    orderBy: filters.orderBy,
    order: filters.order,
  };

  // 查询转发规则列表
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: forwardRulesQueryKeys.list(params),
    queryFn: () => listForwardRules(params),
    enabled,
  });

  // 创建转发规则
  const createMutation = useMutation({
    mutationFn: createForwardRule,
    onSuccess: () => {
      showSuccess('转发规则创建成功');
      queryClient.invalidateQueries({ queryKey: forwardRulesQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 更新转发规则
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateForwardRuleRequest }) =>
      updateForwardRule(id, data),
    onSuccess: () => {
      showSuccess('转发规则更新成功');
      queryClient.invalidateQueries({ queryKey: forwardRulesQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 删除转发规则
  const deleteMutation = useMutation({
    mutationFn: deleteForwardRule,
    onSuccess: () => {
      showSuccess('转发规则删除成功');
      queryClient.invalidateQueries({ queryKey: forwardRulesQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 启用转发规则
  const enableMutation = useMutation({
    mutationFn: enableForwardRule,
    onSuccess: () => {
      showSuccess('转发规则已启用');
      queryClient.invalidateQueries({ queryKey: forwardRulesQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 禁用转发规则
  const disableMutation = useMutation({
    mutationFn: disableForwardRule,
    onSuccess: () => {
      showSuccess('转发规则已禁用');
      queryClient.invalidateQueries({ queryKey: forwardRulesQueryKeys.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // 重置流量
  const resetTrafficMutation = useMutation({
    mutationFn: resetForwardRuleTraffic,
    onSuccess: () => {
      showSuccess('流量统计已重置');
      queryClient.invalidateQueries({ queryKey: forwardRulesQueryKeys.lists() });
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
    updateForwardRule: (id: number | string, data: UpdateForwardRuleRequest) =>
      updateMutation.mutateAsync({ id, data }),
    deleteForwardRule: (id: number | string) => deleteMutation.mutateAsync(id),
    enableForwardRule: (id: number | string) => enableMutation.mutateAsync(id),
    disableForwardRule: (id: number | string) => disableMutation.mutateAsync(id),
    resetTraffic: (id: number | string) => resetTrafficMutation.mutateAsync(id),

    // Mutation 状态
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isEnabling: enableMutation.isPending,
    isDisabling: disableMutation.isPending,
    isResettingTraffic: resetTrafficMutation.isPending,
  };
};

// 获取单个转发规则详情
export const useForwardRule = (id: number | string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: forwardRulesQueryKeys.detail(id!),
    queryFn: () => getForwardRule(id!),
    enabled: !!id,
  });

  return {
    forwardRule: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

// Query Keys for Forward Agents (local)
const forwardAgentsQueryKeys = {
  all: ['forwardAgents'] as const,
  lists: () => [...forwardAgentsQueryKeys.all, 'list'] as const,
  list: (params: object) => [...forwardAgentsQueryKeys.lists(), params] as const,
};

// 转发规则列表状态管理 hook（用于页面级状态）
export const useForwardRulesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<ForwardRuleFilters>({});
  const [selectedRule, setSelectedRule] = useState<ForwardRule | null>(null);

  const rulesQuery = useForwardRules({ page, pageSize, filters });

  // 获取所有转发代理以构建 agentId -> agent 映射
  const { data: agentsData } = useQuery({
    queryKey: forwardAgentsQueryKeys.list({ pageSize: 100 }),
    queryFn: () => listForwardAgents({ pageSize: 100 }),
    enabled: rulesQuery.forwardRules.length > 0,
  });

  // 构建 agentId -> agent 映射
  const agentsMap = useMemo(() => {
    const map: Record<number, ForwardAgent> = {};
    if (agentsData?.items) {
      for (const agent of agentsData.items) {
        map[agent.id] = agent;
      }
    }
    return map;
  }, [agentsData]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Partial<ForwardRuleFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return {
    ...rulesQuery,
    page,
    pageSize,
    filters,
    selectedRule,
    agentsMap,
    setSelectedRule,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
  };
};
