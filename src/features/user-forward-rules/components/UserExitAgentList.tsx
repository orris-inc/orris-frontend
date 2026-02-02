/**
 * User Exit Agent List Component
 * Adapter for the generic ExitAgentList with user-specific rendering
 */

import {
  ExitAgentList as GenericExitAgentList,
  userAgentRenderer,
} from "@/components/common/ExitAgentList";
import type { UserForwardAgent, ExitAgent } from "@/api/forward";

interface UserExitAgentListProps {
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
  /** Whether the component is disabled */
  disabled?: boolean;
}

export const UserExitAgentList: React.FC<UserExitAgentListProps> = ({
  agents,
  exitAgents,
  onChange,
  hasError = false,
  idPrefix = "user-exit-agent",
  disabled = false,
}) => {
  return (
    <GenericExitAgentList
      agents={agents}
      exitAgents={exitAgents}
      onChange={onChange}
      renderAgentDetails={userAgentRenderer}
      hasError={hasError}
      idPrefix={idPrefix}
      disabled={disabled}
    />
  );
};
