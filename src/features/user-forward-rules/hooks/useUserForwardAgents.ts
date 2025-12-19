/**
 * useUserForwardAgents Hook
 * 用户端转发代理数据查询
 * 基于 TanStack Query 实现
 */

import { useQuery } from '@tanstack/react-query';
import { handleApiError } from '@/shared/lib/axios';
import {
  listUserForwardAgents,
  type UserForwardAgent,
  type ListUserForwardAgentsParams,
  type ForwardStatus,
} from '@/api/forward';

// 导出类型供外部使用
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
 * 用户可访问的转发代理列表查询
 * 通过订阅计划和资源组关联获取可用代理
 */
export const useUserForwardAgents = (options: UseUserForwardAgentsOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true } = options;

  // 构建查询参数
  const params: ListUserForwardAgentsParams = {
    page,
    pageSize,
    name: filters.name,
    status: filters.status,
  };

  // 查询转发代理列表
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
    // 数据
    forwardAgents: data?.items ?? [],
    pagination: {
      page: data?.page ?? page,
      pageSize: data?.pageSize ?? pageSize,
      total: data?.total ?? 0,
      totalPages: data?.totalPages ?? 0,
    },

    // 状态
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,

    // 操作
    refetch,
  };
};
