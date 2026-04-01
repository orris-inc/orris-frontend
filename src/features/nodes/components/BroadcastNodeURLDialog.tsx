/**
 * Broadcast API URL change to nodes
 * Supports two modes:
 * 1. Broadcast mode: notify all connected nodes
 * 2. Single node mode: notify a specific node
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
  Server,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  BroadcastNodeAPIURLChangedResponse,
  NotifyNodeAPIURLChangedResponse,
} from '@/api/node';

// Single node target info
interface TargetNode {
  id: string;
  name: string;
  isOnline: boolean;
}

interface BroadcastNodeURLDialogProps {
  open: boolean;
  onClose: () => void;
  onBroadcast: (newUrl: string, reason?: string) => Promise<BroadcastNodeAPIURLChangedResponse>;
  isBroadcasting: boolean;
  onlineCount: number;
  // Single node mode props
  targetNode?: TargetNode | null;
  onNotifySingle?: (nodeId: string, newUrl: string, reason?: string) => Promise<NotifyNodeAPIURLChangedResponse>;
  isNotifying?: boolean;
}

export const BroadcastNodeURLDialog: React.FC<BroadcastNodeURLDialogProps> = ({
  open,
  onClose,
  onBroadcast,
  isBroadcasting,
  onlineCount,
  targetNode,
  onNotifySingle,
  isNotifying,
}) => {
  const { t } = useTranslation();
  const [newUrl, setNewUrl] = useState('');
  const [reason, setReason] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<BroadcastNodeAPIURLChangedResponse | null>(null);
  const [singleResult, setSingleResult] = useState<NotifyNodeAPIURLChangedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Confirmation step state
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Determine mode: single node or broadcast
  const isSingleMode = !!targetNode;
  const isLoading = isSingleMode ? isNotifying : isBroadcasting;

  // Validate and proceed to confirmation step
  const handleProceedToConfirm = () => {
    if (!newUrl.trim()) {
      setError(t('admin.nodes.broadcast.enterNewUrl'));
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
      if (isSingleMode && targetNode && onNotifySingle) {
        const res = await onNotifySingle(targetNode.id, newUrl.trim(), reason.trim() || undefined);
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

  // Determine if target is available (single mode: node online, broadcast mode: has online nodes)
  const isTargetAvailable = isSingleMode ? targetNode?.isOnline : onlineCount > 0;

  // Check if confirmation text matches
  // Single mode: must type node name; Broadcast mode: must type online count
  const expectedConfirmText = isSingleMode ? targetNode?.name : String(onlineCount);
  const isConfirmValid = confirmText === expectedConfirmText;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSingleMode ? (
              <Server className="size-5 text-info" />
            ) : (
              <Radio className="size-5 text-info" />
            )}
            {isSingleMode ? t('admin.nodes.broadcast.notifyTitle') : t('admin.nodes.broadcast.broadcastTitle')}
          </DialogTitle>
          <DialogDescription>
            {showResult
              ? t('admin.nodes.broadcast.taskCompleted')
              : isSingleMode
                ? t('admin.nodes.broadcast.notifyNodeDesc', { name: targetNode?.name })
                : t('admin.nodes.broadcast.notifyAllDesc')}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Input form */}
        {!showResult && !showConfirm ? (
          <div className="space-y-4">
            {/* Target info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {isSingleMode ? t('admin.nodes.broadcast.targetNode') : t('admin.nodes.broadcast.onlineNodeCount')}
                </span>
                {isSingleMode ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{targetNode?.name}</span>
                    {targetNode?.isOnline ? (
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
                  {isSingleMode ? t('admin.nodes.broadcast.nodeOffline') : t('admin.nodes.broadcast.noOnlineNodes')}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newUrl">{t('admin.nodes.broadcast.newApiUrl')} *</Label>
                  <Input
                    id="newUrl"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder={t('admin.nodes.broadcast.newApiUrlPlaceholder')}
                    className={error ? 'border-destructive' : ''}
                  />
                  {error && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">{t('admin.nodes.broadcast.changeReason')}</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t('admin.nodes.broadcast.changeReasonPlaceholder')}
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-info/10 rounded-lg">
                  <AlertTriangle className="size-4 text-info flex-shrink-0" />
                  <span className="text-xs text-info">
                    {t('admin.nodes.broadcast.nodeAutoUpdateHint')}
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
                  <div className="flex size-10 items-center justify-center rounded-full bg-warning/10 shadow-sm">
                    <ShieldAlert className="size-5 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h4
                      id="warning-title"
                      className="text-base font-semibold text-foreground"
                    >
                      {t('admin.nodes.broadcast.dangerWarningTitle')}
                    </h4>
                    <p className="text-sm text-warning mt-1 leading-relaxed">
                      {isSingleMode
                        ? t('admin.nodes.broadcast.dangerWarningDescSingle')
                        : t('admin.nodes.broadcast.dangerWarningDescAll', { count: onlineCount })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact list - Enhanced visual design */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">{t('admin.nodes.broadcast.impactTitle')}</p>
              <ul className="space-y-2.5" aria-label={t('admin.nodes.broadcast.impactTitle')}>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 flex size-2 items-center justify-center rounded-full bg-warning ring-4 ring-warning/20" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{t('admin.nodes.broadcast.impact1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 flex size-2 items-center justify-center rounded-full bg-warning ring-4 ring-warning/20" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{t('admin.nodes.broadcast.impact2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 flex size-2 items-center justify-center rounded-full bg-warning ring-4 ring-warning/20" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{t('admin.nodes.broadcast.impact3')}</span>
                </li>
              </ul>
            </div>

            {/* Operation summary - Enhanced card design */}
            <div className="rounded-lg border border-border bg-muted/50 divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">{t('admin.nodes.broadcast.newAddress')}</span>
                <SmartTruncate text={newUrl} mono className="text-sm max-w-[220px] text-foreground" />
              </div>
              {reason && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('admin.nodes.broadcast.reason')}</span>
                  <SmartTruncate text={reason} className="text-sm max-w-[220px] text-foreground" />
                </div>
              )}
            </div>

            {/* Confirmation input - Enhanced styling */}
            <div className="space-y-2.5">
              <Label htmlFor="confirmText" className="text-sm leading-relaxed">
                {isSingleMode ? (
                  <>{t('admin.nodes.broadcast.confirmInputNodeName', { name: targetNode?.name })}</>
                ) : (
                  <>{t('admin.nodes.broadcast.confirmInputNodeCount', { count: onlineCount })}</>
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
                  {t('admin.nodes.broadcast.inputMismatch')}
                </p>
              )}
            </div>
          </div>
        ) : isSingleMode && singleResult ? (
          // Single node result
          <div className="space-y-4">
            {singleResult.notified ? (
              <div className="p-4 bg-success/10 rounded-lg text-center">
                <CheckCircle2 className="size-8 text-success mx-auto mb-3" />
                <p className="text-lg font-semibold text-success">
                  {t('admin.nodes.broadcast.notifySuccess')}
                </p>
                <p className="text-sm text-success mt-1">
                  {t('admin.nodes.broadcast.notifySuccessDesc', { name: targetNode?.name })}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-warning/10 rounded-lg text-center">
                <AlertTriangle className="size-8 text-warning mx-auto mb-3" />
                <p className="text-lg font-semibold text-warning">
                  {t('admin.nodes.broadcast.notifyFailed')}
                </p>
                <p className="text-sm text-warning mt-1">
                  {t('admin.nodes.broadcast.notifyFailedDesc')}
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
                  {broadcastResult.nodesNotified}
                </p>
                <p className="text-sm text-success">{t('admin.nodes.broadcast.notified')}</p>
              </div>
              <div className="p-4 bg-info/10 rounded-lg text-center">
                <Radio className="size-6 text-info mx-auto mb-2" />
                <p className="text-2xl font-semibold text-info">
                  {broadcastResult.nodesOnline}
                </p>
                <p className="text-sm text-info">{t('admin.nodes.broadcast.onlineNodes')}</p>
              </div>
            </div>

            {broadcastResult.nodesNotified > 0 && (
              <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg">
                <CheckCircle2 className="size-4 text-success flex-shrink-0" />
                <span className="text-sm text-success">
                  {t('admin.nodes.broadcast.notifySuccessSummary', { count: broadcastResult.nodesNotified })}
                </span>
              </div>
            )}

            {broadcastResult.nodesNotified === 0 && broadcastResult.nodesOnline === 0 && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg">
                <AlertTriangle className="size-4 text-warning flex-shrink-0" />
                <span className="text-sm text-warning">
                  {t('admin.nodes.broadcast.noOnlineNodesToNotify')}
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
                    <Server className="size-4 mr-2" />
                    {t('common.nextStep')}
                  </>
                ) : (
                  <>
                    <Radio className="size-4 mr-2" />
                    {t('common.nextStep')}
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
                    {t('admin.nodes.broadcast.notifying')}
                  </>
                ) : (
                  <>
                    <ShieldAlert className="size-4 mr-2" />
                    {t('admin.nodes.broadcast.confirmNotify')}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleBackToInput}>
                <ArrowLeft className="size-4 mr-2" />
                {t('admin.nodes.broadcast.backToEdit')}
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
