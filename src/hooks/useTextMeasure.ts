/**
 * Text measurement hook using Pretext library
 * Provides fast, DOM-free text measurement for virtualization and layout
 */

import { useMemo, useCallback, useRef } from 'react';
import { prepare, layout, type PreparedText } from '@chenglou/pretext';

interface TextMeasureOptions {
  /** CSS font string, e.g. '13px Inter' */
  font: string;
  /** Line height in pixels */
  lineHeight: number;
  /** White space handling */
  whiteSpace?: 'normal' | 'pre-wrap';
}

interface MeasureResult {
  height: number;
  lineCount: number;
}

/**
 * Hook for measuring text dimensions without DOM layout
 * Uses Pretext's Canvas-based measurement for ~300x faster performance
 */
export function useTextMeasure(options: TextMeasureOptions) {
  const { font, lineHeight, whiteSpace = 'normal' } = options;
  const cacheRef = useRef<Map<string, PreparedText>>(new Map());

  const getPrepared = useCallback(
    (text: string): PreparedText => {
      const key = `${text}__${font}`;
      let prepared = cacheRef.current.get(key);
      if (!prepared) {
        prepared = prepare(text, font, { whiteSpace });
        cacheRef.current.set(key, prepared);
        // Prevent unbounded cache growth
        if (cacheRef.current.size > 500) {
          const firstKey = cacheRef.current.keys().next().value;
          if (firstKey) cacheRef.current.delete(firstKey);
        }
      }
      return prepared;
    },
    [font, whiteSpace]
  );

  const measure = useCallback(
    (text: string, maxWidth: number): MeasureResult => {
      if (!text) return { height: lineHeight, lineCount: 1 };
      const prepared = getPrepared(text);
      return layout(prepared, maxWidth, lineHeight);
    },
    [getPrepared, lineHeight]
  );

  const measureHeight = useCallback(
    (text: string, maxWidth: number): number => {
      return measure(text, maxWidth).height;
    },
    [measure]
  );

  const isOverflowing = useCallback(
    (text: string, maxWidth: number): boolean => {
      if (!text) return false;
      const prepared = getPrepared(text);
      const result = layout(prepared, maxWidth, lineHeight);
      return result.lineCount > 1;
    },
    [getPrepared, lineHeight]
  );

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return useMemo(
    () => ({ measure, measureHeight, isOverflowing, clearCache }),
    [measure, measureHeight, isOverflowing, clearCache]
  );
}

/**
 * Batch measurement for virtualizer row height estimation
 * Measures multiple text values and returns the max height + padding
 */
export function measureRowHeight(
  texts: string[],
  maxWidth: number,
  font: string,
  lineHeight: number,
  padding: number = 20
): number {
  let maxH = lineHeight;
  for (const text of texts) {
    if (!text) continue;
    const prepared = prepare(text, font, { whiteSpace: 'normal' });
    const result = layout(prepared, maxWidth, lineHeight);
    if (result.height > maxH) maxH = result.height;
  }
  return maxH + padding;
}
