/**
 * System Status Hover Context Provider
 * Manages hover state at table level to prevent state loss during SSE updates
 * The hover state is lifted up so cell re-renders don't reset it
 * Shared by Node and Forward Agent pages
 */

import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { SystemStatusHoverContext } from './system-status-hover-context';

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
