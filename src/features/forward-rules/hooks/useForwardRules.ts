/**
 * useForwardRules Hook
 * Implemented using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { concurrentMap } from '@/shared/utils/concurrency-utils';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import { queryKeys } from '@/shared/lib/query-client';
import {
  listForwardRules,
  getForwardRule,
  createForwardRule,
  updateForwardRule,
  deleteForwardRule,
  enableForwardRule,
  disableForwardRule,
  resetForwardRuleTraffic,
  reorderForwardRules,
  listForwardAgents,
  probeRule,
  getRuleOverallStatus,
  type ForwardRule,
  type ForwardAgent,
  type CreateForwardRuleRequest,
  type UpdateForwardRuleRequest,
  type ListForwardRulesParams,
  type ProbeRuleRequest,
  type RuleOverallStatusResponse,
  type ReorderForwardRulesRequest,
} from '@/api/forward';

export type ForwardRuleGroupBy = 'none' | 'agent' | 'ruleType';

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
  /** Include user-created rules in the list (default: false - only admin-created rules) */
  includeUserRules?: boolean;
}

export const useForwardRules = (options: UseForwardRulesOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true, includeUserRules } = options;
  const queryClient = useQueryClient();
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);
  const { t } = useTranslation();

  // Build query parameters
  const params: ListForwardRulesParams = {
    page,
    pageSize,
    name: filters.name,
    protocol: filters.protocol,
    status: filters.status,
    orderBy: filters.orderBy,
    order: filters.order,
    includeUserRules,
  };

  // Query forward rules list
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.forwardRules.list(params),
    queryFn: () => listForwardRules(params),
    enabled,
  });

  // Create forward rule
  const createMutation = useMutation({
    mutationFn: createForwardRule,
    onSuccess: () => {
      showSuccess(t('messages.forwardRuleCreateSuccess'));
      queryClient.invalidateQueries({ queryKey: queryKeys.forwardRules.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Update forward rule
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateForwardRuleRequest }) =>
      updateForwardRule(id, data),
    onSuccess: () => {
      showSuccess(t('messages.forwardRuleUpdateSuccess'));
      queryClient.invalidateQueries({ queryKey: queryKeys.forwardRules.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Delete forward rule
  const deleteMutation = useMutation({
    mutationFn: deleteForwardRule,
    onSuccess: () => {
      showSuccess(t('messages.forwardRuleDeleteSuccess'));
      queryClient.invalidateQueries({ queryKey: queryKeys.forwardRules.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Enable forward rule with optimistic update
  const enableMutation = useMutation({
    mutationFn: enableForwardRule,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.forwardRules.lists() });
      const previousData = queryClient.getQueryData(queryKeys.forwardRules.list(params));
      queryClient.setQueryData(
        queryKeys.forwardRules.list(params),
        (old: { items: ForwardRule[]; page: number; pageSize: number; total: number; totalPages: number } | undefined) => {
          if (!old) return old;
          const updatedItems = old.items.map((rule) =>
            String(rule.id) === String(id) ? { ...rule, status: 'enabled' as const } : rule
          );
          return { ...old, items: updatedItems };
        }
      );
      return { previousData };
    },
    onSuccess: () => {
      showSuccess(t('messages.forwardRuleEnabled'));
    },
    onError: (error, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.forwardRules.list(params), context.previousData);
      }
      showError(handleApiError(error));
    },
  });

  // Disable forward rule with optimistic update
  const disableMutation = useMutation({
    mutationFn: disableForwardRule,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.forwardRules.lists() });
      const previousData = queryClient.getQueryData(queryKeys.forwardRules.list(params));
      queryClient.setQueryData(
        queryKeys.forwardRules.list(params),
        (old: { items: ForwardRule[]; page: number; pageSize: number; total: number; totalPages: number } | undefined) => {
          if (!old) return old;
          const updatedItems = old.items.map((rule) =>
            String(rule.id) === String(id) ? { ...rule, status: 'disabled' as const } : rule
          );
          return { ...old, items: updatedItems };
        }
      );
      return { previousData };
    },
    onSuccess: () => {
      showSuccess(t('messages.forwardRuleDisabled'));
    },
    onError: (error, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.forwardRules.list(params), context.previousData);
      }
      showError(handleApiError(error));
    },
  });

  // Reset traffic
  const resetTrafficMutation = useMutation({
    mutationFn: resetForwardRuleTraffic,
    onSuccess: () => {
      showSuccess(t('messages.trafficReset'));
      queryClient.invalidateQueries({ queryKey: queryKeys.forwardRules.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Probe rule
  const probeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data?: ProbeRuleRequest }) =>
      probeRule(id, data),
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Reorder forward rules with optimistic update
  const reorderMutation = useMutation({
    mutationFn: (data: ReorderForwardRulesRequest) => reorderForwardRules(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.forwardRules.lists() });

      const previousData = queryClient.getQueryData(queryKeys.forwardRules.list(params));

      queryClient.setQueryData(
        queryKeys.forwardRules.list(params),
        (old: { items: ForwardRule[]; page: number; pageSize: number; total: number; totalPages: number } | undefined) => {
          if (!old) return old;
          const updatedItems = old.items.map((rule) => {
            const update = data.ruleOrders.find((u) => u.ruleId === rule.id);
            if (update) {
              return { ...rule, sortOrder: update.sortOrder };
            }
            return rule;
          });
          updatedItems.sort((a, b) => a.sortOrder - b.sortOrder);
          return { ...old, items: updatedItems };
        }
      );

      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.forwardRules.list(params), context.previousData);
      }
      showError(handleApiError(error));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forwardRules.lists() });
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

    // Status
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,

    // Operations
    refetch,
    createForwardRule: (data: CreateForwardRuleRequest) => createMutation.mutateAsync(data),
    updateForwardRule: (id: number | string, data: UpdateForwardRuleRequest) =>
      updateMutation.mutateAsync({ id, data }),
    deleteForwardRule: (id: number | string) => deleteMutation.mutateAsync(id),
    enableForwardRule: (id: number | string) => enableMutation.mutateAsync(id),
    disableForwardRule: (id: number | string) => disableMutation.mutateAsync(id),
    resetTraffic: (id: number | string) => resetTrafficMutation.mutateAsync(id),
    probeRule: (id: number | string, data?: ProbeRuleRequest) =>
      probeMutation.mutateAsync({ id, data }),
    reorderRules: (data: ReorderForwardRulesRequest) =>
      reorderMutation.mutateAsync(data),

    // Mutation status
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isEnabling: enableMutation.isPending,
    isDisabling: disableMutation.isPending,
    isResettingTraffic: resetTrafficMutation.isPending,
    isProbing: probeMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
};

