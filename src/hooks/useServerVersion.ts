/**
 * Hook to fetch version information
 * Provides both server version (from API) and client version (from build)
 */

import { useState, useEffect } from 'react';
import { getVersion } from '@/api/auth';

// Client version info from build-time constants
export const CLIENT_VERSION = __APP_VERSION__;
export const BUILD_TIME = __BUILD_TIME__;
export const COMMIT_HASH = __COMMIT_HASH__;

// Module-level cache to share server version across all hook instances
let cachedServerVersion: string | null = null;
let fetchPromise: Promise<string | null> | null = null;

interface UseVersionInfoResult {
  serverVersion: string | null;
  clientVersion: string;
  isLoading: boolean;
}

/**
 * @deprecated Use useVersionInfo instead
 */
export const useServerVersion = (): { version: string | null; isLoading: boolean } => {
  const { serverVersion, isLoading } = useVersionInfo();
  return { version: serverVersion, isLoading };
};

export const useVersionInfo = (): UseVersionInfoResult => {
  const [serverVersion, setServerVersion] = useState<string | null>(cachedServerVersion);
  const [isLoading, setIsLoading] = useState(cachedServerVersion === null);

  useEffect(() => {
    // Already have cached version
    if (cachedServerVersion !== null) {
      setServerVersion(cachedServerVersion);
      setIsLoading(false);
      return;
    }

    // Reuse existing fetch promise to avoid duplicate requests
    if (!fetchPromise) {
      fetchPromise = (async () => {
        try {
          const response = await getVersion();
          cachedServerVersion = response.version;
          return cachedServerVersion;
        } catch {
          return null;
        }
      })();
    }

    fetchPromise.then((v) => {
      setServerVersion(v);
      setIsLoading(false);
    });
  }, []);

  return {
    serverVersion,
    clientVersion: CLIENT_VERSION,
    isLoading,
  };
};
