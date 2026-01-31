/**
 * System Status Hover Hooks
 * Extracted for Fast Refresh compatibility
 */

import { useContext } from 'react';
import { SystemStatusHoverContext } from './system-status-hover-context';

/**
 * Hook to access hover state
 */
export function useSystemStatusHover() {
  const context = useContext(SystemStatusHoverContext);
  if (!context) {
    throw new Error('useSystemStatusHover must be used within SystemStatusHoverProvider');
  }
  return context;
}

/**
 * Hook to check if a specific item is hovered
 */
export function useIsItemHovered(itemId: string): boolean {
  const { hoveredId } = useSystemStatusHover();
  return hoveredId === itemId;
}
