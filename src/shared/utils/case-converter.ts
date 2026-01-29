/**
 * Case converter utilities for SSE data
 * Converts snake_case objects to camelCase
 */

/**
 * Convert a snake_case string to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively convert all keys in an object from snake_case to camelCase
 */
export function convertSnakeToCamel<T>(obj: unknown): T {
  if (obj === null || obj === undefined) {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertSnakeToCamel(item)) as T;
  }

  if (typeof obj === 'object') {
    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = snakeToCamel(key);
      converted[camelKey] = convertSnakeToCamel(value);
    }
    return converted as T;
  }

  return obj as T;
}
