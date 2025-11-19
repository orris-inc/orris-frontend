/**
 * useSubscriptionPlans Hook
 * 管理端使用，包含完整的CRUD操作
 */

import { useEffect } from 'react';
import { useSubscriptionPlansStore } from '../stores/subscription-plans-store';
import type { CreatePlanRequest, UpdatePlanRequest } from '../types/subscription-plans.types';

export const useSubscriptionPlans = () => {
  const {
    plans,
    selectedPlan,
    filters,
    pagination,
    loading,
    error,
    fetchPlans,
    fetchPlanById,
    createPlan,
    updatePlan,
    activatePlan,
    deactivatePlan,
    setFilters,
    setSelectedPlan,
    clearError,
    reset,
  } = useSubscriptionPlansStore();

  // 组件挂载时获取数据
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // 创建订阅计划（带类型）
  const handleCreatePlan = async (data: CreatePlanRequest) => {
    return await createPlan(data);
  };

  // 更新订阅计划（带类型）
  const handleUpdatePlan = async (id: number, data: UpdatePlanRequest) => {
    return await updatePlan(id, data);
  };

  // 切换计划状态（激活/停用）
  const togglePlanStatus = async (id: number, currentStatus: string) => {
    if (currentStatus === 'active') {
      return await deactivatePlan(id);
    } else {
      return await activatePlan(id);
    }
  };

  return {
    // 状态
    plans,
    selectedPlan,
    filters,
    pagination,
    loading,
    error,

    // 方法
    fetchPlans,
    fetchPlanById,
    createPlan: handleCreatePlan,
    updatePlan: handleUpdatePlan,
    activatePlan,
    deactivatePlan,
    togglePlanStatus,
    setFilters,
    setSelectedPlan,
    clearError,
    reset,
  };
};
