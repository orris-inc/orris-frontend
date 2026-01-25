/**
 * Generic Batch Update Dialog Component
 * Reusable dialog for batch updating agents/nodes
 */

import { useState, useCallback } from 'react';
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

/**
 * Common entity interface for batch update
 */
export interface BatchUpdateEntity {
  id: string;
  name: string;
  agentVersion?: string;
  systemStatus?: {
    agentVersion?: string;
  };
}

/**
 * Common batch update result item
 */
export interface BatchUpdateResultItem {
  id: string;
  targetVersion?: string;
  reason?: string;
}

/**
 * Common batch update response
 */
export interface BatchUpdateResult {
  succeeded: BatchUpdateResultItem[];
  failed: BatchUpdateResultItem[];
  skipped: BatchUpdateResultItem[];
  truncated?: boolean;
}

interface BatchUpdateDialogProps<T extends BatchUpdateEntity> {
  open: boolean;
  onClose: () => void;
  /** List of entities to potentially update */
  entities: T[];
  /** Filter function to determine which entities can be updated */
  filterUpdatable: (entity: T) => boolean;
  /** Callback to trigger batch update */
  onBatchUpdate: (updateAll: boolean) => Promise<BatchUpdateResult>;
  /** Whether update is in progress */
  isUpdating: boolean;
  /** Update result */
  result: BatchUpdateResult | null;
  /** i18n namespace for translations */
  i18nNamespace: 'admin.forwardAgents.batchUpdateDialog' | 'admin.nodes.batchUpdate';
  /** ID field name in result items */
  idField?: 'agentId' | 'nodeId';
}

export function BatchUpdateDialog<T extends BatchUpdateEntity>({
  open,
  onClose,
  entities,
  filterUpdatable,
  onBatchUpdate,
  isUpdating,
  result,
  i18nNamespace,
  idField = 'nodeId',
}: BatchUpdateDialogProps<T>) {
  const { t } = useTranslation();
  const [hasTriggered, setHasTriggered] = useState(false);

  // Filter entities with updates available
  const updatableEntities = entities.filter(filterUpdatable);
  const updateCount = updatableEntities.length;

  const handleUpdate = useCallback(async () => {
    setHasTriggered(true);
    await onBatchUpdate(true);
  }, [onBatchUpdate]);

  const handleClose = useCallback(() => {
    setHasTriggered(false);
    onClose();
  }, [onClose]);

  // Show result view after update is triggered
  const showResult = hasTriggered && result && !isUpdating;

  // Get entity ID from result item
  const getResultItemId = (item: Record<string, unknown>): string => {
    return (item[idField] as string) || (item.id as string) || '';
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpCircle className="size-5 text-blue-500" />
            {t(`${i18nNamespace}.title`)}
          </DialogTitle>
          <DialogDescription>
            {showResult
              ? t(`${i18nNamespace}.taskSubmitted`)
              : t(`${i18nNamespace}.description`)}
          </DialogDescription>
        </DialogHeader>

        {!showResult ? (
          // Confirmation view
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t(`${i18nNamespace}.updatableCount`)}
                </span>
                <Badge variant={updateCount > 0 ? 'default' : 'secondary'}>
                  {updateCount}
                </Badge>
              </div>
            </div>

            {updateCount === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="size-4 text-green-500" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  {t(`${i18nNamespace}.allUpToDate`)}
                </span>
              </div>
            ) : (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {t(`${i18nNamespace}.willUpdateAgents`, {
                      defaultValue: t(`${i18nNamespace}.willUpdateNodes`, {
                        defaultValue: 'Will update:',
                      }),
                    })}
                  </p>
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {updatableEntities.map((entity) => (
                      <div
                        key={entity.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                      >
                        <span className="font-medium">{entity.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          v{entity.agentVersion || entity.systemStatus?.agentVersion}
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
                <p className="text-xs text-green-600 dark:text-green-400">
                  {t(`${i18nNamespace}.succeeded`)}
                </p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                <XCircle className="size-5 text-red-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                  {result.failed.length}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  {t(`${i18nNamespace}.failed`)}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                <AlertTriangle className="size-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
                  {result.skipped.length}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  {t(`${i18nNamespace}.skipped`)}
                </p>
              </div>
            </div>

            {result.truncated && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Info className="size-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {t(`${i18nNamespace}.truncatedNotice`, {
                    defaultValue: t(`${i18nNamespace}.truncatedHint`, {
                      defaultValue: 'Results truncated',
                    }),
                  })}
                </span>
              </div>
            )}

            {result.succeeded.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  {t(`${i18nNamespace}.updateTriggered`)}
                </p>
                <div className="max-h-[100px] overflow-y-auto space-y-1">
                  {result.succeeded.map((item) => (
                    <div
                      key={getResultItemId(item as unknown as Record<string, unknown>)}
                      className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/10 rounded text-sm"
                    >
                      <span className="font-mono text-xs">
                        {getResultItemId(item as unknown as Record<string, unknown>)}
                      </span>
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
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  {t(`${i18nNamespace}.updateFailed`)}
                </p>
                <div className="max-h-[100px] overflow-y-auto space-y-1">
                  {result.failed.map((item) => (
                    <div
                      key={getResultItemId(item as unknown as Record<string, unknown>)}
                      className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/10 rounded text-sm"
                    >
                      <span className="font-mono text-xs">
                        {getResultItemId(item as unknown as Record<string, unknown>)}
                      </span>
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
                  {t(`${i18nNamespace}.updateSkipped`)}
                </p>
                <div className="max-h-[100px] overflow-y-auto space-y-1">
                  {result.skipped.map((item) => (
                    <div
                      key={getResultItemId(item as unknown as Record<string, unknown>)}
                      className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded text-sm"
                    >
                      <span className="font-mono text-xs">
                        {getResultItemId(item as unknown as Record<string, unknown>)}
                      </span>
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
                {t('common.actions.cancel')}
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateCount === 0 || isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t(`${i18nNamespace}.updating`)}
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="size-4 mr-2" />
                    {t(`${i18nNamespace}.updateButton`, {
                      count: updateCount,
                      defaultValue: t(`${i18nNamespace}.updateCount`, {
                        count: updateCount,
                        defaultValue: `Update ${updateCount}`,
                      }),
                    })}
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>{t('common.actions.close')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
