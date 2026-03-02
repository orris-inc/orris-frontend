/**
 * Edit subscription dialog component (Desktop)
 * Allows editing subscription dates and traffic limits
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Loader2 } from 'lucide-react';
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
import { TruncatedId } from '@/components/admin';
import { inputStyles, labelStyles } from '@/lib/ui-styles';
import { useEditSubscriptionForm } from '../hooks/useEditSubscriptionForm';
import type { Subscription } from '@/api/subscription/types';
import type { AdminUpdateSubscriptionRequest } from '@/api/admin/types';

interface EditSubscriptionDialogProps {
  open: boolean;
  subscription: Subscription | null;
  onClose: () => void;
  onConfirm: (data: AdminUpdateSubscriptionRequest) => Promise<void>;
}

export const EditSubscriptionDialog: React.FC<EditSubscriptionDialogProps> = ({
  open,
  subscription,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useEditSubscriptionForm({ subscription });

  useEffect(() => {
    if (open && subscription) {
      form.initialize(subscription);
    }
  }, [open, subscription]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    const error = form.validate();
    if (error) return;

    const payload = form.buildPayload();
    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await onConfirm(payload as AdminUpdateSubscriptionRequest);
      form.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      form.reset();
      onClose();
    }
  };

  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5 text-primary" />
            {t('subscription.editTitle')}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1 flex-wrap">
            {t('subscription.editDesc', { id: '' })} <TruncatedId id={subscription.id} />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Start Date */}
          <div className="space-y-2">
            <Label className={labelStyles}>{t('subscription.startDate')}</Label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => form.setStartDate(e.target.value)}
              className={inputStyles}
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label className={labelStyles}>{t('subscription.endDate')}</Label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => form.setEndDate(e.target.value)}
              className={inputStyles}
            />
          </div>

          {/* Data Limit Override */}
          <div className="space-y-2">
            <Label className={labelStyles}>{t('subscription.dataLimitOverride')}</Label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.dataLimitGB}
              onChange={(e) => form.setDataLimitGB(e.target.value)}
              placeholder={t('subscription.dataLimitInGB')}
              className={inputStyles}
            />
            <p className="text-xs text-muted-foreground">{t('subscription.usesPlanDefault')}</p>
          </div>

          {/* Data Used Override */}
          <div className="space-y-2">
            <Label className={labelStyles}>{t('subscription.dataUsedOverride')}</Label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.dataUsedGB}
              onChange={(e) => form.setDataUsedGB(e.target.value)}
              placeholder={t('subscription.dataUsedInGB')}
              className={inputStyles}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t('common.processing')}
              </>
            ) : (
              t('common.actions.save')
            )}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.actions.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
