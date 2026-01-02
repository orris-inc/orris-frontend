/**
 * System Status Hover Context
 * Manages hover state at table level to prevent state loss during SSE updates
 * The hover state is lifted up so cell re-renders don't reset it
 * Shared by Node and Forward Agent pages
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

interface SystemStatusHoverContextValue {
  /** Currently hovered item ID */
  hoveredId: string | null;
  /** Set the hovered item ID */
  setHoveredId: (id: string | null) => void;
}

const SystemStatusHoverContext = createContext<SystemStatusHoverContextValue | null>(null);

/**
 * Provider component - wrap around the table
 */
export function SystemStatusHoverProvider({ children }: { children: ReactNode }) {
  const [hoveredId, setHoveredIdState] = useState<string | null>(null);

  const setHoveredId = useCallback((id: string | null) => {
    setHoveredIdState(id);
  }, []);

  const value = useMemo(() => ({ hoveredId, setHoveredId }), [hoveredId, setHoveredId]);

  return <SystemStatusHoverContext.Provider value={value}>{children}</SystemStatusHoverContext.Provider>;
}

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
