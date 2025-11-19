/**
 * 节点组管理 API 封装
 * 严格基于后端 Swagger 文档定义
 * 来源: backend/swagger.json /node-groups
 */

import { apiClient } from '@/shared/lib/axios';
import type { APIResponse, ListResponse } from '@/shared/types/api.types';
import type { NodeListItem } from '@/features/nodes/types/nodes.types';
import type {
  NodeGroupListItem,
  NodeGroupDetail,
  CreateNodeGroupRequest,
  UpdateNodeGroupRequest,
  NodeGroupListParams,
  AddNodeToGroupRequest,
  BatchAddNodesToGroupRequest,
  BatchRemoveNodesFromGroupRequest,
  SubscriptionPlanBasic,
} from '../types/node-groups.types';

// ==================== 基础 CRUD API ====================

/**
 * 获取节点组列表（分页+筛选）
 * GET /node-groups
 * 来源: swagger.json line 1213
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const getNodeGroups = async (
  params?: NodeGroupListParams
): Promise<ListResponse<NodeGroupListItem>> => {
  const response = await apiClient.get<APIResponse<ListResponse<NodeGroupListItem>>>(
    '/node-groups',
    { params }
  );
  return response.data.data;
};

/**
 * 创建新节点组
 * POST /node-groups
 * 来源: swagger.json line 1286
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const createNodeGroup = async (
  data: CreateNodeGroupRequest
): Promise<NodeGroupListItem> => {
  const response = await apiClient.post<APIResponse<NodeGroupListItem>>(
    '/node-groups',
    data
  );
  return response.data.data;
};

/**
 * 获取指定节点组详情
 * GET /node-groups/{id}
 * 来源: swagger.json line 1348
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const getNodeGroupById = async (
  id: number | string
): Promise<NodeGroupDetail> => {
  const response = await apiClient.get<APIResponse<NodeGroupDetail>>(
    `/node-groups/${id}`
  );
  return response.data.data;
};

/**
 * 更新节点组信息（部分更新）
 * PUT /node-groups/{id}
 * 来源: swagger.json line 1414
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const updateNodeGroup = async (
  id: number | string,
  data: UpdateNodeGroupRequest
): Promise<NodeGroupListItem> => {
  const response = await apiClient.put<APIResponse<NodeGroupListItem>>(
    `/node-groups/${id}`,
    data
  );
  return response.data.data;
};

/**
 * 删除节点组
 * DELETE /node-groups/{id}
 * 来源: swagger.json line 1488
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const deleteNodeGroup = async (id: number | string): Promise<void> => {
  await apiClient.delete(`/node-groups/${id}`);
};

// ==================== 节点关联管理 API ====================

/**
 * 获取节点组中的所有节点
 * GET /node-groups/{id}/nodes
 * 来源: swagger.json line 1551
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const getNodeGroupNodes = async (
  id: number | string
): Promise<NodeListItem[]> => {
  const response = await apiClient.get<APIResponse<{ group_id: number; nodes: NodeListItem[]; total: number }>>(
    `/node-groups/${id}/nodes`
  );

  const data = response.data.data;
  // 后端返回的格式是 { group_id, nodes, total }，我们需要提取 nodes 字段
  const nodes = data?.nodes || [];
  return Array.isArray(nodes) ? nodes : [];
};

/**
 * 添加单个节点到组
 * POST /node-groups/{id}/nodes
 * 来源: swagger.json line 1617
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const addNodeToGroup = async (
  groupId: number | string,
  data: AddNodeToGroupRequest
): Promise<void> => {
  await apiClient.post(`/node-groups/${groupId}/nodes`, data);
};

/**
 * 批量添加节点到组
 * POST /node-groups/{id}/nodes/batch
 * 来源: swagger.json line 1692
 * 需要认证: Bearer Token
 * 需要权限: Admin
 * 限制: 最多100个节点
 */
export const batchAddNodesToGroup = async (
  groupId: number | string,
  data: BatchAddNodesToGroupRequest
): Promise<void> => {
  // 验证节点数量限制
  if (data.node_ids.length > 100) {
    throw new Error('批量添加节点数量不能超过100个');
  }
  await apiClient.post(`/node-groups/${groupId}/nodes/batch`, data);
};

/**
 * 批量从组中移除节点
 * DELETE /node-groups/{id}/nodes/batch
 * 来源: swagger.json line 1767
 * 需要认证: Bearer Token
 * 需要权限: Admin
 * 限制: 最多100个节点
 */
export const batchRemoveNodesFromGroup = async (
  groupId: number | string,
  data: BatchRemoveNodesFromGroupRequest
): Promise<void> => {
  // 验证节点数量限制
  if (data.node_ids.length > 100) {
    throw new Error('批量移除节点数量不能超过100个');
  }
  await apiClient.delete(`/node-groups/${groupId}/nodes/batch`, { data });
};

/**
 * 从组中移除单个节点
 * DELETE /node-groups/{id}/nodes/{nodeId}
 * 来源: swagger.json line 1842
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const removeNodeFromGroup = async (
  groupId: number | string,
  nodeId: number | string
): Promise<void> => {
  await apiClient.delete(`/node-groups/${groupId}/nodes/${nodeId}`);
};

// ==================== 订阅计划关联管理 API ====================

/**
 * 获取节点组关联的订阅计划
 * GET /node-groups/{id}/plans
 * 来源: swagger.json line 1913
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const getNodeGroupPlans = async (
  id: number | string
): Promise<SubscriptionPlanBasic[]> => {
  const response = await apiClient.get<APIResponse<SubscriptionPlanBasic[]>>(
    `/node-groups/${id}/plans`
  );
  return response.data.data;
};

/**
 * 关联订阅计划到节点组
 * POST /node-groups/{id}/plans/{planId}
 * 来源: swagger.json line 1989 (推测)
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const associatePlanToGroup = async (
  groupId: number | string,
  planId: number | string
): Promise<void> => {
  await apiClient.post(`/node-groups/${groupId}/plans/${planId}`);
};

/**
 * 取消订阅计划关联
 * DELETE /node-groups/{id}/plans/{planId}
 * 来源: swagger.json line 1989 (推测)
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const dissociatePlanFromGroup = async (
  groupId: number | string,
  planId: number | string
): Promise<void> => {
  await apiClient.delete(`/node-groups/${groupId}/plans/${planId}`);
};
