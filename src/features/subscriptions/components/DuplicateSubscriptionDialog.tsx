/**
 * Duplicate Subscription Dialog Component (Admin)
 * Create new subscription based on existing subscription
 */

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Info, X, Copy } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { SimpleSelect } from '@/lib/SimpleSelect';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { getButtonClass, labelStyles, alertStyles, alertDescriptionStyles } from '@/lib/ui-styles';
import { TruncatedId } from '@/components/admin';
import type { BillingCycle, PricingOption, Subscription, SubscriptionPlan, AdminCreateSubscriptionRequest } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface DuplicateSubscriptionDialogProps {
  open: boolean;
  subscription: Subscription | null;
  user?: UserResponse;
  onClose: () => void;
  onSubmit: (data: AdminCreateSubscriptionRequest) => Promise<void>;
}

// Billing cycle display name mapping
const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: '周付',
  monthly: '月付',
  quarterly: '季付',
  semi_annual: '半年付',
  yearly: '年付',
  lifetime: '终身',
};

// Get available pricing options for the plan
const getAvailablePricings = (plan: SubscriptionPlan): PricingOption[] => {
  return plan.pricings?.filter(p => p.isActive) || [];
};

// Format price display
const formatPrice = (price: number, currency: string): string => {
  const symbol = currency === 'CNY' ? '¥' : '$';
  return `${symbol}${(price / 100).toFixed(2)}`;
};

