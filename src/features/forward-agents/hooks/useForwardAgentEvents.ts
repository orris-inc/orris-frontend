/**
 * useForwardAgentEvents Hook
 * SSE subscription for real-time forward agent events with auto-reconnect
 * Updated: 2026-01-06 - Added auto-reconnect with exponential backoff
 */

import { useEffect, useRef, useCallback, useState, startTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-client';
import { subscribeForwardAgentEvents } from '@/api/forward';
import { createAutoReconnectSSE, type SSEController, type SSEConnectionState } from '@/shared/lib/sse';
import { convertSnakeToCamel } from '@/shared/utils/case-converter';
import type { ForwardAgentEvent, ForwardAgent, AgentSystemStatus, ForwardAgentBatchStatusEvent } from '@/api/forward';
import type { ListResponse } from '@/shared/types/api.types';

interface UseForwardAgentEventsOptions {
  /** Specific agent IDs to subscribe to (omit for all agents) */
  agentIds?: string[];
  /** Enable/disable the subscription */
  enabled?: boolean;
}

interface UseForwardAgentEventsReturn {
  /** Current SSE connection state */
  connectionState: SSEConnectionState;
  /** Manually trigger reconnection */
  reconnect: () => void;
}

interface UseForwardAgentDetailEventsOptions {
  /** Agent ID to subscribe to */
  agentId: string | null;
  /** Enable/disable the subscription */
  enabled?: boolean;
  /** Callback when status is updated */
  onStatusUpdate?: (status: AgentSystemStatus) => void;
}

interface UseForwardAgentDetailEventsReturn {
  /** Current system status from SSE */
  status: AgentSystemStatus | null;
  /** Whether the agent is online */
  isOnline: boolean;
  /** Whether SSE connection is established */
  isConnected: boolean;
  /** Current SSE connection state */
  connectionState: SSEConnectionState;
  /** Manually trigger reconnection */
  reconnect: () => void;
}

/**
 * Hook to subscribe to real-time forward agent events via SSE
 * Automatically updates TanStack Query cache when events are received
 * Features auto-reconnect with exponential backoff
 */
export function useForwardAgentEvents(options: UseForwardAgentEventsOptions = {}): UseForwardAgentEventsReturn {
  const { agentIds, enabled = true } = options;
  const queryClient = useQueryClient();
  const controllerRef = useRef<SSEController | null>(null);
  const [connectionState, setConnectionState] = useState<SSEConnectionState>('disconnected');

  // Use refs for callbacks to maintain stable references
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  // Update agent in all list caches - stable reference
  // Uses startTransition to mark SSE updates as low priority,
  // preventing them from interrupting user interactions (e.g., hover states)
  const updateAgentInCache = useCallback(
    (agentId: string, updater: (agent: ForwardAgent) => ForwardAgent) => {
      const qc = queryClientRef.current;
      const queries = qc.getQueriesData<ListResponse<ForwardAgent>>({
        queryKey: queryKeys.forwardAgents.lists(),
      });

      queries.forEach(([queryKey, data]) => {
        if (!data?.items) return;

        const updatedItems = data.items.map((agent: ForwardAgent) =>
          agent.id === agentId ? updater(agent) : agent
        );

        const hasChange = data.items.some(
          (agent: ForwardAgent, i: number) => agent.id === agentId && agent !== updatedItems[i]
        );

        if (hasChange) {
          // Wrap in startTransition to avoid interrupting user interactions
          startTransition(() => {
            qc.setQueryData<ListResponse<ForwardAgent>>(queryKey, {
              ...data,
              items: updatedItems,
            });
          });
        }
      });
    },
    []
  );

  // Handle incoming SSE events - stable reference
  const handleEvent = useCallback(
    (event: ForwardAgentEvent) => {
      const qc = queryClientRef.current;

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
          qc.invalidateQueries({ queryKey: queryKeys.forwardAgents.lists() });
          break;

        case 'agents:status': {
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
    [updateAgentInCache]
  );

  // Manual reconnect function
  const reconnect = useCallback(() => {
    controllerRef.current?.reconnect();
  }, []);

  // Memoize agentIds string for stable dependency
  const agentIdsKey = agentIds?.join(',') ?? '';

  // Manage SSE subscription lifecycle
  useEffect(() => {
    if (!enabled) {
      if (controllerRef.current) {
        controllerRef.current.close();
        controllerRef.current = null;
      }
      setConnectionState('disconnected');
      return;
    }

    const params = agentIdsKey ? { agentIds: agentIdsKey } : undefined;

    // Use auto-reconnect wrapper
    controllerRef.current = createAutoReconnectSSE(
      subscribeForwardAgentEvents,
      params,
      {
        onStateChange: setConnectionState,
        onEvent: handleEvent,
        onError: (error) => {
          console.error('Forward agent SSE connection error:', error);
        },
      }
    );

    return () => {
      if (controllerRef.current) {
        controllerRef.current.close();
        controllerRef.current = null;
      }
    };
  }, [enabled, agentIdsKey, handleEvent]);

  return {
    connectionState,
    reconnect,
  };
}

/**
 * Hook for detail dialog to subscribe to a single agent's real-time events
 * Returns the latest status and handles SSE subscription lifecycle
 */
export function useForwardAgentDetailEvents(options: UseForwardAgentDetailEventsOptions): UseForwardAgentDetailEventsReturn {
  const { agentId, enabled = true, onStatusUpdate } = options;
  const controllerRef = useRef<SSEController | null>(null);
  const [status, setStatus] = useState<AgentSystemStatus | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [connectionState, setConnectionState] = useState<SSEConnectionState>('disconnected');

  // Use ref for callback to maintain stable reference
  const onStatusUpdateRef = useRef(onStatusUpdate);
  onStatusUpdateRef.current = onStatusUpdate;

  // Handle incoming SSE events for this specific agent
  const handleEvent = useCallback(
    (event: ForwardAgentEvent) => {
      if (event.type !== 'agents:status' && event.agentId !== agentId) {
        return;
      }

      switch (event.type) {
        case 'agent:online':
          setIsOnline(true);
          break;

        case 'agent:offline':
          setIsOnline(false);
          setStatus(null);
          break;

        case 'agent:status':
          if (event.data) {
            const convertedStatus = convertSnakeToCamel<AgentSystemStatus>(event.data);
            setStatus(convertedStatus);
            setIsOnline(true);
            onStatusUpdateRef.current?.(convertedStatus);
          }
          break;

        case 'agents:status': {
          const batchEvent = event as unknown as ForwardAgentBatchStatusEvent;
          const agentData = batchEvent.agents[agentId!];
          if (agentData?.status) {
            const convertedStatus = convertSnakeToCamel<AgentSystemStatus>(agentData.status);
            setStatus(convertedStatus);
            setIsOnline(true);
            onStatusUpdateRef.current?.(convertedStatus);
          }
          break;
        }
      }
    },
    [agentId]
  );

  // Manual reconnect function
  const reconnect = useCallback(() => {
    controllerRef.current?.reconnect();
  }, []);

  // Manage SSE subscription lifecycle
  useEffect(() => {
    if (!enabled || !agentId) {
      if (controllerRef.current) {
        controllerRef.current.close();
        controllerRef.current = null;
      }
      setStatus(null);
      setIsOnline(false);
      setConnectionState('disconnected');
      return;
    }

    // Use auto-reconnect wrapper
    controllerRef.current = createAutoReconnectSSE(
      subscribeForwardAgentEvents,
      { agentIds: agentId },
      {
        onStateChange: setConnectionState,
        onEvent: handleEvent,
        onError: (error) => {
          console.error('Forward agent detail SSE connection error:', error);
        },
      }
    );

    return () => {
      if (controllerRef.current) {
        controllerRef.current.close();
        controllerRef.current = null;
      }
    };
  }, [enabled, agentId, handleEvent]);

  return {
    status,
    isOnline,
    isConnected: connectionState === 'connected',
    connectionState,
    reconnect,
  };
}
