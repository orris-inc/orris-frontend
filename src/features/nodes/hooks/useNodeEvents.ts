/**
 * useNodeEvents Hook
 * SSE subscription for real-time node events
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-client';
import { subscribeNodeEvents } from '@/api/node';
import { convertSnakeToCamel } from '@/shared/utils/case-converter';
import type { NodeEvent, Node, NodeSystemStatus, NodeBatchStatusEvent } from '@/api/node';
import type { ListResponse } from '@/shared/types/api.types';

interface UseNodeEventsOptions {
  /** Specific node IDs to subscribe to (omit for all nodes) */
  nodeIds?: string[];
  /** Enable/disable the subscription */
  enabled?: boolean;
}

interface UseNodeDetailEventsOptions {
  /** Node ID to subscribe to */
  nodeId: string | null;
  /** Enable/disable the subscription */
  enabled?: boolean;
  /** Callback when status is updated */
  onStatusUpdate?: (status: NodeSystemStatus) => void;
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
          // Node was updated (e.g., agent update completed), invalidate to refresh
          queryClient.invalidateQueries({ queryKey: queryKeys.nodes.lists() });
          break;

        case 'nodes:status': {
          // Batch status event - update multiple nodes at once
          const batchEvent = event as unknown as NodeBatchStatusEvent;
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

/**
 * Hook for detail dialog to subscribe to a single node's real-time events
 * Returns the latest status and handles SSE subscription lifecycle
 */
export function useNodeDetailEvents(options: UseNodeDetailEventsOptions) {
  const { nodeId, enabled = true, onStatusUpdate } = options;
  const cleanupRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<NodeSystemStatus | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Handle incoming SSE events for this specific node
  const handleEvent = useCallback(
    (event: NodeEvent) => {
      // Only process events for our node
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
          break;

        case 'node:status':
          if (event.data) {
            const convertedStatus = convertSnakeToCamel<NodeSystemStatus>(event.data);
            setStatus(convertedStatus);
            setIsOnline(true);
            if (onStatusUpdate) {
              onStatusUpdate(convertedStatus);
            }
          }
          break;

        case 'nodes:status': {
          // Batch status event - check if our node is included
          const batchEvent = event as unknown as NodeBatchStatusEvent;
          const nodeData = batchEvent.agents[nodeId!];
          if (nodeData?.status) {
            const convertedStatus = convertSnakeToCamel<NodeSystemStatus>(nodeData.status);
            setStatus(convertedStatus);
            setIsOnline(true);
            if (onStatusUpdate) {
              onStatusUpdate(convertedStatus);
            }
          }
          break;
        }
      }
    },
    [nodeId, onStatusUpdate]
  );

  // Handle SSE errors
  const handleError = useCallback((error: Event) => {
    console.error('Node detail SSE connection error:', error);
  }, []);

  // Handle connection open
  const handleOpen = useCallback(() => {
    setIsConnected(true);
  }, []);

  // Handle connection close
  const handleClose = useCallback(() => {
    setIsConnected(false);
  }, []);

  // Manage SSE subscription lifecycle
  useEffect(() => {
    if (!enabled || !nodeId) {
      // Clean up if disabled or no node ID
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      setStatus(null);
      setIsOnline(false);
      setIsConnected(false);
      return;
    }

    // Subscribe to SSE events for this specific node
    cleanupRef.current = subscribeNodeEvents(
      { nodeIds: nodeId },
      {
        onOpen: handleOpen,
        onEvent: handleEvent,
        onError: handleError,
        onClose: handleClose,
      }
    );

    // Cleanup on unmount or when deps change
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [enabled, nodeId, handleEvent, handleError, handleOpen, handleClose]);

  return {
    /** Current system status from SSE */
    status,
    /** Whether the node is online */
    isOnline,
    /** Whether SSE connection is established */
    isConnected,
  };
}
