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
      setError(t('admin.nodes.broadcast.invalidUrl'));
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSingleMode ? (
              <Server className="size-5 text-blue-500" />
            ) : (
              <Radio className="size-5 text-blue-500" />
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
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <span className="size-2 rounded-full bg-green-500" />
                        {t('admin.nodes.broadcast.online')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="size-2 rounded-full bg-muted-foreground/30" />
                        {t('admin.nodes.broadcast.offline')}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm font-medium">{onlineCount}</span>
                )}
              </div>
            </div>

            {!isTargetAvailable ? (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="size-4 text-yellow-500" />
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
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

                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <AlertTriangle className="size-4 text-blue-500 flex-shrink-0" />
                  <span className="text-xs text-blue-700 dark:text-blue-300">
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
              className="relative overflow-hidden rounded-xl border border-orange-200 dark:border-orange-800/60 bg-gradient-to-br from-orange-50 via-orange-50 to-amber-50 dark:from-orange-950/40 dark:via-orange-900/30 dark:to-amber-950/20"
              role="alert"
              aria-labelledby="warning-title"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/60 dark:to-amber-900/40 shadow-sm">
                    <ShieldAlert className="size-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h4
                      id="warning-title"
                      className="text-base font-semibold text-orange-900 dark:text-orange-100"
                    >
                      {t('admin.nodes.broadcast.dangerWarningTitle')}
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1 leading-relaxed">
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
                  <span className="mt-1.5 flex size-2 items-center justify-center rounded-full bg-orange-500 ring-4 ring-orange-500/20" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{t('admin.nodes.broadcast.impact1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 flex size-2 items-center justify-center rounded-full bg-orange-500 ring-4 ring-orange-500/20" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{t('admin.nodes.broadcast.impact2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 flex size-2 items-center justify-center rounded-full bg-orange-500 ring-4 ring-orange-500/20" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{t('admin.nodes.broadcast.impact3')}</span>
                </li>
              </ul>
            </div>

            {/* Operation summary - Enhanced card design */}
            <div className="rounded-lg border border-border bg-muted/50 divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">{t('admin.nodes.broadcast.newAddress')}</span>
                <span
                  className="font-mono text-sm truncate max-w-[220px] text-foreground"
                  title={newUrl}
                >
                  {newUrl}
                </span>
              </div>
              {reason && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('admin.nodes.broadcast.reason')}</span>
                  <span className="text-sm truncate max-w-[220px] text-foreground" title={reason}>
                    {reason}
                  </span>
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
                  confirmText && !isConfirmValid && 'border-orange-300 dark:border-orange-700 focus-visible:ring-orange-500/20',
                  confirmText && isConfirmValid && 'border-green-300 dark:border-green-700 focus-visible:ring-green-500/20'
                )}
                autoComplete="off"
                aria-describedby="confirm-hint"
              />
              {confirmText && !isConfirmValid && (
                <p id="confirm-hint" className="text-xs text-orange-600 dark:text-orange-400" role="status">
                  {t('admin.nodes.broadcast.inputMismatch')}
                </p>
              )}
            </div>
          </div>
        ) : isSingleMode && singleResult ? (
          // Single node result
          <div className="space-y-4">
            {singleResult.notified ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <CheckCircle2 className="size-8 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                  {t('admin.nodes.broadcast.notifySuccess')}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  {t('admin.nodes.broadcast.notifySuccessDesc', { name: targetNode?.name })}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                <AlertTriangle className="size-8 text-yellow-500 mx-auto mb-3" />
                <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
                  {t('admin.nodes.broadcast.notifyFailed')}
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                  {t('admin.nodes.broadcast.notifyFailedDesc')}
                </p>
              </div>
            )}
          </div>
        ) : broadcastResult ? (
          // Broadcast result
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <CheckCircle2 className="size-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-green-700 dark:text-green-300">
                  {broadcastResult.nodesNotified}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">{t('admin.nodes.broadcast.notified')}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <Radio className="size-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-blue-700 dark:text-blue-300">
                  {broadcastResult.nodesOnline}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">{t('admin.nodes.broadcast.onlineNodes')}</p>
              </div>
            </div>

            {broadcastResult.nodesNotified > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="size-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  {t('admin.nodes.broadcast.notifySuccessSummary', { count: broadcastResult.nodesNotified })}
                </span>
              </div>
            )}

            {broadcastResult.nodesNotified === 0 && broadcastResult.nodesOnline === 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="size-4 text-yellow-500 flex-shrink-0" />
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
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
              <Button variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
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
            </>
          ) : showConfirm && !showResult ? (
            // Step 2: Confirmation buttons
            <>
              <Button variant="outline" onClick={handleBackToInput}>
                <ArrowLeft className="size-4 mr-2" />
                {t('admin.nodes.broadcast.backToEdit')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmedSubmit}
                disabled={!isConfirmValid || isLoading}
                className="bg-orange-600 hover:bg-orange-700"
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
            </>
          ) : (
            // Step 3: Result
            <Button onClick={handleClose}>{t('common.close')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
