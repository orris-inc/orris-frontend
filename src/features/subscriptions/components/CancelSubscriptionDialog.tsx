/**
 * 取消订阅对话框组件
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';
import { Checkbox } from '@/components/common/Checkbox';
import { TruncatedId } from '@/components/admin';
import type { Subscription } from '@/api/subscription/types';

interface CancelSubscriptionDialogProps {
  open: boolean;
  subscription: Subscription | null;
  onClose: () => void;
  onConfirm: (reason: string, immediate: boolean) => Promise<void>;
}

export const CancelSubscriptionDialog: React.FC<CancelSubscriptionDialogProps> = ({
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>取消订阅</DialogTitle>
          <DialogDescription className="flex items-center gap-1 flex-wrap">
            确定要取消订阅 {subscription?.id && <TruncatedId id={subscription.id} />} 吗？请填写取消原因。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">取消原因 *</Label>
            <Textarea
              id="reason"
              placeholder="请输入取消原因..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="immediate"
              checked={immediate}
              onCheckedChange={(checked) => setImmediate(checked === true)}
              disabled={loading}
            />
            <Label htmlFor="immediate" className="cursor-pointer">
              立即取消（否则在当前周期结束后取消）
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            返回
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
          >
            {loading ? '处理中...' : '确认取消'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
