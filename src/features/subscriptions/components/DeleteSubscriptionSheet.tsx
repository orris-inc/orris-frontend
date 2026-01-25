/**
 * Delete Subscription Confirmation Sheet
 * Mobile-optimized bottom sheet for confirming subscription deletion
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle, User, CreditCard, Calendar } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  ConfirmActionSheet,
  type DeleteSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { TruncatedId } from '@/components/admin';
import { formatDate } from '@/shared/utils/date-utils';
import { cn } from '@/lib/utils';
import type { Subscription, SubscriptionStatus } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface DeleteSubscriptionSheetProps extends DeleteSheetProps<Subscription> {
  user?: UserResponse;
}

// Status configuration with translation keys (synced with SDK 2025-01-14)
const STATUS_CONFIG: Record<SubscriptionStatus, { labelKey: string; color: string }> = {
  inactive: { labelKey: 'common.status.inactive', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  pending_payment: { labelKey: 'subscriptionStatus.pendingPayment', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  trialing: { labelKey: 'subscriptionStatus.trialing', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  active: { labelKey: 'common.status.active', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  past_due: { labelKey: 'subscriptionStatus.pastDue', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  suspended: { labelKey: 'common.status.suspended', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  cancelled: { labelKey: 'common.status.cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  expired: { labelKey: 'common.status.expired', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

export const DeleteSubscriptionSheet: React.FC<DeleteSubscriptionSheetProps> = ({
  open,
  onOpenChange,
  entity: subscription,
  user,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = async () => {
    if (!subscription) return;
    setLoading(true);
    try {
      await onConfirm(subscription);
      setConfirmOpen(false);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!subscription) return null;

  const statusConfig = STATUS_CONFIG[subscription.status] || { labelKey: subscription.status, color: 'bg-gray-100 text-gray-600' };

  return (
    <>
    <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <SheetContent className="max-h-[95vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="size-4 text-destructive" />
            </div>
            <span>{t('subscription.delete')}</span>
          </SheetTitle>
          <SheetDescription className="text-xs">{t('messages.deleteIrreversible')}</SheetDescription>
        </SheetHeader>

        <SheetBody className="py-4">
          {/* Warning Card */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">{t('messages.confirmDeleteSubscription')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('messages.deleteSubscriptionWarning')}
                </p>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="rounded-lg bg-background p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('tableColumns.subscriptionId')}</span>
                <TruncatedId id={subscription.id} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('common.status.label')}</span>
                <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', statusConfig.color)}>
                  {t(statusConfig.labelKey)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('common.role.user')}</span>
                <div className="flex items-center gap-1.5 text-sm">
                  <User className="size-3.5 text-muted-foreground" />
                  <span className="truncate max-w-[150px]">
                    {user ? (user.name || user.email) : `ID: ${subscription.userId}`}
                  </span>
                </div>
              </div>
              {subscription.plan && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t('tableColumns.plan')}</span>
                  <div className="flex items-center gap-1.5 text-sm">
                    <CreditCard className="size-3.5 text-muted-foreground" />
                    <span className="truncate max-w-[150px]">{subscription.plan.name}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('common.fields.createdAt')}</span>
                <div className="flex items-center gap-1.5 text-sm">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  <span>{formatDate(subscription.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </SheetBody>

        <SheetFooter className="pt-3 pb-1">
          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
            className="w-full min-h-[48px]"
          >
            {t('messages.confirmCancel')}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading} className="w-full min-h-[44px]">
            {t('common.actions.cancel')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

    <ConfirmActionSheet
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      variant="destructive"
      title={t('admin.subscriptions.confirmDeleteTitle')}
      description={t('messages.deleteIrreversible')}
      confirmText={t('messages.confirmCancel')}
      onConfirm={handleConfirm}
    />
    </>
  );
};
