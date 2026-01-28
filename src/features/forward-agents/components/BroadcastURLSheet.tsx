/**
 * Broadcast URL Sheet - Mobile optimized
 * Tailwind Application UI style bottom sheet for broadcasting API URL changes
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Radio,
  Loader2,
  CheckCircle2,
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
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { MobileFormInput } from '@/components/common/mobile-form';
import { cn } from '@/lib/utils';
import type { BroadcastAPIURLChangedResponse } from '@/api/forward';

interface BroadcastURLSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBroadcast: (newUrl: string, reason?: string) => Promise<BroadcastAPIURLChangedResponse>;
  isBroadcasting: boolean;
  onlineCount: number;
}

type Step = 'input' | 'confirm' | 'result';

export const BroadcastURLSheet: React.FC<BroadcastURLSheetProps> = ({
  open,
  onOpenChange,
  onBroadcast,
  isBroadcasting,
  onlineCount,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('input');
  const [newUrl, setNewUrl] = useState('');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BroadcastAPIURLChangedResponse | null>(null);

  const handleClose = () => {
    setStep('input');
    setNewUrl('');
    setReason('');
    setConfirmText('');
    setError(null);
    setResult(null);
    onOpenChange(false);
  };

  const handleProceedToConfirm = () => {
    if (!newUrl.trim()) {
      setError(t('common.validation.required'));
      return;
    }

    try {
      new URL(newUrl.trim());
    } catch {
      setError(t('common.validation.url'));
      return;
    }

    setError(null);
    setStep('confirm');
  };

  const handleBack = () => {
    setStep('input');
    setConfirmText('');
  };

  const handleConfirmedSubmit = async () => {
    try {
      const res = await onBroadcast(newUrl.trim(), reason.trim() || undefined);
      setResult(res);
      setStep('result');
    } catch {
      // Error handled by parent
    }
  };

  const isConfirmValid = confirmText === String(onlineCount);
  const isTargetAvailable = onlineCount > 0;

  return (
    <Sheet open={open} onOpenChange={(o) => !isBroadcasting && (o ? onOpenChange(o) : handleClose())}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('admin.forwardAgents.dialog.broadcastTitle')}</SheetTitle>
          <SheetDescription>
            {step === 'result'
              ? t('admin.forwardAgents.broadcast.taskCompleted')
              : t('admin.forwardAgents.broadcast.notifyAllDesc')}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-4">
          {/* Step 1: Input */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Online count info */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">
                  {t('admin.forwardAgents.broadcast.onlineNodeCount')}
                </span>
                <span className="text-sm font-medium">{onlineCount}</span>
              </div>

              {!isTargetAvailable ? (
                <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg">
                  <AlertTriangle className="size-4 text-warning" />
                  <span className="text-sm text-warning">
                    {t('admin.forwardAgents.broadcast.noOnlineAgents')}
                  </span>
                </div>
              ) : (
                <>
                  {/* New URL */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      {t('admin.forwardAgents.broadcast.newApiUrl')} <span className="text-destructive">*</span>
                    </label>
                    <MobileFormInput
                      value={newUrl}
                      onChange={(v) => {
                        setNewUrl(v);
                        if (error) setError(null);
                      }}
                      placeholder={t('admin.forwardAgents.broadcast.newApiUrlPlaceholder')}
                      error={error ?? undefined}
                      className="font-mono"
                    />
                  </div>

                  {/* Reason */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      {t('admin.forwardAgents.broadcast.changeReason')}
                    </label>
                    <MobileFormInput
                      value={reason}
                      onChange={setReason}
                      placeholder={t('admin.forwardAgents.broadcast.changeReasonPlaceholder')}
                    />
                  </div>

                  {/* Hint */}
                  <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
                    <Radio className="size-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      {t('admin.forwardAgents.broadcast.agentAutoUpdateHint')}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              {/* Warning */}
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-5 text-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-warning">
                      {t('admin.forwardAgents.broadcast.dangerWarningTitle')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('admin.forwardAgents.broadcast.dangerWarningDesc', {
                        target: t('admin.forwardAgents.broadcast.dangerWarningAllNodes', { count: onlineCount })
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg border divide-y">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('admin.forwardAgents.broadcast.newAddress')}</span>
                  <span className="font-mono text-sm truncate max-w-[180px]" title={newUrl}>
                    {newUrl}
                  </span>
                </div>
                {reason && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">{t('admin.forwardAgents.broadcast.reason')}</span>
                    <span className="text-sm truncate max-w-[180px]" title={reason}>
                      {reason}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirmation input */}
              <div className="space-y-1.5">
                <label className="text-sm">
                  {t('admin.forwardAgents.broadcast.confirmInputNodeCountPrefix')}
                  <span className="inline-flex items-center mx-1 px-2 py-0.5 rounded bg-warning/20 font-mono font-medium text-warning">
                    {onlineCount}
                  </span>
                  {t('admin.forwardAgents.broadcast.confirmInputNodeCountSuffix')}
                </label>
                <MobileFormInput
                  value={confirmText}
                  onChange={setConfirmText}
                  placeholder={String(onlineCount)}
                  className={cn(
                    confirmText && !isConfirmValid && 'border-warning',
                    confirmText && isConfirmValid && 'border-success'
                  )}
                />
                {confirmText && !isConfirmValid && (
                  <p className="text-xs text-warning">{t('admin.forwardAgents.broadcast.inputMismatch')}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {step === 'result' && result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-success/10 rounded-lg text-center">
                  <CheckCircle2 className="size-6 text-success mx-auto mb-2" />
                  <p className="text-2xl font-semibold text-success">{result.agentsNotified}</p>
                  <p className="text-sm text-success/80">{t('admin.forwardAgents.broadcast.notified')}</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg text-center">
                  <Radio className="size-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-semibold text-primary">{result.agentsOnline}</p>
                  <p className="text-sm text-primary/80">{t('admin.forwardAgents.broadcast.onlineNodes')}</p>
                </div>
              </div>

              {result.agentsNotified > 0 && (
                <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg">
                  <CheckCircle2 className="size-4 text-success shrink-0" />
                  <span className="text-sm text-success">
                    {t('admin.forwardAgents.broadcast.notifySuccessSummary', { count: result.agentsNotified })}
                  </span>
                </div>
              )}
            </div>
          )}
        </SheetBody>

        <SheetFooter>
          {step === 'input' && (
            <div className="flex gap-3 w-full">
              <Button
                onClick={handleProceedToConfirm}
                disabled={!isTargetAvailable}
                className="flex-1 min-h-[44px]"
              >
                {t('common.actions.next')}
              </Button>
              <Button variant="outline" onClick={handleClose} className="flex-1 min-h-[44px]">
                {t('common.actions.cancel')}
              </Button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="flex gap-3 w-full">
              <Button
                variant="destructive"
                onClick={handleConfirmedSubmit}
                disabled={!isConfirmValid || isBroadcasting}
                className="flex-1 min-h-[44px] bg-warning hover:bg-warning/90"
              >
                {isBroadcasting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t('admin.forwardAgents.broadcast.notifying')}
                  </>
                ) : (
                  t('admin.forwardAgents.broadcast.confirmNotify')
                )}
              </Button>
              <Button variant="outline" onClick={handleBack} className="flex-1 min-h-[44px]">
                {t('admin.forwardAgents.broadcast.backToEdit')}
              </Button>
            </div>
          )}

          {step === 'result' && (
            <Button onClick={handleClose} className="w-full min-h-[44px]">
              {t('common.actions.close')}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
