/**
 * useForwardRules Hook
 * Implemented using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
  probeRule,
  getRuleOverallStatus,
  type ForwardRule,
  type ForwardAgent,
  type CreateForwardRuleRequest,
  type UpdateForwardRuleRequest,
  type ListForwardRulesParams,
  type ProbeRuleRequest,
  type RuleOverallStatusResponse,
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
  /** Include user-created rules in the list (default: false - only admin-created rules) */
  includeUserRules?: boolean;
}

export const useForwardRules = (options: UseForwardRulesOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true, includeUserRules } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

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
    queryKey: forwardRulesQueryKeys.list(params),
    queryFn: () => listForwardRules(params),
    enabled,
  });

  // Create forward rule
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

  // Update forward rule
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

  // Delete forward rule
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

  // Enable forward rule
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

  // Disable forward rule
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

  // Reset traffic
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

  // Probe rule
  const probeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data?: ProbeRuleRequest }) =>
      probeRule(id, data),
    onError: (error) => {
      showError(handleApiError(error));
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

    // Mutation status
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isEnabling: enableMutation.isPending,
    isDisabling: disableMutation.isPending,
    isResettingTraffic: resetTrafficMutation.isPending,
    isProbing: probeMutation.isPending,
  };
};

// Get single forward rule details
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
  const [filters, setFilters] = useState<ForwardRuleFilters>({});
  const [includeUserRules, setIncludeUserRules] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ForwardRule | null>(null);

  const rulesQuery = useForwardRules({ page, pageSize, filters, includeUserRules });

  // Get all forward agents to build agentId -> agent mapping
  // Load simultaneously with rules list to avoid showing ID first then name
  const { data: agentsData, isLoading: isAgentsLoading } = useQuery({
    queryKey: forwardAgentsQueryKeys.list({ pageSize: 100 }),
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
    setSelectedRule,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
    handleIncludeUserRulesChange,
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

      const results = await Promise.allSettled(
        uniqueRuleIds.map((ruleId) => getRuleOverallStatus(ruleId))
      );

      // Build ruleId -> status mapping
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
  const [pollingRules, setPollingRules] = useState<Map<string, PollingRule>>(new Map());
  const [polledStatusMap, setPolledStatusMap] = useState<Record<string, RuleOverallStatusResponse>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start polling for a specific rule
  const startPolling = useCallback((ruleId: string) => {
    setPollingRules(prev => {
      const next = new Map(prev);
      next.set(ruleId, { ruleId, startTime: Date.now() });
      return next;
    });
  }, []);

  // Stop polling for a specific rule
  const stopPolling = useCallback((ruleId: string) => {
    setPollingRules(prev => {
      const next = new Map(prev);
      next.delete(ruleId);
      return next;
    });
    // Also clear the polled status for this rule
    setPolledStatusMap(prev => {
      const next = { ...prev };
      delete next[ruleId];
      return next;
    });
  }, []);

  // Check if status is stable (synced + running)
  const isStatusStable = useCallback((status: RuleOverallStatusResponse): boolean => {
    return status.overallSyncStatus === 'synced' && status.overallRunStatus === 'running';
  }, []);

  // Polling logic
  useEffect(() => {
    if (pollingRules.size === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const poll = async () => {
      const now = Date.now();
      const rulesToStop: string[] = [];

      for (const [ruleId, rule] of pollingRules) {
        // Check timeout
        if (now - rule.startTime > POLLING_TIMEOUT) {
          rulesToStop.push(ruleId);
          continue;
        }

        try {
          const status = await getRuleOverallStatus(ruleId);
          setPolledStatusMap(prev => ({ ...prev, [ruleId]: status }));

          // Check if status is stable
          if (isStatusStable(status)) {
            rulesToStop.push(ruleId);
          }
        } catch {
          // Ignore errors, continue polling
        }
      }

      // Stop polling for stable/timeout rules
      if (rulesToStop.length > 0) {
        setPollingRules(prev => {
          const next = new Map(prev);
          for (const ruleId of rulesToStop) {
            next.delete(ruleId);
          }
          return next;
        });
      }
    };

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pollingRules, isStatusStable]);

  return {
    polledStatusMap,
    pollingRuleIds: Array.from(pollingRules.keys()),
    startPolling,
    stopPolling,
    isPolling: (ruleId: string) => pollingRules.has(ruleId),
  };
};
