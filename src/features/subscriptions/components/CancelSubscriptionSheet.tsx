/**
 * Cancel Subscription Sheet Component
 * Mobile-optimized bottom sheet for cancelling subscription
 */

import { useState } from 'react';
import { XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/common/Sheet';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Label } from '@/components/common/Label';
import { TruncatedId } from '@/components/admin';
import { cn } from '@/lib/utils';
import type { Subscription } from '@/api/subscription/types';

interface CancelSubscriptionSheetProps {
  open: boolean;
  subscription: Subscription | null;
  onClose: () => void;
  onConfirm: (reason: string, immediate: boolean) => Promise<void>;
}

export const CancelSubscriptionSheet: React.FC<CancelSubscriptionSheetProps> = ({
  open,
  subscription,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [immediate, setImmediate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onConfirm(reason, immediate);
      setReason('');
      setImmediate(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setImmediate(false);
      onClose();
    }
  };

  if (!subscription) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="max-h-[95vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="size-4 text-destructive" />
            </div>
            <span>取消订阅</span>
          </SheetTitle>
          <SheetDescription className="text-xs flex items-center gap-1">
            订阅 <TruncatedId id={subscription.id} />
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-4 space-y-4">
          {/* Warning */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                取消后，用户将无法继续使用该订阅的服务。请确认是否要取消此订阅。
              </p>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">
              取消原因 <span className="text-destructive">*</span>
            </label>
            <textarea
              placeholder="请输入取消原因..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              rows={3}
              className={cn(
                'w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                'placeholder:text-muted-foreground/60'
              )}
            />
          </div>

          {/* Immediate Cancel Option */}
          <div className="flex items-start gap-2 p-3 rounded-lg border bg-muted/30">
            <Checkbox
              id="immediate-cancel"
              checked={immediate}
              onCheckedChange={(checked) => setImmediate(checked === true)}
              disabled={loading}
              className="mt-0.5"
            />
            <div>
              <Label htmlFor="immediate-cancel" className="cursor-pointer text-sm font-medium">
                立即取消
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                否则将在当前周期结束后取消
              </p>
            </div>
          </div>
        </SheetBody>

        <SheetFooter className="pt-3 pb-1">
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            className="w-full h-11"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                处理中...
              </>
            ) : (
              '确认取消'
            )}
          </Button>
          <Button variant="ghost" onClick={handleClose} disabled={loading} className="w-full h-10">
            返回
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