// Get single forward rule details
export const useForwardRule = (id: number | string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.forwardRules.detail(id!),
    queryFn: () => getForwardRule(id!),
    enabled: !!id,
  });

  return {
    forwardRule: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

// Query Keys for Rule Status
const ruleStatusQueryKeys = {
  all: ['ruleStatus'] as const,
  overallStatus: (ruleId: string) => [...ruleStatusQueryKeys.all, 'overall', ruleId] as const,
  batch: (ruleIds: string[]) => [...ruleStatusQueryKeys.all, 'batch', ...ruleIds] as const,
};

// Forward rules list state management hook (for page-level state)
export const useForwardRulesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<ForwardRuleFilters>({
    orderBy: 'sort_order',
    order: 'asc',
  });
  const [includeUserRules, setIncludeUserRules] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ForwardRule | null>(null);
  const [groupBy, setGroupBy] = useState<ForwardRuleGroupBy>('none');

  // When grouping is active, use larger page size to fetch more data
  const effectivePageSize = groupBy !== 'none' ? 200 : pageSize;
  const effectivePage = groupBy !== 'none' ? 1 : page;

  const rulesQuery = useForwardRules({ page: effectivePage, pageSize: effectivePageSize, filters, includeUserRules });

  // Get all forward agents to build agentId -> agent mapping
  // Load simultaneously with rules list to avoid showing ID first then name
  const { data: agentsData, isLoading: isAgentsLoading } = useQuery({
    queryKey: queryKeys.forwardAgents.list({ pageSize: 100 }),
    queryFn: () => listForwardAgents({ pageSize: 100 }),
  });

  // Build agentId -> agent mapping
  const agentsMap = useMemo(() => {
    const map: Record<string, ForwardAgent> = {};
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

  const handleIncludeUserRulesChange = (include: boolean) => {
    setIncludeUserRules(include);
    setPage(1);
  };

  const handleReorder = async (ruleOrders: { ruleId: string; sortOrder: number }[]) => {
    await rulesQuery.reorderRules({ ruleOrders });
  };

  const handleGroupByChange = (newGroupBy: ForwardRuleGroupBy) => {
    setGroupBy(newGroupBy);
    if (newGroupBy !== 'none') {
      setPage(1);
    }
  };

  return {
    ...rulesQuery,
    // Merge loading states, ensure agent data is also loaded before showing table
    isLoading: rulesQuery.isLoading || isAgentsLoading,
    page,
    pageSize,
    filters,
    includeUserRules,
    selectedRule,
    agentsMap,
    groupBy,
    setSelectedRule,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
    handleIncludeUserRulesChange,
    handleReorder,
    handleGroupByChange,
  };
};

// Get rule overall status for a single rule
export const useRuleOverallStatus = (ruleId: string | null) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ruleStatusQueryKeys.overallStatus(ruleId!),
    queryFn: () => getRuleOverallStatus(ruleId!),
    enabled: !!ruleId,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    staleTime: 5000,
  });

  return {
    ruleOverallStatus: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
    refetch,
  };
};

