/**
 * Broadcast API URL change to all connected forward agents
 * Allows admin to notify agents of API URL migration
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
} from 'lucide-react';
import type { BroadcastAPIURLChangedResponse } from '@/api/forward';

interface BroadcastURLDialogProps {
  open: boolean;
  onClose: () => void;
  onBroadcast: (newUrl: string, reason?: string) => Promise<BroadcastAPIURLChangedResponse>;
  isBroadcasting: boolean;
  onlineCount: number;
}

export const BroadcastURLDialog: React.FC<BroadcastURLDialogProps> = ({
  open,
  onClose,
  onBroadcast,
  isBroadcasting,
  onlineCount,
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<BroadcastAPIURLChangedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBroadcast = async () => {
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
      const res = await onBroadcast(newUrl.trim(), reason.trim() || undefined);
      setResult(res);
    } catch {
      // Error handled by parent
    }
  };

  const handleClose = () => {
    setNewUrl('');
    setReason('');
    setResult(null);
    setError(null);
    onClose();
  };

  const showResult = result !== null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="size-5 text-blue-500" />
            下发API地址
          </DialogTitle>
          <DialogDescription>
            {showResult ? '下发任务已完成' : '向所有在线转发节点下发新的API地址'}
          </DialogDescription>
        </DialogHeader>

        {!showResult ? (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">当前在线节点数</span>
                <span className="text-sm font-medium">{onlineCount}</span>
              </div>
            </div>

            {onlineCount === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="size-4 text-yellow-500" />
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                  当前没有在线的转发节点
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
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <CheckCircle2 className="size-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-green-700 dark:text-green-300">
                  {result.agentsNotified}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">已通知</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <Radio className="size-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-blue-700 dark:text-blue-300">
                  {result.agentsOnline}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">在线节点</p>
              </div>
            </div>

            {result.agentsNotified > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="size-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  已成功通知 {result.agentsNotified} 个转发节点更新API地址
                </span>
              </div>
            )}

            {result.agentsNotified === 0 && result.agentsOnline === 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="size-4 text-yellow-500 flex-shrink-0" />
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                  没有在线的转发节点接收通知
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!showResult ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button
                onClick={handleBroadcast}
                disabled={onlineCount === 0 || isBroadcasting}
              >
                {isBroadcasting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    下发中...
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
