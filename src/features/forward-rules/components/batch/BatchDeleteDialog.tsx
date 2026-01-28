/**
 * Batch delete confirmation dialog for forward rules
 * Shows confirmation before deletion and displays results after operation
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
import { Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import type { BatchOperationResult } from '@/api/forward';

interface BatchDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: () => Promise<BatchOperationResult>;
  isDeleting: boolean;
}

export const BatchDeleteDialog: React.FC<BatchDeleteDialogProps> = ({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isDeleting,
}) => {
  const { t } = useTranslation();
  const [result, setResult] = useState<BatchOperationResult | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  const handleConfirm = async () => {
    setHasTriggered(true);
    const res = await onConfirm();
    setResult(res);
  };

  const handleClose = () => {
    setHasTriggered(false);
    setResult(null);
    onOpenChange(false);
  };

  const showResult = hasTriggered && result && !isDeleting;
  const failedCount = result?.failed?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="size-5 text-destructive" />
            {t('admin.forwardRules.batch.deleteTitle')}
          </DialogTitle>
          <DialogDescription>
            {showResult
              ? t('admin.forwardRules.batch.deleteComplete')
              : t('admin.forwardRules.batch.deleteDescription')}
          </DialogDescription>
        </DialogHeader>

        {!showResult ? (
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive">
                {t('admin.forwardRules.batch.deleteConfirm', { count: selectedCount })}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('admin.forwardRules.batch.deleteWarning')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <CheckCircle2 className="size-5 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                  {result.succeeded.length}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">{t('admin.forwardRules.batch.succeeded')}</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                <XCircle className="size-5 text-red-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                  {failedCount}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">{t('common.status.failed')}</p>
              </div>
            </div>

            {failedCount > 0 && result.failed && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{t('admin.forwardRules.batch.deleteFailed')}</p>
                <div className="max-h-[150px] overflow-y-auto space-y-1">
                  {result.failed.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/10 rounded text-sm"
                    >
                      <span className="font-mono text-xs truncate max-w-[150px]">{item.id}</span>
                      <span className="text-xs text-red-600 dark:text-red-400 truncate max-w-[180px]">
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
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={isDeleting || selectedCount === 0}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t('common.loading.deleting')}
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4 mr-2" />
                    {t('admin.forwardRules.batch.deleteRulesCount', { count: selectedCount })}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
                {t('common.actions.cancel')}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>{t('common.actions.close')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
