/**
 * 认证相关类型定义
 * 基于后端 Swagger 文档: backend/swagger.yaml
 */

import type { UserRole } from '../../../types/navigation.types';

/**
 * 用户信息
 * 基于后端实际返回的数据结构
 */
export interface User {
  id: number | string; // 后端返回number，兼容string
  email: string;
  display_name?: string; // 后端字段
  name?: string; // 用于兼容
  initials?: string; // 后端字段
  avatar?: string;
  status?: string; // 后端字段：active等
  email_verified?: boolean;
  oauth_provider?: 'google' | 'github' | null;
  role?: UserRole; // 用户角色：用于权限控制
  created_at: string;
  updated_at?: string;
}

/**
 * 认证响应 (登录/注册/OAuth成功后返回)
 * Token 存储在 HttpOnly Cookie 中，响应只返回用户信息
 */
export interface AuthResponse {
  user: User;
}

/**
 * 登录请求
 */
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

/**
 * 注册请求
 */
export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

/**
 * 刷新Token请求
 * Cookie 方案不需要传递 refresh_token，浏览器会自动携带
 */
export interface RefreshTokenRequest {
  // 不再需要传递参数，保留接口以保持兼容性
}

/**
 * 忘记密码请求
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * 重置密码请求
 */
export interface ResetPasswordRequest {
  token: string;
  password: string;
}

/**
 * OAuth 提供商
 */
export type OAuthProvider = 'google' | 'github';

/**
 * OAuth 回调消息类型 (PostMessage)
 * Token 存储在 HttpOnly Cookie 中，只传递用户信息
 */
export interface OAuthSuccessMessage {
  type: 'oauth_success';
  user: User;
}

export interface OAuthErrorMessage {
  type: 'oauth_error';
  error: string;
}

export type OAuthCallbackMessage = OAuthSuccessMessage | OAuthErrorMessage;
