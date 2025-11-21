/**
 * 订阅 API 封装
 * 严格基于后端 Swagger 文档定义
 */

import { apiClient } from '@/shared/lib/axios';
import type { APIResponse, ListResponse } from '@/shared/types/api.types';
import type {
  Subscription,
  CreateSubscriptionRequest,
  SubscriptionCreateResult,
  SubscriptionListParams,
  SubscriptionToken,
  GetTokensParams,
  GenerateTokenRequest,
} from '../types/subscriptions.types';

/**
 * 获取用户订阅列表（分页+筛选）
 * GET /subscriptions
 * 来源: swagger.json line 4159-4244
 * 需要认证: Bearer Token
 */
export const getSubscriptions = async (
  params?: SubscriptionListParams
): Promise<ListResponse<Subscription>> => {
  const response = await apiClient.get<APIResponse<ListResponse<Subscription>>>(
    '/subscriptions',
    { params }
  );
  return response.data.data;
};

/**
 * 获取指定订阅详情
 * GET /subscriptions/{id}
 * 来源: swagger.json line 4325+
 * 需要认证: Bearer Token
 */
export const getSubscriptionById = async (id: number): Promise<Subscription> => {
  const response = await apiClient.get<APIResponse<Subscription>>(
    `/subscriptions/${id}`
  );
  return response.data.data;
};

/**
 * 创建新订阅
 * POST /subscriptions
 * 来源: swagger.json line 4245-4323
 * 需要认证: Bearer Token
 * 管理员可以通过 user_id 参数为其他用户创建订阅
 */
export const createSubscription = async (
  data: CreateSubscriptionRequest
): Promise<SubscriptionCreateResult> => {
  const response = await apiClient.post<APIResponse<SubscriptionCreateResult>>(
    '/subscriptions',
    data
  );
  return response.data.data;
};

/**
 * 取消订阅
 * POST /subscriptions/{id}/cancel
 * 需要认证: Bearer Token
 */
export const cancelSubscription = async (id: number): Promise<Subscription> => {
  const response = await apiClient.post<APIResponse<Subscription>>(
    `/subscriptions/${id}/cancel`
  );
  return response.data.data;
};

/**
 * 激活订阅（管理员功能）
 * POST /subscriptions/{id}/activate
 * 来源: swagger.json line 4404-4469
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const activateSubscription = async (id: number): Promise<Subscription> => {
  const response = await apiClient.post<APIResponse<Subscription>>(
    `/subscriptions/${id}/activate`
  );
  return response.data.data;
};

/**
 * 获取订阅的令牌列表
 * GET /subscriptions/{id}/tokens
 * 来源: swagger.json line 4690-4762
 * 需要认证: Bearer Token
 */
export const getSubscriptionTokens = async (
  subscriptionId: number,
  params?: GetTokensParams
): Promise<SubscriptionToken[]> => {
  const response = await apiClient.get<APIResponse<SubscriptionToken[]>>(
    `/subscriptions/${subscriptionId}/tokens`,
    { params }
  );
  return response.data.data;
};

/**
 * 生成订阅令牌
 * POST /subscriptions/{id}/tokens
 * 来源: swagger.json line 4763-4836
 * 需要认证: Bearer Token
 */
export const generateSubscriptionToken = async (
  subscriptionId: number,
  data: GenerateTokenRequest
): Promise<SubscriptionToken> => {
  const response = await apiClient.post<APIResponse<SubscriptionToken>>(
    `/subscriptions/${subscriptionId}/tokens`,
    data
  );
  return response.data.data;
};
