/**
 * 节点组管理类型定义
 * 严格基于后端 Swagger 文档定义
 * 来源: backend/swagger.json /node-groups
 */

import type { NodeListItem } from '@/features/nodes/types/nodes.types';

/**
 * 节点组列表项
 * GET /node-groups 接口返回数据
 */
export interface NodeGroupListItem {
  id: number;
  name: string;
  description?: string;
  is_public: boolean;
  sort_order?: number;
  node_count?: number; // 前端计算或后端返回
  created_at: string;
  updated_at?: string;
}

/**
 * 节点组详情（包含关联的节点）
 * GET /node-groups/{id} 接口返回数据
 */
export interface NodeGroupDetail extends NodeGroupListItem {
  nodes?: NodeListItem[];
  subscription_plans?: SubscriptionPlanBasic[];
}

/**
 * 订阅计划基础信息
 */
export interface SubscriptionPlanBasic {
  id: number;
  name: string;
  price?: number;
  duration_days?: number;
}

/**
 * 创建节点组请求
 * POST /node-groups
 * 来源: swagger.json node.CreateNodeGroupRequest
 */
export interface CreateNodeGroupRequest {
  name: string;              // 必需
  description?: string;      // 可选
  is_public?: boolean;       // 可选
  sort_order?: number;       // 可选
}

/**
 * 更新节点组请求
 * PUT /node-groups/{id}
 * 来源: swagger.json node.UpdateNodeGroupRequest
 * 所有字段都是可选的
 */
export interface UpdateNodeGroupRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
  sort_order?: number;
}

/**
 * 节点组列表查询参数
 * 来源: swagger.json GET /node-groups 接口参数
 */
export interface NodeGroupListParams {
  page?: number;              // 页码，默认 1
  page_size?: number;         // 每页数量，默认 20
  is_public?: boolean;        // 公开性筛选
}

/**
 * 节点组筛选条件（前端使用）
 */
export interface NodeGroupFilters {
  is_public?: boolean;        // 公开性筛选
  search?: string;            // 前端本地搜索（按名称/描述）
}

/**
 * 添加节点到组请求
 * POST /node-groups/{id}/nodes
 * 来源: swagger.json node.AddNodeToGroupRequest
 */
export interface AddNodeToGroupRequest {
  node_id: number;            // 必需
}

/**
 * 批量添加节点到组请求
 * POST /node-groups/{id}/nodes/batch
 * 来源: swagger.json node.BatchAddNodesToGroupRequest
 */
export interface BatchAddNodesToGroupRequest {
  node_ids: number[];         // 必需，1-100个节点ID
}

/**
 * 批量从组中移除节点请求
 * DELETE /node-groups/{id}/nodes/batch
 * 来源: swagger.json node.BatchRemoveNodesFromGroupRequest
 */
export interface BatchRemoveNodesFromGroupRequest {
  node_ids: number[];         // 必需，1-100个节点ID
}

/**
 * 关联订阅计划请求
 * POST /node-groups/{id}/plans/{planId}
 * 来源: swagger.json node.AssociatePlanRequest
 */
export interface AssociatePlanRequest {
  plan_id: number;            // 必需
}

/**
 * 节点组统计信息（前端使用）
 */
export interface NodeGroupStats {
  total: number;
  public: number;
  private: number;
}
