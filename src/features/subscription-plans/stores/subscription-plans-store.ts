/**
 * 订阅计划 Zustand 状态管理
 * 不使用持久化，数据从API实时获取
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SubscriptionPlan, SubscriptionPlanFilters, PlanPricing } from '../types/subscription-plans.types';
import type { ListResponse } from '@/shared/types/api.types';
import {
  getSubscriptionPlans as fetchPlansApi,
  getPublicPlans as fetchPublicPlansApi,
  getSubscriptionPlanById as fetchPlanByIdApi,
  createSubscriptionPlan as createPlanApi,
  updateSubscriptionPlan as updatePlanApi,
  activateSubscriptionPlan as activatePlanApi,
  deactivateSubscriptionPlan as deactivatePlanApi,
  getPlanPricings as fetchPlanPricingsApi,
} from '../api/subscription-plans-api';
import { handleApiError } from '@/shared/lib/axios';
import { useNotificationStore } from '@/shared/stores/notification-store';

// 辅助函数：根据类型显示通知
const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
  const notificationStore = useNotificationStore.getState();
  switch (type) {
    case 'success':
      notificationStore.showSuccess(message);
      break;
    case 'error':
      notificationStore.showError(message);
      break;
    case 'info':
      notificationStore.showInfo(message);
      break;
    case 'warning':
      notificationStore.showWarning(message);
      break;
  }
};

interface SubscriptionPlansState {
  // 状态
  plans: SubscriptionPlan[];          // 所有计划（管理端）
  publicPlans: SubscriptionPlan[];    // 公开计划（用户端）
  selectedPlan: SubscriptionPlan | null;
  planPricings: Record<number, PlanPricing[]>; // 计划定价缓存（按计划ID索引）
  filters: SubscriptionPlanFilters;
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  loading: boolean;
  error: string | null;

  // 方法
  fetchPlans: (page?: number, pageSize?: number) => Promise<void>;
  fetchPublicPlans: () => Promise<void>;
  fetchPlanById: (id: number) => Promise<void>;
  fetchPlanPricings: (id: number) => Promise<PlanPricing[]>;
  createPlan: (data: any) => Promise<SubscriptionPlan | null>;
  updatePlan: (id: number, data: any) => Promise<SubscriptionPlan | null>;
  activatePlan: (id: number) => Promise<boolean>;
  deactivatePlan: (id: number) => Promise<boolean>;
  setFilters: (filters: Partial<SubscriptionPlanFilters>) => void;
  setSelectedPlan: (plan: SubscriptionPlan | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  plans: [],
  publicPlans: [],
  selectedPlan: null,
  planPricings: {} as Record<number, PlanPricing[]>,
  filters: {} as SubscriptionPlanFilters,
  pagination: {
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 0,
  },
  loading: false,
  error: null,
};

export const useSubscriptionPlansStore = create<SubscriptionPlansState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 获取订阅计划列表（管理端）
      fetchPlans: async (page = 1, pageSize = 20) => {
        set({ loading: true, error: null });

        try {
          const filters = get().filters;
          const response: ListResponse<SubscriptionPlan> = await fetchPlansApi({
            page,
            page_size: pageSize,
            status: filters.status,
            is_public: filters.is_public,
            billing_cycle: filters.billing_cycle,
          });

          set({
            plans: response.items,
            pagination: {
              page: response.page,
              page_size: response.page_size,
              total: response.total,
              total_pages: response.total_pages,
            },
            loading: false,
          });
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
        }
      },

      // 获取公开订阅计划（用户端）
      fetchPublicPlans: async () => {
        set({ loading: true, error: null });

        try {
          const publicPlans = await fetchPublicPlansApi();
          set({ publicPlans, loading: false });
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
        }
      },

      // 获取指定订阅计划详情
      fetchPlanById: async (id: number) => {
        set({ loading: true, error: null });

        try {
          const plan = await fetchPlanByIdApi(id);
          set({ selectedPlan: plan, loading: false });
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
        }
      },

      // 获取指定计划的定价选项
      fetchPlanPricings: async (id: number) => {
        // 如果已经缓存，直接返回
        const cached = get().planPricings[id];
        if (cached) {
          return cached;
        }

        try {
          const pricings = await fetchPlanPricingsApi(id);

          // 缓存定价数据
          set((state) => ({
            planPricings: {
              ...state.planPricings,
              [id]: pricings,
            },
          }));

          return pricings;
        } catch (error) {
          const errorMessage = handleApiError(error);
          showNotification(errorMessage, 'error');
          return [];
        }
      },

      // 创建订阅计划
      createPlan: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const newPlan = await createPlanApi(data);
          set({ loading: false });
          showNotification('订阅计划创建成功', 'success');

          // 重新获取列表
          await get().fetchPlans();

          return newPlan;
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
          return null;
        }
      },

      // 更新订阅计划
      updatePlan: async (id: number, data: any) => {
        set({ loading: true, error: null });

        try {
          const updatedPlan = await updatePlanApi(id, data);
          set({ loading: false });
          showNotification('订阅计划更新成功', 'success');

          // 重新获取列表
          await get().fetchPlans();

          return updatedPlan;
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
          return null;
        }
      },

      // 激活订阅计划
      activatePlan: async (id: number) => {
        set({ loading: true, error: null });

        try {
          await activatePlanApi(id);
          set({ loading: false });
          showNotification('订阅计划已激活', 'success');

          // 重新获取列表
          await get().fetchPlans();

          return true;
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
          return false;
        }
      },

      // 停用订阅计划
      deactivatePlan: async (id: number) => {
        set({ loading: true, error: null });

        try {
          await deactivatePlanApi(id);
          set({ loading: false });
          showNotification('订阅计划已停用', 'success');

          // 重新获取列表
          await get().fetchPlans();

          return true;
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
          return false;
        }
      },

      // 设置筛选条件
      setFilters: (filters: Partial<SubscriptionPlanFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));

        // 应用筛选后重新获取数据
        get().fetchPlans(1);
      },

      // 设置选中的计划
      setSelectedPlan: (plan: SubscriptionPlan | null) => {
        set({ selectedPlan: plan });
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },

      // 重置状态
      reset: () => {
        set(initialState);
      },
    }),
    { name: 'SubscriptionPlansStore' }
  )
);
