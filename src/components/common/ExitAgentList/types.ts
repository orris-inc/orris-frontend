/**
 * Types for ExitAgentList component
 */

import type { ReactNode } from "react";
import type { ExitAgent, LoadBalanceStrategy } from "@/api/forward";

/**
 * Base agent interface - minimum required fields
 */
export interface BaseAgent {
  id: string;
  name: string;
}

/**
 * Agent details render result
 */
export interface AgentDetailsRender {
  /** Badge to display after agent name (e.g., port range) */
  badge?: ReactNode;
  /** Secondary text to display (e.g., publicAddress or groupName) */
  secondaryText?: string;
}

/**
 * Agent renderer function type
 */
export type AgentRenderer<T extends BaseAgent> = (agent: T) => AgentDetailsRender;

/**
 * Props for the generic ExitAgentList component
 */
export interface ExitAgentListProps<T extends BaseAgent> {
  /** Available agent list */
  agents: T[];
  /** Selected exit agents with weights */
  exitAgents: ExitAgent[];
  /** Selection change callback */
  onChange: (exitAgents: ExitAgent[]) => void;
  /** Custom renderer for agent details */
  renderAgentDetails?: AgentRenderer<T>;
  /** Whether there is an error */
  hasError?: boolean;
  /** Component ID prefix */
  idPrefix?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Load balance strategy - affects display (failover: priority, weighted: percentage) */
  loadBalanceStrategy?: LoadBalanceStrategy;
}
