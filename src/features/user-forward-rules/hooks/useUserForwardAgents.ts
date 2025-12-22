/**
 * useUserForwardAgents Hook
 * User-side forward agent data query
 * Built with TanStack Query
 */

import { useQuery } from '@tanstack/react-query';
import { handleApiError } from '@/shared/lib/axios';
import {
  listUserForwardAgents,
  type UserForwardAgent,
  type ListUserForwardAgentsParams,
  type ForwardStatus,
} from '@/api/forward';

// Export types for external use
export type { UserForwardAgent, ListUserForwardAgentsParams };

// Query Keys for User Forward Agents
const userForwardAgentsQueryKeys = {
  all: ['userForwardAgents'] as const,
  lists: () => [...userForwardAgentsQueryKeys.all, 'list'] as const,
  list: (params: object) => [...userForwardAgentsQueryKeys.lists(), params] as const,
};

export interface UserForwardAgentFilters {
  name?: string;
  status?: ForwardStatus;
}

interface UseUserForwardAgentsOptions {
  page?: number;
  pageSize?: number;
  filters?: UserForwardAgentFilters;
  enabled?: boolean;
}

/**
 * User-accessible forward agent list query
 * Get available agents through subscription plan and resource group association
 */
export const useUserForwardAgents = (options: UseUserForwardAgentsOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true } = options;

  // Build query params
  const params: ListUserForwardAgentsParams = {
    page,
    pageSize,
    name: filters.name,
    status: filters.status,
  };

  // Query forward agent list
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: userForwardAgentsQueryKeys.list(params),
    queryFn: () => listUserForwardAgents(params),
    enabled,
  });

  return {
    // Data
    forwardAgents: data?.items ?? [],
    pagination: {
      page: data?.page ?? page,
      pageSize: data?.pageSize ?? pageSize,
      total: data?.total ?? 0,
      totalPages: data?.totalPages ?? 0,
    },

    // State
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,

    // Actions
    refetch,
  };
};
