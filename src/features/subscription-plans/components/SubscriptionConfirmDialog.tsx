/**
 * Subscription confirmation dialog
 * Multi-step flow: Plan selection -> Payment method -> Processing/USDT instructions
 * Follows Tailwind Application UI patterns with mobile-first responsive design
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import { Alert, AlertDescription } from '@/components/common/Alert';
import { Separator } from '@/components/common/Separator';
import { PlanPricingSelector } from './PlanPricingSelector';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { USDTPaymentInstructions } from './USDTPaymentInstructions';
import { useCreatePayment } from '../hooks/useCreatePayment';
import { isUSDTPaymentMethod } from '@/api/payment/types';
import type { SubscriptionPlan, PricingOption, BillingCycle } from '@/api/subscription/types';
import type { PaymentMethod } from '@/api/payment/types';

interface SubscriptionConfirmDialogProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  onClose: () => void;
}

// Dialog step state machine
type DialogStep = 'select_plan' | 'select_payment' | 'processing' | 'usdt_instructions';

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
  const [step, setStep] = useState<DialogStep>('select_plan');
  const [selectedPricing, setSelectedPricing] = useState<PricingOption | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  const {
    error: paymentError,
    paymentResponse,
    initiatePayment,
    reset: resetPayment,
  } = useCreatePayment();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStep('select_plan');
      setSelectedPricing(null);
      setSelectedPaymentMethod(null);
      resetPayment();
    }
  }, [open, resetPayment]);

  // Handle step transitions after payment creation
  useEffect(() => {
    if (paymentResponse) {
      if (isUSDTPaymentMethod(selectedPaymentMethod!)) {
        setStep('usdt_instructions');
      }
      // For traditional payments, redirect happens in useCreatePayment
    }
  }, [paymentResponse, selectedPaymentMethod]);

  if (!plan) return null;

  const hasPricings = plan.pricings && plan.pricings.length > 0;
  const defaultPricing = hasPricings ? plan.pricings[0] : null;
  const currentPricing = selectedPricing || defaultPricing;
  const currentPrice = currentPricing?.price || 0;
  const currentCurrency = currentPricing?.currency || 'CNY';
  const currentBillingCycle = currentPricing?.billingCycle || 'monthly';

  const currencySymbol = currentCurrency === 'CNY' ? '¥' : '$';
  const formattedPrice = (currentPrice / 100).toFixed(2);

  const handleProceedToPayment = () => {
    setStep('select_payment');
  };

  const handleBack = () => {
    if (step === 'select_payment') {
      setStep('select_plan');
      setSelectedPaymentMethod(null);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedPaymentMethod || !currentPricing) return;

    setStep('processing');

    await initiatePayment({
      planId: plan.id,
      billingCycle: currentBillingCycle,
      paymentMethod: selectedPaymentMethod,
    });
  };

  const handleUSDTCompleted = () => {
    onClose();
  };

  // Get step title
  const getStepTitle = () => {
    switch (step) {
      case 'select_plan':
        return t('pricing.confirm.title');
      case 'select_payment':
        return t('pricing.confirm.selectPaymentMethod');
      case 'processing':
        return t('pricing.confirm.processing');
      case 'usdt_instructions':
        return t('pricing.confirm.usdt.title');
      default:
        return t('pricing.confirm.title');
    }
  };

  // Check if back button should be shown
  const showBackButton = step === 'select_payment';

  // Render plan selection step content
  const renderPlanContent = () => (
    <>
      {/* Plan info */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">{plan.name}</h2>
        {plan.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {plan.description}
          </p>
        )}
      </div>

      <Separator />

      {/* Price details */}
      <div>
        <h3 className="text-sm font-semibold mb-3">{t('pricing.confirm.priceDetails')}</h3>

        {hasPricings && plan.pricings.length > 1 ? (
          <PlanPricingSelector
            pricings={plan.pricings}
            defaultBillingCycle={defaultPricing?.billingCycle}
            onPricingChange={(pricing) => setSelectedPricing(pricing)}
          />
        ) : (
          <div>
            <div className="flex justify-between items-baseline">
              <span className="text-base">{t('pricing.confirm.subscriptionFee')}</span>
              <span className="text-2xl sm:text-3xl font-bold">
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
          <AlertDescription>
            {t('pricing.confirm.trialNotice', { days: plan.trialDays })}
          </AlertDescription>
        </Alert>
      )}

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

      <Separator />

      {/* Note */}
      <p className="text-xs text-muted-foreground">
        {t('pricing.confirm.note')}
      </p>
    </>
  );

  // Render payment method selection content
  const renderPaymentContent = () => (
    <>
      {/* Plan summary */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{plan.name}</p>
          <p className="text-sm text-muted-foreground">
            {t('pricing.confirm.perCycle', { cycle: t(`billingCycle.${BILLING_CYCLE_I18N_KEY[currentBillingCycle]}`) })}
          </p>
        </div>
        <p className="text-lg sm:text-xl font-bold ml-4 shrink-0">
          {currencySymbol}{formattedPrice}
        </p>
      </div>

      <Separator />

      {/* Payment method selector */}
      <PaymentMethodSelector
        selectedMethod={selectedPaymentMethod}
        onMethodChange={setSelectedPaymentMethod}
      />
    </>
  );

  // Render processing content
  const renderProcessingContent = () => (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-4">
      <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
      <p className="text-muted-foreground">{t('pricing.confirm.processing')}</p>

      {paymentError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  // Render USDT payment instructions content
  const renderUSDTContent = () => {
    if (!paymentResponse || !paymentResponse.chainType) return null;

    return (
      <USDTPaymentInstructions
        chainType={paymentResponse.chainType}
        receivingAddress={paymentResponse.receivingAddress!}
        usdtAmount={paymentResponse.usdtAmount!}
        exchangeRate={paymentResponse.exchangeRate}
        expiredAt={paymentResponse.expiredAt}
        onCompleted={handleUSDTCompleted}
      />
    );
  };

  // Render footer buttons based on step
  const renderFooter = () => {
    switch (step) {
      case 'select_plan':
        return (
          <>
            <Button onClick={handleProceedToPayment} className="flex-1 sm:flex-none">
              {plan.trialDays ? t('pricing.confirm.startTrial') : t('pricing.confirm.subscribeNow')}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
              {t('common.actions.cancel')}
            </Button>
          </>
        );
      case 'select_payment':
        return (
          <>
            <Button
              onClick={handleConfirmPayment}
              disabled={!selectedPaymentMethod}
              className="flex-1 sm:flex-none"
            >
              {t('pricing.confirm.payNow')}
            </Button>
            <Button variant="outline" onClick={handleBack} className="flex-1 sm:flex-none">
              {t('pricing.confirm.back')}
            </Button>
          </>
        );
      case 'processing':
        return paymentError ? (
          <Button variant="outline" onClick={() => setStep('select_payment')} className="w-full sm:w-auto">
            {t('pricing.confirm.back')}
          </Button>
        ) : null;
      case 'usdt_instructions':
        return null; // USDT instructions has its own button
      default:
        return null;
    }
  };

  // Render content based on step
  const renderContent = () => {
    switch (step) {
      case 'select_plan':
        return renderPlanContent();
      case 'select_payment':
        return renderPaymentContent();
      case 'processing':
        return renderProcessingContent();
      case 'usdt_instructions':
        return renderUSDTContent();
      default:
        return renderPlanContent();
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/80',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />

        {/* Content - Full screen on mobile, centered modal on desktop */}
        <DialogPrimitive.Content
          className={cn(
            'fixed z-50 bg-background',
            // Mobile: full screen with safe area
            'inset-0 flex flex-col',
            // Desktop: centered modal
            'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
            'sm:max-w-lg sm:w-[calc(100%-2rem)] sm:max-h-[calc(100vh-4rem)]',
            'sm:rounded-lg sm:border sm:shadow-lg',
            // Animation
            'duration-200',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
            'sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]',
            'sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]'
          )}
        >
          {/* Header - Fixed on mobile */}
          <div className={cn(
            'flex items-center gap-3 px-4 py-3 border-b bg-background',
            // Safe area for mobile
            'pt-[calc(0.75rem+env(safe-area-inset-top))]',
            'sm:pt-3 sm:px-6 sm:py-4'
          )}>
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-9 w-9 shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <DialogPrimitive.Title className="flex-1 text-lg font-semibold truncate">
              {getStepTitle()}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogPrimitive.Close>
          </div>

          {/* Scrollable content area */}
          <div className={cn(
            'flex-1 overflow-y-auto overscroll-contain',
            'px-4 py-4 space-y-4',
            'sm:px-6',
            // Safe area padding for bottom on mobile
            'pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4'
          )}>
            {renderContent()}
          </div>

          {/* Footer - Fixed at bottom on mobile */}
          {renderFooter() && (
            <div className={cn(
              'flex gap-3 px-4 py-3 border-t bg-background',
              // Safe area for mobile
              'pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
              'sm:pb-3 sm:px-6 sm:py-4',
              // Layout
              'flex-col sm:flex-row sm:justify-end'
            )}>
              {renderFooter()}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
