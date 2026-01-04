/**
 * Broadcast API URL change to forward agents
 * Supports two modes:
 * 1. Broadcast mode: notify all connected agents
 * 2. Single agent mode: notify a specific agent
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
} from 'lucide-react';
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

  // Determine mode: single agent or broadcast
  const isSingleMode = !!targetAgent;
  const isLoading = isSingleMode ? isNotifying : isBroadcasting;

  const handleSubmit = async () => {
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
    try {
      if (isSingleMode && targetAgent && onNotifySingle) {
        const res = await onNotifySingle(targetAgent.id, newUrl.trim(), reason.trim() || undefined);
        setSingleResult(res);
      } else {
        const res = await onBroadcast(newUrl.trim(), reason.trim() || undefined);
        setBroadcastResult(res);
      }
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
    onClose();
  };

  const showResult = isSingleMode ? singleResult !== null : broadcastResult !== null;

  // Determine if target is available (single mode: agent online, broadcast mode: has online agents)
  const isTargetAvailable = isSingleMode ? targetAgent?.isOnline : onlineCount > 0;

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

        {!showResult ? (
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
          {!showResult ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isTargetAvailable || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    下发中...
                  </>
                ) : isSingleMode ? (
                  <>
                    <Cpu className="size-4 mr-2" />
                    下发到节点
                  </>
                ) : (
                  <>
                    <Radio className="size-4 mr-2" />
                    下发到 {onlineCount} 个节点
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>关闭</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
