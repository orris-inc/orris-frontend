/**
 * Batch toggle status dialog for forward rules
 * Allows enabling or disabling multiple rules at once
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
  const [result, setResult] = useState<BatchOperationResult | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  const isEnabling = targetStatus === 'enabled';
  const statusText = isEnabling ? '启用' : '禁用';
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
            批量{statusText}规则
          </DialogTitle>
          <DialogDescription>
            {showResult ? `${statusText}操作已完成` : `确认${statusText}选中的转发规则`}
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
                您即将{statusText}{' '}
                <span className="font-semibold">{selectedCount}</span> 条转发规则。
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {isEnabling
                  ? '启用后，这些规则将开始生效。'
                  : '禁用后，这些规则将暂停转发。'}
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
                <p className="text-xs text-green-600 dark:text-green-400">成功</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                <XCircle className="size-5 text-red-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                  {failedCount}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">失败</p>
              </div>
            </div>

            {failedCount > 0 && result.failed && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  {statusText}失败
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
                取消
              </Button>
              <Button
                variant={isEnabling ? 'default' : 'secondary'}
                onClick={handleConfirm}
                disabled={isProcessing || selectedCount === 0}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <StatusIcon className="size-4 mr-2" />
                    {statusText} {selectedCount} 条规则
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
