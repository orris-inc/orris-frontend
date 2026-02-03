/**
 * Agent renderers for ExitAgentList component
 * These are separated to avoid Fast Refresh warnings
 */

import { Badge } from "@/components/common/Badge";
import { portRangeBadgeStyles } from "@/lib/ui-styles";
import type { ForwardAgent, UserForwardAgent } from "@/api/forward";
import type { AgentRenderer } from "./types";

/**
 * Admin agent renderer - displays allowedPortRange badge and publicAddress
 */
export const adminAgentRenderer: AgentRenderer<ForwardAgent> = (agent) => ({
  badge: agent.allowedPortRange ? (
    <Badge variant="outline" className={portRangeBadgeStyles}>
      {agent.allowedPortRange}
    </Badge>
  ) : undefined,
  secondaryText: agent.publicAddress,
});

/**
 * User agent renderer - displays group names
 */
export const userAgentRenderer: AgentRenderer<UserForwardAgent> = (agent) => ({
  secondaryText: agent.groups?.map((g) => g.name).join(', '),
});
