/**
 * 用户管理类型定义
 * 后端 API 类型从 @/api/user 导入，这里只保留前端特有类型
 */

// 从 @/api/user 重新导出类型
export type { UserResponse, CreateUserRequest, UpdateUserRequest, ListUsersParams } from '@/api/user';

// 为向后兼容保留 User 别名
export type { UserResponse as User } from '@/api/user';

// 为向后兼容保留的别名
export type { UserResponse as UserListItem } from '@/api/user';

/**
 * 前端创建用户表单请求（包含密码字段）
 * 注意：后端 CreateUserRequest 不包含 password，但前端表单需要
 */
export interface CreateUserFormData {
  email: string;
  name: string;
  password: string;
}

/**
 * 用户状态枚举
 * Updated 2025-12-19: Removed 'deleted' status
 */
export type UserStatus =
  | 'active'      // 激活
  | 'inactive'    // 未激活
  | 'pending'     // 待处理
  | 'suspended';  // 暂停

/**
 * 用户角色枚举
 */
export type UserRole =
  | 'user'        // 普通用户
  | 'admin';      // 管理员

/**
 * 用户筛选条件（前端使用）
 */
export interface UserFilters {
  status?: UserStatus;          // 状态筛选
  role?: UserRole;              // 角色筛选
  search?: string;              // 前端本地搜索（按邮箱/姓名）
}
