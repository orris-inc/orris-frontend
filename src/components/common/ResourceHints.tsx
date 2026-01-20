/**
 * ResourceHints Component
 * Provides performance optimization through resource hints:
 * - dns-prefetch: Resolve DNS for external domains early
 * - preconnect: Establish early connections to important origins
 * - prefetch: Fetch resources that will be needed soon
 * - preload: Fetch critical resources for current page
 */

import { useEffect, memo } from 'react';

export interface ResourceHintsProps {
  /** Domains to prefetch DNS for */
  dnsPrefetch?: string[];
  /** Origins to preconnect to (includes DNS + TCP + TLS) */
  preconnect?: Array<{
    href: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
  }>;
  /** Resources to prefetch for future navigation */
  prefetch?: Array<{
    href: string;
    as?: 'document' | 'script' | 'style' | 'image' | 'font';
  }>;
  /** Critical resources to preload for current page */
  preload?: Array<{
    href: string;
    as: 'script' | 'style' | 'image' | 'font' | 'fetch';
    type?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
  }>;
}

/**
 * ResourceHints component injects link elements for resource hints
 * Use this in your App root to optimize loading performance
 *
 * @example
 * ```tsx
 * <ResourceHints
 *   dnsPrefetch={['https://fonts.googleapis.com']}
 *   preconnect={[
 *     { href: 'https://api.example.com', crossOrigin: 'anonymous' }
 *   ]}
 *   preload={[
 *     { href: '/fonts/main.woff2', as: 'font', type: 'font/woff2' }
 *   ]}
 * />
 * ```
 */
export const ResourceHints = memo(function ResourceHints({
  dnsPrefetch = [],
  preconnect = [],
  prefetch = [],
  preload = [],
}: ResourceHintsProps) {
  useEffect(() => {
    const head = document.head;
    const links: HTMLLinkElement[] = [];

    // Helper to create and append link element
    const createLink = (
      rel: string,
      href: string,
      options?: {
        as?: string;
        type?: string;
        crossOrigin?: string;
      }
    ) => {
      // Check if link already exists
      const existing = head.querySelector(
        `link[rel="${rel}"][href="${href}"]`
      );
      if (existing) return;

      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (options?.as) link.as = options.as;
      if (options?.type) link.type = options.type;
      if (options?.crossOrigin) link.crossOrigin = options.crossOrigin;

      head.appendChild(link);
      links.push(link);
    };

    // DNS Prefetch
    dnsPrefetch.forEach((href) => {
      createLink('dns-prefetch', href);
    });

    // Preconnect
    preconnect.forEach(({ href, crossOrigin }) => {
      createLink('preconnect', href, { crossOrigin });
    });

    // Prefetch
    prefetch.forEach(({ href, as }) => {
      createLink('prefetch', href, { as });
    });

    // Preload
    preload.forEach(({ href, as, type, crossOrigin }) => {
      createLink('preload', href, { as, type, crossOrigin });
    });

    // Cleanup on unmount
    return () => {
      links.forEach((link) => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [dnsPrefetch, preconnect, prefetch, preload]);

  return null;
});

/**
 * Default resource hints for the application
 * Includes API endpoint and common CDN domains
 */
export function DefaultResourceHints() {
  return (
    <ResourceHints
      preconnect={[
        // Preconnect to API endpoint
        { href: window.location.origin, crossOrigin: 'anonymous' },
      ]}
      dnsPrefetch={[
        // Common CDN domains that might be used
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
      ]}
    />
  );
}

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
