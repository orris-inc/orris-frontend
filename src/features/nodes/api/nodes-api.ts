/**
 * 节点管理 API 封装
 * 严格基于后端 Swagger 文档定义
 * 来源: backend/swagger.json
 */

import { apiClient } from '@/shared/lib/axios';
import type { APIResponse, ListResponse } from '@/shared/types/api.types';
import type {
  NodeListItem,
  CreateNodeRequest,
  UpdateNodeRequest,
  NodeListParams,
  NodeTokenResponse,
  NodeTrafficData,
} from '../types/nodes.types';

// 不做任何转换，直接使用后端返回的数据格式

/**
 * 获取节点列表（分页+筛选+排序）
 * GET /nodes
 * 来源: swagger.json line 1910
 * 需要认证: Bearer Token
 * 需要权限: Admin
 *
 * 新增查询参数：
 * - region: 地区筛选
 * - tags: 标签筛选（多选，逗号分隔）
 * - order_by: 排序字段（默认 sort_order）
 * - order: 排序方向（asc | desc，默认 asc）
 */
export const getNodes = async (
  params?: NodeListParams
): Promise<ListResponse<NodeListItem>> => {
  // 处理tags数组参数，转换为逗号分隔的字符串
  const queryParams = { ...params };
  if (queryParams.tags && Array.isArray(queryParams.tags)) {
    // Swagger中定义为collectionFormat: csv，需要转换为逗号分隔字符串
    (queryParams as any).tags = queryParams.tags.join(',');
  }

  const response = await apiClient.get<APIResponse<ListResponse<NodeListItem>>>(
    '/nodes',
    { params: queryParams }
  );

  // 直接返回后端数据，不做任何转换
  return response.data.data;
};

/**
 * 创建新节点
 * POST /nodes
 * 来源: swagger.json line 1801
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const createNode = async (
  data: CreateNodeRequest
): Promise<NodeListItem> => {
  const response = await apiClient.post<APIResponse<NodeListItem>>(
    '/nodes',
    data
  );
  return response.data.data;
};

/**
 * 获取指定节点详情
 * GET /nodes/{id}
 * 来源: swagger.json line 2045
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const getNodeById = async (id: number | string): Promise<NodeListItem> => {
  const response = await apiClient.get<APIResponse<NodeListItem>>(
    `/nodes/${id}`
  );
  return response.data.data;
};

/**
 * 更新节点信息（部分更新）
 * PUT /nodes/{id}
 * 来源: swagger.json line 2045
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const updateNode = async (
  id: number | string,
  data: UpdateNodeRequest
): Promise<NodeListItem> => {
  const response = await apiClient.put<APIResponse<NodeListItem>>(
    `/nodes/${id}`,
    data
  );
  return response.data.data;
};

/**
 * 删除节点
 * DELETE /nodes/{id}
 * 来源: swagger.json line 2045
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const deleteNode = async (id: number | string): Promise<void> => {
  await apiClient.delete(`/nodes/${id}`);
};

/**
 * 激活节点
 * POST /nodes/{id}/activate
 * 来源: swagger.json line 2248
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const activateNode = async (id: number | string): Promise<NodeListItem> => {
  const response = await apiClient.post<APIResponse<NodeListItem>>(
    `/nodes/${id}/activate`
  );
  return response.data.data;
};

/**
 * 停用节点
 * POST /nodes/{id}/deactivate
 * 来源: swagger.json line 2315
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const deactivateNode = async (id: number | string): Promise<NodeListItem> => {
  const response = await apiClient.post<APIResponse<NodeListItem>>(
    `/nodes/${id}/deactivate`
  );
  return response.data.data;
};

/**
 * 生成节点API Token
 * POST /nodes/{id}/token
 * 来源: swagger.json line 2382
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const generateNodeToken = async (
  id: number | string
): Promise<NodeTokenResponse> => {
  const response = await apiClient.post<APIResponse<NodeTokenResponse>>(
    `/nodes/${id}/token`
  );

  return response.data.data;
};

/**
 * 获取节点流量统计
 * 注意: 此接口在当前swagger文档中不存在
 * 如果后端未实现此接口，此方法将返回错误
 * GET /nodes/{id}/traffic
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const getNodeTraffic = async (
  id: number | string,
  params?: { start?: string; end?: string }
): Promise<NodeTrafficData> => {
  const response = await apiClient.get<APIResponse<NodeTrafficData>>(
    `/nodes/${id}/traffic`,
    { params }
  );
  return response.data.data;
};
