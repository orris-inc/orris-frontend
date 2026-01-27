/**
 * useCreatePayment Hook
 * Handles payment creation flow for subscriptions
 * Supports both traditional payments (Stripe, Alipay, WeChat) and USDT payments (Polygon, Tron)
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createSubscription } from '@/api/subscription';
import { createPayment } from '@/api/payment';
import { isUSDTPaymentMethod } from '@/api/payment/types';
import type { BillingCycle } from '@/api/subscription/types';
import type {
  PaymentMethod,
  PaymentBillingCycle,
  CreatePaymentResponse,
} from '@/api/payment/types';

export interface InitiatePaymentParams {
  planId: string;
  billingCycle: BillingCycle;
  paymentMethod: PaymentMethod;
}

export interface UseCreatePaymentReturn {
  isCreating: boolean;
  error: string | null;
  paymentResponse: CreatePaymentResponse | null;
  initiatePayment: (params: InitiatePaymentParams) => Promise<void>;
  reset: () => void;
}

/**
 * Map subscription billing cycle to payment billing cycle
 * Payment API uses a subset of billing cycles
 */
const mapToPaymentBillingCycle = (cycle: BillingCycle): PaymentBillingCycle | null => {
  switch (cycle) {
    case 'monthly':
    case 'quarterly':
    case 'semi_annual':
    case 'yearly':
      return cycle;
    // weekly and lifetime are not supported by payment API
    default:
      return null;
  }
};

/**
 * Hook for creating subscription and payment
 *
 * Flow:
 * 1. Create subscription via createSubscription API
 * 2. Create payment via createPayment API
 * 3. For traditional payments: redirect to paymentUrl
 * 4. For USDT payments: return payment details for display
 */
export const useCreatePayment = (): UseCreatePaymentReturn => {
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentResponse, setPaymentResponse] = useState<CreatePaymentResponse | null>(null);

  const reset = useCallback(() => {
    setIsCreating(false);
    setError(null);
    setPaymentResponse(null);
  }, []);

  const initiatePayment = useCallback(async (params: InitiatePaymentParams) => {
    const { planId, billingCycle, paymentMethod } = params;

    setIsCreating(true);
    setError(null);
    setPaymentResponse(null);

    try {
      // Step 1: Create subscription
      const subscriptionResult = await createSubscription({
        planId,
        billingCycle,
        autoRenew: true,
      });

      // Extract subscription ID from response
      // Note: Backend SDK issue - subscription object may be empty, token may contain the ID
      let subscriptionId: string | undefined;

      // Try standard path: subscription.id
      if (subscriptionResult?.subscription?.id) {
        subscriptionId = subscriptionResult.subscription.id;
      }

      // Workaround: If subscription is empty but token is a string starting with "sub",
      // the backend may have returned the subscription ID in the token field
      if (!subscriptionId && typeof subscriptionResult?.token === 'string') {
        const tokenValue = subscriptionResult.token as string;
        if (tokenValue.startsWith('sub')) {
          console.warn('Using token field as subscriptionId (backend SDK issue)');
          subscriptionId = tokenValue;
        }
      }

      // Fallback: check if result itself has id
      if (!subscriptionId) {
        const resultAny = subscriptionResult as unknown as Record<string, unknown>;
        subscriptionId = resultAny.id as string | undefined;
      }

      if (!subscriptionId) {
        console.error('Could not extract subscription ID from response:', subscriptionResult);
        throw new Error('Failed to create subscription: invalid response');
      }

      // Step 2: Create payment
      // Map billing cycle to payment API format
      const paymentBillingCycle = mapToPaymentBillingCycle(billingCycle);
      if (!paymentBillingCycle) {
        throw new Error(`Billing cycle "${billingCycle}" is not supported for payment`);
      }

      // Build return URL for traditional payments
      const returnUrl = `${window.location.origin}/payment/success`;

      const payment = await createPayment({
        subscriptionId,
        billingCycle: paymentBillingCycle,
        paymentMethod,
        returnUrl: isUSDTPaymentMethod(paymentMethod) ? undefined : returnUrl,
      });

      setPaymentResponse(payment);

      // Step 3: Handle payment flow
      if (!isUSDTPaymentMethod(paymentMethod) && payment.paymentUrl) {
        // Traditional payment: redirect to payment URL
        window.location.href = payment.paymentUrl;
      }
      // USDT payment: paymentResponse will be used to display instructions

    } catch (err) {
      console.error('Payment creation failed:', err);
      const errorMessage = err instanceof Error
        ? err.message
        : t('pricing.confirm.payment.error');
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, [t]);

  return {
    isCreating,
    error,
    paymentResponse,
    initiatePayment,
    reset,
  };
};
