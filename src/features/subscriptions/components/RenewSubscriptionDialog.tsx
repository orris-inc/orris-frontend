/**
 * Renew subscription dialog component
 * Desktop dialog for renewing expired subscriptions with optional billing cycle selection
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Info, Loader2 } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { useRenewSubscriptionForm, BILLING_CYCLE_OPTIONS } from '../hooks/useRenewSubscriptionForm';
import type { Subscription } from '@/api/subscription/types';
import type { RenewSubscriptionRequest } from '@/api/admin/types';

type RenewableBillingCycle = NonNullable<RenewSubscriptionRequest['billingCycle']>;

interface RenewSubscriptionDialogProps {
  open: boolean;
  subscription: Subscription | null;
  onClose: () => void;
  onConfirm: (billingCycle?: RenewableBillingCycle) => Promise<void>;
}

export const RenewSubscriptionDialog: React.FC<RenewSubscriptionDialogProps> = ({
  open,
  subscription,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const {
    selectedCycle,
    setSelectedCycle,
    availableCycles,
    isLifetime,
    reset,
  } = useRenewSubscriptionForm({ subscription });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Pass undefined if no cycle selected (use current cycle)
      await onConfirm(selectedCycle || undefined);
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

  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="size-5 text-primary" />
            {t('subscription.renewTitle')}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1 flex-wrap">
            {t('subscription.renewDesc', { id: '' })} <TruncatedId id={subscription.id} />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Plan Info */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground mb-1">{t('subscription.currentPlan')}</div>
            <div className="font-medium">{subscription.plan?.name || t('subscription.unknownPlan')}</div>
          </div>

          {/* Lifetime subscription warning */}
          {isLifetime ? (
            <div className="rounded-lg border border-warning/20 bg-warning/10 p-3">
              <div className="flex items-start gap-2">
                <Info className="size-4 text-warning mt-0.5 shrink-0" />
                <p className="text-sm text-warning">
                  {t('subscription.lifetimeCannotRenew')}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Billing Cycle Selection */}
              {availableCycles.length > 0 && (
                <div className="space-y-2">
                  <Label>{t('subscription.renewBillingCycle')}</Label>
                  <Select
                    value={selectedCycle}
                    onValueChange={(value) => setSelectedCycle(value as RenewableBillingCycle)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.placeholders.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {BILLING_CYCLE_OPTIONS.filter((opt) =>
                        availableCycles.includes(opt.value)
                      ).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('common.optional')}
                  </p>
                </div>
              )}

              {/* Info */}
              <div className="rounded-lg border border-info/20 bg-info/10 p-3">
                <div className="flex items-start gap-2">
                  <Info className="size-4 text-info mt-0.5 shrink-0" />
                  <p className="text-sm text-info">
                    {t('subscription.renewInfo')}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || isLifetime}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t('common.processing')}
              </>
            ) : (
              t('subscription.confirmRenew')
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
