/**
 * Renew Subscription Sheet Component
 * Mobile-optimized bottom sheet for renewing expired subscriptions
 */

import { useState, useMemo } from 'react';
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
import type { Subscription } from '@/api/subscription/types';
import type { RenewSubscriptionRequest } from '@/api/admin/types';

type RenewableBillingCycle = NonNullable<RenewSubscriptionRequest['billingCycle']>;

interface RenewSubscriptionSheetProps extends BaseSheetProps {
  subscription: Subscription | null;
  onConfirm: (billingCycle?: RenewableBillingCycle) => Promise<void>;
}

const BILLING_CYCLE_OPTIONS: { value: RenewableBillingCycle; labelKey: string }[] = [
  { value: 'weekly', labelKey: 'billingCycle.weekly' },
  { value: 'monthly', labelKey: 'billingCycle.monthly' },
  { value: 'quarterly', labelKey: 'billingCycle.quarterly' },
  { value: 'semi_annual', labelKey: 'billingCycle.semiAnnual' },
  { value: 'yearly', labelKey: 'billingCycle.yearly' },
];

export const RenewSubscriptionSheet: React.FC<RenewSubscriptionSheetProps> = ({
  open,
  onOpenChange,
  subscription,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [selectedCycle, setSelectedCycle] = useState<RenewableBillingCycle | ''>('');
  const [loading, setLoading] = useState(false);

  // Get available billing cycles from the subscription's plan
  const availableCycles = useMemo(() => {
    if (!subscription?.plan?.pricings) return [];
    return subscription.plan.pricings
      .filter((p) => p.isActive && p.billingCycle !== 'lifetime')
      .map((p) => p.billingCycle);
  }, [subscription]);

  // Check if this is a lifetime subscription
  const isLifetime = useMemo(() => {
    if (!subscription?.plan?.pricings) return false;
    return subscription.plan.pricings.some(
      (p) => p.billingCycle === 'lifetime' && p.isActive
    );
  }, [subscription]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onConfirm(selectedCycle || undefined);
      setSelectedCycle('');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!loading && !open) {
      setSelectedCycle('');
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
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground mb-1">{t('subscription.currentPlan')}</div>
            <div className="font-medium">{subscription.plan?.name || t('subscription.unknownPlan')}</div>
          </div>

          {/* Lifetime subscription warning */}
          {isLifetime ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30 p-3">
              <div className="flex items-start gap-2">
                <Info className="size-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
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
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-3">
                <div className="flex items-start gap-2">
                  <Info className="size-4 text-blue-600 dark:text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-400">
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
