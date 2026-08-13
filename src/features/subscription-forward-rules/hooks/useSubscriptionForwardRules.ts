/**
 * useSubscriptionForwardRules Hook
 * Subscription-bound forward rule data management
 * Built with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import {
  listSubscriptionForwardRules,
  getSubscriptionForwardRule,
  createSubscriptionForwardRule,
  updateSubscriptionForwardRule,
  deleteSubscriptionForwardRule,
  enableSubscriptionForwardRule,
  disableSubscriptionForwardRule,
  reorderSubscriptionForwardRules,
  listUserForwardAgents,
  type ForwardRule,
  type CreateSubscriptionForwardRuleRequest,
  type UpdateSubscriptionForwardRuleRequest,
  type ListSubscriptionForwardRulesParams,
  type SubscriptionForwardUsage,
  type UserForwardAgent,
} from '@/api/forward';
import { getSubscription } from '@/api/subscription';

// Export types for external use
export type { SubscriptionForwardUsage };

// Shape of the cached rule list page, used for optimistic reordering
type PaginatedRules = {
  items: ForwardRule[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

// Cache time: 2 minutes for subscription forward rules data
const STALE_TIME = 2 * 60 * 1000;

// Query Keys for Subscription Forward Rules
const subscriptionForwardRulesQueryKeys = {
  all: ['subscriptionForwardRules'] as const,
  lists: () => [...subscriptionForwardRulesQueryKeys.all, 'list'] as const,
  list: (subscriptionId: string, params: object) =>
    [...subscriptionForwardRulesQueryKeys.lists(), subscriptionId, params] as const,
  usage: (subscriptionId: string) =>
    [...subscriptionForwardRulesQueryKeys.all, 'usage', subscriptionId] as const,
  detail: (subscriptionId: string, ruleId: string) =>
    [...subscriptionForwardRulesQueryKeys.all, 'detail', subscriptionId, ruleId] as const,
  agents: () => [...subscriptionForwardRulesQueryKeys.all, 'agents'] as const,
};

export interface SubscriptionForwardRuleFilters {
  name?: string;
  protocol?: 'tcp' | 'udp' | 'both';
  status?: 'enabled' | 'disabled';
}

interface UseSubscriptionForwardRulesOptions {
  subscriptionId: string;
  page?: number;
  pageSize?: number;
  filters?: SubscriptionForwardRuleFilters;
  enabled?: boolean;
}

/**
 * Subscription forward rule list query and operations
 */
