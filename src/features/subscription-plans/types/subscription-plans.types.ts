/**
 * 订阅计划类型定义
 * 严格基于后端 Swagger 文档定义
 */

/**
 * 计费周期枚举
 * 来源: swagger.json line 3632-3638
 */
export type BillingCycle =
  | 'monthly'      // 月付
  | 'quarterly'    // 季付
  | 'semi_annual'  // 半年付
  | 'annual'       // 年付
  | 'lifetime';    // 终身

/**
 * 订阅计划状态枚举
 * 来源: swagger.json line 3615-3619
 */
export type PlanStatus =
  | 'active'       // 激活
  | 'inactive'     // 未激活
  | 'archived';    // 已归档

/**
 * 创建订阅计划请求
 * 严格基于后端 Swagger 定义
 * 来源: backend/swagger.json -> handlers.CreatePlanRequest
 */
export interface CreatePlanRequest {
  // 必填字段
  name: string;                      // 计划名称
  slug: string;                      // URL友好的唯一标识
  price: number;                     // 价格（整数，单位：分）
  currency: string;                  // 货币代码（如：CNY, USD）
  billing_cycle: BillingCycle;       // 计费周期

  // 可选字段
  description?: string;              // 计划描述
  features?: string[];               // 功能列表
  is_public?: boolean;               // 是否公开显示
  trial_days?: number;               // 试用天数
  max_users?: number;                // 最大用户数
  max_projects?: number;             // 最大项目数
  api_rate_limit?: number;           // API速率限制
  limits?: Record<string, any>;      // 其他自定义限制（additionalProperties: true）
  sort_order?: number;               // 排序顺序
}

/**
 * 更新订阅计划请求
 * 严格基于后端 Swagger 定义
 * 来源: backend/swagger.json -> handlers.UpdatePlanRequest
 * 注意: 不支持更新 name, slug, billing_cycle, trial_days
 */
export interface UpdatePlanRequest {
  // 所有字段都是可选的
  price?: number;                    // 价格（分）
  currency?: string;                 // 货币代码
  description?: string;              // 计划描述
  features?: string[];               // 功能列表
  is_public?: boolean;               // 是否公开
  max_users?: number;                // 最大用户数
  max_projects?: number;             // 最大项目数
  api_rate_limit?: number;           // API速率限制
  limits?: Record<string, any>;      // 自定义限制
  sort_order?: number;               // 排序顺序
}

/**
 * 订阅计划响应数据（后端返回格式 - PascalCase）
 * 基于实际API返回的字段名
 */
export interface SubscriptionPlan {
  // 系统字段 - 后端使用PascalCase
  ID: number;
  Status: PlanStatus;
  CreatedAt: string;                // ISO 8601 格式
  UpdatedAt: string;                // ISO 8601 格式

  // 业务字段 - 后端使用PascalCase
  Name: string;
  Slug: string;
  Price: number;                    // 价格（分）- 主要价格（向后兼容）
  Currency: string;
  BillingCycle: BillingCycle;
  Description?: string;
  Features?: string[];
  IsPublic: boolean;
  TrialDays?: number;
  MaxUsers?: number;
  MaxProjects?: number;
  APIRateLimit?: number;
  Limits?: Record<string, any>;
  SortOrder?: number;

  // 新增字段 - 多定价支持
  pricings?: PlanPricing[];         // 该计划的所有可用定价选项（小写，后端实际返回格式）
}

/**
 * 订阅计划列表查询参数
 * 来源: swagger.json line 3599-3644
 */
export interface SubscriptionPlanListParams {
  page?: number;                     // 页码，默认 1
  page_size?: number;                // 每页数量，默认 20
  status?: PlanStatus;               // 状态筛选
  is_public?: boolean;               // 筛选公开/私有计划
  billing_cycle?: BillingCycle;      // 计费周期筛选
}

/**
 * 订阅计划筛选条件（前端使用）
 */
export interface SubscriptionPlanFilters {
  status?: PlanStatus;
  is_public?: boolean;
  billing_cycle?: BillingCycle;
  search?: string;                   // 前端本地搜索（按名称）
  min_price?: number;                // 最小价格筛选（前端本地）
  max_price?: number;                // 最大价格筛选（前端本地）
}

/**
 * 计划定价选项
 * 用于支持同一计划的多种计费周期定价
 */
export interface PlanPricing {
  billing_cycle: BillingCycle;       // 计费周期
  price: number;                     // 价格（分）
  currency: string;                  // 货币代码
  is_active: boolean;                // 是否激活
}

/**
 * 更新订阅计划状态请求
 * PATCH /subscription-plans/{id}/status
 * 来源: swagger.json internal_interfaces_http_handlers.UpdatePlanStatusRequest
 */
export interface UpdatePlanStatusRequest {
  status: 'active' | 'inactive';     // 必需：激活或未激活
}
