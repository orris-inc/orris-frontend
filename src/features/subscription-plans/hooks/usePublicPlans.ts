/**
 * usePublicPlans Hook
 * 用户端使用，只读取公开的订阅计划
 * 基于 TanStack Query 实现
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-client';
import { handleApiError } from '@/shared/lib/axios';
import { getPublicPlans } from '@/api/subscription';
import type { SubscriptionPlan } from '@/api/subscription/types';

type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'yearly' | 'lifetime';

export const usePublicPlans = (billingCycleFilter?: BillingCycle) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.subscriptionPlans.public(),
    queryFn: getPublicPlans,
  });

  const publicPlans = data ?? [];

  // 根据计费周期筛选计划（前端筛选）
  const filteredPlans = useMemo(() => {
    if (!billingCycleFilter) return publicPlans;
    return publicPlans.filter((plan) => {
      return plan.billingCycle === billingCycleFilter;
    });
  }, [publicPlans, billingCycleFilter]);

  // 按价格排序
  const sortedPlans = useMemo(() => {
    return [...filteredPlans].sort((a, b) => a.price - b.price);
  }, [filteredPlans]);

  // 按计费周期分组
  const plansByBillingCycle = useMemo(() => {
    return publicPlans.reduce(
      (acc, plan) => {
        if (!acc[plan.billingCycle]) {
          acc[plan.billingCycle] = [];
        }
        acc[plan.billingCycle].push(plan);
        return acc;
      },
      {} as Record<string, SubscriptionPlan[]>
    );
  }, [publicPlans]);

  return {
    // 状态
    publicPlans: sortedPlans,
    allPublicPlans: publicPlans,
    plansByBillingCycle,
    isLoading,
    error: error ? handleApiError(error) : null,

    // 方法
    refetch,
  };
};
