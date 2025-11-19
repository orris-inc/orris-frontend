/**
 * 订阅计划 API 封装
 * 严格基于后端 Swagger 文档定义
 */

import { apiClient } from '@/shared/lib/axios';
import type { APIResponse, ListResponse } from '@/shared/types/api.types';
import type {
  SubscriptionPlan,
  CreatePlanRequest,
  UpdatePlanRequest,
  SubscriptionPlanListParams,
  PlanPricing,
} from '../types/subscription-plans.types';

/**
 * 获取订阅计划列表（分页+筛选）
 * GET /subscription-plans
 * 来源: swagger.json line 3581-3670
 * 需要认证: Bearer Token
 */
export const getSubscriptionPlans = async (
  params?: SubscriptionPlanListParams
): Promise<ListResponse<SubscriptionPlan>> => {
  const response = await apiClient.get<APIResponse<ListResponse<SubscriptionPlan>>>(
    '/subscription-plans',
    { params }
  );
  return response.data.data;
};

/**
 * 获取公开的订阅计划列表
 * GET /subscription-plans/public
 * 来源: swagger.json (需要确认具体行号)
 * 无需认证
 */
export const getPublicPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await apiClient.get<APIResponse<SubscriptionPlan[]>>(
    '/subscription-plans/public'
  );
  return response.data.data;
};

/**
 * 获取指定订阅计划详情
 * GET /subscription-plans/{id}
 * 来源: swagger.json
 * 需要认证: Bearer Token
 */
export const getSubscriptionPlanById = async (id: number): Promise<SubscriptionPlan> => {
  const response = await apiClient.get<APIResponse<SubscriptionPlan>>(
    `/subscription-plans/${id}`
  );
  return response.data.data;
};

/**
 * 创建新的订阅计划
 * POST /subscription-plans
 * 来源: swagger.json line 3672-3731
 * 需要认证: Bearer Token
 */
export const createSubscriptionPlan = async (
  data: CreatePlanRequest
): Promise<SubscriptionPlan> => {
  const response = await apiClient.post<APIResponse<SubscriptionPlan>>(
    '/subscription-plans',
    data
  );
  return response.data.data;
};

/**
 * 更新订阅计划
 * PUT /subscription-plans/{id}
 * 来源: swagger.json
 * 需要认证: Bearer Token
 */
export const updateSubscriptionPlan = async (
  id: number,
  data: UpdatePlanRequest
): Promise<SubscriptionPlan> => {
  const response = await apiClient.put<APIResponse<SubscriptionPlan>>(
    `/subscription-plans/${id}`,
    data
  );
  return response.data.data;
};

/**
 * 激活订阅计划
 * POST /subscription-plans/{id}/activate
 * 来源: swagger.json
 * 需要认证: Bearer Token
 */
export const activateSubscriptionPlan = async (id: number): Promise<SubscriptionPlan> => {
  const response = await apiClient.post<APIResponse<SubscriptionPlan>>(
    `/subscription-plans/${id}/activate`
  );
  return response.data.data;
};

/**
 * 停用订阅计划
 * POST /subscription-plans/{id}/deactivate
 * 来源: swagger.json
 * 需要认证: Bearer Token
 */
export const deactivateSubscriptionPlan = async (id: number): Promise<SubscriptionPlan> => {
  const response = await apiClient.post<APIResponse<SubscriptionPlan>>(
    `/subscription-plans/${id}/deactivate`
  );
  return response.data.data;
};

/**
 * 获取指定计划的定价选项
 * GET /subscription-plans/{id}/pricings
 * 来源: swagger.json (新增接口)
 * 无需认证
 * 返回一个计划的所有可用计费周期和价格
 */
export const getPlanPricings = async (id: number): Promise<PlanPricing[]> => {
  const response = await apiClient.get<APIResponse<PlanPricing[]>>(
    `/subscription-plans/${id}/pricings`
  );
  return response.data.data;
};
