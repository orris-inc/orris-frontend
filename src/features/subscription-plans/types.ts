/**
 * 订阅计划模块本地类型定义
 */

// 从 API 重新导出类型
export type {
  BillingCycle,
  PlanStatus,
  PricingOption,
} from '@/api/subscription/types';

/**
 * 订阅计划筛选条件
 */
export interface SubscriptionPlanFilters {
  status?: 'active' | 'inactive';
  isPublic?: boolean;
  search?: string;
}
