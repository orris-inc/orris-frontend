/**
 * Renew Subscription Sheet Component
 * Mobile-optimized bottom sheet for renewing expired subscriptions
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Info, Loader2 } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { useRenewSubscriptionForm, BILLING_CYCLE_OPTIONS } from '../hooks/useRenewSubscriptionForm';
import type { Subscription } from '@/api/subscription/types';
import type { RenewSubscriptionRequest } from '@/api/admin/types';

type RenewableBillingCycle = NonNullable<RenewSubscriptionRequest['billingCycle']>;

interface RenewSubscriptionSheetProps extends BaseSheetProps {
  subscription: Subscription | null;
  onConfirm: (billingCycle?: RenewableBillingCycle) => Promise<void>;
}

export const RenewSubscriptionSheet: React.FC<RenewSubscriptionSheetProps> = ({
  open,
  onOpenChange,
  subscription,
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
      await onConfirm(selectedCycle || undefined);
      reset();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!loading && !open) {
      reset();
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
              <RefreshCw className="size-4 text-primary" />
            </div>
            <span>{t('subscription.renewTitle')}</span>
          </SheetTitle>
          <SheetDescription className="text-xs flex items-center gap-1">
            {t('subscription.label')} <TruncatedId id={subscription.id} />
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-4 space-y-4">
          {/* Plan Info */}
          <div className="rounded-xl ring-1 ring-border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground mb-1">{t('subscription.currentPlan')}</div>
            <div className="font-medium">{subscription.plan?.name || t('subscription.unknownPlan')}</div>
          </div>

          {/* Lifetime subscription warning */}
          {isLifetime ? (
            <div className="rounded-xl border border-warning/20 bg-warning/10 p-3">
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
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t('subscription.renewBillingCycle')}</Label>
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
              <div className="rounded-xl border border-info/20 bg-info/10 p-3">
                <div className="flex items-start gap-2">
                  <Info className="size-4 text-info mt-0.5 shrink-0" />
                  <p className="text-xs text-info">
                    {t('subscription.renewInfo')}
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetBody>

        <SheetFooter className="pt-3 pb-1">
          <Button
            onClick={handleSubmit}
            disabled={loading || isLifetime}
            className="w-full min-h-[48px]"
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
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={loading} className="w-full min-h-[44px]">
            {t('common.actions.back')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
