/**
 * Batch update forward agents dialog
 * Allows admin to trigger updates for all agents with available updates
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Separator } from '@/components/common/Separator';
import {
  ArrowUpCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import type {
  ForwardAgent,
  AgentBatchUpdateResponse,
  AgentBatchUpdateSuccess,
  AgentBatchUpdateFailed,
  AgentBatchUpdateSkipped,
} from '@/api/forward';

interface AgentBatchUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  agents: ForwardAgent[];
  onBatchUpdate: (updateAll: boolean) => Promise<AgentBatchUpdateResponse>;
  isUpdating: boolean;
  result: AgentBatchUpdateResponse | null;
}

export const AgentBatchUpdateDialog: React.FC<AgentBatchUpdateDialogProps> = ({
  open,
  onClose,
  agents,
  onBatchUpdate,
  isUpdating,
  result,
}) => {
  const { t } = useTranslation();
  const [hasTriggered, setHasTriggered] = useState(false);

  // Count agents with updates available (online = enabled + has systemStatus)
  const agentsWithUpdates = agents.filter(
    (agent) => agent.hasUpdate && agent.status === 'enabled' && agent.systemStatus
  );
  const updateCount = agentsWithUpdates.length;

  const handleUpdate = async () => {
    setHasTriggered(true);
    await onBatchUpdate(true);
  };

  const handleClose = () => {
    setHasTriggered(false);
    onClose();
  };

  // Show result view after update is triggered
  const showResult = hasTriggered && result && !isUpdating;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpCircle className="size-5 text-blue-500" />
            {t('admin.forwardAgents.batchUpdateDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {showResult ? t('admin.forwardAgents.batchUpdateDialog.taskSubmitted') : t('admin.forwardAgents.batchUpdateDialog.description')}
          </DialogDescription>
        </DialogHeader>

        {!showResult ? (
          // Confirmation view
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('admin.forwardAgents.batchUpdateDialog.updatableCount')}</span>
                <Badge variant={updateCount > 0 ? 'default' : 'secondary'}>
                  {updateCount}
                </Badge>
              </div>
            </div>

            {updateCount === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="size-4 text-green-500" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  {t('admin.forwardAgents.batchUpdateDialog.allUpToDate')}
                </span>
              </div>
            ) : (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t('admin.forwardAgents.batchUpdateDialog.willUpdateAgents')}</p>
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {agentsWithUpdates.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                      >
                        <span className="font-medium">{agent.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          v{agent.agentVersion || agent.systemStatus?.agentVersion}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          // Result view
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <CheckCircle2 className="size-5 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                  {result.succeeded.length}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">{t('admin.forwardAgents.batchUpdateDialog.succeeded')}</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                <XCircle className="size-5 text-red-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                  {result.failed.length}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">{t('admin.forwardAgents.batchUpdateDialog.failed')}</p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                <AlertTriangle className="size-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
                  {result.skipped.length}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">{t('admin.forwardAgents.batchUpdateDialog.skipped')}</p>
              </div>
            </div>

            {result.truncated && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Info className="size-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {t('admin.forwardAgents.batchUpdateDialog.truncatedNotice')}
                </span>
              </div>
            )}

            {result.succeeded.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  {t('admin.forwardAgents.batchUpdateDialog.updateTriggered')}
                </p>
                <div className="max-h-[100px] overflow-y-auto space-y-1">
                  {result.succeeded.map((item: AgentBatchUpdateSuccess) => (
                    <div
                      key={item.agentId}
                      className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/10 rounded text-sm"
                    >
                      <span className="font-mono text-xs">{item.agentId}</span>
                      <span className="text-xs text-green-600 dark:text-green-400">
                        → v{item.targetVersion}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.failed.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{t('admin.forwardAgents.batchUpdateDialog.updateFailed')}</p>
                <div className="max-h-[100px] overflow-y-auto space-y-1">
                  {result.failed.map((item: AgentBatchUpdateFailed) => (
                    <div
                      key={item.agentId}
                      className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/10 rounded text-sm"
                    >
                      <span className="font-mono text-xs">{item.agentId}</span>
                      <span className="text-xs text-red-600 dark:text-red-400">
                        {item.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.skipped.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  {t('admin.forwardAgents.batchUpdateDialog.updateSkipped')}
                </p>
                <div className="max-h-[100px] overflow-y-auto space-y-1">
                  {result.skipped.map((item: AgentBatchUpdateSkipped) => (
                    <div
                      key={item.agentId}
                      className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded text-sm"
                    >
                      <span className="font-mono text-xs">{item.agentId}</span>
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">
                        {item.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!showResult ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateCount === 0 || isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t('admin.forwardAgents.batchUpdateDialog.updating')}
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="size-4 mr-2" />
                    {t('admin.forwardAgents.batchUpdateDialog.updateButton', { count: updateCount })}
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>{t('common.close')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
