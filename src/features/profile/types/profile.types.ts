import { z } from 'zod';
import type { TFunction } from 'i18next';

// Types exported from @/api/profile, only Zod validation schemas are kept here
export type { UpdateProfileRequest, ChangePasswordRequest } from '@/api/profile';

/**
 * Update profile validation schema factory
 */
export const createUpdateProfileSchema = (t: TFunction) =>
  z.object({
    name: z
      .string()
      .min(2, t('profile.validation.usernameTooShort'))
      .max(100, t('profile.validation.usernameTooLong'))
      .optional(),
    email: z
      .string()
      .email(t('profile.validation.invalidEmail'))
      .optional(),
  });

/**
 * Change password validation schema factory
 * Password requirements: 8-72 characters, must contain at least one letter and one number
 */
export const createChangePasswordSchema = (t: TFunction) =>
  z
    .object({
      oldPassword: z.string().min(1, t('profile.validation.currentPasswordRequired')),
      newPassword: z
        .string()
        .min(8, t('profile.validation.newPasswordTooShort'))
        .max(72, t('profile.validation.newPasswordTooLong'))
        .regex(/[a-zA-Z]/, t('profile.validation.passwordNeedsLetter'))
        .regex(/\d/, t('profile.validation.passwordNeedsNumber')),
      confirmPassword: z.string().min(1, t('profile.validation.confirmPasswordRequired')),
      logoutAllDevices: z.boolean().optional(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('profile.validation.passwordMismatch'),
      path: ['confirmPassword'],
    })
    .refine((data) => data.oldPassword !== data.newPassword, {
      message: t('profile.validation.newPasswordSameAsOld'),
      path: ['newPassword'],
    });

export type UpdateProfileFormData = z.infer<ReturnType<typeof createUpdateProfileSchema>>;
export type ChangePasswordFormData = z.infer<ReturnType<typeof createChangePasswordSchema>>;
