/**
 * useNodeEvents Hook
 * SSE subscription for real-time node events with auto-reconnect
 * Updated: 2026-01-06 - Added auto-reconnect with exponential backoff
 */

import { useEffect, useRef, useCallback, useState, startTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-client';
import { subscribeNodeEvents } from '@/api/node';
import { createAutoReconnectSSE, type SSEController, type SSEConnectionState } from '@/shared/lib/sse';
import { convertSnakeToCamel } from '@/shared/utils/case-converter';
import type { NodeEvent, Node, NodeSystemStatus, NodeBatchStatusEvent } from '@/api/node';
import type { ListResponse } from '@/shared/types/api.types';

// SSE stream sends both individual and batch events with different structures
type NodeSSEEvent = NodeEvent | NodeBatchStatusEvent;

function isBatchNodeStatusEvent(event: NodeSSEEvent): event is NodeBatchStatusEvent {
  return event.type === 'nodes:status' && 'agents' in event;
}

interface UseNodeEventsOptions {
  /** Specific node IDs to subscribe to (omit for all nodes) */
  nodeIds?: string[];
  /** Enable/disable the subscription */
  enabled?: boolean;
}

interface UseNodeEventsReturn {
  /** Current SSE connection state */
  connectionState: SSEConnectionState;
  /** Manually trigger reconnection */
  reconnect: () => void;
}

interface UseNodeDetailEventsOptions {
  /** Node ID to subscribe to */
  nodeId: string | null;
  /** Enable/disable the subscription */
  enabled?: boolean;
  /** Callback when status is updated */
  onStatusUpdate?: (status: NodeSystemStatus) => void;
}

interface UseNodeDetailEventsReturn {
  /** Current system status from SSE */
  status: NodeSystemStatus | null;
  /** Whether the node is online */
  isOnline: boolean;
  /** Whether SSE connection is established */
  isConnected: boolean;
  /** Current SSE connection state */
  connectionState: SSEConnectionState;
  /** Manually trigger reconnection */
  reconnect: () => void;
}

/**
 * Hook to subscribe to real-time node events via SSE
 * Automatically updates TanStack Query cache when events are received
 * Features auto-reconnect with exponential backoff
 */
export function useNodeEvents(options: UseNodeEventsOptions = {}): UseNodeEventsReturn {
  const { nodeIds, enabled = true } = options;
  const queryClient = useQueryClient();
  const controllerRef = useRef<SSEController | null>(null);
  const [connectionState, setConnectionState] = useState<SSEConnectionState>('disconnected');

  // Use refs for callbacks to maintain stable references
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  // Update node in all list caches - stable reference
  // Uses startTransition to mark SSE updates as low priority,
  // preventing them from interrupting user interactions (e.g., hover states)
  const updateNodeInCache = useCallback(
    (nodeId: string, updater: (node: Node) => Node) => {
      const qc = queryClientRef.current;
      const queries = qc.getQueriesData<ListResponse<Node>>({
        queryKey: queryKeys.nodes.lists(),
      });

      queries.forEach(([queryKey, data]) => {
        if (!data?.items) return;

        const updatedItems = data.items.map((node: Node) =>
          node.id === nodeId ? updater(node) : node
        );

        const hasChange = data.items.some(
          (node: Node, i: number) => node.id === nodeId && node !== updatedItems[i]
        );

        if (hasChange) {
          // Wrap in startTransition to avoid interrupting user interactions
          startTransition(() => {
            qc.setQueryData<ListResponse<Node>>(queryKey, {
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
    (event: NodeEvent) => {
      const qc = queryClientRef.current;

      switch (event.type) {
        case 'node:online':
          updateNodeInCache(event.agentId, (node) => ({
            ...node,
            isOnline: true,
            lastSeenAt: new Date(event.timestamp * 1000).toISOString(),
          }));
          break;

        case 'node:offline':
          updateNodeInCache(event.agentId, (node) => ({
            ...node,
            isOnline: false,
            lastSeenAt: new Date(event.timestamp * 1000).toISOString(),
          }));
          break;

        case 'node:status':
          if (event.data) {
            const convertedStatus = convertSnakeToCamel<NodeSystemStatus>(event.data);
            updateNodeInCache(event.agentId, (node) => ({
              ...node,
              isOnline: true,
              lastSeenAt: new Date(event.timestamp * 1000).toISOString(),
              systemStatus: convertedStatus,
            }));
          }
          break;

        case 'node:updated':
          qc.invalidateQueries({ queryKey: queryKeys.nodes.lists() });
          break;

        case 'nodes:status': {
          const sseEvent: NodeSSEEvent = event;
          if (!isBatchNodeStatusEvent(sseEvent)) break;
          const batchEvent = sseEvent;
          Object.entries(batchEvent.agents).forEach(([nodeId, statusData]) => {
            if (statusData.status) {
              const convertedStatus = convertSnakeToCamel<NodeSystemStatus>(statusData.status);
              updateNodeInCache(nodeId, (node) => ({
                ...node,
                isOnline: true,
                lastSeenAt: new Date(batchEvent.timestamp * 1000).toISOString(),
                systemStatus: convertedStatus,
              }));
            }
          });
          break;
        }
      }
    },
    [updateNodeInCache]
  );

  // Manual reconnect function
  const reconnect = useCallback(() => {
    controllerRef.current?.reconnect();
  }, []);

  // Memoize nodeIds string for stable dependency
  const nodeIdsKey = nodeIds?.join(',') ?? '';

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

    const params = nodeIdsKey ? { nodeIds: nodeIdsKey } : undefined;

    // Use auto-reconnect wrapper
    controllerRef.current = createAutoReconnectSSE(
      subscribeNodeEvents,
      params,
      {
        onStateChange: setConnectionState,
        onEvent: handleEvent,
        onError: (error) => {
          console.error('Node SSE connection error:', error);
        },
      }
    );

    return () => {
      if (controllerRef.current) {
        controllerRef.current.close();
        controllerRef.current = null;
      }
    };
  }, [enabled, nodeIdsKey, handleEvent]);

  return {
    connectionState,
    reconnect,
  };
}

/**
 * Check if two NodeSystemStatus objects are equal (shallow comparison of key fields)
 * Only compares fields that affect UI rendering to avoid unnecessary re-renders
 */
function isStatusEqual(a: NodeSystemStatus | null, b: NodeSystemStatus | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  // Compare key numeric fields with tolerance for floating point
  const numericFields = [
    'cpuPercent', 'memoryPercent', 'diskPercent',
    'networkRxRate', 'networkTxRate',
    'tcpConnections', 'udpConnections', 'uptimeSeconds',
  ] as const;

  for (const field of numericFields) {
    const aVal = a[field];
    const bVal = b[field];
    if (aVal !== bVal) {
      // Allow small differences for percentages (less than 0.5%)
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        if (Math.abs(aVal - bVal) > 0.5) return false;
      } else {
        return false;
      }
    }
  }

  // Compare string fields
  const stringFields = ['agentVersion', 'platform', 'arch', 'publicIpv4', 'publicIpv6'] as const;
  for (const field of stringFields) {
    if (a[field] !== b[field]) return false;
  }

  return true;
}

/**
 * Hook for detail dialog to subscribe to a single node's real-time events
 * Returns the latest status and handles SSE subscription lifecycle
 */
export function useNodeDetailEvents(options: UseNodeDetailEventsOptions): UseNodeDetailEventsReturn {
  const { nodeId, enabled = true, onStatusUpdate } = options;
  const controllerRef = useRef<SSEController | null>(null);
  const [status, setStatus] = useState<NodeSystemStatus | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [connectionState, setConnectionState] = useState<SSEConnectionState>('disconnected');

  // Use refs for stable references and avoiding unnecessary re-renders
  const onStatusUpdateRef = useRef(onStatusUpdate);
  onStatusUpdateRef.current = onStatusUpdate;
  const statusRef = useRef<NodeSystemStatus | null>(null);

  // Handle incoming SSE events for this specific node
  const handleEvent = useCallback(
    (event: NodeEvent) => {
      if (event.type !== 'nodes:status' && event.agentId !== nodeId) {
        return;
      }

      switch (event.type) {
        case 'node:online':
          setIsOnline(true);
          break;

        case 'node:offline':
          setIsOnline(false);
          setStatus(null);
          statusRef.current = null;
          break;

        case 'node:status':
          if (event.data) {
            const convertedStatus = convertSnakeToCamel<NodeSystemStatus>(event.data);
            // Only update state if status actually changed
            if (!isStatusEqual(statusRef.current, convertedStatus)) {
              statusRef.current = convertedStatus;
              setStatus(convertedStatus);
              onStatusUpdateRef.current?.(convertedStatus);
            }
            setIsOnline(true);
          }
          break;

        case 'nodes:status': {
          const sseEvent: NodeSSEEvent = event;
          if (!isBatchNodeStatusEvent(sseEvent)) break;
          const batchEvent = sseEvent;
          const nodeData = batchEvent.agents[nodeId!];
          if (nodeData?.status) {
            const convertedStatus = convertSnakeToCamel<NodeSystemStatus>(nodeData.status);
            // Only update state if status actually changed
            if (!isStatusEqual(statusRef.current, convertedStatus)) {
              statusRef.current = convertedStatus;
              setStatus(convertedStatus);
              onStatusUpdateRef.current?.(convertedStatus);
            }
            setIsOnline(true);
          }
          break;
        }
      }
    },
    [nodeId]
  );

  // Manual reconnect function
  const reconnect = useCallback(() => {
    controllerRef.current?.reconnect();
  }, []);

  // Manage SSE subscription lifecycle
  useEffect(() => {
    if (!enabled || !nodeId) {
      if (controllerRef.current) {
        controllerRef.current.close();
        controllerRef.current = null;
      }
      statusRef.current = null;
      setStatus(null);
      setIsOnline(false);
      setConnectionState('disconnected');
      return;
    }

    // Use auto-reconnect wrapper
    // Subscribe to all nodes to receive batch status events, filter by nodeId in handleEvent
    controllerRef.current = createAutoReconnectSSE(
      subscribeNodeEvents,
      undefined,
      {
        onStateChange: setConnectionState,
        onEvent: handleEvent,
        onError: (error) => {
          console.error('Node detail SSE connection error:', error);
        },
      }
    );

    return () => {
      if (controllerRef.current) {
        controllerRef.current.close();
        controllerRef.current = null;
      }
    };
  }, [enabled, nodeId, handleEvent]);

  return {
    status,
    isOnline,
    isConnected: connectionState === 'connected',
    connectionState,
    reconnect,
  };
}
