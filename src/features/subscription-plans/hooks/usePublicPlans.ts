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
import type { SubscriptionPlan, BillingCycle } from '@/api/subscription/types';

export const usePublicPlans = (billingCycleFilter?: BillingCycle) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.subscriptionPlans.public(),
    queryFn: getPublicPlans,
  });

  const publicPlans = useMemo(() => data ?? [], [data]);

  // 根据计费周期筛选计划（前端筛选）
  // 筛选逻辑：计划的 pricings 中包含该计费周期的定价选项
  const filteredPlans = useMemo(() => {
    if (!billingCycleFilter) return publicPlans;
    return publicPlans.filter((plan) => {
      return plan.pricings?.some(pricing => pricing.billingCycle === billingCycleFilter);
    });
  }, [publicPlans, billingCycleFilter]);

  // 按价格排序（使用第一个定价的价格）
  const sortedPlans = useMemo(() => {
    return [...filteredPlans].sort((a, b) => {
      const priceA = a.pricings?.[0]?.price || 0;
      const priceB = b.pricings?.[0]?.price || 0;
      return priceA - priceB;
    });
  }, [filteredPlans]);

  // 按计费周期分组（根据 pricings 中的 billingCycle 分组）
  // 一个计划可能出现在多个计费周期组中
  const plansByBillingCycle = useMemo(() => {
    return publicPlans.reduce(
      (acc, plan) => {
        (plan.pricings || []).forEach(pricing => {
          if (!acc[pricing.billingCycle]) {
            acc[pricing.billingCycle] = [];
          }
          // 检查是否已经添加过该计划
          if (!acc[pricing.billingCycle].some(p => p.id === plan.id)) {
            acc[pricing.billingCycle].push(plan);
          }
        });
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
