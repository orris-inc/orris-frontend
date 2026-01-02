/**
 * useForwardAgentEvents Hook
 * SSE subscription for real-time forward agent events
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-client';
import { subscribeForwardAgentEvents } from '@/api/forward';
import { convertSnakeToCamel } from '@/shared/utils/case-converter';
import type { ForwardAgentEvent, ForwardAgent, AgentSystemStatus, ForwardAgentBatchStatusEvent } from '@/api/forward';
import type { ListResponse } from '@/shared/types/api.types';

interface UseForwardAgentEventsOptions {
  /** Specific agent IDs to subscribe to (omit for all agents) */
  agentIds?: string[];
  /** Enable/disable the subscription */
  enabled?: boolean;
}

/**
 * Hook to subscribe to real-time forward agent events via SSE
 * Automatically updates TanStack Query cache when events are received
 */
export function useForwardAgentEvents(options: UseForwardAgentEventsOptions = {}) {
  const { agentIds, enabled = true } = options;
  const queryClient = useQueryClient();
  const cleanupRef = useRef<(() => void) | null>(null);

  // Update agent in all list caches
  const updateAgentInCache = useCallback(
    (agentId: string, updater: (agent: ForwardAgent) => ForwardAgent) => {
      // Get all forward agent list queries from cache
      const queries = queryClient.getQueriesData<ListResponse<ForwardAgent>>({
        queryKey: queryKeys.forwardAgents.lists(),
      });

      // Update each query cache
      queries.forEach(([queryKey, data]) => {
        if (!data?.items) return;

        const updatedItems = data.items.map((agent: ForwardAgent) =>
          agent.id === agentId ? updater(agent) : agent
        );

        // Only update if something changed
        const hasChange = data.items.some(
          (agent: ForwardAgent, i: number) => agent.id === agentId && agent !== updatedItems[i]
        );

        if (hasChange) {
          queryClient.setQueryData<ListResponse<ForwardAgent>>(queryKey, {
            ...data,
            items: updatedItems,
          });
        }
      });
    },
    [queryClient]
  );

  // Handle incoming SSE events
  const handleEvent = useCallback(
    (event: ForwardAgentEvent) => {
      switch (event.type) {
        case 'agent:online':
          updateAgentInCache(event.agentId, (agent) => ({
            ...agent,
            systemStatus: agent.systemStatus ?? ({} as AgentSystemStatus),
            lastSeenAt: new Date(event.timestamp * 1000).toISOString(),
          }));
          break;

        case 'agent:offline':
          updateAgentInCache(event.agentId, (agent) => ({
            ...agent,
            systemStatus: undefined,
            lastSeenAt: new Date(event.timestamp * 1000).toISOString(),
          }));
          break;

        case 'agent:status':
          if (event.data) {
            const convertedStatus = convertSnakeToCamel<AgentSystemStatus>(event.data);
            updateAgentInCache(event.agentId, (agent) => ({
              ...agent,
              lastSeenAt: new Date(event.timestamp * 1000).toISOString(),
              systemStatus: convertedStatus,
            }));
          }
          break;

        case 'agent:updated':
          // Agent was updated (e.g., agent update completed), invalidate to refresh
          queryClient.invalidateQueries({ queryKey: queryKeys.forwardAgents.lists() });
          break;

        case 'agents:status': {
          // Batch status event - update multiple agents at once
          const batchEvent = event as unknown as ForwardAgentBatchStatusEvent;
          Object.entries(batchEvent.agents).forEach(([agentId, statusData]) => {
            if (statusData.status) {
              const convertedStatus = convertSnakeToCamel<AgentSystemStatus>(statusData.status);
              updateAgentInCache(agentId, (agent) => ({
                ...agent,
                lastSeenAt: new Date(batchEvent.timestamp * 1000).toISOString(),
                systemStatus: convertedStatus,
              }));
            }
          });
          break;
        }
      }
    },
    [updateAgentInCache, queryClient]
  );

  // Handle SSE errors
  const handleError = useCallback((error: Event) => {
    console.error('Forward agent SSE connection error:', error);
  }, []);

  // Manage SSE subscription lifecycle
  useEffect(() => {
    if (!enabled) {
      // Clean up if disabled
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      return;
    }

    // Build params
    const params = agentIds?.length ? { agentIds: agentIds.join(',') } : undefined;

    // Subscribe to SSE events with new options-based API
    cleanupRef.current = subscribeForwardAgentEvents(params, {
      onEvent: handleEvent,
      onError: handleError,
    });

    // Cleanup on unmount or when deps change
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [enabled, agentIds, handleEvent, handleError]);
}
