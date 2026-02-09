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
  const actionText = isEnabling ? t('common.actions.enable') : t('common.actions.disable');
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StatusIcon
              className={`size-5 ${isEnabling ? 'text-success' : 'text-warning'}`}
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
                  ? 'bg-success/10'
                  : 'bg-warning/10'
              }`}
            >
              <p
                className={`text-sm ${
                  isEnabling
                    ? 'text-success'
                    : 'text-warning'
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
              <div className="p-3 bg-success/10 rounded-lg text-center">
                <CheckCircle2 className="size-5 text-success mx-auto mb-1" />
                <p className="text-lg font-semibold text-success">
                  {result.succeeded.length}
                </p>
                <p className="text-xs text-success">{t('admin.forwardRules.batch.succeeded')}</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg text-center">
                <XCircle className="size-5 text-destructive mx-auto mb-1" />
                <p className="text-lg font-semibold text-destructive">
                  {failedCount}
                </p>
                <p className="text-xs text-destructive">{t('common.status.failed')}</p>
              </div>
            </div>

            {failedCount > 0 && result.failed && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">
                  {t('admin.forwardRules.batch.toggleFailed', { action: actionText })}
                </p>
                <div className="max-h-[150px] overflow-y-auto space-y-1">
                  {result.failed.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-destructive/10 rounded text-sm"
                    >
                      <span className="font-mono text-xs truncate max-w-[150px]">{item.id}</span>
                      <span className="text-xs text-destructive truncate max-w-[180px]">
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
                variant={isEnabling ? 'default' : 'secondary'}
                onClick={handleConfirm}
                disabled={isProcessing || selectedCount === 0}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t('common.processing')}
                  </>
                ) : (
                  <>
                    <StatusIcon className="size-4 mr-2" />
                    {t('admin.forwardRules.batch.toggleCount', { action: actionText, count: selectedCount })}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
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