export const useSubscriptionForwardRules = (options: UseSubscriptionForwardRulesOptions) => {
  const { subscriptionId, page = 1, pageSize = 20, filters = {}, enabled = true } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();
  const { t } = useTranslation();

  // Build query params - ordered by sort_order so drag-and-drop reflects the real order
  const params: ListSubscriptionForwardRulesParams = {
    page,
    pageSize,
    name: filters.name,
    protocol: filters.protocol,
    status: filters.status,
    orderBy: 'sort_order',
    order: 'asc',
  };

  // Query forward rule list
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: subscriptionForwardRulesQueryKeys.list(subscriptionId, params),
    queryFn: () => listSubscriptionForwardRules(subscriptionId, params),
    enabled: enabled && !!subscriptionId,
    staleTime: STALE_TIME,
  });

  // Create forward rule
  const createMutation = useMutation({
    mutationFn: (request: CreateSubscriptionForwardRuleRequest) =>
      createSubscriptionForwardRule(subscriptionId, request),
    onSuccess: () => {
      showSuccess(t('messages.forwardRuleCreateSuccess'));
      queryClient.invalidateQueries({
        queryKey: subscriptionForwardRulesQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: subscriptionForwardRulesQueryKeys.usage(subscriptionId),
      });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Update forward rule
  const updateMutation = useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; data: UpdateSubscriptionForwardRuleRequest }) =>
      updateSubscriptionForwardRule(subscriptionId, ruleId, data),
    onSuccess: () => {
      showSuccess(t('messages.forwardRuleUpdateSuccess'));
      queryClient.invalidateQueries({
        queryKey: subscriptionForwardRulesQueryKeys.lists(),
      });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Delete forward rule
  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) => deleteSubscriptionForwardRule(subscriptionId, ruleId),
    onSuccess: () => {
      showSuccess(t('messages.forwardRuleDeleteSuccess'));
      queryClient.invalidateQueries({
        queryKey: subscriptionForwardRulesQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: subscriptionForwardRulesQueryKeys.usage(subscriptionId),
      });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Enable forward rule
  const enableMutation = useMutation({
    mutationFn: (ruleId: string) => enableSubscriptionForwardRule(subscriptionId, ruleId),
    onSuccess: () => {
      showSuccess(t('messages.forwardRuleEnabled'));
      queryClient.invalidateQueries({
        queryKey: subscriptionForwardRulesQueryKeys.lists(),
      });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Disable forward rule
  const disableMutation = useMutation({
    mutationFn: (ruleId: string) => disableSubscriptionForwardRule(subscriptionId, ruleId),
    onSuccess: () => {
      showSuccess(t('messages.forwardRuleDisabled'));
      queryClient.invalidateQueries({
        queryKey: subscriptionForwardRulesQueryKeys.lists(),
      });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Reorder forward rules with optimistic update.
  // The backend reads the submitted values as relative order only (2026-08-12): the rules
  // keep their positions in the subscription and just swap places among themselves, so
  // dense indices are safe and the stored values will differ from what is sent.
  const reorderMutation = useMutation({
    mutationFn: (ruleOrders: Array<{ ruleId: string; sortOrder: number }>) =>
      reorderSubscriptionForwardRules(subscriptionId, { ruleOrders }),
    onMutate: async (ruleOrders) => {
      await queryClient.cancelQueries({ queryKey: subscriptionForwardRulesQueryKeys.lists() });
      const queryKey = subscriptionForwardRulesQueryKeys.list(subscriptionId, params);
      const previousData = queryClient.getQueryData<PaginatedRules>(queryKey);

      queryClient.setQueryData<PaginatedRules>(queryKey, (old) => {
        if (!old) return old;
        const orderIndex = new Map(ruleOrders.map((o) => [o.ruleId, o.sortOrder]));
        const items = [...old.items].sort(
          (a, b) => (orderIndex.get(a.id) ?? a.sortOrder) - (orderIndex.get(b.id) ?? b.sortOrder)
        );
        return { ...old, items };
      });

      return { previousData, queryKey };
    },
    onSuccess: () => {
      showSuccess(t('messages.ruleReorderSuccess'));
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      showError(handleApiError(error));
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: subscriptionForwardRulesQueryKeys.lists(),
      });
    },
  });

  return {
    // Data
    forwardRules: data?.items ?? [],
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
    createForwardRule: (request: CreateSubscriptionForwardRuleRequest) =>
      createMutation.mutateAsync(request),
    updateForwardRule: (ruleId: string, request: UpdateSubscriptionForwardRuleRequest) =>
      updateMutation.mutateAsync({ ruleId, data: request }),
    deleteForwardRule: (ruleId: string) => deleteMutation.mutateAsync(ruleId),
    enableForwardRule: (ruleId: string) => enableMutation.mutateAsync(ruleId),
    disableForwardRule: (ruleId: string) => disableMutation.mutateAsync(ruleId),
    reorderForwardRules: (ruleOrders: Array<{ ruleId: string; sortOrder: number }>) =>
      reorderMutation.mutateAsync(ruleOrders),

    // Mutation state
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isEnabling: enableMutation.isPending,
    isDisabling: disableMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
};

/**
 * Get single subscription forward rule details
 */
export const useSubscriptionForwardRule = (subscriptionId: string, ruleId: string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: subscriptionForwardRulesQueryKeys.detail(subscriptionId, ruleId!),
    queryFn: () => getSubscriptionForwardRule(subscriptionId, ruleId!),
    enabled: !!subscriptionId && !!ruleId,
    staleTime: STALE_TIME,
  });

  return {
    forwardRule: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

// Plan limits interface for extracting forward-related limits
interface PlanLimits {
  trafficLimit?: number;
  forwardRuleLimit?: number;
  allowedForwardTypes?: string[];
}

/**
 * Get subscription forward rule quota and usage.
 * Traffic usage is read directly from `subscription.dataUsedBytes` (current
 * traffic cycle, authoritative). No separate traffic-stats request is needed.
 */
export const useSubscriptionForwardUsage = (subscriptionId: string, enabled = true) => {
  // Query subscription details for plan limits and current-cycle usage
  const subscriptionQuery = useQuery({
    queryKey: [...subscriptionForwardRulesQueryKeys.all, 'subscription', subscriptionId] as const,
    queryFn: () => getSubscription(subscriptionId),
    enabled: enabled && !!subscriptionId,
    staleTime: STALE_TIME,
  });

  // Query rule list to get current rule count
  const rulesQuery = useQuery({
    queryKey: subscriptionForwardRulesQueryKeys.list(subscriptionId, { page: 1, pageSize: 1 }),
    queryFn: () => listSubscriptionForwardRules(subscriptionId, { page: 1, pageSize: 1 }),
    enabled: enabled && !!subscriptionId,
    staleTime: STALE_TIME,
  });

  // Combine data into SubscriptionForwardUsage format
  const usage = useMemo<SubscriptionForwardUsage | null>(() => {
    const subscription = subscriptionQuery.data;
    if (!subscription) return null;

    const limits = subscription.plan?.limits as PlanLimits | undefined;

    return {
      ruleCount: rulesQuery.data?.total ?? 0,
      ruleLimit: limits?.forwardRuleLimit ?? 0,
      trafficUsed: subscription.dataUsedBytes ?? 0,
      trafficLimit: limits?.trafficLimit ?? 0,
      allowedTypes: limits?.allowedForwardTypes ?? ['direct', 'entry', 'chain', 'direct_chain'],
    };
  }, [subscriptionQuery.data, rulesQuery.data?.total]);

  const isLoading = subscriptionQuery.isLoading || rulesQuery.isLoading;
  const error = subscriptionQuery.error || rulesQuery.error;

  return {
    usage,
    isLoading,
    error: error ? handleApiError(error) : null,
    refetch: () => {
      subscriptionQuery.refetch();
      rulesQuery.refetch();
    },
  };
};

/**
 * Subscription forward rules section state management hook
 * Combines rules, usage, and agents data for the section component
 */
export const useSubscriptionForwardRulesSection = (subscriptionId: string) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<SubscriptionForwardRuleFilters>({});
  const [selectedRule, setSelectedRule] = useState<ForwardRule | null>(null);

  const rulesQuery = useSubscriptionForwardRules({
    subscriptionId,
    page,
    pageSize,
    filters,
    enabled: !!subscriptionId,
  });

  const usageQuery = useSubscriptionForwardUsage(subscriptionId, !!subscriptionId);

  // Query all available agents to build agentsMap for rule display
  const agentsQuery = useQuery({
    queryKey: subscriptionForwardRulesQueryKeys.agents(),
    queryFn: () => listUserForwardAgents({ page: 1, pageSize: 1000 }),
    enabled: !!subscriptionId,
    staleTime: STALE_TIME,
  });

  // Build agentsMap from agents list
  const agentsMap = useMemo<Record<string, UserForwardAgent>>(() => {
    const agents = agentsQuery.data?.items ?? [];
    return agents.reduce(
      (acc, agent) => {
        acc[agent.id] = agent;
        return acc;
      },
      {} as Record<string, UserForwardAgent>
    );
  }, [agentsQuery.data?.items]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Partial<SubscriptionForwardRuleFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  // Drag-and-drop reorder. The subscription endpoint reads the values as relative order
  // only, so dense indices cannot push these rules ahead of the direct nodes.
  const handleDragEnd = async (
    _activeId: string,
    _overId: string,
    oldIndex: number,
    newIndex: number
  ) => {
    if (oldIndex === newIndex) return;

    const reordered = [...rulesQuery.forwardRules];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    await rulesQuery.reorderForwardRules(
      reordered.map((rule, index) => ({ ruleId: rule.id, sortOrder: index + 1 }))
    );
  };

  return {
    ...rulesQuery,
    usage: usageQuery.usage,
    isUsageLoading: usageQuery.isLoading,
    agentsMap,
    isAgentsLoading: agentsQuery.isLoading,
    page,
    pageSize,
    filters,
    selectedRule,
    setSelectedRule,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
    handleDragEnd,
  };
};
