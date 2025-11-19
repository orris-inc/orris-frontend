/**
 * 认证 API 封装
 * 基于后端 Swagger 文档
 */

import { apiClient } from '@/shared/lib/axios';
import type { APIResponse } from '@/shared/types/api.types';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User,
} from '../types/auth.types';

/**
 * 用户登录
 * POST /auth/login
 * Token 存储在 HttpOnly Cookie 中，响应只返回用户信息
 */
export const login = async (data: LoginRequest): Promise<User> => {
  const response = await apiClient.post<APIResponse<AuthResponse>>('/auth/login', data);
  return response.data.data.user;
};

/**
 * 用户注册
 * POST /auth/register
 */
export const register = async (data: RegisterRequest): Promise<void> => {
  await apiClient.post<APIResponse>('/auth/register', data);
};

/**
 * 刷新Token
 * POST /auth/refresh
 * Cookie 自动携带，后端自动更新 Cookie
 */
export const refreshToken = async (): Promise<void> => {
  await apiClient.post<APIResponse>('/auth/refresh');
};

/**
 * 登出
 * POST /auth/logout
 */
export const logout = async (): Promise<void> => {
  await apiClient.post<APIResponse>('/auth/logout');
};

/**
 * 获取当前用户信息
 * GET /auth/me
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<APIResponse<User>>('/auth/me');
  return response.data.data;
};

/**
 * 忘记密码 - 发送重置邮件
 * POST /auth/forgot-password
 */
export const forgotPassword = async (data: ForgotPasswordRequest): Promise<void> => {
  await apiClient.post<APIResponse>('/auth/forgot-password', data);
};

/**
 * 重置密码
 * POST /auth/reset-password
 */
export const resetPassword = async (data: ResetPasswordRequest): Promise<void> => {
  await apiClient.post<APIResponse>('/auth/reset-password', data);
};

/**
 * 邮箱验证
 * POST /auth/verify-email
 */
export const verifyEmail = async (token: string): Promise<void> => {
  await apiClient.post<APIResponse>('/auth/verify-email', { token });
};

/**
 * 重新发送验证邮件
 * POST /auth/resend-verification
 */
export const resendVerificationEmail = async (email: string): Promise<void> => {
  await apiClient.post<APIResponse>('/auth/resend-verification', { email });
};
