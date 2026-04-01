/**
 * Broadcast API URL change to forward agents
 * Supports two modes:
 * 1. Broadcast mode: notify all connected agents
 * 2. Single agent mode: notify a specific agent
 *
 * Includes dangerous action confirmation step
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Label } from '@/components/common/Label';
import {
  Radio,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  BroadcastAPIURLChangedResponse,
  NotifyAgentAPIURLChangedResponse,
} from '@/api/forward';


// Single agent target info
interface TargetAgent {
  id: string;
  name: string;
  isOnline: boolean;
}

interface BroadcastURLDialogProps {
  open: boolean;
  onClose: () => void;
  onBroadcast: (newUrl: string, reason?: string) => Promise<BroadcastAPIURLChangedResponse>;
  isBroadcasting: boolean;
  onlineCount: number;
  // Single agent mode props
  targetAgent?: TargetAgent | null;
  onNotifySingle?: (agentId: string, newUrl: string, reason?: string) => Promise<NotifyAgentAPIURLChangedResponse>;
  isNotifying?: boolean;
}

export const BroadcastURLDialog: React.FC<BroadcastURLDialogProps> = ({
  open,
  onClose,
  onBroadcast,
  isBroadcasting,
  onlineCount,
  targetAgent,
  onNotifySingle,
  isNotifying,
}) => {
  const { t } = useTranslation();
  const [newUrl, setNewUrl] = useState('');
  const [reason, setReason] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<BroadcastAPIURLChangedResponse | null>(null);
  const [singleResult, setSingleResult] = useState<NotifyAgentAPIURLChangedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Confirmation step state
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Determine mode: single agent or broadcast
  const isSingleMode = !!targetAgent;
  const isLoading = isSingleMode ? isNotifying : isBroadcasting;

  // Validate and proceed to confirmation step
  const handleProceedToConfirm = () => {
    if (!newUrl.trim()) {
      setError(t('common.validation.required'));
      return;
    }

    // Basic URL validation
    try {
      new URL(newUrl.trim());
    } catch {
      setError(t('common.validation.url'));
      return;
    }

    setError(null);
    setShowConfirm(true);
  };

  // Go back to input step
  const handleBackToInput = () => {
    setShowConfirm(false);
    setConfirmText('');
  };

  // Execute the dangerous action after confirmation
  const handleConfirmedSubmit = async () => {
    try {
      if (isSingleMode && targetAgent && onNotifySingle) {
        const res = await onNotifySingle(targetAgent.id, newUrl.trim(), reason.trim() || undefined);
        setSingleResult(res);
      } else {
        const res = await onBroadcast(newUrl.trim(), reason.trim() || undefined);
        setBroadcastResult(res);
      }
      setShowConfirm(false);
      setConfirmText('');
    } catch {
      // Error handled by parent
    }
  };

  const handleClose = () => {
    setNewUrl('');
    setReason('');
    setBroadcastResult(null);
    setSingleResult(null);
    setError(null);
    setShowConfirm(false);
    setConfirmText('');
    onClose();
  };

  const showResult = isSingleMode ? singleResult !== null : broadcastResult !== null;

  // Determine if target is available (single mode: agent online, broadcast mode: has online agents)
  const isTargetAvailable = isSingleMode ? targetAgent?.isOnline : onlineCount > 0;

  // Check if confirmation text matches
  // Single mode: must type agent name; Broadcast mode: must type online count
  const expectedConfirmText = isSingleMode ? targetAgent?.name : String(onlineCount);
  const isConfirmValid = confirmText === expectedConfirmText;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSingleMode ? (
              <Cpu className="size-5 text-info" />
            ) : (
              <Radio className="size-5 text-info" />
            )}
            {isSingleMode ? t('admin.forwardAgents.dialog.notifyTitle') : t('admin.forwardAgents.dialog.broadcastTitle')}
          </DialogTitle>
          <DialogDescription>
            {showResult
              ? t('admin.forwardAgents.broadcast.taskCompleted')
              : isSingleMode
                ? t('admin.forwardAgents.broadcast.notifyAgentDesc', { name: targetAgent?.name })
                : t('admin.forwardAgents.broadcast.notifyAllDesc')}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Input form */}
        {!showResult && !showConfirm ? (
          <div className="space-y-4">
            {/* Target info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {isSingleMode ? t('admin.forwardAgents.broadcast.targetNode') : t('admin.forwardAgents.broadcast.onlineNodeCount')}
                </span>
                {isSingleMode ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{targetAgent?.name}</span>
                    {targetAgent?.isOnline ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <span className="size-2 rounded-full bg-success" />
                        {t('common.status.online')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="size-2 rounded-full bg-muted-foreground/30" />
                        {t('common.status.offline')}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm font-medium">{onlineCount}</span>
                )}
              </div>
            </div>

            {!isTargetAvailable ? (
              <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg">
                <AlertTriangle className="size-4 text-warning" />
                <span className="text-sm text-warning">
                  {isSingleMode ? t('admin.forwardAgents.broadcast.nodeOffline') : t('admin.forwardAgents.broadcast.noOnlineAgents')}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newUrl">{t('admin.forwardAgents.broadcast.newApiUrl')} *</Label>
                  <Input
                    id="newUrl"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder={t('admin.forwardAgents.broadcast.newApiUrlPlaceholder')}
                    className={error ? 'border-destructive' : ''}
                  />
                  {error && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">{t('admin.forwardAgents.broadcast.changeReason')}</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t('admin.forwardAgents.broadcast.changeReasonPlaceholder')}
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-info/10 rounded-lg">
                  <AlertTriangle className="size-4 text-info flex-shrink-0" />
                  <span className="text-xs text-info">
                    {t('admin.forwardAgents.broadcast.agentAutoUpdateHint')}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : showConfirm && !showResult ? (
          // Step 2: Dangerous action confirmation
          <div className="space-y-5">
            {/* Warning header - Enhanced visual hierarchy */}
            <div
              className="relative overflow-hidden rounded-xl border border-warning/30 bg-warning/5"
              role="alert"
              aria-labelledby="warning-title"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-warning/15 shadow-sm">
                    <ShieldAlert className="size-5 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h4
                      id="warning-title"
                      className="text-base font-semibold text-foreground"
                    >
                      {t('admin.forwardAgents.broadcast.dangerWarningTitle')}
                    </h4>
                    <p className="text-sm text-warning mt-1 leading-relaxed">
                      {t('admin.forwardAgents.broadcast.dangerWarningDesc', {
                        target: isSingleMode
                          ? t('admin.forwardAgents.broadcast.dangerWarningTargetNode')
                          : t('admin.forwardAgents.broadcast.dangerWarningAllNodes', { count: onlineCount })
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact list - Enhanced visual design */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">{t('admin.forwardAgents.broadcast.impactTitle')}</p>
              <ul className="space-y-2.5" aria-label={t('admin.forwardAgents.broadcast.impactTitle')}>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 flex size-2 items-center justify-center rounded-full bg-warning ring-4 ring-warning/20" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{t('admin.forwardAgents.broadcast.impact1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 flex size-2 items-center justify-center rounded-full bg-warning ring-4 ring-warning/20" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{t('admin.forwardAgents.broadcast.impact2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 flex size-2 items-center justify-center rounded-full bg-warning ring-4 ring-warning/20" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{t('admin.forwardAgents.broadcast.impact3')}</span>
                </li>
              </ul>
            </div>

            {/* Operation summary - Enhanced card design */}
            <div className="rounded-lg border border-border bg-muted/50 divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">{t('admin.forwardAgents.broadcast.newAddress')}</span>
                <SmartTruncate text={newUrl} mono className="text-sm max-w-[220px] text-foreground" />
              </div>
              {reason && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('admin.forwardAgents.broadcast.reason')}</span>
                  <SmartTruncate text={reason} className="text-sm max-w-[220px] text-foreground" />
                </div>
              )}
            </div>

            {/* Confirmation input - Enhanced styling */}
            <div className="space-y-2.5">
              <Label htmlFor="confirmText" className="text-sm leading-relaxed">
                {isSingleMode ? (
                  <>
                    {t('admin.forwardAgents.broadcast.confirmInputNodeNamePrefix')}
                    <span className="inline-flex items-center rounded-md bg-warning/15 px-2 py-0.5 font-semibold text-warning">{targetAgent?.name}</span>
                    {t('admin.forwardAgents.broadcast.confirmInputNodeNameSuffix')}
                  </>
                ) : (
                  <>
                    {t('admin.forwardAgents.broadcast.confirmInputNodeCountPrefix')}
                    <span className="inline-flex items-center rounded-md bg-warning/15 px-2 py-0.5 font-mono font-semibold text-warning">{onlineCount}</span>
                    {t('admin.forwardAgents.broadcast.confirmInputNodeCountSuffix')}
                  </>
                )}
              </Label>
              <Input
                id="confirmText"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={expectedConfirmText}
                className={cn(
                  'transition-colors',
                  confirmText && !isConfirmValid && 'border-warning/50 focus-visible:ring-warning/20',
                  confirmText && isConfirmValid && 'border-success/50 focus-visible:ring-success/20'
                )}
                autoComplete="off"
                aria-describedby="confirm-hint"
              />
              {confirmText && !isConfirmValid && (
                <p id="confirm-hint" className="text-xs text-warning" role="status">
                  {t('admin.forwardAgents.broadcast.inputMismatch')}
                </p>
              )}
            </div>
          </div>
        ) : isSingleMode && singleResult ? (
          // Single agent result
          <div className="space-y-4">
            {singleResult.notified ? (
              <div className="p-4 bg-success/10 rounded-lg text-center">
                <CheckCircle2 className="size-8 text-success mx-auto mb-3" />
                <p className="text-lg font-semibold text-success">
                  {t('admin.forwardAgents.broadcast.notifySuccess')}
                </p>
                <p className="text-sm text-success/80 mt-1">
                  {t('admin.forwardAgents.broadcast.notifySuccessDesc', { name: targetAgent?.name })}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-warning/10 rounded-lg text-center">
                <AlertTriangle className="size-8 text-warning mx-auto mb-3" />
                <p className="text-lg font-semibold text-warning">
                  {t('admin.forwardAgents.broadcast.notifyFailed')}
                </p>
                <p className="text-sm text-warning/80 mt-1">
                  {t('admin.forwardAgents.broadcast.notifyFailedDesc')}
                </p>
              </div>
            )}
          </div>
        ) : broadcastResult ? (
          // Broadcast result
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-success/10 rounded-lg text-center">
                <CheckCircle2 className="size-6 text-success mx-auto mb-2" />
                <p className="text-2xl font-semibold text-success">
                  {broadcastResult.agentsNotified}
                </p>
                <p className="text-sm text-success/80">{t('admin.forwardAgents.broadcast.notified')}</p>
              </div>
              <div className="p-4 bg-info/10 rounded-lg text-center">
                <Radio className="size-6 text-info mx-auto mb-2" />
                <p className="text-2xl font-semibold text-info">
                  {broadcastResult.agentsOnline}
                </p>
                <p className="text-sm text-info/80">{t('admin.forwardAgents.broadcast.onlineNodes')}</p>
              </div>
            </div>

            {broadcastResult.agentsNotified > 0 && (
              <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg">
                <CheckCircle2 className="size-4 text-success flex-shrink-0" />
                <span className="text-sm text-success">
                  {t('admin.forwardAgents.broadcast.notifySuccessSummary', { count: broadcastResult.agentsNotified })}
                </span>
              </div>
            )}

            {broadcastResult.agentsNotified === 0 && broadcastResult.agentsOnline === 0 && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg">
                <AlertTriangle className="size-4 text-warning flex-shrink-0" />
                <span className="text-sm text-warning">
                  {t('admin.forwardAgents.broadcast.noOnlineAgentsToNotify')}
                </span>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          {!showResult && !showConfirm ? (
            // Step 1: Input form buttons
            <>
              <Button
                onClick={handleProceedToConfirm}
                disabled={!isTargetAvailable}
              >
                {isSingleMode ? (
                  <>
                    <Cpu className="size-4 mr-2" />
                    {t('common.actions.next')}
                  </>
                ) : (
                  <>
                    <Radio className="size-4 mr-2" />
                    {t('common.actions.next')}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                {t('common.actions.cancel')}
              </Button>
            </>
          ) : showConfirm && !showResult ? (
            // Step 2: Confirmation buttons
            <>
              <Button
                variant="destructive"
                onClick={handleConfirmedSubmit}
                disabled={!isConfirmValid || isLoading}
                className="bg-warning hover:bg-warning/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t('admin.forwardAgents.broadcast.notifying')}
                  </>
                ) : (
                  <>
                    <ShieldAlert className="size-4 mr-2" />
                    {t('admin.forwardAgents.broadcast.confirmNotify')}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleBackToInput}>
                <ArrowLeft className="size-4 mr-2" />
                {t('admin.forwardAgents.broadcast.backToEdit')}
              </Button>
            </>
          ) : (
            // Step 3: Result
            <Button onClick={handleClose}>{t('common.actions.close')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
