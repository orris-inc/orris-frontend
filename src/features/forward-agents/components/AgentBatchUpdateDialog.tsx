/**
 * Forward Agent Batch Update Dialog
 * Wrapper around shared BatchUpdateDialog for forward agents
 */

import {
  BatchUpdateDialog as BaseBatchUpdateDialog,
  type BatchUpdateResult,
} from '@/shared/components/agent';
import type { ForwardAgent, AgentBatchUpdateResponse } from '@/api/forward';

interface AgentBatchUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  agents: ForwardAgent[];
  onBatchUpdate: (updateAll: boolean) => Promise<AgentBatchUpdateResponse>;
  isUpdating: boolean;
  result: AgentBatchUpdateResponse | null;
}

/**
 * Transform API response to common BatchUpdateResult
 */
const transformResult = (
  result: AgentBatchUpdateResponse | null
): BatchUpdateResult | null => {
  if (!result) return null;
  return {
    succeeded: result.succeeded.map((item) => ({
      id: item.agentId,
      targetVersion: item.targetVersion,
    })),
    failed: result.failed.map((item) => ({
      id: item.agentId,
      reason: item.reason,
    })),
    skipped: result.skipped.map((item) => ({
      id: item.agentId,
      reason: item.reason,
    })),
    truncated: result.truncated,
  };
};

/**
 * Filter function to determine which agents can be updated
 */
const filterUpdatable = (agent: ForwardAgent): boolean => {
  return agent.hasUpdate === true && agent.status === 'enabled' && !!agent.systemStatus;
};

export const AgentBatchUpdateDialog: React.FC<AgentBatchUpdateDialogProps> = ({
  open,
  onClose,
  agents,
  onBatchUpdate,
  isUpdating,
  result,
}) => {
  // Wrap onBatchUpdate to transform the result
  const handleBatchUpdate = async (updateAll: boolean): Promise<BatchUpdateResult> => {
    const apiResult = await onBatchUpdate(updateAll);
    return transformResult(apiResult)!;
  };

  return (
    <BaseBatchUpdateDialog
      open={open}
      onClose={onClose}
      entities={agents}
      filterUpdatable={filterUpdatable}
      onBatchUpdate={handleBatchUpdate}
      isUpdating={isUpdating}
      result={transformResult(result)}
      i18nNamespace="admin.forwardAgents.batchUpdateDialog"
      idField="agentId"
    />
  );
};
