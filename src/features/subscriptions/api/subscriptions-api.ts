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
  ChangePlanRequest,
  UpdateSubscriptionStatusRequest,
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

/**
 * 删除订阅令牌
 * DELETE /subscriptions/{id}/tokens/{token_id}
 * 来源: swagger.json /subscriptions/{id}/tokens/{token_id}
 * 需要认证: Bearer Token
 */
export const revokeSubscriptionToken = async (
  subscriptionId: number,
  tokenId: number
): Promise<void> => {
  await apiClient.delete(`/subscriptions/${subscriptionId}/tokens/${tokenId}`);
};

/**
 * 刷新订阅令牌
 * POST /subscriptions/{id}/tokens/{token_id}/refresh
 * 来源: swagger.json /subscriptions/{id}/tokens/{token_id}/refresh
 * 需要认证: Bearer Token
 */
export const refreshSubscriptionToken = async (
  subscriptionId: number,
  tokenId: number
): Promise<SubscriptionToken> => {
  const response = await apiClient.post<APIResponse<SubscriptionToken>>(
    `/subscriptions/${subscriptionId}/tokens/${tokenId}/refresh`
  );
  return response.data.data;
};

/**
 * 更换订阅计划
 * PATCH /subscriptions/{id}/plan
 * 来源: swagger.json /subscriptions/{id}/plan
 * 需要认证: Bearer Token
 */
export const changeSubscriptionPlan = async (
  subscriptionId: number,
  data: ChangePlanRequest
): Promise<Subscription> => {
  const response = await apiClient.patch<APIResponse<Subscription>>(
    `/subscriptions/${subscriptionId}/plan`,
    data
  );
  return response.data.data;
};

/**
 * 更新订阅状态
 * PATCH /subscriptions/{id}/status
 * 来源: swagger.json /subscriptions/{id}/status
 * 需要认证: Bearer Token
 * 支持操作: activate, cancel, renew
 */
export const updateSubscriptionStatus = async (
  subscriptionId: number,
  data: UpdateSubscriptionStatusRequest
): Promise<Subscription> => {
  const response = await apiClient.patch<APIResponse<Subscription>>(
    `/subscriptions/${subscriptionId}/status`,
    data
  );
  return response.data.data;
};
