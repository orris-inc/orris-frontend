/**
 * usePublicPlans Hook
 * 用户端使用，只读取公开的订阅计划
 * 基于 TanStack Query 实现
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-client';
import { handleApiError } from '@/shared/lib/axios';
import { getPublicPlans } from '../api/subscription-plans-api';
import type { BillingCycle, SubscriptionPlan } from '../types/subscription-plans.types';

export const usePublicPlans = (billingCycleFilter?: BillingCycle) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.subscriptionPlans.public(),
    queryFn: getPublicPlans,
  });

  const publicPlans = data ?? [];

  // 根据计费周期筛选计划（前端筛选）
  // 支持多定价：检查主计费周期和 pricings 数组
  const filteredPlans = useMemo(() => {
    if (!billingCycleFilter) return publicPlans;
    return publicPlans.filter((plan) => {
      // 检查主计费周期
      if (plan.BillingCycle === billingCycleFilter) return true;
      // 检查 pricings 数组中是否有匹配的激活定价
      if (plan.pricings?.some(p => p.billing_cycle === billingCycleFilter && p.is_active)) {
        return true;
      }
      return false;
    });
  }, [publicPlans, billingCycleFilter]);

  // 按价格排序
  const sortedPlans = useMemo(() => {
    return [...filteredPlans].sort((a, b) => a.Price - b.Price);
  }, [filteredPlans]);

  // 按计费周期分组
  const plansByBillingCycle = useMemo(() => {
    return publicPlans.reduce(
      (acc, plan) => {
        if (!acc[plan.BillingCycle]) {
          acc[plan.BillingCycle] = [];
        }
        acc[plan.BillingCycle].push(plan);
        return acc;
      },
      {} as Record<BillingCycle, SubscriptionPlan[]>
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
