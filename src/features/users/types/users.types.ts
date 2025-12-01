/**
 * 用户管理类型定义
 * 严格基于后端 Swagger 文档定义
 * 来源: backend/swagger.json
 */

/**
 * 用户状态枚举
 * 来源: swagger.json UpdateUserRequest status 枚举
 */
export type UserStatus =
  | 'active'      // 激活
  | 'inactive'    // 未激活
  | 'pending'     // 待处理
  | 'suspended'   // 暂停
  | 'deleted';    // 已删除

/**
 * 用户角色枚举
 * 来源: swagger.json UpdateUserRequest role 枚举
 */
export type UserRole =
  | 'user'        // 普通用户
  | 'admin';      // 管理员

/**
 * 用户列表项（管理端使用）
 * 来源: swagger.json UserResponse 定义
 */
export interface UserListItem {
  id: number;
  email: string;
  name: string;
  display_name?: string;
  initials?: string;
  status: string;
  role?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * 创建用户请求
 * 来源: swagger.json CreateUserRequest 定义
 * POST /users
 */
export interface CreateUserRequest {
  email: string;      // 必需
  name: string;       // 必需，长度 2-100
}

/**
 * 更新用户请求（部分更新）
 * 来源: swagger.json UpdateUserRequest 定义
 * PATCH /users/{id}
 * 所有字段都是可选的，至少提供一个
 */
export interface UpdateUserRequest {
  email?: string;     // 可选
  name?: string;      // 可选，长度 2-100
  status?: UserStatus;  // 可选
  role?: UserRole;    // 可选
}

/**
 * 用户列表查询参数
 * 来源: swagger.json GET /users 接口参数
 */
export interface UserListParams {
  page?: number;                // 页码，默认 1
  page_size?: number;           // 每页数量，默认 20
  status?: UserStatus;          // 状态筛选
  role?: UserRole;              // 角色筛选
}

/**
 * 用户筛选条件（前端使用）
 */
export interface UserFilters {
  status?: UserStatus;          // 状态筛选
  role?: UserRole;              // 角色筛选
  search?: string;              // 前端本地搜索（按邮箱/姓名）
}

/**
 * 修改密码请求
 * POST /users/change-password
 * 来源: swagger.json internal_application_user_dto.ChangePasswordRequest
 */
export interface ChangePasswordRequest {
  old_password: string;         // 必需：旧密码（最少8位）
  new_password: string;         // 必需：新密码（最少8位）
  logout_all_devices?: boolean; // 可选：是否登出所有设备
}

/**
 * 更新个人资料请求
 * PUT /users/profile
 * 来源: swagger.json internal_application_user_dto.UpdateProfileRequest
 */
export interface UpdateProfileRequest {
  name?: string;                // 可选：用户名（2-100字符）
  email?: string;               // 可选：邮箱
}
