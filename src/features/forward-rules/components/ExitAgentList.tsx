/**
 * Admin Exit Agent List Component
 * Adapter for the generic ExitAgentList with admin-specific rendering
 */

import {
  ExitAgentList as GenericExitAgentList,
  adminAgentRenderer,
} from "@/components/common/ExitAgentList";
import type { ForwardAgent, ExitAgent, LoadBalanceStrategy } from "@/api/forward";

interface ExitAgentListProps {
  /** Available agent list */
  agents: ForwardAgent[];
  /** Selected exit agents with weights */
  exitAgents: ExitAgent[];
  /** Selection change callback */
  onChange: (exitAgents: ExitAgent[]) => void;
  /** Whether there is an error */
  hasError?: boolean;
  /** Component ID prefix */
  idPrefix?: string;
  /** Load balance strategy - affects display (failover: priority, weighted: percentage) */
  loadBalanceStrategy?: LoadBalanceStrategy;
}

export const ExitAgentList: React.FC<ExitAgentListProps> = ({
  agents,
  exitAgents,
  onChange,
  hasError = false,
  idPrefix = "exit-agent",
  loadBalanceStrategy,
}) => {
  return (
    <GenericExitAgentList
      agents={agents}
      exitAgents={exitAgents}
      onChange={onChange}
      renderAgentDetails={adminAgentRenderer}
      hasError={hasError}
      idPrefix={idPrefix}
      loadBalanceStrategy={loadBalanceStrategy}
    />
  );
};
