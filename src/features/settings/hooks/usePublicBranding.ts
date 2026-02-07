/**
 * Public Branding Hook
 * Fetches branding settings without authentication
 * Uses localStorage cache to prevent flash of default content on page refresh
 */

import { useQuery } from '@tanstack/react-query';
import {
  getPublicBranding,
  type PublicBrandingResponse,
} from '@/api/setting';
import { baseURL } from '@/shared/lib/axios';

const BRANDING_CACHE_KEY = 'orris_branding_cache';

/**
 * Resolve asset URL to full path
 * Handles both development (separate frontend/backend) and production (same origin) scenarios
 */
function resolveAssetUrl(url: string): string {
  if (!url) return '';

  // Already a full URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Relative path starting with /uploads/
  if (url.startsWith('/uploads/')) {
    // If baseURL is a full URL (e.g., http://localhost:8081), extract origin
    if (baseURL.startsWith('http://') || baseURL.startsWith('https://')) {
      try {
        const apiUrl = new URL(baseURL);
        return `${apiUrl.origin}${url}`;
      } catch {
        // Invalid URL, return as-is
        return url;
      }
    }
    // baseURL is relative (e.g., /api), prepend it to use the same proxy
    // /uploads/branding/xxx.png -> /api/uploads/branding/xxx.png
    return `${baseURL}${url}`;
  }

  return url;
}

/**
 * Get cached branding data from localStorage
 */
function getCachedBranding(): PublicBrandingResponse | null {
  try {
    const cached = localStorage.getItem(BRANDING_CACHE_KEY);
    if (cached) {
      const parsed: unknown = JSON.parse(cached);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'appName' in parsed &&
        typeof (parsed as Record<string, unknown>).appName === 'string'
      ) {
        return parsed as PublicBrandingResponse;
      }
      return null;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Save branding data to localStorage cache
 */
function setCachedBranding(data: PublicBrandingResponse): void {
  try {
    localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export function usePublicBranding() {
  // Get initial cached data
  const cachedData = getCachedBranding();

  const {
    data,
    isLoading,
    error,
    isPlaceholderData,
  } = useQuery<PublicBrandingResponse>({
    queryKey: ['public', 'branding'],
    queryFn: async () => {
      const result = await getPublicBranding();
      // Update cache on successful fetch
      setCachedBranding(result);
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Use cached data as initial/placeholder while loading
    placeholderData: cachedData ?? undefined,
  });

  // Show loading state only when:
  // 1. Actually loading AND
  // 2. No cached data available (first visit)
  const showLoading = isLoading && !cachedData;

  return {
    appName: data?.appName ?? '',
    logoUrl: resolveAssetUrl(data?.logoUrl ?? ''),
    faviconUrl: resolveAssetUrl(data?.faviconUrl ?? ''),
    isLoading: showLoading,
    isPlaceholderData,
    error,
  };
}