export const DuplicateSubscriptionDialog: React.FC<DuplicateSubscriptionDialogProps> = ({
  open,
  subscription,
  user,
  onClose,
  onSubmit,
}) => {
  const { plans, isLoading: plansLoading } = useSubscriptionPlans({ enabled: open });
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<AdminCreateSubscriptionRequest>({
    userId: '',
    planId: '',
    billingCycle: 'monthly',
    autoRenew: true,
  });

  // Get selected plan
  const selectedPlan = useMemo(() => {
    return plans.find(p => p.id === formData.planId) || null;
  }, [plans, formData.planId]);

  // Get available pricing options for selected plan
  const availablePricings = useMemo(() => {
    if (!selectedPlan) return [];
    return getAvailablePricings(selectedPlan);
  }, [selectedPlan]);

  // Get selected pricing
  const selectedPricing = useMemo(() => {
    return availablePricings.find(p => p.billingCycle === formData.billingCycle) || availablePricings[0] || null;
  }, [availablePricings, formData.billingCycle]);

  // Initialize form (based on original subscription data)
  useEffect(() => {
    if (open && subscription) {
      const defaultPricing = subscription.plan?.pricings?.[0];
      setFormData({
        userId: subscription.userId,
        planId: subscription.plan?.id || '',
        billingCycle: (defaultPricing?.billingCycle as BillingCycle) || 'monthly',
        autoRenew: subscription.autoRenew,
      });
    }
  }, [open, subscription]);

  // Automatically set default billing cycle when selected plan changes
  useEffect(() => {
    if (selectedPlan && availablePricings.length > 0) {
      // Use functional update to avoid dependency on formData.billingCycle
      setFormData(prev => {
        const currentCycleAvailable = availablePricings.some(p => p.billingCycle === prev.billingCycle);
        if (!currentCycleAvailable) {
          return { ...prev, billingCycle: availablePricings[0].billingCycle };
        }
        return prev;
      });
    }
  }, [selectedPlan, availablePricings]);

  const handleSubmit = async () => {
    if (!formData.planId) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (openState: boolean) => {
    if (!openState && !submitting) {
      onClose();
    }
  };

  // Prepare plan options (show price range)
  const planOptions = useMemo(() => {
    return plans
      .filter(plan => plan.status === 'active')
      .map(plan => {
        const pricings = getAvailablePricings(plan);
        let priceDisplay: string;
        if (pricings.length > 1) {
          const prices = pricings.map(p => p.price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const currency = pricings[0].currency;
          priceDisplay = minPrice === maxPrice
            ? formatPrice(minPrice, currency)
            : `${formatPrice(minPrice, currency)} - ${formatPrice(maxPrice, currency)}`;
        } else if (pricings.length === 1) {
          priceDisplay = formatPrice(pricings[0].price, pricings[0].currency);
        } else {
          priceDisplay = '未设置价格';
        }
        return {
          value: plan.id.toString(),
          label: `${plan.name} - ${priceDisplay}`
        };
      });
  }, [plans]);

  // Prepare billing cycle options (based on selected plan's available pricing)
  const billingCycleOptions = useMemo(() => {
    if (availablePricings.length > 0) {
      return availablePricings.map(p => ({
        value: p.billingCycle,
        label: `${BILLING_CYCLE_LABELS[p.billingCycle]} - ${formatPrice(p.price, p.currency)}`,
      }));
    }
    return Object.entries(BILLING_CYCLE_LABELS).map(([value, label]) => ({
      value: value as BillingCycle,
      label,
    }));
  }, [availablePricings]);

  if (!subscription) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
                <Copy className="size-5" />
                复制订阅
              </Dialog.Title>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                基于订阅 <TruncatedId id={subscription.id} /> 创建新订阅
              </p>
            </div>
            <Dialog.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          {plansLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6 py-4">
              {/* Target user display */}
              <div className="grid gap-2">
                <LabelPrimitive.Root className={labelStyles}>目标用户</LabelPrimitive.Root>
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                  {user ? (
                    <span>{user.name || user.email} ({user.email})</span>
                  ) : (
                    <span className="text-muted-foreground">用户 ID: {subscription.userId}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  新订阅将分配给相同用户
                </p>
              </div>

              {/* Subscription plan selection */}
              <div className="grid gap-2">
                <LabelPrimitive.Root className={labelStyles}>订阅计划</LabelPrimitive.Root>
                <SimpleSelect
                  value={formData.planId}
                  onValueChange={(value) => setFormData({ ...formData, planId: value })}
                  options={planOptions}
                  placeholder="请选择计划"
                />
              </div>

              {/* Billing cycle selection */}
              <div className="grid gap-2">
                <LabelPrimitive.Root className={labelStyles}>
                  计费周期
                  {availablePricings.length > 1 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({availablePricings.length} 个可选)
                    </span>
                  )}
                </LabelPrimitive.Root>
                <SimpleSelect
                  value={formData.billingCycle}
                  onValueChange={(value) => setFormData({ ...formData, billingCycle: value as BillingCycle })}
                  options={billingCycleOptions}
                  disabled={!selectedPlan}
                />
              </div>

              {/* Auto-renewal */}
              <div className="flex items-center space-x-2">
                <Checkbox.Root
                  id="auto_renew"
                  checked={formData.autoRenew}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoRenew: checked === true })}
                  className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                >
                  <Checkbox.Indicator className="flex items-center justify-center text-current">
                    <Check className="h-3 w-3" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <LabelPrimitive.Root
                  htmlFor="auto_renew"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  自动续费
                </LabelPrimitive.Root>
              </div>

              {/* Plan details */}
              {selectedPlan && (
                <div className="rounded-md bg-muted p-4 text-sm">
                  <h4 className="font-medium mb-2">计划详情</h4>
                  <div className="space-y-1 text-muted-foreground">
                    <p>名称: {selectedPlan.name}</p>
                    {selectedPricing && (
                      <p>
                        价格: {formatPrice(selectedPricing.price, selectedPricing.currency)} / {BILLING_CYCLE_LABELS[selectedPricing.billingCycle]}
                      </p>
                    )}
                    {selectedPlan.description && (
                      <p className="mt-1">{selectedPlan.description}</p>
                    )}
                  </div>
                </div>
              )}

              <div className={alertStyles}>
                <Info className="h-4 w-4" />
                <div className={alertDescriptionStyles}>
                  将为用户创建一个新订阅，新订阅立即生效，会生成新的订阅链接。
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className={getButtonClass('outline', 'default')}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.planId || submitting}
              className={getButtonClass('default', 'default')}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                '创建订阅'
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
