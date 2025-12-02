/**
 * 分配订阅对话框组件（管理端）
 */

import { useState, useEffect } from 'react';
import { Loader2, Info, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { SimpleSelect } from '@/lib/SimpleSelect';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { getButtonClass, labelStyles, alertStyles, alertDescriptionStyles } from '@/lib/ui-styles';
import type { CreateSubscriptionRequest, BillingCycle } from '../types/subscriptions.types';
import type { UserListItem } from '@/features/users/types/users.types';

interface AssignSubscriptionDialogProps {
  open: boolean;
  user: UserListItem | null;
  onClose: () => void;
  onSubmit: (data: CreateSubscriptionRequest) => Promise<void>;
}

// 计费周期选项
const BILLING_CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'weekly', label: '周付' },
  { value: 'monthly', label: '月付' },
  { value: 'quarterly', label: '季付' },
  { value: 'semi_annual', label: '半年付' },
  { value: 'yearly', label: '年付' },
  { value: 'lifetime', label: '终身' },
];

export const AssignSubscriptionDialog: React.FC<AssignSubscriptionDialogProps> = ({
  open,
  user,
  onClose,
  onSubmit,
}) => {
  const { plans, isLoading: plansLoading } = useSubscriptionPlans({ enabled: open });
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateSubscriptionRequest>({
    plan_id: 0,
    billing_cycle: 'monthly',
    auto_renew: true,
  });

  // 重置表单
  useEffect(() => {
    if (open && user) {
      setFormData({
        plan_id: 0,
        billing_cycle: 'monthly',
        auto_renew: true,
        user_id: user.id,
      });
    }
  }, [open, user]);

  const handleSubmit = async () => {
    if (!formData.plan_id) {
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

  const handleOpenChange = (open: boolean) => {
    if (!open && !submitting) {
      onClose();
    }
  };

  const selectedPlan = plans.find(p => p.ID === formData.plan_id);

  // 准备计划选项
  const planOptions = plans
    .filter(plan => plan.Status === 'active')
    .map(plan => ({
      value: plan.ID.toString(),
      label: `${plan.Name} - ${(plan.Price / 100).toFixed(2)} ${plan.Currency}`
    }));

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
                  value={formData.plan_id ? formData.plan_id.toString() : ''}
                  onValueChange={(value) => setFormData({ ...formData, plan_id: Number(value) })}
                  options={planOptions}
                  placeholder="请选择计划"
                />
              </div>

              {/* 计费周期选择 */}
              <div className="grid gap-2">
                <LabelPrimitive.Root className={labelStyles}>计费周期</LabelPrimitive.Root>
                <SimpleSelect
                  value={formData.billing_cycle}
                  onValueChange={(value) => setFormData({ ...formData, billing_cycle: value as BillingCycle })}
                  options={BILLING_CYCLE_OPTIONS}
                />
              </div>

              {/* 自动续费 */}
              <div className="flex items-center space-x-2">
                <Checkbox.Root
                  id="auto_renew"
                  checked={formData.auto_renew}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_renew: checked === true })}
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
                    <p>名称: {selectedPlan.Name}</p>
                    <p>价格: {(selectedPlan.Price / 100).toFixed(2)} {selectedPlan.Currency}</p>
                    {selectedPlan.Description && (
                      <p className="mt-1">{selectedPlan.Description}</p>
                    )}
                    {selectedPlan.Features && selectedPlan.Features.length > 0 && (
                      <div className="mt-2">
                        <p>功能:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          {selectedPlan.Features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
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
              disabled={!formData.plan_id || submitting}
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
