/**
 * Command Palette keyboard hook
 * Extracted for Fast Refresh compatibility
 */

import { useEffect } from 'react';

/**
 * Global keyboard listener for ⌘K / Ctrl+K
 */
export function useCommandPaletteKeyboard(
  onOpen: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpen, enabled]);
}
