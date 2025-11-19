/**
 * 用户管理 API 封装
 * 严格基于后端 Swagger 文档定义
 * 来源: backend/swagger.yaml
 */

import { apiClient } from '@/shared/lib/axios';
import type { APIResponse, ListResponse } from '@/shared/types/api.types';
import type {
  UserListItem,
  CreateUserRequest,
  UpdateUserRequest,
  UserListParams,
} from '../types/users.types';

/**
 * 获取用户列表（分页+筛选）
 * GET /users
 * 来源: swagger.yaml line 4206
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const getUsers = async (
  params?: UserListParams
): Promise<ListResponse<UserListItem>> => {
  const response = await apiClient.get<APIResponse<ListResponse<UserListItem>>>(
    '/users',
    { params }
  );
  return response.data.data;
};

/**
 * 创建新用户
 * POST /users
 * 来源: swagger.yaml line 4206
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const createUser = async (
  data: CreateUserRequest
): Promise<UserListItem> => {
  const response = await apiClient.post<APIResponse<UserListItem>>(
    '/users',
    data
  );
  return response.data.data;
};

/**
 * 获取指定用户详情
 * GET /users/{id}
 * 来源: swagger.yaml line 4312
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const getUserById = async (id: number | string): Promise<UserListItem> => {
  const response = await apiClient.get<APIResponse<UserListItem>>(
    `/users/${id}`
  );
  return response.data.data;
};

/**
 * 更新用户信息（部分更新）
 * PATCH /users/{id}
 * 来源: swagger.json line 5883
 * 需要认证: Bearer Token
 * 需要权限: Admin
 * 注意：所有字段都是可选的，至少提供一个
 */
export const updateUser = async (
  id: number | string,
  data: UpdateUserRequest
): Promise<UserListItem> => {
  const response = await apiClient.patch<APIResponse<UserListItem>>(
    `/users/${id}`,
    data
  );
  return response.data.data;
};

/**
 * 删除用户
 * DELETE /users/{id}
 * 来源: swagger.yaml line 4312
 * 需要认证: Bearer Token
 * 需要权限: Admin
 */
export const deleteUser = async (id: number | string): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};
