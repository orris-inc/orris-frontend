/**
 * URL validation utilities for security
 */

/**
 * Validate if a URL is safe to open in a new window
 * Only allows http:// and https:// protocols to prevent XSS via javascript: or data: URLs
 */
export const isSafeExternalUrl = (url: string | undefined): boolean => {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    // Invalid URL format
    return false;
  }
};

/**
 * Safely open a URL in a new window
 * Returns true if the URL was opened, false if blocked due to security
 */
export const safeWindowOpen = (url: string | undefined): boolean => {
  if (!isSafeExternalUrl(url)) {
    return false;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
};
