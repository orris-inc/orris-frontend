/**
 * Broadcast API URL change to nodes
 * Supports two modes:
 * 1. Broadcast mode: notify all connected nodes
 * 2. Single node mode: notify a specific node
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
  Server,
} from 'lucide-react';
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
  const [newUrl, setNewUrl] = useState('');
  const [reason, setReason] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<BroadcastNodeAPIURLChangedResponse | null>(null);
  const [singleResult, setSingleResult] = useState<NotifyNodeAPIURLChangedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Determine mode: single node or broadcast
  const isSingleMode = !!targetNode;
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
      if (isSingleMode && targetNode && onNotifySingle) {
        const res = await onNotifySingle(targetNode.id, newUrl.trim(), reason.trim() || undefined);
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

  // Determine if target is available (single mode: node online, broadcast mode: has online nodes)
  const isTargetAvailable = isSingleMode ? targetNode?.isOnline : onlineCount > 0;

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
            {isSingleMode ? '下发API地址' : '广播API地址'}
          </DialogTitle>
          <DialogDescription>
            {showResult
              ? '下发任务已完成'
              : isSingleMode
                ? `向节点 "${targetNode?.name}" 下发新的API地址`
                : '向所有在线节点下发新的API地址'}
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
                    <span className="text-sm font-medium">{targetNode?.name}</span>
                    {targetNode?.isOnline ? (
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
                  {isSingleMode ? '节点当前不在线' : '当前没有在线的节点'}
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
                    节点收到通知后会自动更新配置并重连到新地址
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : isSingleMode && singleResult ? (
          // Single node result
          <div className="space-y-4">
            {singleResult.notified ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <CheckCircle2 className="size-8 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                  通知成功
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  节点 "{targetNode?.name}" 已收到API地址更新通知
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
                  {broadcastResult.nodesNotified}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">已通知</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <Radio className="size-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-blue-700 dark:text-blue-300">
                  {broadcastResult.nodesOnline}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">在线节点</p>
              </div>
            </div>

            {broadcastResult.nodesNotified > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="size-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  已成功通知 {broadcastResult.nodesNotified} 个节点更新API地址
                </span>
              </div>
            )}

            {broadcastResult.nodesNotified === 0 && broadcastResult.nodesOnline === 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="size-4 text-yellow-500 flex-shrink-0" />
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                  没有在线的节点接收通知
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
                    <Server className="size-4 mr-2" />
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
