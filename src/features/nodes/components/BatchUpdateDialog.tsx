/**
 * Node Batch Update Dialog
 * Wrapper around shared BatchUpdateDialog for nodes
 */

import {
  BatchUpdateDialog as BaseBatchUpdateDialog,
  type BatchUpdateResult,
} from '@/shared/components/agent';
import type { Node, BatchUpdateResponse } from '@/api/node';

interface BatchUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  nodes: Node[];
  onBatchUpdate: (updateAll: boolean) => Promise<BatchUpdateResponse>;
  isUpdating: boolean;
  result: BatchUpdateResponse | null;
}

/**
 * Transform API response to common BatchUpdateResult
 */
const transformResult = (
  result: BatchUpdateResponse | null
): BatchUpdateResult | null => {
  if (!result) return null;
  return {
    succeeded: result.succeeded.map((item) => ({
      id: item.nodeId,
      targetVersion: item.targetVersion,
    })),
    failed: result.failed.map((item) => ({
      id: item.nodeId,
      reason: item.reason,
    })),
    skipped: result.skipped.map((item) => ({
      id: item.nodeId,
      reason: item.reason,
    })),
    truncated: result.truncated,
  };
};

/**
 * Filter function to determine which nodes can be updated
 */
const filterUpdatable = (node: Node): boolean => {
  return node.hasUpdate === true && node.isOnline === true;
};

export const BatchUpdateDialog: React.FC<BatchUpdateDialogProps> = ({
  open,
  onClose,
  nodes,
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
      entities={nodes}
      filterUpdatable={filterUpdatable}
      onBatchUpdate={handleBatchUpdate}
      isUpdating={isUpdating}
      result={transformResult(result)}
      i18nNamespace="admin.nodes.batchUpdate"
      idField="nodeId"
    />
  );
};
