/**
 * Service Worker for Orris Frontend
 * Provides offline caching and performance optimization
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `orris-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `orris-dynamic-${CACHE_VERSION}`;
const API_CACHE = `orris-api-${CACHE_VERSION}`;

// Static assets to precache (shell)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Network-first for API calls (fresh data preferred)
  networkFirst: ['/api/'],
  // Cache-first for static assets
  cacheFirst: ['/assets/', '/fonts/', '.woff', '.woff2', '.png', '.jpg', '.jpeg', '.svg', '.ico'],
  // Stale-while-revalidate for HTML pages
  staleWhileRevalidate: ['/'],
};

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete caches that don't match current version
              return (
                name.startsWith('orris-') &&
                name !== STATIC_CACHE &&
                name !== DYNAMIC_CACHE &&
                name !== API_CACHE
              );
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - apply caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Determine caching strategy
  const strategy = getStrategy(url.pathname);

  switch (strategy) {
    case 'networkFirst':
      event.respondWith(networkFirst(request, API_CACHE));
      break;
    case 'cacheFirst':
      event.respondWith(cacheFirst(request, STATIC_CACHE));
      break;
    case 'staleWhileRevalidate':
      event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
      break;
    default:
      // Default to network-first for unknown resources
      event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Determine caching strategy based on URL
function getStrategy(pathname) {
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    for (const pattern of patterns) {
      if (pathname.includes(pattern)) {
        return strategy;
      }
    }
  }
  return 'networkFirst';
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    throw new Error('Network error and no cache available');
  }
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Return a fallback for images
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f0f0f0" width="100" height="100"/></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    throw new Error('Network error and no cache available');
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data === 'clearCache') {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.startsWith('orris-')) {
          caches.delete(name);
        }
      });
    });
  }
});

// Background sync for failed requests (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-requests') {
    console.log('[SW] Syncing pending requests');
    // Implement background sync logic here if needed
  }
});
