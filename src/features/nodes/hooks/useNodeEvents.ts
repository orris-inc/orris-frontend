/**
 * useNodeEvents Hook
 * SSE subscription for real-time node events
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-client';
import { subscribeNodeEvents } from '@/api/node';
import type { NodeEvent, Node, NodeSystemStatus } from '@/api/node';
import type { ListResponse } from '@/shared/types/api.types';

interface UseNodeEventsOptions {
  /** Specific node IDs to subscribe to (omit for all nodes) */
  nodeIds?: string[];
  /** Enable/disable the subscription */
  enabled?: boolean;
}

/**
 * Hook to subscribe to real-time node events via SSE
 * Automatically updates TanStack Query cache when events are received
 */
export function useNodeEvents(options: UseNodeEventsOptions = {}) {
  const { nodeIds, enabled = true } = options;
  const queryClient = useQueryClient();
  const cleanupRef = useRef<(() => void) | null>(null);

  // Update node in all list caches
  const updateNodeInCache = useCallback(
    (nodeId: string, updater: (node: Node) => Node) => {
      // Get all node list queries from cache
      const queries = queryClient.getQueriesData<ListResponse<Node>>({
        queryKey: queryKeys.nodes.lists(),
      });

      // Update each query cache
      queries.forEach(([queryKey, data]) => {
        if (!data?.items) return;

        const updatedItems = data.items.map((node: Node) =>
          node.id === nodeId ? updater(node) : node
        );

        // Only update if something changed
        const hasChange = data.items.some(
          (node: Node, i: number) => node.id === nodeId && node !== updatedItems[i]
        );

        if (hasChange) {
          queryClient.setQueryData<ListResponse<Node>>(queryKey, {
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
    (event: NodeEvent) => {
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
            updateNodeInCache(event.agentId, (node) => ({
              ...node,
              isOnline: true,
              lastSeenAt: new Date(event.timestamp * 1000).toISOString(),
              systemStatus: event.data as NodeSystemStatus,
            }));
          }
          break;

        case 'node:updated':
          // Node was updated (e.g., agent update completed), invalidate to refresh
          queryClient.invalidateQueries({ queryKey: queryKeys.nodes.lists() });
          break;
      }
    },
    [updateNodeInCache, queryClient]
  );

  // Handle SSE errors
  const handleError = useCallback((error: Event) => {
    console.error('Node SSE connection error:', error);
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
    const params = nodeIds?.length ? { nodeIds: nodeIds.join(',') } : undefined;

    // Subscribe to SSE events with new options-based API
    cleanupRef.current = subscribeNodeEvents(params, {
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
  }, [enabled, nodeIds, handleEvent, handleError]);
}
