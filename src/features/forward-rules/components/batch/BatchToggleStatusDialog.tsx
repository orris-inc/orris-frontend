/**
 * Batch toggle status dialog for forward rules
 * Allows enabling or disabling multiple rules at once
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
import { Loader2, CheckCircle2, XCircle, Power, PowerOff } from 'lucide-react';
import type { BatchOperationResult } from '@/api/forward';

interface BatchToggleStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  targetStatus: 'enabled' | 'disabled';
  onConfirm: () => Promise<BatchOperationResult>;
  isProcessing: boolean;
}

export const BatchToggleStatusDialog: React.FC<BatchToggleStatusDialogProps> = ({
  open,
  onOpenChange,
  selectedCount,
  targetStatus,
  onConfirm,
  isProcessing,
}) => {
  const { t } = useTranslation();
  const [result, setResult] = useState<BatchOperationResult | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  const isEnabling = targetStatus === 'enabled';
  const actionText = isEnabling ? t('admin.forwardRules.batch.enable') : t('admin.forwardRules.batch.disable');
  const StatusIcon = isEnabling ? Power : PowerOff;

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

  const showResult = hasTriggered && result && !isProcessing;
  const failedCount = result?.failed?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StatusIcon
              className={`size-5 ${isEnabling ? 'text-green-500' : 'text-orange-500'}`}
            />
            {t('admin.forwardRules.batch.toggleTitle', { action: actionText })}
          </DialogTitle>
          <DialogDescription>
            {showResult
              ? t('admin.forwardRules.batch.toggleComplete', { action: actionText })
              : t('admin.forwardRules.batch.toggleDescription', { action: actionText })}
          </DialogDescription>
        </DialogHeader>

        {!showResult ? (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg ${
                isEnabling
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-orange-50 dark:bg-orange-900/20'
              }`}
            >
              <p
                className={`text-sm ${
                  isEnabling
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-orange-700 dark:text-orange-300'
                }`}
              >
                {t('admin.forwardRules.batch.toggleConfirm', { action: actionText, count: selectedCount })}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {isEnabling
                  ? t('admin.forwardRules.batch.toggleEnableHint')
                  : t('admin.forwardRules.batch.toggleDisableHint')}
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
                <p className="text-xs text-red-600 dark:text-red-400">{t('admin.forwardRules.batch.failed')}</p>
              </div>
            </div>

            {failedCount > 0 && result.failed && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  {t('admin.forwardRules.batch.toggleFailed', { action: actionText })}
                </p>
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
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                {t('admin.forwardRules.batch.cancel')}
              </Button>
              <Button
                variant={isEnabling ? 'default' : 'secondary'}
                onClick={handleConfirm}
                disabled={isProcessing || selectedCount === 0}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t('admin.forwardRules.batch.processing')}
                  </>
                ) : (
                  <>
                    <StatusIcon className="size-4 mr-2" />
                    {t('admin.forwardRules.batch.toggleCount', { action: actionText, count: selectedCount })}
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>{t('admin.forwardRules.batch.close')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
