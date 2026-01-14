/**
 * Subscription confirmation dialog (placeholder component)
 * Used to display subscription information, payment integration pending
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { Separator } from '@/components/common/Separator';
import { PlanPricingSelector } from './PlanPricingSelector';
import type { SubscriptionPlan, PricingOption, BillingCycle } from '@/api/subscription/types';

interface SubscriptionConfirmDialogProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  onClose: () => void;
}

// Mapping from API billing cycle to i18n key suffix
const BILLING_CYCLE_I18N_KEY: Record<BillingCycle, string> = {
  weekly: 'perWeek',
  monthly: 'perMonth',
  quarterly: 'perQuarter',
  semi_annual: 'perSemiAnnual',
  yearly: 'perYear',
  lifetime: 'perLifetime',
};

export const SubscriptionConfirmDialog: React.FC<SubscriptionConfirmDialogProps> = ({
  open,
  plan,
  onClose,
}) => {
  const { t } = useTranslation();
  // State: user selected pricing
  const [selectedPricing, setSelectedPricing] = useState<PricingOption | null>(null);

  if (!plan) return null;

  // pricings may be empty (backward compatibility)
  const hasPricings = plan.pricings && plan.pricings.length > 0;

  // Get current price and currency (prefer user selected pricing, otherwise use first pricing)
  const defaultPricing = hasPricings ? plan.pricings[0] : null;
  const currentPrice = selectedPricing?.price || defaultPricing?.price || 0;
  const currentCurrency = selectedPricing?.currency || defaultPricing?.currency || 'CNY';
  const currentBillingCycle = selectedPricing?.billingCycle || defaultPricing?.billingCycle || 'monthly';

  const currencySymbol = currentCurrency === 'CNY' ? '¥' : '$';
  const formattedPrice = (currentPrice / 100).toFixed(2);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('pricing.confirm.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info alert */}
          <Alert variant="info">
            {t('pricing.confirm.paymentComingSoon')}
          </Alert>

          {/* Plan info */}
          <div>
            <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
          </div>

          {/* Description */}
          {plan.description && (
            <p className="text-sm text-muted-foreground">
              {plan.description}
            </p>
          )}

          <Separator />

          {/* Price details */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t('pricing.confirm.priceDetails')}</h3>

            {hasPricings && plan.pricings.length > 1 ? (
              // Use multi-pricing selector
              <div className="mt-2">
                <PlanPricingSelector
                  pricings={plan.pricings}
                  defaultBillingCycle={defaultPricing?.billingCycle}
                  onPricingChange={(pricing) => setSelectedPricing(pricing)}
                />
              </div>
            ) : (
              // Single price: display directly
              <div>
                <div className="flex justify-between items-baseline mt-2">
                  <span className="text-base">{t('pricing.confirm.subscriptionFee')}</span>
                  <span className="text-3xl font-bold">
                    {currencySymbol}{formattedPrice}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('pricing.confirm.perCycle', { cycle: t(`billingCycle.${BILLING_CYCLE_I18N_KEY[currentBillingCycle]}`) })}
                </p>
              </div>
            )}
          </div>

          {/* Trial period */}
          {plan.trialDays && plan.trialDays > 0 && (
            <Alert variant="success">
              {t('pricing.confirm.trialNotice', { days: plan.trialDays })}
            </Alert>
          )}

          <Separator />

          {/* Usage limits */}
          {(plan.maxUsers || plan.maxProjects) && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">{t('pricing.confirm.limits')}</h3>
                <ul className="space-y-2">
                  {plan.maxUsers && (
                    <li className="text-sm">
                      <div className="font-medium">{t('pricing.confirm.maxUsers', { count: plan.maxUsers })}</div>
                      <div className="text-muted-foreground text-xs">{t('pricing.confirm.maxUsersDesc')}</div>
                    </li>
                  )}
                  {plan.maxProjects && (
                    <li className="text-sm">
                      <div className="font-medium">{t('pricing.confirm.maxProjects', { count: plan.maxProjects })}</div>
                      <div className="text-muted-foreground text-xs">{t('pricing.confirm.maxProjectsDesc')}</div>
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}

          {/* Note */}
          <div>
            <p className="text-xs text-muted-foreground">
              {t('pricing.confirm.note')}
            </p>
          </div>
        </div>

        <DialogFooter className="px-0 pt-4">
          <Button variant="outline" onClick={onClose} size="lg">
            {t('common.actions.cancel')}
          </Button>
          <Button
            size="lg"
            onClick={() => {
              // Temporarily just close dialog, will redirect to payment page in future
              alert(t('pricing.confirm.paymentComingSoonShort'));
              onClose();
            }}
          >
            {plan.trialDays ? t('pricing.confirm.startTrial') : t('pricing.confirm.subscribeNow')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
