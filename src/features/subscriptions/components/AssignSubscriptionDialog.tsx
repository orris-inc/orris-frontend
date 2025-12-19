/**
 * 分配订阅对话框组件（管理端）
 * 支持多定价选择
 */

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Info, X, Check } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as Checkbox from '@radix-ui/react-checkbox';
import { SimpleSelect } from '@/lib/SimpleSelect';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { getButtonClass, labelStyles, alertStyles, alertDescriptionStyles } from '@/lib/ui-styles';
import type { BillingCycle, PricingOption, SubscriptionPlan, AdminCreateSubscriptionRequest } from '@/api/subscription/types';
import type { UserListItem } from '@/features/users/types/users.types';

interface AssignSubscriptionDialogProps {
  open: boolean;
  user: UserListItem | null;
  onClose: () => void;
  onSubmit: (data: AdminCreateSubscriptionRequest) => Promise<void>;
}

// 计费周期选项（用于无多定价的情况）
const BILLING_CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'weekly', label: '周付' },
  { value: 'monthly', label: '月付' },
  { value: 'quarterly', label: '季付' },
  { value: 'semi_annual', label: '半年付' },
  { value: 'yearly', label: '年付' },
  { value: 'lifetime', label: '终身' },
];

// 计费周期显示名称映射
const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: '周付',
  monthly: '月付',
  quarterly: '季付',
  semi_annual: '半年付',
  yearly: '年付',
  lifetime: '终身',
};

// 获取计划可用的定价选项
const getAvailablePricings = (plan: SubscriptionPlan): PricingOption[] => {
  if (!plan.pricings) return [];
  return plan.pricings.filter(p => p.isActive);
};

// 格式化价格显示
const formatPrice = (price: number, currency: string): string => {
  const symbol = currency === 'CNY' ? '¥' : '$';
  return `${symbol}${(price / 100).toFixed(2)}`;
};

export const AssignSubscriptionDialog: React.FC<AssignSubscriptionDialogProps> = ({
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

  // 获取选中的计划
  const selectedPlan = useMemo(() => {
    return plans.find(p => p.id === formData.planId) || null;
  }, [plans, formData.planId]);

  // 获取选中计划的可用定价选项
  const availablePricings = useMemo(() => {
    if (!selectedPlan) return [];
    return getAvailablePricings(selectedPlan);
  }, [selectedPlan]);

  // 获取选中的定价
  const selectedPricing = useMemo(() => {
    return availablePricings.find(p => p.billingCycle === formData.billingCycle) || availablePricings[0] || null;
  }, [availablePricings, formData.billingCycle]);

  // 重置表单（仅在数据加载完成后执行，避免 plans 空数组引用变化导致无限循环）
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

  // 当选择计划变化时，自动设置默认的计费周期
  useEffect(() => {
    if (selectedPlan && availablePricings.length > 0) {
      // 使用函数式更新来避免依赖 formData.billingCycle
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

  // 准备计划选项（显示价格范围）
  const planOptions = useMemo(() => {
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

  // 准备计费周期选项（基于选中计划的可用定价）
  const billingCycleOptions = useMemo(() => {
    if (availablePricings.length > 0) {
      return availablePricings.map(p => ({
        value: p.billingCycle,
        label: `${BILLING_CYCLE_LABELS[p.billingCycle]} - ${formatPrice(p.price, p.currency)}`,
      }));
    }
    return BILLING_CYCLE_OPTIONS;
  }, [availablePricings]);

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
                为用户分配订阅
              </Dialog.Title>
              {user && (
                <p className="text-sm text-muted-foreground mt-1">
                  用户: {user.name} ({user.email})
                </p>
              )}
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
              {/* 订阅计划选择 */}
              <div className="grid gap-2">
                <LabelPrimitive.Root className={labelStyles}>订阅计划</LabelPrimitive.Root>
                <SimpleSelect
                  value={formData.planId}
                  onValueChange={(value) => setFormData({ ...formData, planId: value })}
                  options={planOptions}
                  placeholder="请选择计划"
                />
              </div>

              {/* 计费周期选择 */}
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

              {/* 自动续费 */}
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

              {/* 计划详情 */}
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
                  管理员分配的订阅将立即生效，用户将获得对应计划的权限。
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
                  分配中...
                </>
              ) : (
                '确认分配'
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
