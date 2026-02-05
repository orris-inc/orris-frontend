/**
 * Hook for copying text to clipboard with status feedback
 */

import { useState, useCallback, useRef } from 'react';

interface UseCopyToClipboardOptions {
  /** Duration in ms before resetting copied state (default: 2000) */
  resetDelay?: number;
  /** Callback when copy succeeds */
  onSuccess?: () => void;
  /** Callback when copy fails */
  onError?: (error: Error) => void;
}

interface UseCopyToClipboardReturn {
  /** Whether the text was recently copied */
  copied: boolean;
  /** Copy text to clipboard */
  copyToClipboard: (text: string) => Promise<boolean>;
  /** Reset copied state manually */
  reset: () => void;
}

/**
 * Custom hook for copying text to clipboard with visual feedback
 *
 * @example
 * ```tsx
 * const { copied, copyToClipboard } = useCopyToClipboard();
 *
 * <button onClick={() => copyToClipboard('Hello')}>
 *   {copied ? <Check /> : <Copy />}
 * </button>
 * ```
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): UseCopyToClipboardReturn {
  const { resetDelay = 2000, onSuccess, onError } = options;
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    setCopied(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const copyToClipboard = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text) return false;

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        onSuccess?.();

        timeoutRef.current = setTimeout(() => {
          setCopied(false);
          timeoutRef.current = null;
        }, resetDelay);

        return true;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Copy failed');
        onError?.(err);
        return false;
      }
    },
    [resetDelay, onSuccess, onError]
  );

  return { copied, copyToClipboard, reset };
}
