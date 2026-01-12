/**
 * Hook to get current page title from navigation config
 * Used for mobile header to display context-aware page title
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { navigationConfig } from '@/config/navigation';

/**
 * Get the current page title based on URL path
 *
 * @param fallback - Fallback title when no match found
 * @returns Current page title
 *
 * @example
 * ```tsx
 * const title = useCurrentPageTitle('Dashboard');
 * // Returns "用户管理" when on /admin/users
 * // Returns "Dashboard" when no match found
 * ```
 */
export function useCurrentPageTitle(fallback: string = ''): string {
  const location = useLocation();

  return useMemo(() => {
    const pathname = location.pathname;

    // Try exact path match first
    const exactMatch = navigationConfig.find((item) => item.path === pathname);
    if (exactMatch) {
      return exactMatch.label;
    }

    // Try matching dynamic routes (e.g., /dashboard/subscriptions/:id)
    const dynamicMatch = navigationConfig.find((item) => {
      if (!item.path.includes(':')) return false;
      const pattern = item.path.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    });
    if (dynamicMatch) {
      return dynamicMatch.label;
    }

    // Try matching by last path segment
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      const segmentMatch = navigationConfig.find((item) => {
        const itemSegments = item.path.split('/').filter(Boolean);
        return itemSegments[itemSegments.length - 1] === lastSegment;
      });
      if (segmentMatch) {
        return segmentMatch.label;
      }
    }

    return fallback;
  }, [location.pathname, fallback]);
}
