/**
 * 订阅类型定义
 * 严格基于后端实际返回的数据格式
 */

/**
 * 订阅状态枚举
 */
export type SubscriptionStatus =
  | 'active'      // 激活
  | 'inactive'    // 未激活
  | 'cancelled'   // 已取消
  | 'expired'     // 已过期
  | 'pending';    // 待处理

/**
 * 计费周期枚举
 */
export type BillingCycle =
  | 'weekly'       // 周付
  | 'monthly'      // 月付
  | 'quarterly'    // 季付
  | 'semi_annual'  // 半年付
  | 'yearly'       // 年付
  | 'lifetime';    // 终身

/**
 * 创建订阅请求
 * 管理员可以通过 user_id 为其他用户创建订阅
 */
export interface CreateSubscriptionRequest {
  plan_id: number;                // 必需：订阅计划ID
  billing_cycle: BillingCycle;    // 必需：计费周期
  user_id?: number;               // 可选：管理员可以指定目标用户ID
  auto_renew?: boolean;           // 可选：是否自动续费
  start_date?: string;            // 可选：开始日期
  payment_info?: Record<string, unknown>;  // 可选：支付信息
}

/**
 * 订阅响应数据��后端返回的 PascalCase 格式）
 */
export interface Subscription {
  // 基本信息
  ID: number;
  UserID: number;
  PlanID?: number;
  Status: SubscriptionStatus;

  // 续费和周期
  AutoRenew: boolean;
  CurrentPeriodStart?: string;
  CurrentPeriodEnd?: string;

  // 日期
  StartDate: string;
  EndDate?: string;

  // 取消信息
  CancelledAt?: string | null;
  CancelReason?: string | null;

  // 状态标记
  IsActive: boolean;
  IsExpired: boolean;

  // 时间戳
  CreatedAt: string;
  UpdatedAt: string;

  // 关联数据（可能包含）
  Plan?: {
    ID: number;
    Name: string;
    Price: number;
    Currency: string;
    BillingCycle?: string;
    Description?: string;
  };
  User?: {
    ID: number;
    Email: string;
    Name: string;
  };
}

/**
 * 订阅创建结果
 */
export interface SubscriptionCreateResult {
  subscription: Subscription;
  message?: string;
}

/**
 * 订阅��表查询参数
 */
export interface SubscriptionListParams {
  page?: number;                     // 页码，默认 1
  page_size?: number;                // 每页数量，默认 20
  status?: SubscriptionStatus;       // 状态筛选
}

/**
 * 订阅令牌（Token）
 * 用于生成订阅链接
 * 基于后端实际返回格式（PascalCase）
 */
export interface SubscriptionToken {
  ID: number;                        // 令牌ID
  SubscriptionID: number;            // 所属订阅ID
  Token?: string;                    // 令牌字符串（可能为空，需要使用ID或Prefix）
  Prefix?: string;                   // 令牌前缀（如"sub"）
  Name: string;                      // 令牌名称
  Scope: string;                     // 作用域
  ExpiresAt?: string;                // 过期时间
  IsActive: boolean;                 // 是否活跃
  LastUsedAt?: string;               // 最后使用时间
  UsageCount?: number;               // 使用次数
  CreatedAt: string;                 // 创建时间
  UpdatedAt?: string;                // 更新时间
}

/**
 * 生成令牌请求
 * POST /subscriptions/{id}/tokens
 */
export interface GenerateTokenRequest {
  name: string;                      // 必需：令牌名称
  scope: string;                     // 必需：作用域
  expires_at?: string;               // 可选：过期时间
}

/**
 * 获取令牌列表参数
 * GET /subscriptions/{id}/tokens
 */
export interface GetTokensParams {
  active_only?: boolean;             // 是否只显示活跃令牌，默认false
}
