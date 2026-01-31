/**
 * System Status Hover Context
 * Context definition extracted for Fast Refresh compatibility
 */

import { createContext } from 'react';

export interface SystemStatusHoverContextValue {
  /** Currently hovered item ID */
  hoveredId: string | null;
  /** Set the hovered item ID */
  setHoveredId: (id: string | null) => void;
}

export const SystemStatusHoverContext = createContext<SystemStatusHoverContextValue | null>(null);
