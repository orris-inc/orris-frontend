/**
 * Subscription Exit Agent List Component
 * Adapter for the generic ExitAgentList with user-specific rendering
 */

import {
  ExitAgentList as GenericExitAgentList,
  userAgentRenderer,
} from "@/components/common/ExitAgentList";
import type { UserForwardAgent, ExitAgent } from "@/api/forward";

interface SubscriptionExitAgentListProps {
  /** Available agent list */
  agents: UserForwardAgent[];
  /** Selected exit agents with weights */
  exitAgents: ExitAgent[];
  /** Selection change callback */
  onChange: (exitAgents: ExitAgent[]) => void;
  /** Whether there is an error */
  hasError?: boolean;
  /** Component ID prefix */
  idPrefix?: string;
}

export const SubscriptionExitAgentList: React.FC<SubscriptionExitAgentListProps> = ({
  agents,
  exitAgents,
  onChange,
  hasError = false,
  idPrefix = "sub-exit-agent",
}) => {
  return (
    <GenericExitAgentList
      agents={agents}
      exitAgents={exitAgents}
      onChange={onChange}
      renderAgentDetails={userAgentRenderer}
      hasError={hasError}
      idPrefix={idPrefix}
    />
  );
};
