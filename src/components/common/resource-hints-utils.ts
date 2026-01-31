/**
 * Resource hints utilities and hooks
 * Extracted for Fast Refresh compatibility
 */

import { useEffect } from 'react';

/**
 * Hook to dynamically prefetch a route
 * Useful for prefetching routes on hover/focus
 */
export function usePrefetchRoute() {
  const prefetch = (route: string) => {
    // Check if the route is already prefetched
    const existing = document.head.querySelector(
      `link[rel="prefetch"][href="${route}"]`
    );
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    link.as = 'document';
    document.head.appendChild(link);
  };

  return prefetch;
}

/**
 * Hook to preload critical images
 * Call this early to preload above-the-fold images
 */
export function usePreloadImages(images: string[]) {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];

    images.forEach((src) => {
      const existing = document.head.querySelector(
        `link[rel="preload"][href="${src}"]`
      );
      if (existing) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = src;
      link.as = 'image';
      document.head.appendChild(link);
      links.push(link);
    });

    return () => {
      links.forEach((link) => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [images]);
}

/**
 * Utility to prefetch route modules for React Router
 * Works with Vite's dynamic imports
 */
export async function prefetchRouteModule(path: string): Promise<void> {
  // Map of routes to their dynamic import functions
  const routeModules: Record<string, () => Promise<unknown>> = {
    '/dashboard': () => import('@/pages/DashboardPage'),
    '/dashboard/nodes': () => import('@/pages/UserNodesPage'),
    '/dashboard/forward-rules': () => import('@/pages/UserForwardRulesPage'),
    '/dashboard/subscription': () => import('@/pages/UserSubscriptionDetailPage'),
    '/admin': () => import('@/pages/NewAdminDashboardPage'),
    '/admin/users': () => import('@/pages/UserManagementPage'),
    '/admin/nodes': () => import('@/pages/NodeManagementPage'),
    '/admin/forward-rules': () => import('@/pages/ForwardRulesPage'),
  };

  const moduleLoader = routeModules[path];
  if (moduleLoader) {
    try {
      await moduleLoader();
    } catch {
      // Silently fail - prefetch is best-effort
    }
  }
}
