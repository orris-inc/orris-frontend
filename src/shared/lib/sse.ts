/**
 * SSE (Server-Sent Events) auto-reconnect wrapper
 *
 * This utility wraps existing SSE subscription functions to add:
 * - Automatic reconnection with exponential backoff
 * - Heartbeat timeout detection
 * - Connection state management
 * - Page visibility awareness (pause when hidden)
 * - Network status detection (online/offline)
 *
 * It does NOT create SSE connections directly - it wraps existing
 * subscription functions from the API layer.
 */

// Only log in development mode
const isDev = import.meta.env.DEV;
const log = {
  info: (...args: unknown[]) => isDev && console.log('[SSE]', ...args),
  warn: (...args: unknown[]) => isDev && console.warn('[SSE]', ...args),
  error: (...args: unknown[]) => console.error('[SSE]', ...args),
};

/**
 * SSE connection state
 */
export type SSEConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'paused';

/**
 * Options for the original SSE subscription function
 */
export interface OriginalSSEOptions<T> {
  onOpen?: () => void;
  onEvent: (event: T) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
  /** Last event ID for resuming connection */
  lastEventId?: string;
}

/**
 * SSE subscription function type (from API layer)
 */
export type SSESubscribeFn<P, T> = (
  params: P | undefined,
  options: OriginalSSEOptions<T>
) => () => void;

/**
 * Enhanced SSE options with auto-reconnect
 */
export interface SSEAutoReconnectOptions<T> {
  /** Callback when connection state changes */
  onStateChange?: (state: SSEConnectionState) => void;
  /** Callback for each received event */
  onEvent: (event: T) => void;
  /** Callback on error */
  onError?: (error: Event) => void;
  /** Enable auto-reconnect (default: true) */
  autoReconnect?: boolean;
  /** Initial reconnect delay in ms (default: 1000) */
  initialReconnectDelay?: number;
  /** Maximum reconnect delay in ms (default: 30000) */
  maxReconnectDelay?: number;
  /** Maximum reconnect attempts (default: Infinity) */
  maxReconnectAttempts?: number;
  /** Heartbeat timeout in ms - reconnect if no data received (default: 60000) */
  heartbeatTimeout?: number;
  /** Pause connection when page is hidden (default: true) */
  pauseWhenHidden?: boolean;
  /** Disconnect when offline, reconnect when online (default: true) */
  networkAware?: boolean;
}

/**
 * SSE connection controller
 */
export interface SSEController {
  /** Close the connection and stop reconnection attempts */
  close: () => void;
  /** Get current connection state */
  getState: () => SSEConnectionState;
  /** Manually trigger reconnection */
  reconnect: () => void;
}

/**
 * Wrap an SSE subscription function with auto-reconnect capability
 *
 * @param subscribeFn - The original SSE subscription function from API layer
 * @param params - Parameters to pass to the subscription function
 * @param options - Enhanced options with auto-reconnect settings
 * @returns Controller to manage the connection
 *
 * @example
 * ```ts
 * import { subscribeNodeEvents } from '@/api/node';
 *
 * const controller = createAutoReconnectSSE(
 *   subscribeNodeEvents,
 *   { nodeIds: 'node_abc' },
 *   {
 *     onStateChange: (state) => console.log('SSE state:', state),
 *     onEvent: (event) => handleEvent(event),
 *     onError: (error) => console.error('SSE error:', error),
 *   }
 * );
 *
 * // Later, to close:
 * controller.close();
 * ```
 */