// Get rules overall status for multiple rules (batch query for list)
export const useRulesOverallStatusBatch = (ruleIds: string[]) => {
  // Deduplicate rule IDs
  const uniqueRuleIds = useMemo(() => [...new Set(ruleIds)], [ruleIds]);

  // Batch query all rules' overall status
  const queries = useQuery({
    queryKey: ruleStatusQueryKeys.batch(uniqueRuleIds),
    queryFn: async () => {
      if (uniqueRuleIds.length === 0) return {};

      const results = await concurrentMap(
        uniqueRuleIds,
        (ruleId) => getRuleOverallStatus(ruleId),
        5
      );

      const statusMap: Record<string, RuleOverallStatusResponse> = {};
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          statusMap[uniqueRuleIds[index]] = result.value;
        }
      });

      return statusMap;
    },
    enabled: uniqueRuleIds.length > 0,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  return {
    ruleOverallStatusMap: queries.data ?? {},
    isLoading: queries.isLoading,
    error: queries.error ? handleApiError(queries.error) : null,
    refetch: queries.refetch,
  };
};

// Polling configuration
const POLLING_INTERVAL = 3000; // 3 seconds
const POLLING_TIMEOUT = 30000; // 30 seconds

interface PollingRule {
  ruleId: string;
  startTime: number;
}

/**
 * Hook for short-term polling after enable/disable operations
 *
 * Usage:
 * - Normal list browsing: use inline status from ForwardRule (no extra requests)
 * - After enable/disable: poll that rule's status for 30 seconds (every 3 seconds)
 * - After 30 seconds or status stabilizes: stop polling
 */
export const useRuleStatusPolling = () => {
  const pollingRulesRef = useRef<Map<string, PollingRule>>(new Map());
  const [pollingRuleIds, setPollingRuleIds] = useState<string[]>([]);
  const [polledStatusMap, setPolledStatusMap] = useState<Record<string, RuleOverallStatusResponse>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncPollingRuleIds = useCallback(() => {
    setPollingRuleIds(Array.from(pollingRulesRef.current.keys()));
  }, []);

  const startPolling = useCallback((ruleId: string) => {
    pollingRulesRef.current.set(ruleId, { ruleId, startTime: Date.now() });
    syncPollingRuleIds();
  }, [syncPollingRuleIds]);

  const stopPolling = useCallback((ruleId: string) => {
    pollingRulesRef.current.delete(ruleId);
    syncPollingRuleIds();
    setPolledStatusMap(prev => {
      const next = { ...prev };
      delete next[ruleId];
      return next;
    });
  }, [syncPollingRuleIds]);

  const isStatusStable = useCallback((status: RuleOverallStatusResponse): boolean => {
    return status.overallSyncStatus === 'synced' && status.overallRunStatus === 'running';
  }, []);

  useEffect(() => {
    const poll = async () => {
      const rules = pollingRulesRef.current;
      if (rules.size === 0) return;

      const now = Date.now();
      const rulesToStop: string[] = [];

      const entries = Array.from(rules.entries());
      const results = await concurrentMap(
        entries,
        async ([ruleId, rule]) => {
          if (now - rule.startTime > POLLING_TIMEOUT) {
            return { ruleId, timedOut: true } as const;
          }
          try {
            const status = await getRuleOverallStatus(ruleId);
            return { ruleId, status, timedOut: false } as const;
          } catch {
            return { ruleId, timedOut: false } as const;
          }
        },
        3
      );

      const statusUpdates: Record<string, RuleOverallStatusResponse> = {};
      for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        const { ruleId, timedOut } = result.value;
        if (timedOut) {
          rulesToStop.push(ruleId);
          continue;
        }
        if ('status' in result.value && result.value.status) {
          statusUpdates[ruleId] = result.value.status;
          if (isStatusStable(result.value.status)) {
            rulesToStop.push(ruleId);
          }
        }
      }

      if (Object.keys(statusUpdates).length > 0) {
        setPolledStatusMap(prev => ({ ...prev, ...statusUpdates }));
      }

      if (rulesToStop.length > 0) {
        for (const ruleId of rulesToStop) {
          pollingRulesRef.current.delete(ruleId);
        }
        syncPollingRuleIds();
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isStatusStable, syncPollingRuleIds]);

  return {
    polledStatusMap,
    pollingRuleIds,
    startPolling,
    stopPolling,
    isPolling: (ruleId: string) => pollingRulesRef.current.has(ruleId),
  };
};
