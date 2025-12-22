/**
 * OAuth2 Popup Login Logic
 * Implemented using window.open + postMessage
 */

import type { UserDisplayInfo } from '@/api/auth';
import { baseURL } from '@/shared/lib/axios';
import { translateErrorMessage } from '@/shared/utils/error-messages';

/** OAuth provider type */
export type OAuthProvider = 'google' | 'github';

/** OAuth callback message from popup */
export interface OAuthCallbackMessage {
  type: 'oauth_success' | 'oauth_error';
  user?: UserDisplayInfo;
  error?: string;
}

/**
 * OAuth popup configuration
 */
const POPUP_CONFIG = {
  width: 600,
  height: 700,
  features: 'menubar=no,location=no,resizable=yes,scrollbars=yes,status=yes',
};

/**
 * Open OAuth login popup
 *
 * @param provider - OAuth provider ('google' | 'github')
 * @returns Promise<UserDisplayInfo> - Returns user info on successful auth, Token is stored in HttpOnly Cookie
 */
export const openOAuthPopup = (provider: OAuthProvider): Promise<UserDisplayInfo> => {
  return new Promise((resolve, reject) => {
    // Use flag to prevent duplicate resolve/reject
    let isSettled = false;

    // Calculate popup centered position
    const left = Math.floor((window.screen.width - POPUP_CONFIG.width) / 2);
    const top = Math.floor((window.screen.height - POPUP_CONFIG.height) / 2);

    const features = `${POPUP_CONFIG.features},width=${POPUP_CONFIG.width},height=${POPUP_CONFIG.height},left=${left},top=${top}`;

    // Open OAuth authorization page
    const popup = window.open(
      `${baseURL}/auth/oauth/${provider}`,
      `OAuth-${provider}`,
      features
    );

    if (!popup) {
      reject(new Error('Popup blocked by browser, please allow popup permissions'));
      return;
    }

    // Cleanup function
    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutId);
    };

    // Listen to postMessage event
    const handleMessage = (event: MessageEvent<OAuthCallbackMessage>) => {
      console.log('[OAuth] Message received:', event.origin, event.data);

      // Security check: verify message origin
      // baseURL may be a relative path (e.g., '/api'), so we need to handle this case
      let apiOrigin: string;
      try {
        // If baseURL is absolute URL, extract its origin
        apiOrigin = new URL(baseURL).origin;
      } catch {
        // If baseURL is relative path, use current window origin
        apiOrigin = window.location.origin;
      }

      console.log('[OAuth] Origin check:', { eventOrigin: event.origin, apiOrigin, windowOrigin: window.location.origin });

      if (event.origin !== apiOrigin && event.origin !== window.location.origin) {
        console.log('[OAuth] Origin mismatch, ignoring');
        return;
      }

      const message = event.data;

      // Validate message format
      if (!message || typeof message !== 'object' || !message.type) {
        console.log('[OAuth] Invalid message format');
        return;
      }

      console.log('[OAuth] Processing message type:', message.type);

      // Handle OAuth success
      if (message.type === 'oauth_success') {
        console.log('[OAuth] Success! User:', message.user);
        if (isSettled) return;
        isSettled = true;
        cleanup();
        popup.close();

        // Token is already stored in HttpOnly Cookie, only return user info
        if (message.user) {
          console.log('[OAuth] Resolving with user');
          resolve(message.user);
        } else {
          console.log('[OAuth] No user in message');
          reject(new Error('OAuth login succeeded but no user info returned'));
        }
      }

      // Handle OAuth error
      if (message.type === 'oauth_error') {
        if (isSettled) return;
        isSettled = true;
        cleanup();
        popup.close();
        const errorMsg = translateErrorMessage(message.error || 'oauth authentication failed');
        reject(new Error(errorMsg));
      }
    };

    // Add message listener
    window.addEventListener('message', handleMessage);

    // Timeout handling (2 minutes)
    const timeoutId = setTimeout(() => {
      if (popup && !popup.closed) {
        if (isSettled) return;
        isSettled = true;
        cleanup();
        popup.close();
        reject(new Error('OAuth authentication timeout'));
      }
    }, 120000);
  });
};

/**
 * Detect if popup is blocked
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
