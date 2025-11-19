import { z } from 'zod';

/**
 * 更新个人资料请求
 * 基于后端 API: PATCH /users/me
 */
export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

/**
 * 修改密码请求
 * 基于后端 API: PUT /users/me/password
 */
export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  logout_all_devices?: boolean;
}

/**
 * 更新个人资料验证Schema
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, '用户名至少需要2个字符')
    .max(100, '用户名最多100个字符')
    .optional(),
  email: z
    .string()
    .email('请输入有效的邮箱地址')
    .optional(),
});

/**
 * 修改密码验证Schema
 */
export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, '请输入当前密码'),
    new_password: z
      .string()
      .min(8, '新密码至少需要8个字符'),
    confirm_password: z.string().min(1, '请确认新密码'),
    logout_all_devices: z.boolean().optional(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: '两次输入的密码不一致',
    path: ['confirm_password'],
  })
  .refine((data) => data.old_password !== data.new_password, {
    message: '新密码不能与旧密码相同',
    path: ['new_password'],
  });

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
