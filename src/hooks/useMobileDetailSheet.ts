/**
 * useMobileDetailSheet - Hook for managing detail sheet state
 *
 * Consolidates common sheet logic:
 * - Selected item state
 * - Open state
 * - Open/close functions
 */

import { useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface UseMobileDetailSheetResult<T> {
  /** Currently selected item */
  selectedItem: T | null;
  /** Whether sheet is open */
  isOpen: boolean;
  /** Open sheet with an item */
  openSheet: (item: T) => void;
  /** Close sheet */
  closeSheet: () => void;
  /** Set open state (for controlled Sheet component) */
  setOpen: (open: boolean) => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useMobileDetailSheet<T>(): UseMobileDetailSheetResult<T> {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openSheet = useCallback((item: T) => {
    setSelectedItem(item);
    setIsOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsOpen(false);
    // Delay clearing item to allow close animation
    // Item is kept for sheet content during animation
  }, []);

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Delay clearing item to allow close animation
    }
  }, []);

  return {
    selectedItem,
    isOpen,
    openSheet,
    closeSheet,
    setOpen,
  };
}
