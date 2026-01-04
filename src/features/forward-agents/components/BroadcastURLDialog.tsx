/**
 * Broadcast API URL change to forward agents
 * Supports two modes:
 * 1. Broadcast mode: notify all connected agents
 * 2. Single agent mode: notify a specific agent
 *
 * Includes dangerous action confirmation step
 */

import { useState } from 'react';
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
      setError('请输入新的API地址');
      return;
    }

    // Basic URL validation
    try {
      new URL(newUrl.trim());
    } catch {
      setError('请输入有效的URL地址');
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSingleMode ? (
              <Cpu className="size-5 text-blue-500" />
            ) : (
              <Radio className="size-5 text-blue-500" />
            )}
            {isSingleMode ? '下发API地址' : '广播API地址'}
          </DialogTitle>
          <DialogDescription>
            {showResult
              ? '下发任务已完成'
              : isSingleMode
                ? `向转发节点 "${targetAgent?.name}" 下发新的API地址`
                : '向所有在线转发节点下发新的API地址'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Input form */}
        {!showResult && !showConfirm ? (
          <div className="space-y-4">
            {/* Target info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {isSingleMode ? '目标节点' : '当前在线节点数'}
                </span>
                {isSingleMode ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{targetAgent?.name}</span>
                    {targetAgent?.isOnline ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <span className="size-2 rounded-full bg-green-500" />
                        在线
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="size-2 rounded-full bg-muted-foreground/30" />
                        离线
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
                  {isSingleMode ? '节点当前不在线' : '当前没有在线的转发节点'}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newUrl">新API地址 *</Label>
                  <Input
                    id="newUrl"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://new-api.example.com"
                    className={error ? 'border-destructive' : ''}
                  />
                  {error && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">变更原因（可选）</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="例如：服务器迁移到新数据中心"
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <AlertTriangle className="size-4 text-blue-500 flex-shrink-0" />
                  <span className="text-xs text-blue-700 dark:text-blue-300">
                    转发节点收到通知后会自动更新配置并重连到新地址
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
                      高危操作警告
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1 leading-relaxed">
                      此操作将立即影响{isSingleMode ? '目标节点' : (
                        <>所有 <span className="font-semibold">{onlineCount}</span> 个在线节点</>
                      )}的连接
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact list - Enhanced visual design */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">操作影响：</p>
              <ul className="space-y-2.5" aria-label="操作影响列表">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 flex size-2 items-center justify-center rounded-full bg-orange-500 ring-4 ring-orange-500/20" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground leading-relaxed">节点将断开当前连接并尝试重连到新地址</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 flex size-2 items-center justify-center rounded-full bg-orange-500 ring-4 ring-orange-500/20" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground leading-relaxed">重连期间转发服务将暂时中断</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 flex size-2 items-center justify-center rounded-full bg-orange-500 ring-4 ring-orange-500/20" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground leading-relaxed">如果新地址无法访问，节点可能无法恢复连接</span>
                </li>
              </ul>
            </div>

            {/* Operation summary - Enhanced card design */}
            <div className="rounded-lg border border-border bg-muted/50 divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">新地址</span>
                <span
                  className="font-mono text-sm truncate max-w-[220px] text-foreground"
                  title={newUrl}
                >
                  {newUrl}
                </span>
              </div>
              {reason && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">原因</span>
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
                  <>请输入节点名称 <span className="inline-flex items-center rounded-md bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 font-semibold text-orange-700 dark:text-orange-300">{targetAgent?.name}</span> 以确认</>
                ) : (
                  <>请输入在线节点数 <span className="inline-flex items-center rounded-md bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 font-mono font-semibold text-orange-700 dark:text-orange-300">{onlineCount}</span> 以确认</>
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
                  输入内容不匹配
                </p>
              )}
            </div>
          </div>
        ) : isSingleMode && singleResult ? (
          // Single agent result
          <div className="space-y-4">
            {singleResult.notified ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <CheckCircle2 className="size-8 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                  通知成功
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  转发节点 "{targetAgent?.name}" 已收到API地址更新通知
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                <AlertTriangle className="size-8 text-yellow-500 mx-auto mb-3" />
                <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
                  通知失败
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                  节点当前不在线，无法接收通知
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
                  {broadcastResult.agentsNotified}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">已通知</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <Radio className="size-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-blue-700 dark:text-blue-300">
                  {broadcastResult.agentsOnline}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">在线节点</p>
              </div>
            </div>

            {broadcastResult.agentsNotified > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="size-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  已成功通知 {broadcastResult.agentsNotified} 个转发节点更新API地址
                </span>
              </div>
            )}

            {broadcastResult.agentsNotified === 0 && broadcastResult.agentsOnline === 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="size-4 text-yellow-500 flex-shrink-0" />
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                  没有在线的转发节点接收通知
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
                取消
              </Button>
              <Button
                onClick={handleProceedToConfirm}
                disabled={!isTargetAvailable}
              >
                {isSingleMode ? (
                  <>
                    <Cpu className="size-4 mr-2" />
                    下一步
                  </>
                ) : (
                  <>
                    <Radio className="size-4 mr-2" />
                    下一步
                  </>
                )}
              </Button>
            </>
          ) : showConfirm && !showResult ? (
            // Step 2: Confirmation buttons
            <>
              <Button variant="outline" onClick={handleBackToInput}>
                <ArrowLeft className="size-4 mr-2" />
                返回修改
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
                    下发中...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="size-4 mr-2" />
                    确认下发
                  </>
                )}
              </Button>
            </>
          ) : (
            // Step 3: Result
            <Button onClick={handleClose}>关闭</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
