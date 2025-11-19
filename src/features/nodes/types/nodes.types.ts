/**
 * 节点管理类型定义
 * 严格基于后端 Swagger 文档定义
 * 来源: backend/swagger.json
 */

/**
 * 节点状态枚举
 * 来源: swagger.json GET /nodes status 参数枚举
 */
export type NodeStatus =
  | 'active'      // 激活
  | 'inactive'    // 未激活
  | 'maintenance' // 维护中
  | 'error';      // 错误

/**
 * 节点协议类型
 * 来源: swagger.json node.CreateNodeRequest protocol 枚举
 */
export type NodeProtocol =
  | 'shadowsocks'  // Shadowsocks协议
  | 'trojan';      // Trojan协议

/**
 * 节点列表项（管理端使用）
 * 来源: swagger.json /nodes 接口返回数据
 */
export interface NodeListItem {
  id: number;
  name: string;
  description?: string;
  protocol: NodeProtocol;
  server_address: string;
  server_port: number;
  method: string;
  plugin?: string;
  plugin_opts?: Record<string, string>;
  region?: string;
  status: NodeStatus;
  max_users?: number;
  traffic_limit?: number;
  traffic_used?: number;
  sort_order?: number;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  last_heartbeat?: string;
}

/**
 * 创建节点请求
 * 严格基于 swagger.json internal_interfaces_http_handlers_node.CreateNodeRequest
 * POST /nodes
 */
export interface CreateNodeRequest {
  name: string;              // 必需
  protocol: NodeProtocol;    // 必需：协议类型 (shadowsocks, trojan)
  server_address: string;    // 必需
  server_port: number;       // 必需
  method: string;            // 必需：加密方法
  description?: string;      // 可选
  plugin?: string;           // 可选
  plugin_opts?: Record<string, string>; // 可选
  region?: string;           // 可选：地区
  sort_order?: number;       // 可选：排序顺序
  tags?: string[];           // 可选：标签
}

/**
 * 更新节点请求（部分更新）
 * 严格基于 swagger.json internal_interfaces_http_handlers_node.UpdateNodeRequest
 * PUT /nodes/{id}
 * 所有字段都是可选的
 */
export interface UpdateNodeRequest {
  name?: string;
  description?: string;
  server_address?: string;
  server_port?: number;
  method?: string;
  plugin?: string;
  plugin_opts?: Record<string, string>;
  region?: string;
  status?: 'active' | 'inactive' | 'maintenance';  // 只包含swagger中定义的枚举值
  sort_order?: number;
  tags?: string[];
}

/**
 * 节点列表查询参数
 * 来源: swagger.json GET /nodes 接口参数
 */
export interface NodeListParams {
  page?: number;              // 页码，默认 1
  page_size?: number;         // 每页数量，默认 20
  status?: NodeStatus;        // 状态筛选
  region?: string;            // 地区筛选 (新增)
  tags?: string[];            // 标签筛选，多选 (新增)
  order_by?: string;          // 排序字段，默认 "sort_order" (新增)
  order?: 'asc' | 'desc';     // 排序方向，默认 "asc" (新增)
}

/**
 * 节点筛选条件（前端使用）
 */
export interface NodeFilters {
  status?: NodeStatus;        // 状态筛选
  region?: string;            // 地区筛选 (新增)
  tags?: string[];            // 标签筛选 (新增)
  order_by?: string;          // 排序字段 (新增)
  order?: 'asc' | 'desc';     // 排序方向 (新增)
  search?: string;            // 前端本地搜索（按名称/地址）
}

/**
 * 节点Token响应（后端返回格式 - PascalCase）
 * POST /nodes/{id}/token 接口返回数据
 */
export interface NodeTokenResponse {
  Token: string;
  NodeID: number;
  TokenPrefix: string;
  ExpiresAt: string | null;
  CreatedAt: string;
}

/**
 * 节点流量统计数据
 * GET /nodes/{id}/traffic 接口返回数据
 */
export interface NodeTrafficData {
  node_id: number;
  upload_bytes: number;
  download_bytes: number;
  total_bytes: number;
  start_time: string;
  end_time: string;
  data_points?: TrafficDataPoint[];
}

/**
 * 流量数据点（用于图表展示）
 */
export interface TrafficDataPoint {
  timestamp: string;
  upload_bytes: number;
  download_bytes: number;
  total_bytes: number;
}

/**
 * 节点统计信息（前端使用）
 */
export interface NodeStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  error: number;
}
