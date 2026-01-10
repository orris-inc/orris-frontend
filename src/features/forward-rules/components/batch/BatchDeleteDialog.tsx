/**
 * Batch delete confirmation dialog for forward rules
 * Shows confirmation before deletion and displays results after operation
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
import { Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import type { BatchOperationResult } from '@/api/forward';

interface BatchDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: () => Promise<BatchOperationResult>;
  isDeleting: boolean;
}

export const BatchDeleteDialog: React.FC<BatchDeleteDialogProps> = ({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isDeleting,
}) => {
  const [result, setResult] = useState<BatchOperationResult | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

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

  const showResult = hasTriggered && result && !isDeleting;
  const failedCount = result?.failed?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="size-5 text-destructive" />
            批量删除规则
          </DialogTitle>
          <DialogDescription>
            {showResult ? '删除操作已完成' : '此操作不可撤销，请确认是否继续'}
          </DialogDescription>
        </DialogHeader>

        {!showResult ? (
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive">
                您即将删除 <span className="font-semibold">{selectedCount}</span> 条转发规则。
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                删除后将无法恢复，请确认操作。
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
                <p className="text-sm font-medium text-red-700 dark:text-red-300">删除失败</p>
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
              <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={isDeleting || selectedCount === 0}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    删除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4 mr-2" />
                    删除 {selectedCount} 条规则
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
