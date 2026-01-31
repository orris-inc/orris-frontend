/**
 * Public Registration Hook
 * Fetches registration settings without authentication
 */

import { useQuery } from '@tanstack/react-query';
import {
  getPublicRegistration,
  type PublicRegistrationResponse,
} from '@/api/setting';

export function usePublicRegistration() {
  const {
    data,
    isLoading,
    error,
  } = useQuery<PublicRegistrationResponse>({
    queryKey: ['public', 'registration'],
    queryFn: getPublicRegistration,
  });

  return {
    registrationEnabled: data?.registrationEnabled ?? true,
    emailVerificationRequired: data?.emailVerificationRequired ?? false,
    isLoading,
    error,
  };
}
