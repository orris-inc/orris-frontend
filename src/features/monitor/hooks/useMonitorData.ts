/**
 * useMonitorData Hook
 * Combined SSE subscription for real-time monitoring dashboard
 * Aggregates node and forward agent events with historical tracking
 *
 * Performance optimizations:
 * - High-frequency data stored in refs to avoid React re-renders
 * - Throttled state updates (500ms) for UI synchronization
 * - Stable callback references via ref-based getters
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { subscribeNodeEvents } from '@/api/node';
import { subscribeForwardAgentEvents } from '@/api/forward';
import { convertSnakeToCamel } from '@/shared/utils/case-converter';
import type { NodeEvent, NodeSystemStatus, NodeBatchStatusEvent } from '@/api/node';
import type { ForwardAgentEvent, AgentSystemStatus, ForwardAgentBatchStatusEvent } from '@/api/forward';

// Maximum number of data points to keep for charts
const MAX_CHART_POINTS = 60;
// Maximum number of events to keep in log
const MAX_EVENT_LOG = 100;
// Throttle interval for state updates (ms)
// 1000ms for real-time experience
const STATE_UPDATE_INTERVAL = 1000;
// Moving average window size for data smoothing
const SMOOTHING_WINDOW = 5;

/**
 * Apply moving average smoothing to chart data
 * Reduces noise and sudden spikes in the data
 */
function smoothChartData(data: EntityChartDataPoint[]): EntityChartDataPoint[] {
  if (data.length < SMOOTHING_WINDOW) return data;

  return data.map((point, index) => {
    if (index < SMOOTHING_WINDOW - 1) return point;

    // Calculate moving average for numeric fields
    let cpuSum = 0, memSum = 0, diskSum = 0, rxSum = 0, txSum = 0;
    for (let i = 0; i < SMOOTHING_WINDOW; i++) {
      const p = data[index - i];
      cpuSum += p.cpu;
      memSum += p.memory;
      diskSum += p.disk;
      rxSum += p.networkRxRate;
      txSum += p.networkTxRate;
    }

    return {
      timestamp: point.timestamp,
      cpu: cpuSum / SMOOTHING_WINDOW,
      memory: memSum / SMOOTHING_WINDOW,
      disk: diskSum / SMOOTHING_WINDOW,
      networkRxRate: rxSum / SMOOTHING_WINDOW,
      networkTxRate: txSum / SMOOTHING_WINDOW,
    };
  });
}

/** Event log entry */
export interface MonitorEvent {
  id: string;
  timestamp: number;
  type: 'node' | 'agent';
  eventType: string;
  agentId: string;
  agentName?: string;
  message: string;
}

/** Aggregated status for a single entity */
export interface EntityStatus {
  id: string;
  name?: string;
  type: 'node' | 'agent';
  isOnline: boolean;
  lastSeenAt: number;
  status: NodeSystemStatus | AgentSystemStatus | null;
}

/** Chart data point for single entity */
export interface EntityChartDataPoint {
  timestamp: number;
  cpu: number;
  memory: number;
  disk: number;
  networkRxRate: number;
  networkTxRate: number;
}

/** Chart data point (aggregated - deprecated, kept for compatibility) */
export interface ChartDataPoint {
  timestamp: number;
  cpuAvg: number;
  memoryAvg: number;
  diskAvg: number;
  networkRxRate: number;
  networkTxRate: number;
  onlineNodes: number;
  onlineAgents: number;
}

/** Overview statistics */
export interface MonitorOverview {
  totalNodes: number;
  onlineNodes: number;
  totalAgents: number;
  onlineAgents: number;
  avgCpu: number;
  avgMemory: number;
  avgDisk: number;
  totalNetworkRxRate: number;
  totalNetworkTxRate: number;
}

interface UseMonitorDataOptions {
  enabled?: boolean;
}

