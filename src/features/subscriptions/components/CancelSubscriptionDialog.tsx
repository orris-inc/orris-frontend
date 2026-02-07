/**
 * Cancel subscription dialog component
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useCancelSubscriptionForm } from '../hooks/useCancelSubscriptionForm';
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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const {
    reason,
    setReason,
    immediate,
    setImmediate,
    isFormValid,
    buildSubmitData,
    reset,
  } = useCancelSubscriptionForm();

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setLoading(true);
    try {
      const data = buildSubmitData();
      await onConfirm(data.reason, data.immediate);
      reset();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('subscription.cancel')}</DialogTitle>
          <DialogDescription className="flex items-center gap-1 flex-wrap">
            {t('subscription.confirmCancel')} {subscription?.id && <TruncatedId id={subscription.id} />} {t('subscription.confirmCancelSuffix')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">{t('subscription.cancelReason')} *</Label>
            <Textarea
              id="reason"
              placeholder={t('placeholders.cancelReason')}
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
              {t('subscription.immediateCancelOption')}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
          >
            {loading ? t('common.processing') : t('messages.confirmCancel')}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.actions.back')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
