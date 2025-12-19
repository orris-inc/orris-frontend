/**
 * 订阅确认对话框（占位组件）
 * 用于显示订阅信息，暂不对接支付接口
 */

import { useState } from 'react';
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

const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: '周',
  monthly: '月',
  quarterly: '季',
  semi_annual: '半年',
  yearly: '年',
  lifetime: '次（终身）',
};

export const SubscriptionConfirmDialog: React.FC<SubscriptionConfirmDialogProps> = ({
  open,
  plan,
  onClose,
}) => {
  // 状态：用户选择的定价
  const [selectedPricing, setSelectedPricing] = useState<PricingOption | null>(null);

  if (!plan) return null;

  // pricings 可能为空（兼容旧数据）
  const hasPricings = plan.pricings && plan.pricings.length > 0;

  // 获取当前价格和货币（优先使用用户选择的定价，否则使用第一个定价）
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
          <DialogTitle>确认订阅</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 提示信息 */}
          <Alert variant="info">
            支付功能即将上线！目前仅显示订阅信息预览。
          </Alert>

          {/* 计划信息 */}
          <div>
            <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
          </div>

          {/* 描述 */}
          {plan.description && (
            <p className="text-sm text-muted-foreground">
              {plan.description}
            </p>
          )}

          <Separator />

          {/* 价格详情 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">价格详情</h3>

            {hasPricings && plan.pricings.length > 1 ? (
              // 使用多定价选择器
              <div className="mt-2">
                <PlanPricingSelector
                  pricings={plan.pricings}
                  defaultBillingCycle={defaultPricing?.billingCycle}
                  onPricingChange={(pricing) => setSelectedPricing(pricing)}
                />
              </div>
            ) : (
              // 单一价格：直接显示
              <div>
                <div className="flex justify-between items-baseline mt-2">
                  <span className="text-base">订阅费用</span>
                  <span className="text-3xl font-bold">
                    {currencySymbol}{formattedPrice}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  每{BILLING_CYCLE_LABELS[currentBillingCycle]}
                </p>
              </div>
            )}
          </div>

          {/* 试用期 */}
          {plan.trialDays && plan.trialDays > 0 && (
            <Alert variant="success">
              免费试用 {plan.trialDays} 天，试用期结束后自动扣费
            </Alert>
          )}

          <Separator />

          {/* 使用限制 */}
          {(plan.maxUsers || plan.maxProjects) && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">使用限制</h3>
                <ul className="space-y-2">
                  {plan.maxUsers && (
                    <li className="text-sm">
                      <div className="font-medium">最多 {plan.maxUsers} 个用户</div>
                      <div className="text-muted-foreground text-xs">团队成员数量上限</div>
                    </li>
                  )}
                  {plan.maxProjects && (
                    <li className="text-sm">
                      <div className="font-medium">最多 {plan.maxProjects} 个项目</div>
                      <div className="text-muted-foreground text-xs">可创建的项目数量</div>
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}

          {/* 说明 */}
          <div>
            <p className="text-xs text-muted-foreground">
              订阅后可随时取消或更换套餐。如有疑问，请联系客服。
            </p>
          </div>
        </div>

        <DialogFooter className="px-0 pt-4">
          <Button variant="outline" onClick={onClose} size="lg">
            取消
          </Button>
          <Button
            size="lg"
            onClick={() => {
              // 暂时只关闭对话框，未来这里会跳转到支付页面
              alert('支付功能即将上线！');
              onClose();
            }}
          >
            {plan.trialDays ? '开始免费试用' : '立即订阅'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
