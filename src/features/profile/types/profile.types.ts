import { z } from 'zod';

// Types exported from @/api/profile, only Zod validation schemas are kept here
export type { UpdateProfileRequest, ChangePasswordRequest } from '@/api/profile';

/**
 * Update profile validation schema
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
 * Change password validation schema
 */
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, '请输入当前密码'),
    newPassword: z
      .string()
      .min(8, '新密码至少需要8个字符'),
    confirmPassword: z.string().min(1, '请确认新密码'),
    logoutAllDevices: z.boolean().optional(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: '新密码不能与旧密码相同',
    path: ['newPassword'],
  });

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
