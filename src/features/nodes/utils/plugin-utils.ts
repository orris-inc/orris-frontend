/**
 * Plugin Options Utilities
 * Helper functions for Shadowsocks plugin options conversion
 */

/**
 * Convert pluginOpts object to string format
 * @example { key1: 'value1', key2: 'value2' } => 'key1=value1;key2=value2'
 */
export const pluginOptsToString = (opts?: Record<string, string>): string => {
  if (!opts || Object.keys(opts).length === 0) return '';
  return Object.entries(opts)
    .map(([key, value]) => `${key}=${value}`)
    .join(';');
};

/**
 * Parse string to pluginOpts object
 * @example 'key1=value1;key2=value2' => { key1: 'value1', key2: 'value2' }
 */
export const stringToPluginOpts = (str: string): Record<string, string> | undefined => {
  const trimmed = str.trim();
  if (!trimmed) return undefined;

  const opts: Record<string, string> = {};
  const pairs = trimmed.split(';');

  for (const pair of pairs) {
    const [key, ...valueParts] = pair.split('=');
    if (key && valueParts.length > 0) {
      opts[key.trim()] = valueParts.join('=').trim();
    }
  }

  return Object.keys(opts).length > 0 ? opts : undefined;
};

/**
 * Compare two pluginOpts objects for equality
 */
export const arePluginOptsEqual = (
  opts1?: Record<string, string>,
  opts2?: Record<string, string>
): boolean => {
  if (!opts1 && !opts2) return true;
  if (!opts1 || !opts2) return false;

  const keys1 = Object.keys(opts1);
  const keys2 = Object.keys(opts2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every((key) => opts1[key] === opts2[key]);
};
