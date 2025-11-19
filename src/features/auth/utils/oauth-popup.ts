/**
 * OAuth2 弹窗登录逻辑
 * 使用 window.open + postMessage 实现
 */

import type { OAuthProvider, OAuthCallbackMessage, User } from '../types/auth.types';
import { translateErrorMessage } from '@/shared/utils/error-messages';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

/**
 * OAuth弹窗配置
 */
const POPUP_CONFIG = {
  width: 600,
  height: 700,
  features: 'menubar=no,location=no,resizable=yes,scrollbars=yes,status=yes',
};

/**
 * 打开OAuth登录弹窗
 *
 * @param provider - OAuth提供商 ('google' | 'github')
 * @returns Promise<User> - 认证成功返回用户信息，Token 存储在 HttpOnly Cookie 中
 */
export const openOAuthPopup = (provider: OAuthProvider): Promise<User> => {
  return new Promise((resolve, reject) => {
    // 使用标志位防止重复resolve/reject
    let isSettled = false;

    // 计算弹窗居中位置
    const left = Math.floor((window.screen.width - POPUP_CONFIG.width) / 2);
    const top = Math.floor((window.screen.height - POPUP_CONFIG.height) / 2);

    const features = `${POPUP_CONFIG.features},width=${POPUP_CONFIG.width},height=${POPUP_CONFIG.height},left=${left},top=${top}`;

    // 打开OAuth授权页面
    const popup = window.open(
      `${API_BASE_URL}/auth/oauth/${provider}`,
      `OAuth-${provider}`,
      features
    );

    if (!popup) {
      reject(new Error('弹窗被浏览器阻止，请允许弹窗权限'));
      return;
    }

    // 清理函数
    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(checkClosed);
      clearTimeout(timeoutId);
    };

    // 监听postMessage事件
    const handleMessage = (event: MessageEvent<OAuthCallbackMessage>) => {
      // 安全检查：验证消息来源
      const apiOrigin = new URL(API_BASE_URL).origin;
      if (event.origin !== apiOrigin && event.origin !== window.location.origin) {
        console.warn('Rejected OAuth message from untrusted origin:', event.origin);
        return;
      }

      const message = event.data;

      // 验证消息格式
      if (!message || typeof message !== 'object' || !message.type) {
        console.warn('Invalid OAuth message format:', message);
        return;
      }

      // 处理OAuth成功
      if (message.type === 'oauth_success') {
        if (isSettled) return;
        isSettled = true;
        cleanup();
        popup.close();

        // Token 已存储在 HttpOnly Cookie 中，只返回用户信息
        resolve(message.user);
      }

      // 处理OAuth失败
      if (message.type === 'oauth_error') {
        if (isSettled) return;
        isSettled = true;
        cleanup();
        popup.close();
        const errorMsg = translateErrorMessage(message.error || 'oauth authentication failed');
        reject(new Error(errorMsg));
      }
    };

    // 监听弹窗关闭
    // 注意：当弹窗跳转到OAuth提供商（Google/GitHub）时，COOP策略会阻止访问popup.closed
    // 这会在控制台产生警告，但不影响功能，因为我们主要依赖postMessage通信
    const checkClosed = setInterval(() => {
      try {
        // COOP策略可能会阻止访问popup.closed，需要try-catch保护
        if (!popup || popup.closed) {
          if (isSettled) return;
          isSettled = true;
          cleanup();
          reject(new Error('用户取消了OAuth授权'));
        }
      } catch (e) {
        // 如果因为COOP无法访问popup.closed，说明弹窗仍在OAuth提供商页面
        // 不做任何处理，继续等待postMessage
        // 只有在超时的情况下才会终止
      }
    }, 1000); // 使用1秒间隔，减少COOP警告频率

    // 添加消息监听
    window.addEventListener('message', handleMessage);

    // 超时处理 (2分钟)
    const timeoutId = setTimeout(() => {
      if (popup && !popup.closed) {
        if (isSettled) return;
        isSettled = true;
        cleanup();
        popup.close();
        reject(new Error('OAuth认证超时'));
      }
    }, 120000);
  });
};

/**
 * 检测弹窗是否被阻止
 */
export const isPopupBlocked = (): boolean => {
  try {
    const testPopup = window.open('', '_blank', 'width=1,height=1');
    if (!testPopup) {
      return true;
    }
    testPopup.close();
    return false;
  } catch {
    return true;
  }
};
