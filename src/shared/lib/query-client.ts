/**
 * TanStack Query 配置
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分钟内数据视为新鲜
      gcTime: 1000 * 60 * 30, // 30分钟后垃圾回收
      retry: 1, // 失败后重试1次
      refetchOnWindowFocus: false, // 窗口聚焦时不自动刷新
    },
    mutations: {
      retry: 0, // mutations 不自动重试
    },
  },
});

// Query Keys 工厂函数
export const queryKeys = {
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: object) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.users.details(), id] as const,
  },

  // Nodes
  nodes: {
    all: ['nodes'] as const,
    lists: () => [...queryKeys.nodes.all, 'list'] as const,
    list: (params: object) => [...queryKeys.nodes.lists(), params] as const,
    details: () => [...queryKeys.nodes.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.nodes.details(), id] as const,
  },

  // Node Groups
  nodeGroups: {
    all: ['nodeGroups'] as const,
    lists: () => [...queryKeys.nodeGroups.all, 'list'] as const,
    list: (params: object) => [...queryKeys.nodeGroups.lists(), params] as const,
    details: () => [...queryKeys.nodeGroups.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.nodeGroups.details(), id] as const,
    nodes: (id: number | string) => [...queryKeys.nodeGroups.detail(id), 'nodes'] as const,
  },

  // Subscription Plans
  subscriptionPlans: {
    all: ['subscriptionPlans'] as const,
    lists: () => [...queryKeys.subscriptionPlans.all, 'list'] as const,
    list: (params: object) => [...queryKeys.subscriptionPlans.lists(), params] as const,
    public: () => [...queryKeys.subscriptionPlans.all, 'public'] as const,
    details: () => [...queryKeys.subscriptionPlans.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.subscriptionPlans.details(), id] as const,
  },

  // Subscriptions
  subscriptions: {
    all: ['subscriptions'] as const,
    lists: () => [...queryKeys.subscriptions.all, 'list'] as const,
    list: (params: object) => [...queryKeys.subscriptions.lists(), params] as const,
    details: () => [...queryKeys.subscriptions.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.subscriptions.details(), id] as const,
    tokens: (id: number | string) => [...queryKeys.subscriptions.detail(id), 'tokens'] as const,
    current: () => [...queryKeys.subscriptions.all, 'current'] as const,
  },

  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },

  // Profile
  profile: {
    all: ['profile'] as const,
    current: () => [...queryKeys.profile.all, 'current'] as const,
  },

  // Forward Rules
  forwardRules: {
    all: ['forwardRules'] as const,
    lists: () => [...queryKeys.forwardRules.all, 'list'] as const,
    list: (params: object) => [...queryKeys.forwardRules.lists(), params] as const,
    details: () => [...queryKeys.forwardRules.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.forwardRules.details(), id] as const,
  },

  // Forward Agents
  forwardAgents: {
    all: ['forwardAgents'] as const,
    lists: () => [...queryKeys.forwardAgents.all, 'list'] as const,
    list: (params: object) => [...queryKeys.forwardAgents.lists(), params] as const,
    details: () => [...queryKeys.forwardAgents.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.forwardAgents.details(), id] as const,
  },
};
