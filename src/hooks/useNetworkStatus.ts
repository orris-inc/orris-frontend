/**
 * useNetworkStatus Hook
 * Monitors network connectivity and connection quality
 * Provides reactive network state for adaptive loading strategies
 */

import { useState, useEffect, useCallback } from 'react';

export type ConnectionEffectiveType = '2g' | '3g' | '4g' | 'slow-2g';

export interface NetworkStatus {
  /** Whether the browser is online */
  isOnline: boolean;
  /** Whether the connection was recently restored */
  wasOffline: boolean;
  /** Effective connection type (2g, 3g, 4g, slow-2g) */
  effectiveType?: ConnectionEffectiveType;
  /** Downlink speed in Mbps */
  downlink?: number;
  /** Round-trip time in ms */
  rtt?: number;
  /** Whether data saver mode is enabled */
  saveData?: boolean;
  /** Connection quality assessment */
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  /** Timestamp of last status change */
  lastChanged: number;
}

// Extend Navigator interface for Network Information API
declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }

  interface NetworkInformation extends EventTarget {
    effectiveType?: ConnectionEffectiveType;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
    addEventListener(
      type: 'change',
      listener: EventListener
    ): void;
    removeEventListener(
      type: 'change',
      listener: EventListener
    ): void;
  }
}

/**
 * Get the Network Information API connection object
 */
function getConnection(): NetworkInformation | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection
  );
}

/**
 * Assess connection quality based on effective type and metrics
 */
function assessQuality(
  isOnline: boolean,
  effectiveType?: ConnectionEffectiveType,
  downlink?: number,
  rtt?: number
): NetworkStatus['quality'] {
  if (!isOnline) return 'offline';

  // Use effective type as primary indicator
  if (effectiveType) {
    switch (effectiveType) {
      case '4g':
        // Further refine based on actual metrics
        if (downlink && downlink >= 10) return 'excellent';
        if (downlink && downlink >= 5) return 'good';
        return 'good';
      case '3g':
        return 'fair';
      case '2g':
      case 'slow-2g':
        return 'poor';
    }
  }

  // Fallback to metric-based assessment
  if (rtt !== undefined) {
    if (rtt < 50) return 'excellent';
    if (rtt < 100) return 'good';
    if (rtt < 300) return 'fair';
    return 'poor';
  }

  // Default to good if online but no metrics available
  return 'good';
}

/**
 * Hook to monitor network status and connection quality
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOnline, quality, saveData } = useNetworkStatus();
 *
 *   // Adaptive loading based on connection
 *   const imageQuality = quality === 'poor' || saveData ? 'low' : 'high';
 *
 *   if (!isOnline) {
 *     return <OfflineIndicator />;
 *   }
 *
 *   return <Image quality={imageQuality} />;
 * }
 * ```
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const connection = getConnection();

    return {
      isOnline,
      wasOffline: false,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
      quality: assessQuality(
        isOnline,
        connection?.effectiveType,
        connection?.downlink,
        connection?.rtt
      ),
      lastChanged: Date.now(),
    };
  });

  const updateStatus = useCallback((wasOffline = false) => {
    const isOnline = navigator.onLine;
    const connection = getConnection();

    setStatus((prev) => ({
      isOnline,
      wasOffline: wasOffline || (!prev.isOnline && isOnline),
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
      quality: assessQuality(
        isOnline,
        connection?.effectiveType,
        connection?.downlink,
        connection?.rtt
      ),
      lastChanged: Date.now(),
    }));
  }, []);

  useEffect(() => {
    const handleOnline = () => updateStatus(true);
    const handleOffline = () => updateStatus(false);
    const handleConnectionChange = () => updateStatus();

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection quality changes
    const connection = getConnection();
    connection?.addEventListener('change', handleConnectionChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      connection?.removeEventListener('change', handleConnectionChange);
    };
  }, [updateStatus]);

  // Clear wasOffline flag after a delay
  useEffect(() => {
    if (status.wasOffline) {
      const timer = setTimeout(() => {
        setStatus((prev) => ({ ...prev, wasOffline: false }));
      }, 5000); // Reset after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [status.wasOffline]);

  return status;
}

/**
 * Hook to determine if reduced data usage is preferred
 * Considers save-data header, slow connections, and user preference
 */
export function useShouldReduceData(): boolean {
  const { saveData, quality } = useNetworkStatus();

  // Check for prefers-reduced-data media query (future standard)
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    // This media query is not widely supported yet, but future-proof
    const mediaQuery = window.matchMedia?.('(prefers-reduced-data: reduce)');
    if (mediaQuery) {
      setPrefersReduced(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
      mediaQuery.addEventListener?.('change', handler);
      return () => mediaQuery.removeEventListener?.('change', handler);
    }
  }, []);

  return saveData || prefersReduced || quality === 'poor';
}

/**
 * Hook to get adaptive quality level based on network conditions
 * Returns a quality level from 1-3 (low, medium, high)
 */
export function useAdaptiveQuality(): 1 | 2 | 3 {
  const { quality, saveData } = useNetworkStatus();

  if (saveData || quality === 'poor' || quality === 'offline') {
    return 1; // Low quality
  }
  if (quality === 'fair') {
    return 2; // Medium quality
  }
  return 3; // High quality
}
