/**
 * Case converter utilities for SSE events
 * Uses camel-case library (same as axios-case-converter)
 * SSE events bypass axios, so they need manual case conversion
 */

import { camelCase } from 'camel-case';

/**
 * Check if a key should be preserved (not transformed)
 * Matches the preservedKeys logic in axios.ts
 * Preserves ID keys that start with fa_, fr_, node_, user_ prefixes and are longer than 10 chars
 */
function shouldPreserveKey(key: string): boolean {
  return /^(fa|fr|node|user)_/.test(key) && key.length > 10;
}

/**
 * Convert snake_case keys to camelCase recursively
 * Uses the same camel-case library as axios-case-converter
 */
function convertKeysRecursive(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertKeysRecursive);
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const newKey = shouldPreserveKey(key) ? key : camelCase(key);
      result[newKey] = convertKeysRecursive(value);
    }
    return result;
  }

  return obj;
}

/**
 * Convert snake_case object to camelCase with preserved ID keys
 * Wrapper function with pre-configured options matching axios client
 */
export function convertSnakeToCamel<T>(data: unknown): T {
  return convertKeysRecursive(data) as T;
}
