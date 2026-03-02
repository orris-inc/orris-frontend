/**
 * Public Auth Methods Hook
 * Fetches available authentication methods without authentication
 * Used by login page to show/hide auth options
 */

import { useQuery } from '@tanstack/react-query';
import {
  getPublicAuthMethods,
  type PublicAuthMethodsResponse,
} from '@/api/setting';

export function usePublicAuthMethods() {
  const {
    data,
    isLoading,
    error,
  } = useQuery<PublicAuthMethodsResponse>({
    queryKey: ['public', 'authMethods'],
    queryFn: getPublicAuthMethods,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Default all enabled while loading to avoid flash of hidden elements
    placeholderData: {
      passwordEnabled: true,
      passkeyEnabled: true,
      oauthEnabled: true,
    },
  });

  return {
    passwordEnabled: data?.passwordEnabled ?? true,
    passkeyEnabled: data?.passkeyEnabled ?? true,
    oauthEnabled: data?.oauthEnabled ?? true,
    isLoading,
    error,
  };
}
