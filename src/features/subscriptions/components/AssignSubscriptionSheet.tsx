/**
 * Assign Subscription Sheet Component (Admin)
 * Mobile-optimized bottom sheet for assigning subscriptions to users
 */

import { useState, useEffect, useMemo } from 'react';
import { CreditCard, Loader2, Info, Package, Calendar, RefreshCw } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/common/Sheet';
import { Button } from '@/components/common/Button';
import { MobileSelect, type MobileSelectOption } from '@/components/common/mobile-form';
import { Checkbox } from '@/components/common/Checkbox';
import { Label } from '@/components/common/Label';
import { Alert, AlertDescription } from '@/components/common/Alert';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { cn } from '@/lib/utils';
import type { BillingCycle, PricingOption, SubscriptionPlan, AdminCreateSubscriptionRequest } from '@/api/subscription/types';
import type { UserListItem } from '@/features/users/types/users.types';

interface AssignSubscriptionSheetProps {
  open: boolean;
  user: UserListItem | null;
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
  if (!plan.pricings) return [];
  return plan.pricings.filter(p => p.isActive);
};

// Format price display
const formatPrice = (price: number, currency: string): string => {
  const symbol = currency === 'CNY' ? '¥' : '$';
  return `${symbol}${(price / 100).toFixed(2)}`;
};

export const AssignSubscriptionSheet: React.FC<AssignSubscriptionSheetProps> = ({
  open,
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

  // Reset form when dialog opens
  useEffect(() => {
    if (open && user && !plansLoading) {
      const defaultPlan = plans.find(p => p.status === 'active');
      const firstPricing = defaultPlan?.pricings?.find(p => p.isActive);
      const defaultBillingCycle = firstPricing?.billingCycle || 'monthly';
      setFormData({
        userId: user.id,
        planId: '',
        billingCycle: defaultBillingCycle,
        autoRenew: true,
      });
    }
  }, [open, user, plans, plansLoading]);

  // Auto-set billing cycle when plan changes
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
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  // Prepare plan options
  const planOptions = useMemo((): MobileSelectOption[] => {
    return plans
      .filter(plan => plan.status === 'active')
      .map(plan => {
        const pricings = getAvailablePricings(plan);
        let priceDisplay: string;
        if (pricings.length === 0) {
          priceDisplay = '无定价';
        } else if (pricings.length === 1) {
          priceDisplay = formatPrice(pricings[0].price, pricings[0].currency);
        } else {
          const prices = pricings.map(p => p.price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const currency = pricings[0].currency;
          priceDisplay = minPrice === maxPrice
            ? formatPrice(minPrice, currency)
            : `${formatPrice(minPrice, currency)} - ${formatPrice(maxPrice, currency)}`;
        }
        return {
          value: plan.id.toString(),
          label: `${plan.name} - ${priceDisplay}`
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
    return [];
  }, [availablePricings]);

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <CreditCard className="size-5 text-blue-500" />
            </div>
            <span>分配订阅</span>
          </SheetTitle>
          <SheetDescription>
            为用户 <span className="font-medium text-foreground">{user.name || user.email}</span> 分配订阅计划
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-6 py-4">
          {plansLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">加载计划中...</p>
            </div>
          ) : (
            <>
              {/* Plan Selection */}
              <div className="space-y-1.5">
                <Label className="px-1">
                  订阅计划 <span className="text-destructive">*</span>
                </Label>
                <MobileSelect
                  value={formData.planId}
                  onChange={(value) => setFormData({ ...formData, planId: value })}
                  options={planOptions}
                  placeholder="请选择计划"
                  icon={<Package className="size-5" />}
                />
              </div>

              {/* Billing Cycle Selection */}
              <div className="space-y-1.5">
                <Label className="px-1 flex items-center gap-2">
                  计费周期
                  {availablePricings.length > 1 && (
                    <span className="text-xs text-muted-foreground">
                      ({availablePricings.length} 个可选)
                    </span>
                  )}
                </Label>
                <MobileSelect
                  value={formData.billingCycle}
                  onChange={(value) => setFormData({ ...formData, billingCycle: value as BillingCycle })}
                  options={billingCycleOptions}
                  placeholder="请先选择计划"
                  icon={<Calendar className="size-5" />}
                  disabled={!selectedPlan || billingCycleOptions.length === 0}
                />
              </div>

              {/* Auto Renew */}
              <div
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border bg-muted/30',
                  'active:bg-muted/50 transition-colors cursor-pointer'
                )}
                onClick={() => setFormData({ ...formData, autoRenew: !formData.autoRenew })}
              >
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">自动续费</p>
                  <p className="text-sm text-muted-foreground">到期后自动续订</p>
                </div>
                <Checkbox
                  checked={formData.autoRenew}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoRenew: checked === true })}
                  className="size-6"
                />
              </div>

              {/* Plan Details */}
              {selectedPlan && (
                <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Info className="size-4 text-muted-foreground" />
                    计划详情
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">计划名称</span>
                      <span className="font-medium">{selectedPlan.name}</span>
                    </div>
                    {selectedPricing && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">价格</span>
                        <span className="font-medium text-primary">
                          {formatPrice(selectedPricing.price, selectedPricing.currency)} / {BILLING_CYCLE_LABELS[selectedPricing.billingCycle]}
                        </span>
                      </div>
                    )}
                    {selectedPlan.description && (
                      <p className="text-muted-foreground pt-2 border-t">
                        {selectedPlan.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Info Alert */}
              <Alert className="rounded-xl">
                <Info className="size-4" />
                <AlertDescription>
                  管理员分配的订阅将立即生效，用户将获得对应计划的权限。
                </AlertDescription>
              </Alert>
            </>
          )}
        </SheetBody>

        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={!formData.planId || submitting}
            className="w-full min-h-[52px] text-base"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                分配中...
              </>
            ) : (
              '确认分配'
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={submitting}
            className="w-full min-h-[44px]"
          >
            取消
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
