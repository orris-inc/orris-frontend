/**
 * OAuth2 Popup Login Logic
 * Uses popup window + polling to detect login completion.
 *
 * Detection strategy (handles COOP restrictions):
 * 1. Poll popup.closed every 500ms — when closed, check auth immediately
 * 2. Every 2s, check auth status regardless of popup state (COOP fallback)
 * 3. Listen for postMessage from callback page (best-effort, may be blocked by COOP)
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

/** Interval for checking popup.closed */
const POLL_INTERVAL_MS = 500;

/** How often to check auth status as a COOP fallback (in poll ticks) */
const AUTH_CHECK_EVERY_N_TICKS = 4; // 4 * 500ms = 2 seconds

/** Overall timeout for the OAuth flow */
const TIMEOUT_MS = 120_000; // 2 minutes

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
    let tickCount = 0;
    let isCheckingAuth = false;

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

    const settle = (fn: () => void) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      fn();
    };

    // Cleanup all listeners and timers
    const cleanup = () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
      window.removeEventListener('message', onMessage);
    };

    // Check if user is now authenticated (cookies set by callback)
    const checkAuth = async (): Promise<UserDisplayInfo | null> => {
      if (isCheckingAuth) return null;
      isCheckingAuth = true;
      try {
        return await getCurrentUser();
      } catch {
        return null;
      } finally {
        isCheckingAuth = false;
      }
    };

    // Listen for postMessage from callback page (best-effort)
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'oauth_success' && event.data.user) {
        settle(() => {
          try { popup.close(); } catch { /* ignore */ }
          resolve(event.data.user);
        });
      }
    };
    window.addEventListener('message', onMessage);

    // Main polling loop
    const pollInterval = setInterval(async () => {
      if (isSettled) return;
      tickCount++;

      let popupClosed = false;
      try {
        popupClosed = popup.closed;
      } catch {
        // COOP may block access to popup.closed — fall through to auth check
      }

      if (popupClosed) {
        // Popup is definitely closed, check auth once
        const user = await checkAuth();
        if (user) {
          settle(() => resolve(user));
        } else {
          settle(() => reject(new Error('User cancelled OAuth authorization')));
        }
        return;
      }

      // Periodic auth check as COOP fallback:
      // Even if we can't detect popup closure, cookies may already be set.
      if (tickCount % AUTH_CHECK_EVERY_N_TICKS === 0) {
        const user = await checkAuth();
        if (user) {
          settle(() => {
            try { popup.close(); } catch { /* ignore */ }
            resolve(user);
          });
        }
      }
    }, POLL_INTERVAL_MS);

    // Timeout handling
    const timeoutId = setTimeout(() => {
      settle(() => {
        try { popup.close(); } catch { /* ignore */ }
        reject(new Error('OAuth authentication timeout'));
      });
    }, TIMEOUT_MS);
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
