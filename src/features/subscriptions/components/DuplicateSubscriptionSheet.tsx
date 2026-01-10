/**
 * Duplicate Subscription Sheet Component
 * Mobile-optimized bottom sheet for creating subscription based on existing one
 */

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Info, Copy, User, CreditCard, RefreshCw } from 'lucide-react';
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
import { Checkbox } from '@/components/common/Checkbox';
import { Label } from '@/components/common/Label';
import { MobileSelect, type MobileSelectOption } from '@/components/common/mobile-form';
import { TruncatedId } from '@/components/admin';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import type { BillingCycle, PricingOption, Subscription, SubscriptionPlan, AdminCreateSubscriptionRequest } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface DuplicateSubscriptionSheetProps extends BaseSheetProps {
  subscription: Subscription | null;
  user?: UserResponse;
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

export const DuplicateSubscriptionSheet: React.FC<DuplicateSubscriptionSheetProps> = ({
  open,
  onOpenChange,
  subscription,
  user,
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

  // Initialize form
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

  // Update billing cycle when plan changes
  useEffect(() => {
    if (selectedPlan && availablePricings.length > 0) {
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
    if (!formData.planId) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Prepare plan options
  const planOptions = useMemo((): MobileSelectOption[] => {
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
          label: `${plan.name} - ${priceDisplay}`,
        };
      });
  }, [plans]);

  // Prepare billing cycle options
  const billingCycleOptions = useMemo((): MobileSelectOption[] => {
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
    <Sheet open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <SheetContent className="max-h-[95vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Copy className="size-4 text-blue-500" />
            </div>
            <span>复制订阅</span>
          </SheetTitle>
          <SheetDescription className="text-xs flex items-center gap-1">
            基于订阅 <TruncatedId id={subscription.id} /> 创建
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-3 space-y-4">
          {plansLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Target User */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">目标用户</label>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    {user ? (
                      <div>
                        <div className="text-sm font-medium">{user.name || user.email}</div>
                        {user.name && <div className="text-xs text-muted-foreground">{user.email}</div>}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">用户 ID: {subscription.userId}</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">新订阅将分配给相同用户</p>
              </div>

              {/* Plan Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">订阅计划 <span className="text-destructive">*</span></label>
                <MobileSelect
                  value={formData.planId}
                  onChange={(value) => setFormData({ ...formData, planId: value })}
                  options={planOptions}
                  placeholder="请选择计划"
                  icon={<CreditCard className="size-5" />}
                  disabled={submitting}
                />
              </div>

              {/* Billing Cycle */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">
                  计费周期
                  {availablePricings.length > 1 && (
                    <span className="ml-1 text-muted-foreground">({availablePricings.length} 个可选)</span>
                  )}
                </label>
                <MobileSelect
                  value={formData.billingCycle}
                  onChange={(value) => setFormData({ ...formData, billingCycle: value as BillingCycle })}
                  options={billingCycleOptions}
                  placeholder="请先选择计划"
                  icon={<RefreshCw className="size-5" />}
                  disabled={submitting || !selectedPlan}
                />
              </div>

              {/* Auto Renew */}
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                <Checkbox
                  id="auto_renew"
                  checked={formData.autoRenew}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoRenew: checked === true })}
                  disabled={submitting}
                />
                <Label htmlFor="auto_renew" className="cursor-pointer text-sm flex items-center gap-1.5">
                  <RefreshCw className="size-3.5 text-muted-foreground" />
                  自动续费
                </Label>
              </div>

              {/* Plan Details */}
              {selectedPlan && (
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="size-4 text-muted-foreground" />
                    计划详情
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
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

              {/* Info Alert */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-3">
                <div className="flex items-start gap-2">
                  <Info className="size-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    将为用户创建一个新订阅，新订阅立即生效，会生成新的订阅链接。
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetBody>

        <SheetFooter className="pt-3 pb-1">
          <Button
            onClick={handleSubmit}
            disabled={!formData.planId || submitting}
            className="w-full min-h-[48px]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                创建中...
              </>
            ) : (
              '创建订阅'
            )}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting} className="w-full min-h-[44px]">
            取消
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
