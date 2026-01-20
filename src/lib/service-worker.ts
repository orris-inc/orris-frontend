/**
 * Service Worker Registration and Management
 * Provides utilities for registering, updating, and communicating with the SW
 */

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOffline: boolean;
  hasUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
}

type UpdateCallback = () => void;

let updateCallbacks: UpdateCallback[] = [];

/**
 * Register the service worker
 * @returns Promise resolving to the registration or null if not supported
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Worker not supported');
    return null;
  }

  // Only register in production
  if (import.meta.env.DEV) {
    console.log('[SW] Skipping SW registration in development');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    console.log('[SW] Service Worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[SW] New content available, refresh to update');
          // Notify registered callbacks
          updateCallbacks.forEach((cb) => cb());
        }
      });
    });

    // Handle controller changes (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed, reloading...');
      // Optionally auto-reload
      // window.location.reload();
    });

    return registration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.unregister();
  } catch (error) {
    console.error('[SW] Unregistration failed:', error);
    return false;
  }
}

/**
 * Subscribe to service worker update notifications
 * @param callback Function to call when an update is available
 * @returns Unsubscribe function
 */
export function onServiceWorkerUpdate(callback: UpdateCallback): () => void {
  updateCallbacks.push(callback);
  return () => {
    updateCallbacks = updateCallbacks.filter((cb) => cb !== callback);
  };
}

/**
 * Skip waiting and activate the new service worker
 */
export async function activateNewServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const waiting = registration.waiting;

  if (waiting) {
    waiting.postMessage('skipWaiting');
  }
}

/**
 * Clear all service worker caches
 */
export async function clearServiceWorkerCache(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  if (registration.active) {
    registration.active.postMessage('clearCache');
  }

  // Also clear caches directly
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name.startsWith('orris-'))
      .map((name) => caches.delete(name))
  );
}

/**
 * Check if there's an update available
 */
export async function checkForUpdates(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return registration.waiting !== null;
  } catch {
    return false;
  }
}

/**
 * Get the current service worker state
 */
export async function getServiceWorkerState(): Promise<ServiceWorkerState> {
  const isSupported = 'serviceWorker' in navigator;

  if (!isSupported) {
    return {
      isSupported: false,
      isRegistered: false,
      isOffline: !navigator.onLine,
      hasUpdate: false,
      registration: null,
    };
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const registration = registrations[0] || null;

    return {
      isSupported: true,
      isRegistered: registrations.length > 0,
      isOffline: !navigator.onLine,
      hasUpdate: registration?.waiting !== null,
      registration,
    };
  } catch {
    return {
      isSupported: true,
      isRegistered: false,
      isOffline: !navigator.onLine,
      hasUpdate: false,
      registration: null,
    };
  }
}