export function createAutoReconnectSSE<P, T>(
  subscribeFn: SSESubscribeFn<P, T>,
  params: P | undefined,
  options: SSEAutoReconnectOptions<T>
): SSEController {
  const {
    onStateChange,
    onEvent,
    onError,
    autoReconnect = true,
    initialReconnectDelay = 1000,
    maxReconnectDelay = 30000,
    maxReconnectAttempts = Infinity,
    heartbeatTimeout = 60000,
    pauseWhenHidden = false,  // Disabled by default to avoid unexpected disconnections
    networkAware = true,
  } = options;

  let cleanup: (() => void) | null = null;
  let state: SSEConnectionState = 'disconnected';
  let reconnectAttempts = 0;
  let reconnectDelay = initialReconnectDelay;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  let isManuallyClosed = false;
  let isPaused = false;
  let lastEventId: string | undefined;

  /**
   * Update connection state and notify listeners
   */
  const setState = (newState: SSEConnectionState) => {
    if (state !== newState) {
      state = newState;
      onStateChange?.(state);
    }
  };

  /**
   * Reset heartbeat timer - called when any data is received
   */
  const resetHeartbeat = () => {
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer);
    }
    if (heartbeatTimeout > 0 && !isManuallyClosed && !isPaused && state === 'connected') {
      heartbeatTimer = setTimeout(() => {
        log.warn('Heartbeat timeout, reconnecting...');
        scheduleReconnect();
      }, heartbeatTimeout);
    }
  };

  /**
   * Clear all timers
   */
  const clearTimers = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  const scheduleReconnect = () => {
    // Close existing connection
    if (cleanup) {
      cleanup();
      cleanup = null;
    }

    // Don't reconnect if manually closed or paused
    if (isManuallyClosed || isPaused) {
      setState(isPaused ? 'paused' : 'disconnected');
      return;
    }

    // Don't reconnect if offline (networkAware mode)
    if (networkAware && typeof navigator !== 'undefined' && !navigator.onLine) {
      log.info('Network offline, waiting for connection...');
      setState('disconnected');
      return;
    }

    if (!autoReconnect) {
      setState('disconnected');
      return;
    }

    if (reconnectAttempts >= maxReconnectAttempts) {
      log.warn(`Max reconnect attempts (${maxReconnectAttempts}) reached`);
      setState('disconnected');
      return;
    }

    setState('reconnecting');
    reconnectAttempts++;

    // Calculate delay with exponential backoff and jitter
    const jitter = Math.random() * 0.3 + 0.85; // 0.85 - 1.15
    const delay = Math.min(reconnectDelay * jitter, maxReconnectDelay);

    log.info(`Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempts})`);

    reconnectTimer = setTimeout(() => {
      connect();
    }, delay);

    // Increase delay for next attempt (exponential backoff)
    reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay);
  };

  /**
   * Establish SSE connection
   */
  const connect = () => {
    if (isManuallyClosed || isPaused) {
      return;
    }

    // Don't connect if offline (networkAware mode)
    if (networkAware && typeof navigator !== 'undefined' && !navigator.onLine) {
      log.info('Network offline, skipping connection');
      setState('disconnected');
      return;
    }

    // Close existing connection if any
    if (cleanup) {
      cleanup();
      cleanup = null;
    }

    setState('connecting');

    cleanup = subscribeFn(params, {
      onOpen: () => {
        log.info('Connection established');
        setState('connected');
        // Reset reconnection state on successful connection
        reconnectAttempts = 0;
        reconnectDelay = initialReconnectDelay;
        // Start heartbeat timer
        resetHeartbeat();
      },
      onEvent: (event) => {
        // Reset heartbeat on any data received
        resetHeartbeat();
        // Store last event ID if available (for resuming)
        if (event && typeof event === 'object' && 'id' in event) {
          lastEventId = (event as { id?: string }).id;
        }
        onEvent(event);
      },
      onError: (error) => {
        onError?.(error);
        // The original subscription will close after maxRetries errors
        // We'll detect this via onClose and schedule reconnect
      },
      onClose: () => {
        // Connection was closed (either by error or server)
        // Schedule reconnect if not manually closed or paused
        if (!isManuallyClosed && !isPaused) {
          scheduleReconnect();
        }
      },
      lastEventId,
    });
  };

  /**
   * Pause connection (e.g., when page is hidden)
   */
  const pause = () => {
    if (isPaused) return;
    isPaused = true;
    clearTimers();

    if (cleanup) {
      cleanup();
      cleanup = null;
    }

    setState('paused');
    log.info('Connection paused');
  };

  /**
   * Resume connection after pause
   */
  const resume = () => {
    if (!isPaused) return;
    isPaused = false;

    // Only reconnect if not manually closed
    if (!isManuallyClosed) {
      log.info('Resuming connection...');
      // Reset backoff on resume
      reconnectAttempts = 0;
      reconnectDelay = initialReconnectDelay;
      connect();
    }
  };

  /**
   * Handle page visibility change
   */
  const handleVisibilityChange = () => {
    if (!pauseWhenHidden) return;

    if (document.hidden) {
      pause();
    } else {
      resume();
    }
  };

  /**
   * Handle online event
   */
  const handleOnline = () => {
    if (!networkAware) return;
    log.info('Network online, reconnecting...');
    // Don't reconnect if paused or manually closed
    if (!isPaused && !isManuallyClosed) {
      reconnectAttempts = 0;
      reconnectDelay = initialReconnectDelay;
      connect();
    }
  };

  /**
   * Handle offline event
   */
  const handleOffline = () => {
    if (!networkAware) return;
    log.info('Network offline, disconnecting...');
    clearTimers();

    if (cleanup) {
      cleanup();
      cleanup = null;
    }

    setState('disconnected');
  };

  /**
   * Close connection and cleanup
   */
  const close = () => {
    isManuallyClosed = true;
    isPaused = false;
    clearTimers();

    // Remove event listeners
    if (typeof document !== 'undefined' && pauseWhenHidden) {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
    if (typeof window !== 'undefined' && networkAware) {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }

    if (cleanup) {
      cleanup();
      cleanup = null;
    }

    setState('disconnected');
  };

  /**
   * Manually trigger reconnection
   */
  const reconnect = () => {
    isManuallyClosed = false;
    isPaused = false;
    reconnectAttempts = 0;
    reconnectDelay = initialReconnectDelay;
    clearTimers();
    connect();
  };

  /**
   * Get current state
   */
  const getState = (): SSEConnectionState => state;

  // Set up event listeners for visibility and network changes
  if (typeof document !== 'undefined' && pauseWhenHidden) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
  if (typeof window !== 'undefined' && networkAware) {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  // Start initial connection (unless page is hidden)
  if (pauseWhenHidden && typeof document !== 'undefined' && document.hidden) {
    isPaused = true;
    setState('paused');
  } else {
    connect();
  }

  return {
    close,
    getState,
    reconnect,
  };
}
