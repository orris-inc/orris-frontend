/**
 * NetworkStatusIndicator Component
 * Displays network status notifications to users
 * Shows offline banner and connection restored messages
 */

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

export interface NetworkStatusIndicatorProps {
  /** Position of the indicator */
  position?: 'top' | 'bottom';
  /** Whether to show connection quality badge */
  showQuality?: boolean;
  /** Custom class name */
  className?: string;
}

export function NetworkStatusIndicator({
  position = 'top',
  showQuality = false,
  className,
}: NetworkStatusIndicatorProps) {
  const { isOnline, wasOffline, quality } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  // Show "reconnected" message briefly when coming back online
  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline, isOnline]);

  // Don't render if online and not showing reconnected message
  if (isOnline && !showReconnected && !showQuality) {
    return null;
  }

  // Quality badge for slow connections
  if (isOnline && !showReconnected && showQuality && quality !== 'excellent' && quality !== 'good') {
    return (
      <div
        className={cn(
          'fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300',
          position === 'top' ? 'top-[calc(env(safe-area-inset-top)+4rem)]' : 'bottom-[calc(env(safe-area-inset-bottom)+1rem)]',
          className
        )}
      >
        <div className="flex items-center gap-2 rounded-full bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm">
          <Wifi className="h-3.5 w-3.5" />
          <span>Slow connection</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50 transition-all duration-300',
        position === 'top' ? 'top-0' : 'bottom-0',
        className
      )}
    >
      {/* Offline banner */}
      {!isOnline && (
        <div
          className={cn(
            'flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground',
            position === 'top' && 'pt-[calc(env(safe-area-inset-top)+0.5rem)]',
            position === 'bottom' && 'pb-[calc(env(safe-area-inset-bottom)+0.5rem)]'
          )}
        >
          <WifiOff className="h-4 w-4" />
          <span>You're offline. Some features may be unavailable.</span>
        </div>
      )}

      {/* Reconnected message */}
      {showReconnected && isOnline && (
        <div
          className={cn(
            'flex items-center justify-center gap-2 bg-green-600 px-4 py-2 text-sm font-medium text-white',
            position === 'top' && 'pt-[calc(env(safe-area-inset-top)+0.5rem)]',
            position === 'bottom' && 'pb-[calc(env(safe-area-inset-bottom)+0.5rem)]'
          )}
        >
          <Wifi className="h-4 w-4" />
          <span>Connection restored</span>
        </div>
      )}
    </div>
  );
}

/**
 * ServiceWorkerUpdatePrompt Component
 * Shows a prompt when a new version of the app is available
 */
export interface ServiceWorkerUpdatePromptProps {
  onUpdate?: () => void;
  onDismiss?: () => void;
}

export function ServiceWorkerUpdatePrompt({
  onUpdate,
  onDismiss,
}: ServiceWorkerUpdatePromptProps) {
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    // Listen for service worker updates
    const checkForUpdates = async () => {
      if (!('serviceWorker' in navigator)) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.waiting) {
          setHasUpdate(true);
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setHasUpdate(true);
            }
          });
        });
      } catch {
        // Ignore errors
      }
    };

    checkForUpdates();
  }, []);

  const handleUpdate = () => {
    onUpdate?.();
    // Tell the service worker to skip waiting
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.waiting?.postMessage('skipWaiting');
      });
    }
    // Reload the page
    window.location.reload();
  };

  const handleDismiss = () => {
    setHasUpdate(false);
    onDismiss?.();
  };

  if (!hasUpdate) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300 sm:left-auto sm:right-4 sm:w-80">
      <div className="flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <RefreshCw className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Update available</p>
          <p className="text-xs text-muted-foreground">Refresh to get the latest version</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Later
          </button>
          <button
            onClick={handleUpdate}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
