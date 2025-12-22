/**
 * OAuth2 Popup Login Logic
 * Uses popup window + polling to detect login completion
 */

import type { UserDisplayInfo } from '@/api/auth';
import { getCurrentUser } from '@/api/auth';
import { baseURL } from '@/shared/lib/axios';

/** OAuth provider type */
export type OAuthProvider = 'google' | 'github';

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
 * Uses polling to detect when OAuth completes (more reliable than postMessage)
 *
 * @param provider - OAuth provider ('google' | 'github')
 * @returns Promise<UserDisplayInfo> - Returns user info on successful auth
 */
export const openOAuthPopup = (provider: OAuthProvider): Promise<UserDisplayInfo> => {
  return new Promise((resolve, reject) => {
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
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };

    // Poll to check if popup is closed and user is logged in
    const pollInterval = setInterval(async () => {
      try {
        // Check if popup is closed
        if (popup.closed) {
          if (isSettled) return;

          // Popup closed, check if user is now logged in
          try {
            const user = await getCurrentUser();
            if (user) {
              isSettled = true;
              cleanup();
              resolve(user);
              return;
            }
          } catch {
            // Not logged in yet, user probably cancelled
          }

          // Popup closed but not logged in = user cancelled
          isSettled = true;
          cleanup();
          reject(new Error('User cancelled OAuth authorization'));
        }
      } catch {
        // COOP may block access to popup.closed, ignore and continue polling
      }
    }, 500);

    // Timeout handling (2 minutes)
    const timeoutId = setTimeout(() => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      try {
        popup.close();
      } catch {
        // Ignore close errors
      }
      reject(new Error('OAuth authentication timeout'));
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
