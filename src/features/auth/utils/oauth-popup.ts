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
  type: 'oauth-success' | 'oauth-error';
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
      clearInterval(checkClosed);
      clearTimeout(timeoutId);
    };

    // Listen to postMessage event
    const handleMessage = (event: MessageEvent<OAuthCallbackMessage>) => {
      // Security check: verify message origin
      const apiOrigin = new URL(baseURL).origin;
      if (event.origin !== apiOrigin && event.origin !== window.location.origin) {
        return;
      }

      const message = event.data;

      // Validate message format
      if (!message || typeof message !== 'object' || !message.type) {
        return;
      }

      // Handle OAuth success
      if (message.type === 'oauth-success') {
        if (isSettled) return;
        isSettled = true;
        cleanup();
        popup.close();

        // Token is already stored in HttpOnly Cookie, only return user info
        if (message.user) {
          resolve(message.user);
        } else {
          reject(new Error('OAuth login succeeded but no user info returned'));
        }
      }

      // Handle OAuth error
      if (message.type === 'oauth-error') {
        if (isSettled) return;
        isSettled = true;
        cleanup();
        popup.close();
        const errorMsg = translateErrorMessage(message.error || 'oauth authentication failed');
        reject(new Error(errorMsg));
      }
    };

    // Listen for popup close
    // Note: When popup redirects to OAuth provider (Google/GitHub), COOP policy will block access to popup.closed
    // This will produce console warnings but doesn't affect functionality, as we mainly rely on postMessage communication
    const checkClosed = setInterval(() => {
      try {
        // COOP policy may block access to popup.closed, need try-catch protection
        if (!popup || popup.closed) {
          if (isSettled) return;
          isSettled = true;
          cleanup();
          reject(new Error('User cancelled OAuth authorization'));
        }
      } catch {
        // If unable to access popup.closed due to COOP, popup is still on OAuth provider page
        // Do nothing, continue waiting for postMessage
        // Only terminate on timeout
      }
    }, 1000); // Use 1 second interval to reduce COOP warning frequency

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
