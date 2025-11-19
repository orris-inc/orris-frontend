/**
 * usePublicPlans Hook
 * 用户端使用，只读取公开的订阅计划
 */

import { useEffect } from 'react';
import { useSubscriptionPlansStore } from '../stores/subscription-plans-store';
import type { BillingCycle } from '../types/subscription-plans.types';

export const usePublicPlans = (billingCycleFilter?: BillingCycle) => {
  const { publicPlans, loading, error, fetchPublicPlans } = useSubscriptionPlansStore();

  // 组件挂载时获取公开计划
  useEffect(() => {
    fetchPublicPlans();
  }, [fetchPublicPlans]);

  // 根据计费周期筛选计划（前端筛选）
  // 支持多定价：检查主计费周期和 pricings 数组
  const filteredPlans = billingCycleFilter
    ? publicPlans.filter((plan) => {
        // 检查主计费周期
        if (plan.BillingCycle === billingCycleFilter) return true;
        // 检查 pricings 数组中是否有匹配的激活定价
        if (plan.pricings?.some(p => p.billing_cycle === billingCycleFilter && p.is_active)) {
          return true;
        }
        return false;
      })
    : publicPlans;

  // 按价格排序
  const sortedPlans = [...filteredPlans].sort((a, b) => a.Price - b.Price);

  // 按计费周期分组
  const plansByBillingCycle = publicPlans.reduce(
    (acc, plan) => {
      if (!acc[plan.BillingCycle]) {
        acc[plan.BillingCycle] = [];
      }
      acc[plan.BillingCycle].push(plan);
      return acc;
    },
    {} as Record<BillingCycle, typeof publicPlans>
  );

  return {
    // 状态
    publicPlans: sortedPlans,
    allPublicPlans: publicPlans,
    plansByBillingCycle,
    loading,
    error,

    // 方法
    refetch: fetchPublicPlans,
  };
};
