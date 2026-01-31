/**
 * Public Legal Hook
 * Fetches legal URLs (terms of service, privacy policy) without authentication
 */

import { useQuery } from '@tanstack/react-query';
import {
  getPublicLegal,
  type PublicLegalResponse,
} from '@/api/setting';

export function usePublicLegal() {
  const {
    data,
    isLoading,
    error,
  } = useQuery<PublicLegalResponse>({
    queryKey: ['public', 'legal'],
    queryFn: getPublicLegal,
  });

  return {
    termsOfServiceUrl: data?.termsOfServiceUrl ?? '',
    privacyPolicyUrl: data?.privacyPolicyUrl ?? '',
    isLoading,
    error,
  };
}
