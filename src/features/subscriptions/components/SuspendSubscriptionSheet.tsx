/**
 * Suspend Subscription Sheet Component
 * Mobile-optimized bottom sheet for suspending subscription
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pause, AlertTriangle, Loader2 } from 'lucide-react';
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
import { TruncatedId } from '@/components/admin';
import { cn } from '@/lib/utils';
import type { Subscription } from '@/api/subscription/types';

interface SuspendSubscriptionSheetProps extends BaseSheetProps {
  subscription: Subscription | null;
  onConfirm: (reason: string) => Promise<void>;
}

export const SuspendSubscriptionSheet: React.FC<SuspendSubscriptionSheetProps> = ({
  open,
  onOpenChange,
  subscription,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onConfirm(reason);
      setReason('');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!loading && !open) {
      setReason('');
      onOpenChange(false);
    }
  };

  if (!subscription) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="max-h-[95vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-warning/10 flex items-center justify-center">
              <Pause className="size-4 text-warning" />
            </div>
            <span>{t('subscription.suspend')}</span>
          </SheetTitle>
          <SheetDescription className="text-xs flex items-center gap-1">
            {t('subscription.label')} <TruncatedId id={subscription.id} />
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-4 space-y-4">
          {/* Warning */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                {t('subscription.suspendWarning')}
              </p>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">
              {t('subscription.suspendReason')} <span className="text-destructive">*</span>
            </label>
            <textarea
              placeholder={t('subscription.suspendReasonPlaceholder')}
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
        </SheetBody>

        <SheetFooter className="pt-3 pb-1">
          <Button
            variant="outline"
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            className="w-full min-h-[48px] border-warning text-warning hover:bg-warning/10"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t('common.processing')}
              </>
            ) : (
              t('subscription.suspend')
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
