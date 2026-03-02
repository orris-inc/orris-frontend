/**
 * Edit Subscription Sheet Component (Mobile)
 * Mobile-optimized bottom sheet for editing subscription dates and traffic limits
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type BaseSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Label';
import { TruncatedId } from '@/components/admin';
import { inputStyles } from '@/lib/ui-styles';
import { useEditSubscriptionForm } from '../hooks/useEditSubscriptionForm';
import type { Subscription } from '@/api/subscription/types';
import type { AdminUpdateSubscriptionRequest } from '@/api/admin/types';

interface EditSubscriptionSheetProps extends BaseSheetProps {
  subscription: Subscription | null;
  onConfirm: (data: AdminUpdateSubscriptionRequest) => Promise<void>;
}

export const EditSubscriptionSheet: React.FC<EditSubscriptionSheetProps> = ({
  open,
  onOpenChange,
  subscription,
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
      onOpenChange(false);
      return;
    }

    setLoading(true);
    try {
      await onConfirm(payload as AdminUpdateSubscriptionRequest);
      form.reset();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!loading && !open) {
      form.reset();
      onOpenChange(false);
    }
  };

  if (!subscription) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="max-h-[95vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Pencil className="size-4 text-primary" />
            </div>
            <span>{t('subscription.editTitle')}</span>
          </SheetTitle>
          <SheetDescription className="text-xs flex items-center gap-1">
            {t('subscription.label')} <TruncatedId id={subscription.id} />
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-4 space-y-4">
          {/* Start Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('subscription.startDate')}</Label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => form.setStartDate(e.target.value)}
              className={inputStyles}
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('subscription.endDate')}</Label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => form.setEndDate(e.target.value)}
              className={inputStyles}
            />
          </div>

          {/* Data Limit Override */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('subscription.dataLimitOverride')}</Label>
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
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('subscription.dataUsedOverride')}</Label>
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
        </SheetBody>

        <SheetFooter className="pt-3 pb-1">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full min-h-[48px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t('common.processing')}
              </>
            ) : (
              t('common.actions.save')
            )}
          </Button>
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={loading} className="w-full min-h-[44px]">
            {t('common.actions.back')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
