/**
 * 个人资料API
 * 基于后端 Swagger 文档实现
 */

import { apiClient } from '@/shared/lib/axios';
import type { APIResponse } from '@/shared/types/api.types';
import type { User } from '@/features/auth/types/auth.types';
import type {
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../types/profile.types';

/**
 * 更新个人资料
 * API: PATCH /users/me
 */
export const updateProfile = async (
  data: UpdateProfileRequest
): Promise<User> => {
  const response = await apiClient.patch<APIResponse<User>>(
    '/users/me',
    data
  );

  return response.data.data;
};

/**
 * 修改密码
 * API: PUT /users/me/password
 */
export const changePassword = async (
  data: ChangePasswordRequest
): Promise<void> => {
  // 提取实际需要发送给后端的字段，移除前端验证字段
  const { old_password, new_password, logout_all_devices } = data;

  await apiClient.put<APIResponse<void>>(
    '/users/me/password',
    {
      old_password,
      new_password,
      logout_all_devices,
    }
  );
};

/**
 * 上传头像
 * 注意：后端暂无此接口，保留函数签名以便将来实现
 * TODO: 等待后端提供头像上传API
 */
export const uploadAvatar = async (file: File): Promise<{ avatar_url: string }> => {
  console.warn('头像上传功能暂未实现，后端API开发中');

  // 创建本地预览URL（临时方案）
  const localUrl = URL.createObjectURL(file);

  return {
    avatar_url: localUrl,
  };
};