export function useMonitorData(options: UseMonitorDataOptions = {}) {
  const { enabled = true } = options;
  const nodeCleanupRef = useRef<(() => void) | null>(null);
  const agentCleanupRef = useRef<(() => void) | null>(null);

  // ============ High-frequency data in refs (no React re-renders) ============
  const nodeStatusesRef = useRef<Map<string, EntityStatus>>(new Map());
  const agentStatusesRef = useRef<Map<string, EntityStatus>>(new Map());
  const entityChartHistoryRef = useRef<Map<string, EntityChartDataPoint[]>>(new Map());
  const eventLogRef = useRef<MonitorEvent[]>([]);
  const updateVersionRef = useRef(0); // Increment on data change to trigger sync

  // ============ Throttled state for UI rendering ============
  const [nodeStatuses, setNodeStatuses] = useState<Map<string, EntityStatus>>(new Map());
  const [agentStatuses, setAgentStatuses] = useState<Map<string, EntityStatus>>(new Map());
  const [eventLog, setEventLog] = useState<MonitorEvent[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // SSE connection status
  const [isConnected, setIsConnected] = useState(false);

  // ============ Throttled state sync using requestAnimationFrame ============
  useEffect(() => {
    if (!enabled) return;

    let rafId: number;
    let lastSyncTime = 0;

    const syncToState = (timestamp: number) => {
      // Throttle updates to STATE_UPDATE_INTERVAL
      if (timestamp - lastSyncTime >= STATE_UPDATE_INTERVAL) {
        lastSyncTime = timestamp;
        // Copy refs to state for UI rendering
        setNodeStatuses(new Map(nodeStatusesRef.current));
        setAgentStatuses(new Map(agentStatusesRef.current));
        setEventLog([...eventLogRef.current]);
      }
      rafId = requestAnimationFrame(syncToState);
    };

    // Start the animation frame loop
    rafId = requestAnimationFrame(syncToState);

    return () => cancelAnimationFrame(rafId);
  }, [enabled]);

  // Add event to log (ref-based, no re-render)
  const addEventToLog = useCallback((event: MonitorEvent) => {
    eventLogRef.current = [event, ...eventLogRef.current].slice(0, MAX_EVENT_LOG);
    updateVersionRef.current++;
  }, []);

  // Generate event message
  const getEventMessage = useCallback((type: 'node' | 'agent', eventType: string, name?: string): string => {
    const entityName = type === 'node' ? 'Node Agent' : '转发 Agent';
    const displayName = name || 'Unknown';

    switch (eventType) {
      case 'node:online':
      case 'agent:online':
        return `${entityName} ${displayName} 上线`;
      case 'node:offline':
      case 'agent:offline':
        return `${entityName} ${displayName} 离线`;
      case 'node:status':
      case 'agent:status':
        return `${entityName} ${displayName} 状态更新`;
      case 'node:updated':
      case 'agent:updated':
        return `${entityName} ${displayName} 配置已更新`;
      default:
        return `${entityName} ${displayName} 事件`;
    }
  }, []);

  // Handle node events (ref-based, no re-render)
  const handleNodeEvent = useCallback((event: NodeEvent) => {
    const eventId = `node-${event.agentId}-${event.timestamp}-${Math.random().toString(36).slice(2, 8)}`;

    switch (event.type) {
      case 'node:online': {
        const existing = nodeStatusesRef.current.get(event.agentId);
        nodeStatusesRef.current.set(event.agentId, {
          id: event.agentId,
          name: event.agentName || existing?.name,
          type: 'node',
          isOnline: true,
          lastSeenAt: event.timestamp,
          status: existing?.status ?? null,
        });
        addEventToLog({
          id: eventId,
          timestamp: event.timestamp,
          type: 'node',
          eventType: event.type,
          agentId: event.agentId,
          agentName: event.agentName,
          message: getEventMessage('node', event.type, event.agentName),
        });
        break;
      }

      case 'node:offline': {
        const existing = nodeStatusesRef.current.get(event.agentId);
        nodeStatusesRef.current.set(event.agentId, {
          id: event.agentId,
          name: event.agentName || existing?.name,
          type: 'node',
          isOnline: false,
          lastSeenAt: event.timestamp,
          status: null,
        });
        addEventToLog({
          id: eventId,
          timestamp: event.timestamp,
          type: 'node',
          eventType: event.type,
          agentId: event.agentId,
          agentName: event.agentName,
          message: getEventMessage('node', event.type, event.agentName),
        });
        break;
      }

      case 'node:status':
        if (event.data) {
          const convertedStatus = convertSnakeToCamel<NodeSystemStatus>(event.data);
          const existing = nodeStatusesRef.current.get(event.agentId);
          nodeStatusesRef.current.set(event.agentId, {
            id: event.agentId,
            name: event.agentName || existing?.name,
            type: 'node',
            isOnline: true,
            lastSeenAt: event.timestamp,
            status: convertedStatus,
          });
          // Record per-entity chart history
          const chartHistory = entityChartHistoryRef.current.get(event.agentId) ?? [];
          const newPoint: EntityChartDataPoint = {
            timestamp: event.timestamp,
            cpu: convertedStatus.cpuPercent ?? 0,
            memory: convertedStatus.memoryPercent ?? 0,
            disk: convertedStatus.diskPercent ?? 0,
            networkRxRate: convertedStatus.networkRxRate ?? 0,
            networkTxRate: convertedStatus.networkTxRate ?? 0,
          };
          entityChartHistoryRef.current.set(
            event.agentId,
            [...chartHistory, newPoint].slice(-MAX_CHART_POINTS)
          );
        }
        break;

      case 'nodes:status': {
        const batchEvent = event as unknown as NodeBatchStatusEvent;
        Object.entries(batchEvent.agents).forEach(([nodeId, statusData]) => {
          if (statusData.status) {
            const convertedStatus = convertSnakeToCamel<NodeSystemStatus>(statusData.status);
            const existing = nodeStatusesRef.current.get(nodeId);
            nodeStatusesRef.current.set(nodeId, {
              id: nodeId,
              name: statusData.name || existing?.name,
              type: 'node',
              isOnline: true,
              lastSeenAt: batchEvent.timestamp,
              status: convertedStatus,
            });
            // Record per-entity chart history
            const chartHistory = entityChartHistoryRef.current.get(nodeId) ?? [];
            const newPoint: EntityChartDataPoint = {
              timestamp: batchEvent.timestamp,
              cpu: convertedStatus.cpuPercent ?? 0,
              memory: convertedStatus.memoryPercent ?? 0,
              disk: convertedStatus.diskPercent ?? 0,
              networkRxRate: convertedStatus.networkRxRate ?? 0,
              networkTxRate: convertedStatus.networkTxRate ?? 0,
            };
            entityChartHistoryRef.current.set(
              nodeId,
              [...chartHistory, newPoint].slice(-MAX_CHART_POINTS)
            );
          }
        });
        break;
      }
    }
    updateVersionRef.current++;
  }, [addEventToLog, getEventMessage]);

  // Handle forward agent events (ref-based, no re-render)
  const handleAgentEvent = useCallback((event: ForwardAgentEvent) => {
    const eventId = `agent-${event.agentId}-${event.timestamp}-${Math.random().toString(36).slice(2, 8)}`;

    switch (event.type) {
      case 'agent:online': {
        const existing = agentStatusesRef.current.get(event.agentId);
        agentStatusesRef.current.set(event.agentId, {
          id: event.agentId,
          name: event.agentName || existing?.name,
          type: 'agent',
          isOnline: true,
          lastSeenAt: event.timestamp,
          status: existing?.status ?? null,
        });
        addEventToLog({
          id: eventId,
          timestamp: event.timestamp,
          type: 'agent',
          eventType: event.type,
          agentId: event.agentId,
          agentName: event.agentName,
          message: getEventMessage('agent', event.type, event.agentName),
        });
        break;
      }

      case 'agent:offline': {
        const existing = agentStatusesRef.current.get(event.agentId);
        agentStatusesRef.current.set(event.agentId, {
          id: event.agentId,
          name: event.agentName || existing?.name,
          type: 'agent',
          isOnline: false,
          lastSeenAt: event.timestamp,
          status: null,
        });
        addEventToLog({
          id: eventId,
          timestamp: event.timestamp,
          type: 'agent',
          eventType: event.type,
          agentId: event.agentId,
          agentName: event.agentName,
          message: getEventMessage('agent', event.type, event.agentName),
        });
        break;
      }

      case 'agent:status':
        if (event.data) {
          const convertedStatus = convertSnakeToCamel<AgentSystemStatus>(event.data);
          const existing = agentStatusesRef.current.get(event.agentId);
          agentStatusesRef.current.set(event.agentId, {
            id: event.agentId,
            name: event.agentName || existing?.name,
            type: 'agent',
            isOnline: true,
            lastSeenAt: event.timestamp,
            status: convertedStatus,
          });
          // Record per-entity chart history
          const chartHistory = entityChartHistoryRef.current.get(event.agentId) ?? [];
          const newPoint: EntityChartDataPoint = {
            timestamp: event.timestamp,
            cpu: convertedStatus.cpuPercent ?? 0,
            memory: convertedStatus.memoryPercent ?? 0,
            disk: convertedStatus.diskPercent ?? 0,
            networkRxRate: convertedStatus.networkRxRate ?? 0,
            networkTxRate: convertedStatus.networkTxRate ?? 0,
          };
          entityChartHistoryRef.current.set(
            event.agentId,
            [...chartHistory, newPoint].slice(-MAX_CHART_POINTS)
          );
        }
        break;

      case 'agents:status': {
        const batchEvent = event as unknown as ForwardAgentBatchStatusEvent;
        Object.entries(batchEvent.agents).forEach(([agentId, statusData]) => {
          if (statusData.status) {
            const convertedStatus = convertSnakeToCamel<AgentSystemStatus>(statusData.status);
            const existing = agentStatusesRef.current.get(agentId);
            agentStatusesRef.current.set(agentId, {
              id: agentId,
              name: statusData.name || existing?.name,
              type: 'agent',
              isOnline: true,
              lastSeenAt: batchEvent.timestamp,
              status: convertedStatus,
            });
            // Record per-entity chart history
            const chartHistory = entityChartHistoryRef.current.get(agentId) ?? [];
            const newPoint: EntityChartDataPoint = {
              timestamp: batchEvent.timestamp,
              cpu: convertedStatus.cpuPercent ?? 0,
              memory: convertedStatus.memoryPercent ?? 0,
              disk: convertedStatus.diskPercent ?? 0,
              networkRxRate: convertedStatus.networkRxRate ?? 0,
              networkTxRate: convertedStatus.networkTxRate ?? 0,
            };
            entityChartHistoryRef.current.set(
              agentId,
              [...chartHistory, newPoint].slice(-MAX_CHART_POINTS)
            );
          }
        });
        break;
      }
    }
    updateVersionRef.current++;
  }, [addEventToLog, getEventMessage]);

  // Calculate overview statistics
  const overview = useMemo<MonitorOverview>(() => {
    const allNodeStatuses = Array.from(nodeStatuses.values());
    const allAgentStatuses = Array.from(agentStatuses.values());

    const onlineNodes = allNodeStatuses.filter(n => n.isOnline);
    const onlineAgents = allAgentStatuses.filter(a => a.isOnline);

    // Aggregate metrics from online entities
    const allOnlineStatuses = [
      ...onlineNodes.map(n => n.status as NodeSystemStatus),
      ...onlineAgents.map(a => a.status as AgentSystemStatus),
    ].filter(Boolean);

    const totalCount = allOnlineStatuses.length || 1;

    const avgCpu = allOnlineStatuses.reduce((sum, s) => sum + (s?.cpuPercent ?? 0), 0) / totalCount;
    const avgMemory = allOnlineStatuses.reduce((sum, s) => sum + (s?.memoryPercent ?? 0), 0) / totalCount;
    const avgDisk = allOnlineStatuses.reduce((sum, s) => sum + (s?.diskPercent ?? 0), 0) / totalCount;
    const totalNetworkRxRate = allOnlineStatuses.reduce((sum, s) => sum + (s?.networkRxRate ?? 0), 0);
    const totalNetworkTxRate = allOnlineStatuses.reduce((sum, s) => sum + (s?.networkTxRate ?? 0), 0);

    return {
      totalNodes: allNodeStatuses.length,
      onlineNodes: onlineNodes.length,
      totalAgents: allAgentStatuses.length,
      onlineAgents: onlineAgents.length,
      avgCpu,
      avgMemory,
      avgDisk,
      totalNetworkRxRate,
      totalNetworkTxRate,
    };
  }, [nodeStatuses, agentStatuses]);

  // Use ref to access latest overview without re-triggering effect
  const overviewRef = useRef(overview);
  overviewRef.current = overview;

  // Update chart data periodically
  useEffect(() => {
    if (!enabled) return;

    // Helper to add a data point
    const addDataPoint = () => {
      const now = Math.floor(Date.now() / 1000);
      const current = overviewRef.current;
      setChartData(prev => {
        const newPoint: ChartDataPoint = {
          timestamp: now,
          cpuAvg: current.avgCpu,
          memoryAvg: current.avgMemory,
          diskAvg: current.avgDisk,
          networkRxRate: current.totalNetworkRxRate,
          networkTxRate: current.totalNetworkTxRate,
          onlineNodes: current.onlineNodes,
          onlineAgents: current.onlineAgents,
        };

        const updated = [...prev, newPoint];
        return updated.slice(-MAX_CHART_POINTS);
      });
    };

    // Add initial data point immediately
    addDataPoint();

    // Then update every 5 seconds
    const interval = setInterval(addDataPoint, 5000);

    return () => clearInterval(interval);
  }, [enabled]);

  // Manage SSE subscriptions
  useEffect(() => {
    if (!enabled) {
      if (nodeCleanupRef.current) {
        nodeCleanupRef.current();
        nodeCleanupRef.current = null;
      }
      if (agentCleanupRef.current) {
        agentCleanupRef.current();
        agentCleanupRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Subscribe to node events
    nodeCleanupRef.current = subscribeNodeEvents(undefined, {
      onOpen: () => setIsConnected(true),
      onEvent: handleNodeEvent,
      onError: (error) => console.error('Monitor node SSE error:', error),
      onClose: () => setIsConnected(false),
    });

    // Subscribe to forward agent events
    agentCleanupRef.current = subscribeForwardAgentEvents(undefined, {
      onEvent: handleAgentEvent,
      onError: (error) => console.error('Monitor agent SSE error:', error),
    });

    return () => {
      if (nodeCleanupRef.current) {
        nodeCleanupRef.current();
        nodeCleanupRef.current = null;
      }
      if (agentCleanupRef.current) {
        agentCleanupRef.current();
        agentCleanupRef.current = null;
      }
    };
  }, [enabled, handleNodeEvent, handleAgentEvent]);

  // Get all entities sorted by online status and name
  const allEntities = useMemo(() => {
    const nodes = Array.from(nodeStatuses.values());
    const agents = Array.from(agentStatuses.values());
    return [...nodes, ...agents].sort((a, b) => {
      // Online first
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      // Then by name
      return (a.name || a.id).localeCompare(b.name || b.id);
    });
  }, [nodeStatuses, agentStatuses]);

  // Get chart data for a specific entity with smoothing (stable reference, reads from ref)
  const getEntityChartData = useCallback((entityId: string): EntityChartDataPoint[] => {
    const rawData = entityChartHistoryRef.current.get(entityId) ?? [];
    return smoothChartData(rawData);
  }, []);

  return {
    overview,
    chartData,
    eventLog,
    allEntities,
    nodeStatuses: Array.from(nodeStatuses.values()),
    agentStatuses: Array.from(agentStatuses.values()),
    isConnected,
    getEntityChartData,
  };
}
