/**
 * System Status Hover Context
 * Manages hover state at table level to prevent state loss during SSE updates
 * The hover state is lifted up so cell re-renders don't reset it
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

interface SystemStatusHoverContextValue {
  /** Currently hovered agent ID */
  hoveredAgentId: string | null;
  /** Set the hovered agent ID */
  setHoveredAgentId: (id: string | null) => void;
}

const SystemStatusHoverContext = createContext<SystemStatusHoverContextValue | null>(null);

/**
 * Provider component - wrap around the table
 */
export function SystemStatusHoverProvider({ children }: { children: ReactNode }) {
  const [hoveredAgentId, setHoveredAgentIdState] = useState<string | null>(null);

  const setHoveredAgentId = useCallback((id: string | null) => {
    setHoveredAgentIdState(id);
  }, []);

  const value = useMemo(
    () => ({ hoveredAgentId, setHoveredAgentId }),
    [hoveredAgentId, setHoveredAgentId]
  );

  return (
    <SystemStatusHoverContext.Provider value={value}>
      {children}
    </SystemStatusHoverContext.Provider>
  );
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
 * Hook to check if a specific agent is hovered
 */
export function useIsAgentHovered(agentId: string): boolean {
  const { hoveredAgentId } = useSystemStatusHover();
  return hoveredAgentId === agentId;
}
