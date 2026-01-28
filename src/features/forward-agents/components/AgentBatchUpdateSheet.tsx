/**
 * AgentBatchUpdateSheet - Mobile batch update sheet
 * Allows admin to trigger updates for all agents with available updates
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/common/sheet/Sheet';
import { cn } from '@/lib/utils';
import type {
  ForwardAgent,
  AgentBatchUpdateResponse,
} from '@/api/forward';

// ============================================================================
// Types
// ============================================================================

export interface AgentBatchUpdateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: ForwardAgent[];
  onBatchUpdate: (updateAll: boolean) => Promise<AgentBatchUpdateResponse>;
  isUpdating: boolean;
  result: AgentBatchUpdateResponse | null;
}

// ============================================================================
// Main Component
// ============================================================================

export const AgentBatchUpdateSheet = ({
  open,
  onOpenChange,
  agents,
  onBatchUpdate,
  isUpdating,
  result,
}: AgentBatchUpdateSheetProps) => {
  const { t } = useTranslation();
  const [hasTriggered, setHasTriggered] = useState(false);

  // Count agents with updates available (online + enabled + hasUpdate)
  const agentsWithUpdates = agents.filter(
    (agent) => agent.hasUpdate && agent.status === 'enabled' && agent.isOnline
  );
  const updateCount = agentsWithUpdates.length;

  const handleUpdate = async () => {
    setHasTriggered(true);
    await onBatchUpdate(true);
  };

  const handleClose = () => {
    setHasTriggered(false);
    onOpenChange(false);
  };

  // Show result view after update is triggered
  const showResult = hasTriggered && result && !isUpdating;

  return (
    <Sheet open={open} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent showClose>
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl flex items-center justify-center bg-warning/10">
              <Download className="size-5 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle>{t('admin.forwardAgents.batchUpdateDialog.title')}</SheetTitle>
              <SheetDescription>
                {showResult
                  ? t('admin.forwardAgents.batchUpdateDialog.taskSubmitted')
                  : t('admin.forwardAgents.batchUpdateDialog.description')}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="space-y-4 pb-4">
          {!showResult ? (
            // Confirmation view
            <>
              {/* Updatable count */}
              <div className="rounded-lg bg-card border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('admin.forwardAgents.batchUpdateDialog.updatableCount')}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-sm font-medium',
                      updateCount > 0
                        ? 'bg-warning/10 text-warning'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {updateCount}
                  </span>
                </div>
              </div>

              {updateCount === 0 ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10">
                  <CheckCircle2 className="size-4 text-success" />
                  <span className="text-sm text-success">
                    {t('admin.forwardAgents.batchUpdateDialog.allUpToDate')}
                  </span>
                </div>
              ) : (
                <div className="rounded-lg bg-card border border-border overflow-hidden">
                  <div className="px-3 py-2 border-b border-border bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t('admin.forwardAgents.batchUpdateDialog.willUpdateAgents')}
                    </p>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto divide-y divide-border">
                    {agentsWithUpdates.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between px-3 py-2.5"
                      >
                        <span className="text-sm font-medium truncate">{agent.name}</span>
                        <span className="text-xs text-muted-foreground font-mono shrink-0">
                          v{agent.agentVersion || agent.systemStatus?.agentVersion}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            // Result view
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-lg bg-success/10 text-center">
                  <CheckCircle2 className="size-5 text-success mx-auto mb-1" />
                  <p className="text-lg font-semibold text-success">
                    {result.succeeded.length}
                  </p>
                  <p className="text-[10px] text-success/80">
                    {t('admin.forwardAgents.batchUpdateDialog.succeeded')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 text-center">
                  <XCircle className="size-5 text-destructive mx-auto mb-1" />
                  <p className="text-lg font-semibold text-destructive">
                    {result.failed.length}
                  </p>
                  <p className="text-[10px] text-destructive/80">
                    {t('common.status.failed')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10 text-center">
                  <AlertTriangle className="size-5 text-warning mx-auto mb-1" />
                  <p className="text-lg font-semibold text-warning">
                    {result.skipped.length}
                  </p>
                  <p className="text-[10px] text-warning/80">
                    {t('admin.forwardAgents.batchUpdateDialog.skipped')}
                  </p>
                </div>
              </div>

              {/* Succeeded list */}
              {result.succeeded.length > 0 && (
                <div className="rounded-lg bg-card border border-border overflow-hidden">
                  <div className="px-3 py-2 border-b border-border bg-success/5">
                    <p className="text-xs font-medium text-success">
                      {t('admin.forwardAgents.batchUpdateDialog.updateTriggered')}
                    </p>
                  </div>
                  <div className="max-h-[100px] overflow-y-auto divide-y divide-border">
                    {result.succeeded.map((item) => (
                      <div
                        key={item.agentId}
                        className="flex items-center justify-between px-3 py-2"
                      >
                        <span className="text-xs font-mono truncate">{item.agentId}</span>
                        <span className="text-xs text-success shrink-0">
                          → v{item.targetVersion}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed list */}
              {result.failed.length > 0 && (
                <div className="rounded-lg bg-card border border-border overflow-hidden">
                  <div className="px-3 py-2 border-b border-border bg-destructive/5">
                    <p className="text-xs font-medium text-destructive">
                      {t('admin.forwardAgents.batchUpdateDialog.updateFailed')}
                    </p>
                  </div>
                  <div className="max-h-[100px] overflow-y-auto divide-y divide-border">
                    {result.failed.map((item) => (
                      <div
                        key={item.agentId}
                        className="flex items-center justify-between px-3 py-2"
                      >
                        <span className="text-xs font-mono truncate">{item.agentId}</span>
                        <span className="text-xs text-destructive shrink-0">{item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skipped list */}
              {result.skipped.length > 0 && (
                <div className="rounded-lg bg-card border border-border overflow-hidden">
                  <div className="px-3 py-2 border-b border-border bg-warning/5">
                    <p className="text-xs font-medium text-warning">
                      {t('admin.forwardAgents.batchUpdateDialog.updateSkipped')}
                    </p>
                  </div>
                  <div className="max-h-[100px] overflow-y-auto divide-y divide-border">
                    {result.skipped.map((item) => (
                      <div
                        key={item.agentId}
                        className="flex items-center justify-between px-3 py-2"
                      >
                        <span className="text-xs font-mono truncate">{item.agentId}</span>
                        <span className="text-xs text-warning shrink-0">{item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </SheetBody>

        <SheetFooter>
          {!showResult ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUpdate}
                disabled={updateCount === 0 || isUpdating}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5',
                  'h-11 rounded-lg',
                  'bg-warning text-warning-foreground',
                  'text-sm font-medium',
                  'disabled:opacity-50',
                  'active:opacity-80 transition-opacity'
                )}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t('common.loading.updating')}
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    {t('admin.forwardAgents.batchUpdateDialog.updateButton', { count: updateCount })}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className={cn(
                  'flex-1 h-11 rounded-lg',
                  'text-sm font-medium',
                  'border border-border bg-background',
                  'active:opacity-80 transition-opacity'
                )}
              >
                {t('common.actions.cancel')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className={cn(
                'w-full h-11 rounded-lg',
                'bg-primary text-primary-foreground',
                'text-sm font-medium',
                'active:opacity-80 transition-opacity'
              )}
            >
              {t('common.actions.close')}
            </button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

AgentBatchUpdateSheet.displayName = 'AgentBatchUpdateSheet';
