/**
 * usePageTitle Hook
 * Used for dynamically setting page title
 */

import { useEffect } from 'react';

/**
 * Set page title
 * @param title Page title (without application name)
 * @param appName Application name, defaults to "Orris"
 *
 * @example
 * ```tsx
 * usePageTitle('User Management'); // Page title: Orris - User Management
 * usePageTitle('Dashboard', 'MyApp'); // Page title: MyApp - Dashboard
 * ```
 */
export const usePageTitle = (title: string, appName = 'Orris') => {
  useEffect(() => {
    const fullTitle = title ? `${appName} - ${title}` : appName;
    document.title = fullTitle;

    // Cleanup function: restore default title when component unmounts
    return () => {
      document.title = appName;
    };
  }, [title, appName]);
};
